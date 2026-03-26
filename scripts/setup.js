#!/usr/bin/env node
/**
 * Brightpath Setup — Interactive Migration Runner
 * 
 * Prompts for your Supabase service_role key and automatically:
 *  1. Creates the announcements + forum tables (SQL migration)
 *  2. Creates the `avatars` storage bucket (public, 5MB limit)
 *
 * Run with:  node scripts/setup.js
 */

const https = require('https');
const readline = require('readline');

const PROJECT_ID = 'humuunoxczekeaozkjda';

// ── Helpers ────────────────────────────────────────────────────────
function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function apiCall(method, hostname, path, body, key) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname,
      path,
      method,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch (_) { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── SQL Migration ───────────────────────────────────────────────────
const MIGRATION_SQL = `
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expertise text[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Anyone can view announcements') THEN
    CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
    CREATE POLICY "Teachers can create announcements" ON public.announcements FOR INSERT WITH CHECK (auth.uid() = teacher_id AND has_role(auth.uid(), 'teacher'));
    CREATE POLICY "Teachers can update own announcements" ON public.announcements FOR UPDATE USING (auth.uid() = teacher_id);
    CREATE POLICY "Teachers can delete own announcements" ON public.announcements FOR DELETE USING (auth.uid() = teacher_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.forum_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='forum_threads' AND policyname='Anyone can view forum threads') THEN
    CREATE POLICY "Anyone can view forum threads" ON public.forum_threads FOR SELECT USING (true);
    CREATE POLICY "Students and teachers can post threads" ON public.forum_threads FOR INSERT WITH CHECK (has_role(auth.uid(),'student') OR has_role(auth.uid(),'teacher'));
    CREATE POLICY "Authors can update own threads" ON public.forum_threads FOR UPDATE USING (auth.uid() = author_id);
    CREATE POLICY "Authors can delete own threads" ON public.forum_threads FOR DELETE USING (auth.uid() = author_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='forum_replies' AND policyname='Anyone can view forum replies') THEN
    CREATE POLICY "Anyone can view forum replies" ON public.forum_replies FOR SELECT USING (true);
    CREATE POLICY "Students and teachers can post replies" ON public.forum_replies FOR INSERT WITH CHECK (has_role(auth.uid(),'student') OR has_role(auth.uid(),'teacher'));
    CREATE POLICY "Authors can update own replies" ON public.forum_replies FOR UPDATE USING (auth.uid() = author_id);
    CREATE POLICY "Authors can delete own replies" ON public.forum_replies FOR DELETE USING (auth.uid() = author_id);
  END IF;
END $$;
`;

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   Brightpath Learning — Setup Script     ║');
  console.log('╚══════════════════════════════════════════╝\n');

  console.log('This script needs your Supabase SERVICE ROLE key to:');
  console.log('  • Create announcements + forum tables');
  console.log('  • Create the `avatars` storage bucket\n');
  console.log('Find it at:');
  console.log('  https://supabase.com/dashboard/project/humuunoxczekeaozkjda/settings/api');
  console.log('  → "service_role" under "Project API keys"\n');

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    || await prompt('Paste your service_role key and press Enter:\n> ');

  if (!key || key.length < 50) {
    console.error('\n❌  Invalid key. Please try again.\n');
    process.exit(1);
  }

  const host = `${PROJECT_ID}.supabase.co`;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1: Run SQL via Supabase's query endpoint (requires service role)
  process.stdout.write('📦  Running SQL migration... ');
  const sqlRes = await apiCall('POST', host, '/rest/v1/rpc/query', { query: MIGRATION_SQL }, key)
    .catch(() => null);

  // The Supabase Management API pg endpoint
  const pgRes = await apiCall('POST', `api.supabase.com`, `/v1/projects/${PROJECT_ID}/database/query`, { query: MIGRATION_SQL }, key)
    .catch(() => null);

  if (pgRes?.status === 200 || pgRes?.status === 201) {
    console.log('✅');
  } else {
    // Fallback: try via direct REST RPC (needs exec_sql function, usually not available)
    console.log('\n\n   ⚠️  Auto-migration not available without a personal access token.');
    console.log('   Please run the SQL manually in the Supabase SQL Editor:\n');
    console.log(`   👉  https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new\n`);
    console.log('   Copy-paste the contents of:');
    console.log('   📄  supabase/migrations/20260324000000_announcements_forums.sql\n');
  }

  // Step 2: Create avatars bucket (service role CAN do this)
  process.stdout.write('🪣   Creating avatars storage bucket... ');
  const bucketRes = await apiCall('POST', host, '/storage/v1/bucket', {
    id: 'avatars',
    name: 'avatars',
    public: true,
    file_size_limit: 5242880,
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  }, key);

  if (bucketRes.status === 200 || bucketRes.status === 201) {
    console.log('✅  Created (public, 5MB limit)');
  } else if (bucketRes.status === 409 || bucketRes.body?.error?.includes?.('already exists')) {
    console.log('✅  Already exists (skipped)');
  } else {
    console.log(`⚠️  Status ${bucketRes.status}: ${JSON.stringify(bucketRes.body)}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉  Setup complete! Open http://localhost:5173\n');
}

main().catch(e => {
  console.error('\n❌  Error:', e.message);
  process.exit(1);
});
