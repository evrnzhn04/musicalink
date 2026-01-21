import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9/mod.ts"

const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')!
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Access token alma (Manuel JWT - Deno Native)
async function getAccessToken() {
  const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT)
  
  // PEM key'i CryptoKey formatına çevir
  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')
    .replace(/\s/g, '')

  const binaryDerString = atob(pem)
  const binaryDer = new Uint8Array(binaryDerString.length)
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i)
  }

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // JWT oluştur ve imzala
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: getNumericDate(60 * 60), // 1 saat geçerli
      iat: getNumericDate(0),
    },
    key
  )

  // Google OAuth2 endpoint'inden access token al
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })

  const data = await response.json()
  return data.access_token
}

serve(async (req) => {
  try {
    const { receiverId, senderId, messageText } = await req.json()

    console.log('Bildirim gönderiliyor:', { receiverId, senderId, messageText })

    // 1. Gönderenin adını al
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', senderId)
      .single()

    const senderName = senderProfile?.display_name || 'Kullanıcı'

    // 2. Alıcının FCM token'larını al
    const { data: tokens, error: tokenError } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', receiverId)

    if (tokenError) {
      console.error('Token alma hatası:', tokenError)
      return new Response(JSON.stringify({ error: 'Token fetch failed' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (!tokens || tokens.length === 0) {
      console.log('Kullanıcının token\'ı yok')
      return new Response(JSON.stringify({ success: false, message: 'No tokens found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 3. Access token al
    const accessToken = await getAccessToken()

    // 4. Her token için FCM V1 API bildirimi gönder
    const sendPromises = tokens.map(({ token }: any) =>
      fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: {
              title: senderName,
              body: messageText,
            },
            data: {
              type: 'message',
              senderId: senderId,
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                channelId: 'messages',
              },
            },
          },
        }),
      })
    )

    const results = await Promise.all(sendPromises)
    const successful = results.filter((r: any) => r.ok).length

    console.log(`${successful}/${results.length} bildirim gönderildi`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        total: results.length 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Edge Function hatası:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
