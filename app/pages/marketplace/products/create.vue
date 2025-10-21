<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-2xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Create Product Listing</h1>
      
      <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-md p-6">
        <div class="mb-6">
          <label class="block text-gray-700 font-medium mb-2">Select Your Registered Work*</label>
          <select v-model="form.workId" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
            <option value="">Choose a work...</option>
            <option v-for="work in works" :key="work.id" :value="work.blockchain_id">
              {{ work.title }} ({{ work.work_type }})
            </option>
          </select>
          <p class="text-gray-500 text-sm mt-2">
            Don't see your work? <NuxtLink to="/works/register" class="text-purple-600 hover:underline">Register it first</NuxtLink>
          </p>
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 font-medium mb-2">Listing Title*</label>
          <input v-model="form.title" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="Enter listing title" />
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 font-medium mb-2">Description</label>
          <textarea v-model="form.description" rows="4"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="Describe what buyers will get"></textarea>
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 font-medium mb-2">Price (ETH)*</label>
          <input v-model.number="form.priceEth" type="number" step="0.001" min="0.001" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="0.05" />
          <p class="text-gray-500 text-sm mt-2">
            ~${{ (form.priceEth * 2000).toFixed(2) }} USD
          </p>
        </div>

        <div class="bg-purple-50 p-4 rounded-lg mb-6">
          <h3 class="font-semibold text-purple-900 mb-2">ℹ️ Product Listing Info</h3>
          <ul class="text-sm text-purple-800 space-y-1">
            <li>• Buyers will get access to your digital work</li>
            <li>• Transactions are secured on blockchain</li>
            <li>• 2.5% platform fee applies</li>
            <li>• You can deactivate listings anytime</li>
          </ul>
        </div>

        <div class="flex justify-end gap-4">
          <button type="button" @click="$router.back()"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" :disabled="submitting"
            class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
            {{ submitting ? 'Creating...' : 'Create Listing' }}
          </button>
        </div>

        <div v-if="error" class="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {{ error }}
        </div>

        <div v-if="success" class="mt-4 p-4 bg-green-50 text-green-600 rounded-lg">
          Product listed successfully! Redirecting...
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const { createProductListing } = useMarketplace();
const { fetchMyWorks } = useDigitalRights();

const works = ref([]);
const form = ref({
  workId: '',
  title: '',
  description: '',
  priceEth: 0.05
});

const submitting = ref(false);
const error = ref('');
const success = ref(false);

onMounted(async () => {
  try {
    works.value = await fetchMyWorks();
  } catch (err) {
    console.error('Failed to fetch works:', err);
  }
});

const handleSubmit = async () => {
  submitting.value = true;
  error.value = '';
  success.value = false;

  try {
    await createProductListing(form.value);
    success.value = true;

    setTimeout(() => {
      navigateTo('/dashboard/listings');
    }, 2000);
  } catch (err: any) {
    error.value = err.message || 'Failed to create listing';
  } finally {
    submitting.value = false;
  }
};
</script>
