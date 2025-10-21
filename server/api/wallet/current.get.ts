// server/api/wallet/current.get.ts
// Get user's current wallet info
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  try {
    const { userId } = getAuth(event);
    if (!userId) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: wallet, error } = await supabase
      .from("user_wallets")
      .select("wallet_address, wallet_type, created_at, updated_at")
      .eq("clerk_user_id", userId)
      .single();

    if (error || !wallet) {
      return {
        hasWallet: false,
        wallet: null,
      };
    }

    return {
      hasWallet: true,
      wallet: {
        address: wallet.wallet_address,
        type: wallet.wallet_type || "auto-generated",
        createdAt: wallet.created_at,
        updatedAt: wallet.updated_at,
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, message: error.message });
  }
});
