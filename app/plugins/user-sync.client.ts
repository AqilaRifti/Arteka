export default defineNuxtPlugin(async () => {
  const { userId, user } = useAuth();
  const { syncUser } = useUser();

  watch(
    userId,
    async (newUserId) => {
      if (newUserId && user.value) {
        try {
          await syncUser({
            email: user.value.primaryEmailAddress?.emailAddress || "",
            username: user.value.username || user.value.firstName || "",
          });
        } catch (error) {
          console.error("Failed to sync user:", error);
        }
      }
    },
    { immediate: true }
  );
});
