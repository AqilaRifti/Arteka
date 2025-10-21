
<!-- pages/dashboard/purchases.vue -->
<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">My Purchases</h1>

      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>

      <div v-else-if="purchases.length === 0" class="text-center py-12">
        <p class="text-gray-500 text-lg mb-4">No purchases yet</p>
        <NuxtLink to="/marketplace/products" 
          class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-block">
          Browse Marketplace
        </NuxtLink>
      </div>

      <div v-else class="space-y-4">
        <div v-for="purchase in purchases" :key="purchase.id"
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="font-bold text-lg mb-2">{{ purchase.listing.title }}</h3>
              <p class="text-gray-600 text-sm mb-3">
                Seller: {{ purchase.listing.seller.username || purchase.listing.seller.email }}
              </p>
              <div class="flex items-center gap-4 text-sm">
                <span class="text-purple-600 font-semibold">{{ purchase.price }} ETH</span>
                <span class="text-gray-500">{{ formatDate(purchase.created_at) }}</span>
                <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {{ purchase.status }}
                </span>
              </div>
            </div>
            <div class="flex gap-2">
              <a :href="`https://sepolia.etherscan.io/tx/${purchase.transaction_hash}`" 
                target="_blank"
                class="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition">
                View TX
              </a>
              <button @click="contactSeller(purchase.listing.seller_id, purchase.listing.id)"
                class="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition">
                💬 Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns';

const { createConversation } = useMessaging();
const purchases = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await useFetch('/api/marketplace/my-purchases');
    purchases.value = data.value || [];
  } catch (error) {
    console.error('Failed to fetch purchases:', error);
  } finally {
    loading.value = false;
  }
});

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

const contactSeller = async (sellerId: string, listingId: number) => {
  try {
    await createConversation(sellerId, listingId);
    navigateTo('/messages');
  } catch (error) {
    console.error('Failed to create conversation:', error);
  }
};
</script>