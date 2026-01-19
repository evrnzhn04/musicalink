// Follow/Unfollow Edge Function with Rate Limiting
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory rate limiter (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // max requests
const RATE_WINDOW = 60000 // per minute (60 seconds)

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

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, requesterId, receiverId } = await req.json()

    // Validate input
    if (!action || !requesterId || !receiverId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting check
    if (isRateLimited(requesterId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please wait.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (action === 'follow') {
      const { error } = await supabaseAdmin
        .from('friendships')
        .insert({
          requester_id: requesterId,
          receiver_id: receiverId,
          status: 'accepted'
        })

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'unfollow') {
      const { error } = await supabaseAdmin
        .from('friendships')
        .delete()
        .eq('requester_id', requesterId)
        .eq('receiver_id', receiverId)

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
