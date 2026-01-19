// Sync Top Artists Edge Function with Rate Limiting
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5 // max requests
const RATE_WINDOW = 60000 // per minute

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW })
    return false
  }

  if (userLimit.count >= RATE_LIMIT) {
    return true
  }

  userLimit.count++
  return false
}

interface TopArtistInput {
  spotify_artist_id: string;
  artist_name: string;
  artist_image_url: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, artists } = await req.json() as { 
      userId: string; 
      artists: TopArtistInput[] 
    }

    if (!userId || !artists || !Array.isArray(artists)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting check
    if (isRateLimited(userId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please wait.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Önce mevcut top artists'leri sil
    await supabaseAdmin
      .from('top_artists')
      .delete()
      .eq('user_id', userId)

    // Yeni top artists'leri ekle
    if (artists.length > 0) {
      const insertData = artists.map((artist, index) => ({
        user_id: userId,
        spotify_artist_id: artist.spotify_artist_id,
        artist_name: artist.artist_name,
        artist_image_url: artist.artist_image_url,
        rank: index + 1
      }))

      const { error } = await supabaseAdmin
        .from('top_artists')
        .insert(insertData)

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
