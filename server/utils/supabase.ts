// server/utils/supabase.ts
import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  return createClient(
    "https://cozhneczrqtxlugkubte.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhuZWN6cnF0eGx1Z2t1YnRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE1NDk2OCwiZXhwIjoyMDc1NzMwOTY4fQ.CWdJyBVN7V7xBJQGAEnAa2eakbncabrn6SmuXIg5hNs"
  );
}
