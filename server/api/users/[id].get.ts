// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "User ID required",
    });
  }

  const supabase = getSupabaseClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, email, created_at")
    .eq("id", id)
    .single();

  if (error || !user) {
    throw createError({
      statusCode: 404,
      message: "User not found",
    });
  }

  return user;
});
