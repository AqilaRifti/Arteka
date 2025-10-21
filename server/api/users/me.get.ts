// server/api/users/me.get.ts
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const supabase = getSupabaseClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", auth.userId)
    .single();

  if (error || !user) {
    throw createError({
      statusCode: 404,
      message: "User not found",
    });
  }

  return user;
});
