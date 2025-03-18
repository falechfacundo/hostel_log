import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  // process.env.SUPABASE_URL,
  // process.env.SUPABASE_ANON_KEY
  "https://llwgjoxjuvqmtmlvlqpr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsd2dqb3hqdXZxbXRtbHZscXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NzYyOTEsImV4cCI6MjA1NjI1MjI5MX0.0bl222cpSXfbN6v_08NyKQohDta19N4xwdY2s_l628A"
);
