// server/api/users/by-wallet.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { walletAddress } = body;

  if (!walletAddress) {
    throw createError({
      statusCode: 400,
      message: "walletAddress is required",
    });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, wallet_address")
      .eq("wallet_address", walletAddress)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return { data };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
