// composables/useMarketplace.ts
export const useMarketplace = () => {
  const fetchProducts = async (sellerId?: string) => {
    const query = sellerId ? `?sellerId=${sellerId}` : "";
    const { data } = await useFetch(`/api/marketplace/products${query}`);
    return data.value || [];
  };

  const fetchServices = async (category?: string, sellerId?: string) => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (sellerId) params.append("sellerId", sellerId);
    const query = params.toString() ? `?${params.toString()}` : "";

    const { data } = await useFetch(`/api/marketplace/services${query}`);
    return data.value || [];
  };

  const createProductListing = async (productData: any) => {
    const { data, error } = await useFetch("/api/marketplace/products/create", {
      method: "POST",
      body: productData,
    });

    if (error.value) throw error.value;
    return data.value;
  };

  const createServiceListing = async (serviceData: any) => {
    const { data, error } = await useFetch("/api/marketplace/services/create", {
      method: "POST",
      body: serviceData,
    });

    if (error.value) throw error.value;
    return data.value;
  };

  const recordPurchase = async (listingId: number, transactionHash: string) => {
    const { data, error } = await useFetch("/api/marketplace/purchase", {
      method: "POST",
      body: { listingId, transactionHash },
    });

    if (error.value) throw error.value;
    return data.value;
  };

  return {
    fetchProducts,
    fetchServices,
    createProductListing,
    createServiceListing,
    recordPurchase,
  };
};
