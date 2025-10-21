// server/api/users/sync.post.ts
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { email, username, walletAddress } = body;

  try {
    const supabase = getSupabaseClient();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", auth.userId)
      .single();

    if (existingUser) {
      // Update existing user
      const { data: user, error } = await supabase
        .from("users")
        .update({
          email: email || existingUser.email,
          username: username || existingUser.username,
          wallet_address: walletAddress || existingUser.wallet_address,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_id", auth.userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, user };
    } else {
      // Create new user
      const { data: user, error } = await supabase
        .from("users")
        .insert({
          clerk_id: auth.userId,
          email,
          username,
          wallet_address: walletAddress,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, user, isNew: true };
    }
  } catch (error: any) {
    console.error("User sync error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to sync user",
    });
  }
});
