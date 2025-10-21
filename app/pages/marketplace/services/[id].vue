
<!-- pages/marketplace/services/[id].vue -->
<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <button @click="$router.back()" class="mb-6 text-blue-600 hover:underline">
        ← Back to Services
      </button>

      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>

      <div v-else-if="service" class="bg-white rounded-lg shadow-lg p-8">
        <div class="flex items-start justify-between mb-6">
          <div class="flex items-center gap-4">
            <div class="text-5xl">{{ getCategoryIcon(service.category) }}</div>
            <div>
              <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {{ getCategoryName(service.category) }}
              </span>
              <h1 class="text-3xl font-bold text-gray-900 mt-2">{{ service.title }}</h1>
            </div>
          </div>
        </div>

        <div class="mb-8">
          <div class="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold mb-2">Service Provider</h3>
            <p class="text-gray-700">{{ service.seller?.username || service.seller?.email }}</p>
          </div>

          <div class="mb-6 p-6 bg-blue-50 rounded-lg">
            <div class="flex items-baseline gap-2 mb-2">
              <span class="text-4xl font-bold text-blue-600">{{ service.price }} ETH</span>
              <span class="text-gray-600">starting price</span>
            </div>
            <p class="text-sm text-gray-600">~${{ (service.price * 2000).toFixed(2) }} USD</p>
          </div>

          <div class="mb-6">
            <h3 class="font-semibold text-lg mb-3">About This Service</h3>
            <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">{{ service.description }}</p>
          </div>

          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold mb-2">Service Details</h3>
            <div class="space-y-2 text-sm text-gray-600">
              <p>Orders Completed: {{ service.sold_count }}</p>
              <p>Listed: {{ formatDate(service.created_at) }}</p>
            </div>
          </div>

          <button @click="contactSeller"
            class="w-full px-6 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition">
            💬 Contact Seller to Order
          </button>

          <p class="text-center text-sm text-gray-500 mt-4">
            Discuss requirements and finalize details via secure messaging
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns';

const route = useRoute();
const { createConversation } = useMessaging();

const categories = [
  { slug: 'illustration', name: 'Illustration', icon: '🎨' },
  { slug: 'graphic_design', name: 'Graphic Design', icon: '✨' },
  { slug: 'video_editing', name: 'Video Editing', icon: '🎬' },
  { slug: 'animation', name: 'Animation', icon: '🎞️' },
  { slug: 'music_production', name: 'Music', icon: '🎵' },
  { slug: 'voice_over', name: 'Voice Over', icon: '🎙️' },
  { slug: 'writing', name: 'Writing', icon: '✍️' },
  { slug: 'photography', name: 'Photography', icon: '📷' },
  { slug: '3d_modeling', name: '3D Modeling', icon: '🧊' },
  { slug: 'web_design', name: 'Web Design', icon: '💻' }
];

const service = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await useFetch(`/api/marketplace/services/${route.params.id}`);
    service.value = data.value;
  } catch (err) {
    console.error('Failed to fetch service:', err);
  } finally {
    loading.value = false;
  }
});

const getCategoryIcon = (slug: string) => {
  return categories.find(c => c.slug === slug)?.icon || '📋';
};

const getCategoryName = (slug: string) => {
  return categories.find(c => c.slug === slug)?.name || slug;
};

const contactSeller = async () => {
  try {
    await createConversation(service.value.seller_id, service.value.id);
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