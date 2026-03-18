import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const fallbackProjectId = 'humuunoxczekeaozkjda';
const fallbackPublishableKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bXV1bm94Y3pla2Vhb3pramRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwOTA5OTksImV4cCI6MjA4NzY2Njk5OX0.0mXyEnAuY9LK25iY_kgeu3gbwlq5hQoNoHVHsGpnxPw';

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || fallbackProjectId;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (projectId ? `https://${projectId}.supabase.co` : undefined);
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  fallbackPublishableKey;

export const isBackendConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const BACKEND_CONFIG_ERROR_MESSAGE =
  'Backend configuration is missing for this build; please publish again if this persists.';

let singleton: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!isBackendConfigured) {
    throw new Error(BACKEND_CONFIG_ERROR_MESSAGE);
  }

  if (!singleton) {
    singleton = createClient<Database>(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return singleton;
}
