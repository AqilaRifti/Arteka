

<!-- pages/marketplace/create.vue -->
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

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-xl shadow-lg p-8">
        <h1 class="text-3xl font-bold mb-6">Create Product Listing</h1>

        <form @submit.prevent="createListing" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Select Your Work *
            </label>
            <select
              v-model="form.workId"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select a work</option>
              <option v-for="work in myWorks" :key="work.work_id" :value="work.work_id">
                {{ work.title }} ({{ work.work_type }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Listing Title *</label>
            <input
              v-model="form.title"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter listing title"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              v-model="form.description"
              rows="4"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Describe your product..."
            ></textarea>
          </div>

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
            <p class="text-sm text-gray-500 mt-1">Platform fee: 2.5%</p>
          </div>

          <!-- Optional: Link to Campaign -->
          <div v-if="myCampaigns.length > 0" class="border-t pt-6">
            <h3 class="font-bold mb-3">🚀 Revenue Sharing (Optional)</h3>
            <p class="text-sm text-gray-600 mb-4">
              Link this listing to a funded campaign to automatically share revenue with backers!
            </p>
            <select
              v-model="form.campaignId"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">No revenue sharing (keep 100%)</option>
              <option v-for="campaign in fundedCampaigns" :key="campaign.campaign_id" :value="campaign.campaign_id">
                {{ campaign.title }} ({{ campaign.creator_share_percent }}% yours, {{ campaign.backers_share_percent }}% backers)
              </option>
            </select>
          </div>

          <button
            type="submit"
            :disabled="creating"
            class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {{ creating ? 'Creating Listing...' : 'Create Listing' }}
          </button>
        </form>

        <div v-if="success" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-green-800 font-semibold mb-2">✅ Listing Created!</p>
          <NuxtLink
            :to="`/marketplace/${success.listingId}`"
            class="text-purple-600 hover:underline"
          >
            View Listing →
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
import { ref, computed, onMounted } from 'vue'
import { UserButton } from '@clerk/nuxt/components'
import { useAuth } from '@clerk/nuxt/composables'


const { userId } = useAuth()
const myWorks = ref<any[]>([])
const myCampaigns = ref<any[]>([])
const creating = ref(false)
const success = ref<any>(null)
const error = ref('')

const form = ref({
  workId: '',
  title: '',
  description: '',
  priceInEth: 0.1,
  campaignId: ''
})

const fundedCampaigns = computed(() => {
  return myCampaigns.value.filter(c => c.is_funded)
})

const loadMyWorks = async () => {
  try {
    const response = await $fetch('/api/digital-rights/list', {
      params: { creator: userId.value }
    })
    myWorks.value = response.works
  } catch (err) {
    console.error('Failed to load works:', err)
  }
}

const loadMyCampaigns = async () => {
  try {
    const response = await $fetch('/api/funding/campaigns/list', {
      params: { creator: userId.value }
    })
    myCampaigns.value = response.campaigns
  } catch (err) {
    console.error('Failed to load campaigns:', err)
  }
}

const createListing = async () => {
  creating.value = true
  success.value = null
  error.value = ''

  try {
    const response = await $fetch('/api/marketplace/create-listing', {
      method: 'POST',
      body: form.value
    })
    
    success.value = response
    form.value = {
      workId: '',
      title: '',
      description: '',
      priceInEth: 0.1,
      campaignId: ''
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to create listing'
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  loadMyWorks()
})
</script>