
<!-- pages/services/create.vue -->
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

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-xl shadow-lg p-8">
        <h1 class="text-3xl font-bold mb-6">Offer Your Service</h1>
        <p class="text-gray-600 mb-8">Create a service listing and start earning with your creative skills!</p>

        <form @submit.prevent="createService" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Service Category *</label>
            <select
              v-model="form.category"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select a category</option>
              <option v-for="cat in categories" :key="cat.slug" :value="cat.slug">
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Service Title *</label>
            <input
              v-model="form.title"
              type="text"
              required
              maxlength="100"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Professional Logo Design for Your Brand"
            />
            <p class="text-xs text-gray-500 mt-1">{{ form.title.length }}/100 characters</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              v-model="form.description"
              rows="6"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Describe your service in detail. What will you deliver? What makes you unique?"
            ></textarea>
          </div>

          <div class="grid md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Price (ETH) *</label>
              <input
                v-model.number="form.priceInEth"
                type="number"
                step="0.001"
                min="0.001"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="0.1"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Delivery Time (days) *</label>
              <input
                v-model.number="form.deliveryTime"
                type="number"
                min="1"
                max="90"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="7"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Revisions Included *</label>
              <input
                v-model.number="form.revisions"
                type="number"
                min="0"
                max="10"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="2"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Requirements from Buyer</label>
            <p class="text-xs text-gray-500 mb-2">What information do you need from the buyer? (One per line)</p>
            <textarea
              v-model="requirementsText"
              rows="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Brand name&#10;Preferred colors&#10;Reference images&#10;Target audience"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Portfolio Examples (Optional)</label>
            <p class="text-xs text-gray-500 mb-2">Upload examples of your previous work</p>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              @change="handlePortfolioUpload"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <div v-if="portfolioFiles.length > 0" class="mt-2 space-y-1">
              <div v-for="(file, i) in portfolioFiles" :key="i" class="text-sm text-gray-600 flex items-center justify-between">
                <span>{{ file.name }}</span>
                <button @click="removePortfolioFile(i)" class="text-red-600 hover:underline">Remove</button>
              </div>
            </div>
          </div>

          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-900">
              <strong>Note:</strong> Platform fee is 2.5%. You'll receive {{ (form.priceInEth * 0.975).toFixed(3) }} ETH per order.
            </p>
          </div>

          <button
            type="submit"
            :disabled="creating"
            class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {{ creating ? 'Creating Service...' : 'Create Service Listing' }}
          </button>
        </form>

        <div v-if="success" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-green-800 font-semibold mb-2">✅ Service Created!</p>
          <NuxtLink
            :to="`/services/${success.listingId}`"
            class="text-purple-600 hover:underline"
          >
            View Your Service →
          </NuxtLink>
        </div>

        <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800">❌ {{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserButton } from '@clerk/nuxt/components'

const creating = ref(false)
const success = ref<any>(null)
const error = ref('')

const form = ref({
  category: '',
  title: '',
  description: '',
  priceInEth: 0.05,
  deliveryTime: 7,
  revisions: 2
})

const requirementsText = ref('')
const portfolioFiles = ref<File[]>([])

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

const handlePortfolioUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    portfolioFiles.value = Array.from(target.files)
  }
}

const removePortfolioFile = (index: number) => {
  portfolioFiles.value.splice(index, 1)
}

const createService = async () => {
  creating.value = true
  success.value = null
  error.value = ''

  try {
    const requirements = requirementsText.value
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0)

    // TODO: Upload portfolio files to IPFS
    const portfolio: any[] = []

    const response = await $fetch('/api/services/create', {
      method: 'POST',
      body: {
        ...form.value,
        requirements,
        portfolio
      }
    })

    success.value = response
    
    // Reset form
    form.value = {
      category: '',
      title: '',
      description: '',
      priceInEth: 0.05,
      deliveryTime: 7,
      revisions: 2
    }
    requirementsText.value = ''
    portfolioFiles.value = []
  } catch (err: any) {
    error.value = err.message || 'Failed to create service'
  } finally {
    creating.value = false
  }
}
</script>