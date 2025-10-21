
<!-- pages/dashboard/listings.vue -->
<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">My Listings</h1>

      <div class="mb-6 flex gap-4">
        <button @click="filter = 'all'"
          :class="[
            'px-4 py-2 rounded-lg transition',
            filter === 'all' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          ]">
          All
        </button>
        <button @click="filter = 'product'"
          :class="[
            'px-4 py-2 rounded-lg transition',
            filter === 'product' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          ]">
          Products
        </button>
        <button @click="filter = 'service'"
          :class="[
            'px-4 py-2 rounded-lg transition',
            filter === 'service' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          ]">
          Services
        </button>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>

      <div v-else-if="filteredListings.length === 0" class="text-center py-12">
        <p class="text-gray-500 text-lg mb-4">No listings yet</p>
        <NuxtLink to="/works/register" 
          class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-block">
          Create Your First Listing
        </NuxtLink>
      </div>

      <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="listing in filteredListings" :key="listing.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="font-medium text-gray-900">{{ listing.title }}</div>
                <div class="text-sm text-gray-500">{{ listing.category || 'Product' }}</div>
              </td>
              <td class="px-6 py-4">
                <span :class="[
                  'px-2 py-1 text-xs rounded-full',
                  listing.listing_type === 'product' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                ]">
                  {{ listing.listing_type }}
                </span>
              </td>
              <td class="px-6 py-4 font-semibold">{{ listing.price }} ETH</td>
              <td class="px-6 py-4">{{ listing.sold_count }}</td>
              <td class="px-6 py-4">
                <span :class="[
                  'px-2 py-1 text-xs rounded-full',
                  listing.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                ]">
                  {{ listing.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <button @click="viewListing(listing)"
                  class="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  View →
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const listings = ref([]);
const filter = ref('all');
const loading = ref(true);

const filteredListings = computed(() => {
  if (filter.value === 'all') return listings.value;
  return listings.value.filter((l: any) => l.listing_type === filter.value);
});

onMounted(async () => {
  try {
    const { data } = await useFetch('/api/marketplace/my-listings');
    listings.value = data.value || [];
  } catch (error) {
    console.error('Failed to fetch listings:', error);
  } finally {
    loading.value = false;
  }
});

const viewListing = (listing: any) => {
  const path = listing.listing_type === 'product' 
    ? `/marketplace/products/${listing.id}`
    : `/marketplace/services/${listing.id}`;
  navigateTo(path);
};
</script>
