import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '../../../lib/apiAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('user_id', auth.user.id)
    .single()

  let code = profile?.referral_code
  if (!code) {
    code = generateCode()
    await supabase
      .from('profiles')
      .update({ referral_code: code })
      .eq('user_id', auth.user.id)
  }

  const { count: referralCount } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', auth.user.id)

  return Response.json({ code, referralCount: referralCount || 0 })
}

export async function POST(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { referral_code } = await request.json()
  if (!referral_code) return Response.json({ error: 'Code required' }, { status: 400 })

  const { data: referrer } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('referral_code', referral_code)
    .single()

  if (!referrer) return Response.json({ error: 'Invalid referral code' }, { status: 404 })
  if (referrer.user_id === auth.user.id) return Response.json({ error: 'Cannot refer yourself' }, { status: 400 })

  const { data: existing } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_id', auth.user.id)
    .single()

  if (existing) return Response.json({ error: 'Already referred' }, { status: 409 })

  const { error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.user_id,
      referred_id: auth.user.id,
      referral_code,
    })

  if (error) return Response.json({ error: 'Failed to save referral' }, { status: 500 })

  return Response.json({ ok: true })
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'QT-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
