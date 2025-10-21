<!-- pages/services/[id].vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <NuxtLink to="/" class="text-2xl font-bold text-purple-600">Arteka</NuxtLink>
          <div class="flex items-center gap-4">
            <NuxtLink to="/services" class="text-gray-700 hover:text-purple-600">← Back</NuxtLink>
            <UserButton />
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>

      <div v-else-if="service" class="grid lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Service Header -->
          <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="flex items-start gap-4 mb-6">
              <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {{ service.seller_wallet?.slice(2, 4).toUpperCase() || '??' }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h1 class="text-3xl font-bold text-gray-900">{{ service.title }}</h1>
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                  <div class="flex items-center gap-1">
                    <span class="text-yellow-500">★</span>
                    <span class="font-semibold">{{ service.average_rating || 0 }}</span>
                    <span>({{ service.total_orders || 0 }} orders)</span>
                  </div>
                  <span>{{ getCategoryName(service.category) }}</span>
                </div>
              </div>
            </div>

            <div class="aspect-video bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <span class="text-8xl">{{ getCategoryIcon(service.category) }}</span>
            </div>

            <div class="prose max-w-none">
              <h2 class="text-xl font-bold mb-3">About This Service</h2>
              <p class="text-gray-700 whitespace-pre-wrap">{{ service.description }}</p>
            </div>
          </div>

          <!-- Requirements -->
          <div v-if="service.requirements && service.requirements.length > 0" class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold mb-4">What I Need From You</h3>
            <ul class="space-y-2">
              <li v-for="(req, i) in service.requirements" :key="i" class="flex items-start gap-2">
                <span class="text-purple-600">✓</span>
                <span class="text-gray-700">{{ req }}</span>
              </li>
            </ul>
          </div>

          <!-- Reviews -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold mb-4">Reviews ({{ reviews.length }})</h3>
            <div v-if="reviews.length > 0" class="space-y-4">
              <div v-for="review in reviews" :key="review.id" class="border-b last:border-b-0 pb-4 last:pb-0">
                <div class="flex items-center gap-2 mb-2">
                  <div class="flex items-center">
                    <span v-for="i in 5" :key="i" :class="i <= review.rating ? 'text-yellow-500' : 'text-gray-300'">
                      ★
                    </span>
                  </div>
                  <span class="text-sm text-gray-500">{{ formatDate(review.created_at) }}</span>
                </div>
                <p class="text-gray-700">{{ review.review }}</p>
              </div>
            </div>
            <p v-else class="text-gray-500">No reviews yet. Be the first to order!</p>
          </div>
        </div>

        <!-- Sidebar - Order Card -->
        <div>
          <div class="bg-white rounded-xl shadow-lg p-6 sticky top-4">
            <div class="mb-6">
              <div class="flex items-baseline gap-2 mb-4">
                <span class="text-3xl font-bold text-purple-600">{{ service.price_eth }}</span>
                <span class="text-gray-600">ETH</span>
              </div>
              <div class="space-y-2 text-sm text-gray-600">
                <div class="flex items-center justify-between">
                  <span>⏱️ Delivery Time</span>
                  <span class="font-semibold">{{ service.delivery_time }} days</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>🔄 Revisions</span>
                  <span class="font-semibold">{{ service.revisions }} included</span>
                </div>
              </div>
            </div>

            <button
              @click="showOrderModal = true"
              class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition mb-3"
            >
              Order Now
            </button>

            <button
              @click="contactSeller"
              class="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              💬 Contact Seller
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Modal -->
    <div
      v-if="showOrderModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showOrderModal = false"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-2xl font-bold mb-4">Place Your Order</h3>

        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-purple-900">
            <strong>Important:</strong> After payment, you'll receive a conversation link to discuss project details with the seller.
          </p>
        </div>

        <form @submit.prevent="placeOrder" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Project Requirements *</label>
            <textarea
              v-model="orderForm.requirements"
              rows="6"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Describe your project in detail..."
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea
              v-model="orderForm.additionalNotes"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Any additional information..."
            ></textarea>
          </div>

          <div class="border-t pt-4">
            <div class="flex justify-between text-lg font-semibold mb-4">
              <span>Total</span>
              <span class="text-purple-600">{{ service.price_eth }} ETH</span>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              type="submit"
              :disabled="ordering"
              class="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {{ ordering ? 'Processing...' : 'Pay & Order' }}
            </button>
            <button
              type="button"
              @click="showOrderModal = false"
              class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>

        <p v-if="orderError" class="text-red-600 text-sm mt-4">{{ orderError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { UserButton } from '@clerk/nuxt/components'
import { useRoute } from 'vue-router'
import { ethers } from 'ethers'


const route = useRoute()
const serviceId = ref(String(route.params.id || ''))

const loading = ref(true)
const service = ref<any>(null)
const reviews = ref<any[]>([])
const showOrderModal = ref(false)
const ordering = ref(false)
const orderError = ref('')

const orderForm = ref({
  requirements: '',
  additionalNotes: ''
})

const categories = [
  { slug: 'illustration', name: 'Illustration & Drawing', icon: '🎨' },
  { slug: 'graphic_design', name: 'Graphic Design', icon: '✨' },
  { slug: 'video_editing', name: 'Video Editing', icon: '🎬' },
  { slug: 'animation', name: 'Animation', icon: '🎞️' },
  { slug: 'music_production', name: 'Music Production', icon: '🎵' },
  { slug: 'voice_over', name: 'Voice Over', icon: '🎙️' },
  { slug: 'writing', name: 'Writing & Translation', icon: '✍️' },
  { slug: 'photography', name: 'Photography', icon: '📷' },
  { slug: '3d_modeling', name: '3D Modeling', icon: '🧊' },
  { slug: 'web_design', name: 'Web Design', icon: '💻' }
]

const loadService = async () => {
  try {
    loading.value = true
    // Fetch service + reviews from API
    const response: any = await $fetch(`/api/services/${serviceId.value}`)
    service.value = response.service || null
    reviews.value = response.reviews || []

    // Ensure sensible defaults so template doesn't break
    if (service.value) {
      service.value.delivery_time = service.value.delivery_time ?? 3
      service.value.revisions = service.value.revisions ?? 1
      service.value.average_rating = service.value.average_rating ?? 0
      service.value.total_orders = service.value.total_orders ?? 0

      // Normalize price -> price_eth for display
      try {
        // prefer explicit wei field, otherwise support raw price field
        const raw = service.value.price_wei ?? service.value.price ?? '0'
        // ethers.utils.formatEther accepts string/BigNumber
        service.value.price_eth = ethers.utils.formatEther(raw.toString())
      } catch (e) {
        // fallback: if parsing fails, show 0
        service.value.price_eth = '0'
      }
    }
  } catch (error) {
    console.error('Failed to load service:', error)
  } finally {
    loading.value = false
  }
}

const getCategoryName = (slug: string) => {
  return categories.find(c => c.slug === slug)?.name || slug
}

const getCategoryIcon = (slug: string) => {
  return categories.find(c => c.slug === slug)?.icon || '🎨'
}

const contactSeller = async () => {
  if (!service.value) {
    alert('Service not loaded yet.')
    return
  }

  try {
    const response: any = await $fetch('/api/messaging/conversation/create', {
      method: 'POST',
      body: {
        participantClerkId: service.value.clerk_user_id,
        listingId: serviceId.value
      }
    })
    // navigateTo is available in Nuxt 3 global utils
    navigateTo(`/messages/${response.conversationId}`)
  } catch (error: any) {
    alert('Failed to create conversation: ' + (error?.message || String(error)))
  }
}

const placeOrder = async () => {
  if (!orderForm.value.requirements) {
    orderError.value = 'Please provide project requirements.'
    return
  }

  ordering.value = true
  orderError.value = ''

  try {
    const response: any = await $fetch('/api/services/order', {
      method: 'POST',
      body: {
        serviceId: serviceId.value,
        requirements: orderForm.value.requirements,
        additionalNotes: orderForm.value.additionalNotes
      }
    })

    alert('Order placed successfully! Check your messages to discuss with the seller.')
    navigateTo(`/messages/${response.conversationId}`)
  } catch (error: any) {
    orderError.value = error?.message || 'Failed to place order'
  } finally {
    ordering.value = false
  }
}

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(async () => {
  // initial id value
  serviceId.value = String(route.params.id || '')
  await loadService()
})

// reload when route id changes (client-side navigation)
watch(
  () => route.params.id,
  async (newId) => {
    if (!newId) return
    serviceId.value = String(newId)
    await loadService()
  }
)
</script>
