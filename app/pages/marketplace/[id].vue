<!-- pages/marketplace/[id].vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <NuxtLink to="/" class="text-2xl font-bold text-purple-600">Arteka</NuxtLink>
          <div class="flex items-center gap-4">
            <NuxtLink to="/marketplace" class="text-gray-700 hover:text-purple-600">← Back</NuxtLink>
            <UserButton />
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>

      <div v-else-if="listing" class="grid lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="aspect-video bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
              <span class="text-8xl">{{ getWorkIcon(listing.digital_works?.work_type) }}</span>
            </div>
            <div class="p-6">
              <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ listing.title }}</h1>
              <p class="text-gray-600 mb-6">{{ listing.description }}</p>

              <!-- Work Details -->
              <div v-if="listing.digital_works" class="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 class="font-bold mb-2">About the Work</h3>
                <div class="text-sm space-y-1">
                  <p><strong>Type:</strong> {{ listing.digital_works.work_type }}</p>
                  <p><strong>Created:</strong> {{ formatDate(listing.digital_works.created_at) }}</p>
                  <a
                    :href="`https://gateway.pinata.cloud/ipfs/${listing.digital_works.ipfs_hash}`"
                    target="_blank"
                    class="text-purple-600 hover:underline"
                  >
                    📦 View on IPFS
                  </a>
                </div>
              </div>

              <!-- Revenue Sharing Info -->
              <div v-if="listing.routes_to_campaign" class="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                <h3 class="font-bold text-purple-900 mb-2">💰 Revenue Sharing Active</h3>
                <p class="text-sm text-purple-800">
                  This product is linked to a funded campaign. Revenue automatically splits between creator and backers!
                </p>
                <NuxtLink
                  :to="`/funding/${listing.campaign_id}`"
                  class="inline-block mt-2 text-purple-600 hover:underline font-medium text-sm"
                >
                  View Campaign →
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div>
          <div class="bg-white rounded-xl shadow-lg p-6 sticky top-4">
            <div class="text-3xl font-bold text-purple-600 mb-6">{{ listing.price_eth }} ETH</div>

            <button
              @click="purchase"
              :disabled="purchasing"
              class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition mb-3"
            >
              {{ purchasing ? 'Processing...' : '🛒 Buy Now' }}
            </button>

            <button
              @click="contactSeller"
              class="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              💬 Contact Seller
            </button>

            <div class="mt-6 pt-6 border-t space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Sold:</span>
                <span class="font-semibold">{{ listing.sold_count || 0 }} times</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Listed:</span>
                <span class="font-semibold">{{ formatDate(listing.created_at) }}</span>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t">
              <a
                :href="`https://sepolia.etherscan.io/tx/${listing.transaction_hash}`"
                target="_blank"
                class="block text-center text-purple-600 hover:underline text-sm"
              >
                📋 View on Etherscan
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UserButton } from '@clerk/nuxt/components'
import { useRoute } from 'vue-router'


const route = useRoute()
const listingId = route.params.id as string

const loading = ref(true)
const purchasing = ref(false)
const listing = ref<any>(null)

const loadListing = async () => {
  try {
    loading.value = true
    // Implement API call to get listing details
    const response = await $fetch(`/api/marketplace/listings`)
    const allListings = response.listings
    listing.value = allListings.find((l: any) => l.listing_id === listingId)
  } catch (error) {
    console.error('Failed to load listing:', error)
  } finally {
    loading.value = false
  }
}

const purchase = async () => {
  purchasing.value = true
  try {
    const response = await $fetch('/api/marketplace/purchase', {
      method: 'POST',
      body: { listingId }
    })

    alert('Purchase successful! Check your messages to coordinate with the seller.')
    await loadListing()
  } catch (error: any) {
    alert('Purchase failed: ' + error.message)
  } finally {
    purchasing.value = false
  }
}

const contactSeller = async () => {
  try {
    const response = await $fetch('/api/messaging/conversation/create', {
      method: 'POST',
      body: {
        participantClerkId: listing.value.clerk_user_id,
        listingId: listingId
      }
    })
    navigateTo(`/messages/${response.conversationId}`)
  } catch (error: any) {
    alert('Failed to create conversation: ' + error.message)
  }
}

const getWorkIcon = (type: string) => {
  const icons: Record<string, string> = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    text: '📝'
  }
  return icons[type] || '📄'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => loadListing())
</script>