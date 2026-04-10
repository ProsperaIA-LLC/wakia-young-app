// Run: node create-admin.mjs <email> <full_name>
// Creates an admin user in Supabase auth + public.users with role='admin'
// and sends an invite email.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local manually
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = env.NEXT_PUBLIC_APP_URL

const [,, email, fullName] = process.argv
if (!email || !fullName) {
  console.error('Usage: node create-admin.mjs <email> "<full name>"')
  process.exit(1)
}

const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

console.log(`Creating admin user: ${email} (${fullName})`)

// 1. Invite via auth
const { data: inviteData, error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
  data: { full_name: fullName, role: 'admin' },
  redirectTo: `${APP_URL}/young/auth/callback?next=/dashboard`,
})

if (inviteError) {
  console.error('Error creating auth user:', inviteError.message)
  process.exit(1)
}

const userId = inviteData.user.id
console.log('Auth user created:', userId)

// 2. Insert public profile with role=admin
const { error: profileError } = await service
  .from('users')
  .upsert({
    id: userId,
    email,
    full_name: fullName,
    nickname: fullName.split(' ')[0],
    role: 'admin',
    country: 'MX',
    market: 'LATAM',
    parent_consent: true,
  })

if (profileError) {
  console.error('Error creating profile:', profileError.message)
  process.exit(1)
}

console.log(`\n✅ Admin user created successfully!`)
console.log(`   Email: ${email}`)
console.log(`   ID: ${userId}`)
console.log(`   An invite email has been sent. The user must click the link to set their password.`)
