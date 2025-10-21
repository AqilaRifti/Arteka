// server/api/messaging/conversations.get.ts
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nuxt/server";
import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  const { userId } = getAuth(event);
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  // ensure env vars exist
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw createError({
      statusCode: 500,
      message:
        "Server configuration error: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing",
    });
  }

  try {
    // Server-side supabase client; don't persist session on server
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // Select conversations where the current user is participant1 or participant2.
    // Also grab related messages (ids) so we can compute a messages_count.
    const { data, error } = await supabase
      .from("conversations")
      .select("*, messages (id)")
      .or(
        `participant1_clerk_id.eq.${userId},participant2_clerk_id.eq.${userId}`
      )
      .eq("status", "active")
      .order("updated_at", { ascending: false });

    if (error) {
      throw createError({ statusCode: 500, message: error.message });
    }

    const conversations = (data || []).map((c: any) => ({
      ...c,
      messages_count: Array.isArray(c.messages) ? c.messages.length : 0,
      // keep c.messages if you want the array of messages; this only adds messages_count
    }));

    return { conversations };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, message });
  }
});
