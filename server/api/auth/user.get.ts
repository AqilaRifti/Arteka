// server/api/auth/user.get.ts
import { clerkClient, getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  try {
    // Get user from database
    let user = await getUserByClerkId(auth.userId);

    // If user doesn't exist, create it
    if (!user) {
      const clerkUser = await clerkClient(event).users.getUser(auth.userId);
      user = await createUser(
        auth.userId,
        clerkUser.emailAddresses[0]?.emailAddress || ""
      );
    }

    return user;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
