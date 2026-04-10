// node set-admin.mjs <email>
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()] })
)

const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const email = process.argv[2]
if (!email) { console.error('Usage: node set-admin.mjs <email>'); process.exit(1) }

const { data, error } = await service
  .from('users').update({ role: 'admin' }).eq('email', email).select('id, email, role').single()

if (error) { console.error('Error:', error.message); process.exit(1) }
console.log(`✅ ${data.email} → role = ${data.role} (id: ${data.id})`)
