
<!-- pages/marketplace/products/[id].vue -->
<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <button @click="$router.back()" class="mb-6 text-purple-600 hover:underline">
        ← Back to Products
      </button>

      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>

      <div v-else-if="product" class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="grid md:grid-cols-2 gap-8 p-8">
          <!-- Product Image/Preview -->
          <div class="bg-gray-100 rounded-lg overflow-hidden">
            <img v-if="product.work?.ipfs_hash" 
              :src="`https://gateway.pinata.cloud/ipfs/${product.work.ipfs_hash}`"
              :alt="product.title"
              class="w-full h-96 object-contain" />
            <div v-else class="w-full h-96 flex items-center justify-center text-6xl">
              🎨
            </div>
          </div>

          <!-- Product Details -->
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ product.title }}</h1>
            
            <div class="mb-6">
              <span class="text-4xl font-bold text-purple-600">{{ product.price }} ETH</span>
              <span class="text-gray-500 ml-2">(~${{ (product.price * 2000).toFixed(2) }})</span>
            </div>

            <div class="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 class="font-semibold mb-2">Seller</h3>
              <p class="text-gray-700">{{ product.seller?.username || product.seller?.email }}</p>
            </div>

            <div class="mb-6">
              <h3 class="font-semibold mb-2">Description</h3>
              <p class="text-gray-700 whitespace-pre-wrap">{{ product.description }}</p>
            </div>

            <div class="mb-6">
              <h3 class="font-semibold mb-2">Details</h3>
              <div class="space-y-2 text-sm text-gray-600">
                <p>Type: {{ product.work?.work_type }}</p>
                <p>Sold: {{ product.sold_count }} times</p>
                <p>Listed: {{ formatDate(product.created_at) }}</p>
              </div>
            </div>

            <div class="flex gap-4">
              <button @click="purchase" :disabled="purchasing"
                class="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
                {{ purchasing ? 'Processing...' : 'Purchase Now' }}
              </button>
              <button @click="contactSeller"
                class="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition">
                💬 Message
              </button>
            </div>

            <div v-if="error" class="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns';

const route = useRoute();
const { wallet, isConnected, connect, purchaseListing } = useWeb3();
const { recordPurchase } = useMarketplace();
const { createConversation } = useMessaging();

const product = ref(null);
const loading = ref(true);
const purchasing = ref(false);
const error = ref('');

onMounted(async () => {
  try {
    const { data } = await useFetch(`/api/marketplace/products/${route.params.id}`);
    product.value = data.value;
  } catch (err) {
    console.error('Failed to fetch product:', err);
  } finally {
    loading.value = false;
  }
});

const purchase = async () => {
  if (!isConnected.value) {
    try {
      await connect();
    } catch (err) {
      error.value = 'Please connect your wallet first';
      return;
    }
  }

  purchasing.value = true;
  error.value = '';

  try {
    const txHash = await purchaseListing(
      product.value.blockchain_id,
      product.value.price_wei
    );

    await recordPurchase(product.value.id, txHash);
    
    alert('Purchase successful! Check your wallet.');
    navigateTo('/dashboard/purchases');
  } catch (err: any) {
    error.value = err.message || 'Failed to purchase';
  } finally {
    purchasing.value = false;
  }
};

const contactSeller = async () => {
  try {
    const result = await createConversation(product.value.seller_id, product.value.id);
    navigateTo('/messages');
  } catch (err) {
    console.error('Failed to create conversation:', err);
    alert('Failed to start conversation');
  }
};

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy');
};
</script>