<!-- pages/marketplace/services/create.vue -->
<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-2xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Offer a Service</h1>
      
      <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-md p-6">
        <div class="mb-6">
          <label class="block text-gray-700 font-medium mb-2">Service Category*</label>
          <select v-model="form.category" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent">
            <option value="">Select a category</option>
            <option v-for="cat in categories" :key="cat.slug" :value="cat.slug">
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 font-medium mb-2">Service Title*</label>
          <input v-model="form.title" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="e.g., Professional Logo Design" />
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 font-medium mb-2">Description*</label>
          <textarea v-model="form.description" rows="6" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="Describe your service, what's included, delivery time, etc."></textarea>
          <p class="text-gray-500 text-sm mt-2">
            Be detailed! Include what you'll deliver, revisions, timeline, and requirements.
          </p>
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 font-medium mb-2">Starting Price (ETH)*</label>
          <input v-model.number="form.priceEth" type="number" step="0.001" min="0.001" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="0.05" />
          <p class="text-gray-500 text-sm mt-2">
            ~${{ (form.priceEth * 2000).toFixed(2) }} USD
          </p>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 class="font-semibold text-blue-900 mb-2">💡 Tips for Success</h3>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• Be clear about what's included in your service</li>
            <li>• Mention typical delivery time</li>
            <li>• Specify how many revisions you offer</li>
            <li>• List any requirements from buyers</li>
          </ul>
        </div>

        <div class="flex justify-end gap-4">
          <button type="button" @click="$router.back()"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" :disabled="submitting"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {{ submitting ? 'Creating...' : 'Create Service Listing' }}
          </button>
        </div>

        <div v-if="error" class="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {{ error }}
        </div>

        <div v-if="success" class="mt-4 p-4 bg-green-50 text-green-600 rounded-lg">
          Service listed successfully! Redirecting...
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const { createServiceListing } = useMarketplace();

const form = ref({
  category: '',
  title: '',
  description: '',
  priceEth: 0.05
});

const submitting = ref(false);
const error = ref('');
const success = ref(false);

const handleSubmit = async () => {
  submitting.value = true;
  error.value = '';
  success.value = false;

  try {
    await createServiceListing(form.value);
    success.value = true;

    setTimeout(() => {
      navigateTo('/dashboard/listings');
    }, 2000);
  } catch (err: any) {
    error.value = err.message || 'Failed to create service listing';
  } finally {
    submitting.value = false;
  }
};
</script>