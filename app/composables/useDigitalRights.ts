// composables/useDigitalRights.ts
export const useDigitalRights = () => {
  const registerWork = async (formData: FormData) => {
    const { data, error } = await useFetch("/api/works/register", {
      method: "POST",
      body: formData,
    });

    if (error.value) throw error.value;
    return data.value;
  };

  const fetchWork = async (id: number) => {
    const { data } = await useFetch(`/api/works/${id}`);
    return data.value;
  };

  const fetchWorks = async (workType?: string, creatorId?: string) => {
    const params = new URLSearchParams();
    if (workType) params.append("workType", workType);
    if (creatorId) params.append("creatorId", creatorId);
    const query = params.toString() ? `?${params.toString()}` : "";

    const { data } = await useFetch(`/api/works${query}`);
    return data.value || [];
  };

  const fetchMyWorks = async () => {
    const { data } = await useFetch("/api/works/my");
    return data.value || [];
  };

  return {
    registerWork,
    fetchWork,
    fetchWorks,
    fetchMyWorks,
  };
};
