<!-- pages/services/index.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <NuxtLink to="/" class="text-2xl font-bold text-purple-600">Arteka</NuxtLink>
          <div class="flex items-center gap-4">
            <NuxtLink to="/marketplace" class="text-gray-700 hover:text-purple-600">Products</NuxtLink>
            <NuxtLink to="/services" class="text-purple-600 font-semibold">Services</NuxtLink>
            <NuxtLink to="/services/my-orders" class="text-gray-700 hover:text-purple-600">My Orders</NuxtLink>
            <NuxtLink to="/messages" class="text-gray-700 hover:text-purple-600">💬</NuxtLink>
            <UserButton />
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Creative Services</h1>
          <p class="text-gray-600 mt-2">Find talented Indonesian creatives for your projects</p>
        </div>
        <NuxtLink
          to="/services/create"
          class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium"
        >
          + Offer Service
        </NuxtLink>
      </div>

      <!-- Categories -->
      <div class="bg-white rounded-xl shadow p-6 mb-8">
        <h3 class="font-semibold mb-4">Categories</h3>
        <div class="flex flex-wrap gap-2">
          <button
            @click="selectedCategory = ''"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition',
              selectedCategory === '' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            All Services
          </button>
          <button
            v-for="cat in categories"
            :key="cat.slug"
            @click="selectedCategory = cat.slug"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition',
              selectedCategory === cat.slug ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            {{ cat.icon }} {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="bg-white rounded-xl shadow p-4 mb-8">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search services..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg"
          @input="debouncedSearch"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>

      <!-- Services Grid -->
      <div v-else-if="services.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="service in services"
          :key="service.listing_id"
          class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
        >
          <div class="aspect-video bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center relative">
            <span class="text-6xl">{{ getCategoryIcon(service.category) }}</span>
            <div class="absolute top-2 right-2 bg-white px-3 py-1 rounded-full text-sm font-medium">
              {{ service.delivery_time }} days
            </div>
          </div>
          <div class="p-5">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {{ service.seller_wallet?.slice(2, 4).toUpperCase() || '??' }}
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-lg truncate">{{ service.title }}</h3>
                <div class="flex items-center gap-1 text-sm">
                  <span class="text-yellow-500">★</span>
                  <span class="font-semibold">{{ service.average_rating || 0 }}</span>
                  <span class="text-gray-500">({{ service.total_orders || 0 }})</span>
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-600 mb-4 line-clamp-2">{{ service.description }}</p>
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-xs text-gray-500">Starting at</p>
                <p class="text-2xl font-bold text-purple-600">{{ service.price_eth }} ETH</p>
              </div>
              <div class="text-right text-xs text-gray-500">
                <p>{{ service.revisions }} revisions</p>
              </div>
            </div>
            <div class="flex gap-2">
              <NuxtLink
                :to="`/services/${service.listing_id}`"
                class="flex-1 text-center bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium"
              >
                View Details
              </NuxtLink>
              <button
                @click="contactSeller(service)"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                💬
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="text-6xl mb-4">🎨</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
        <p class="text-gray-600">Try a different category or search term</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { UserButton } from '@clerk/nuxt/components'

const selectedCategory = ref('')
const searchQuery = ref('')
const loading = ref(true)
const services = ref<any[]>([])

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
]

const loadServices = async () => {
  try {
    loading.value = true
    const params: any = {}
    if (selectedCategory.value) params.category = selectedCategory.value
    if (searchQuery.value) params.search = searchQuery.value

    const response = await $fetch('/api/services/list', { params })
    services.value = response.services
  } catch (error) {
    console.error('Failed to load services:', error)
  } finally {
    loading.value = false
  }
}

let searchTimeout: any
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadServices(), 500)
}

const getCategoryIcon = (slug: string) => {
  const cat = categories.find(c => c.slug === slug)
  return cat?.icon || '🎨'
}

const contactSeller = async (service: any) => {
  try {
    const response = await $fetch('/api/messaging/conversation/create', {
      method: 'POST',
      body: {
        participantClerkId: service.clerk_user_id,
        listingId: service.listing_id
      }
    })
    navigateTo(`/messages/${response.conversationId}`)
  } catch (error: any) {
    alert('Failed to create conversation: ' + error.message)
  }
}

watch(selectedCategory, () => loadServices())

onMounted(() => loadServices())
</script>
