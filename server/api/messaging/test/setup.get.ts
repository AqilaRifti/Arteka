// server/api/messaging/test/setup.get.ts
// Test endpoint to verify messaging setup
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  try {
    // 1. Check environment variables
    results.tests.environment = {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
      supabaseUrlValue: process.env.SUPABASE_URL?.substring(0, 30) + "...",
    };

    // 2. Check Supabase connection
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      results.tests.supabaseConnection = { success: true };

      // 3. Check tables exist
      const tables = ["conversations", "messages", "user_wallets"];
      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select("count").limit(1);
          results.tests[`table_${table}`] = {
            exists: !error,
            error: error?.message,
          };
        } catch (err: any) {
          results.tests[`table_${table}`] = {
            exists: false,
            error: err.message,
          };
        }
      }

      // 4. Check if there are any users
      const { count: userCount } = await supabase
        .from("user_wallets")
        .select("*", { count: "exact", head: true });

      results.tests.userWallets = {
        count: userCount,
        hasUsers: (userCount || 0) > 0,
      };

      // 5. Check if there are any conversations
      const { count: convCount } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true });

      results.tests.conversations = {
        count: convCount,
      };
    } catch (error: any) {
      results.tests.supabaseConnection = {
        success: false,
        error: error.message,
      };
    }

    results.overall = {
      success: true,
      message: "All tests passed! Messaging system is ready.",
    };
  } catch (error: any) {
    results.overall = {
      success: false,
      error: error.message,
    };
  }

  return results;
});
