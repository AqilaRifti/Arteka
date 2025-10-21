// composables/useUser.ts
export const useUser = () => {
  const syncUser = async (userData: {
    email: string;
    username?: string;
    walletAddress?: string;
  }) => {
    const { data, error } = await useFetch("/api/users/sync", {
      method: "POST",
      body: userData,
    });

    if (error.value) throw error.value;
    return data.value;
  };

  const fetchCurrentUser = async () => {
    const { data } = await useFetch("/api/users/me");
    return data.value;
  };

  const fetchUser = async (id: string) => {
    const { data } = await useFetch(`/api/users/${id}`);
    return data.value;
  };

  return {
    syncUser,
    fetchCurrentUser,
    fetchUser,
  };
};
