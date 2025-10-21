<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <NuxtLink to="/" class="text-2xl font-bold text-purple-600">Arteka</NuxtLink>
          <div class="flex items-center gap-4">
            <NuxtLink to="/funding" class="text-gray-700 hover:text-purple-600">← Back to Campaigns</NuxtLink>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>

    <SignedIn>
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Create Funding Campaign</h1>
          <p class="text-gray-600">Launch a campaign to fund your creative project and share revenue with backers</p>
        </div>

        <!-- Wallet Check -->
        <div v-if="!user?.wallet_address" class="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
          <div class="flex items-start gap-4">
            <span class="text-4xl">❌</span>
            <div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Wallet Not Connected</h3>
              <p class="text-gray-700 mb-4">You need to setup your wallet before creating campaigns.</p>
              <NuxtLink to="/dashboard" 
                        class="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
                Go to Dashboard
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Create Campaign Form -->
        <div v-else class="bg-white rounded-xl shadow-lg p-8">
          <form @submit.prevent="createCampaign" class="space-y-6">
            <!-- Project Type -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">
                Project Type *
              </label>
              <div class="grid grid-cols-4 gap-4">
                <button
                  v-for="type in projectTypes"
                  :key="type.slug"
                  type="button"
                  @click="form.projectType = type.slug"
                  :class="[
                    'p-4 border-2 rounded-xl transition text-center',
                    form.projectType === type.slug
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-300'
                  ]"
                >
                  <div class="text-3xl mb-1">{{ type.icon }}</div>
                  <div class="text-xs font-semibold text-gray-900">{{ type.name }}</div>
                </button>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Campaign Title *
              </label>
              <input 
                v-model="form.title"
                type="text"
                required
                placeholder="e.g., 'My First Album - Indonesian Pop Music'"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea 
                v-model="form.description"
                required
                rows="8"
                placeholder="Describe your project, what you'll create, and why people should back it..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">
                Be detailed! Explain your project, timeline, and what backers can expect.
              </p>
            </div>

            <!-- Funding Goal -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Funding Goal (ETH) *
              </label>
              <div class="relative">
                <input 
                  v-model="form.fundingGoal"
                  type="number"
                  step="0.01"
                  required
                  min="0.1"
                  placeholder="10"
                  class="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  ETH
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                How much funding do you need to complete this project?
              </p>
            </div>

            <!-- Revenue Share -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Your Revenue Share (%) *
              </label>
              <input 
                v-model.number="form.creatorShare"
                type="range"
                min="10"
                max="90"
                step="5"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex justify-between mt-2">
                <div class="text-center flex-1 p-3 bg-purple-50 rounded-lg">
                  <p class="text-2xl font-bold text-purple-600">{{ form.creatorShare }}%</p>
                  <p class="text-xs text-gray-600">You (Creator)</p>
                </div>
                <div class="w-4"></div>
                <div class="text-center flex-1 p-3 bg-indigo-50 rounded-lg">
                  <p class="text-2xl font-bold text-indigo-600">{{ 100 - form.creatorShare }}%</p>
                  <p class="text-xs text-gray-600">Backers (Split Proportionally)</p>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                ⚠️ Choose carefully! This determines how all future revenue will be split.
              </p>
            </div>

            <!-- Duration -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Campaign Duration (Days) *
              </label>
              <select 
                v-model.number="form.durationInDays"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="21">21 days</option>
                <option value="30">30 days (Recommended)</option>
                <option value="45">45 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">
                How long should the campaign run to reach your funding goal?
              </p>
            </div>

            <!-- Private Key -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Wallet Private Key *
              </label>
              <input 
                v-model="form.privateKey"
                type="password"
                required
                placeholder="Enter your private key to sign the transaction"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">
                🔒 Required to create the campaign on blockchain.
              </p>
            </div>

            <!-- How It Works -->
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 class="font-semibold text-blue-900 mb-3">📘 How Revenue Sharing Works</h4>
              <ul class="text-sm text-blue-800 space-y-2">
                <li>✓ People back your campaign to help fund your project</li>
                <li>✓ Once funded, you create and release your project</li>
                <li>✓ When people pay for your work (purchases, streams, etc), send that revenue to the campaign</li>
                <li>✓ Smart contracts <strong>automatically split and distribute</strong> revenue based on your shares</li>
                <li>✓ Backers get paid instantly whenever revenue comes in!</li>
              </ul>
            </div>

            <!-- Terms -->
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <input 
                  v-model="form.acceptTerms"
                  type="checkbox"
                  required
                  id="terms"
                  class="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                />
                <label for="terms" class="text-sm text-gray-700">
                  I understand that this campaign will be recorded on the blockchain, 
                  revenue shares are permanent and enforced by smart contracts, and there is a 1% platform fee 
                  taken from funded amount. I commit to sharing revenue from this project with my backers.
                </label>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex gap-4">
              <NuxtLink to="/funding" 
                        class="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-center">
                Cancel
              </NuxtLink>
              <button 
                type="submit"
                :disabled="creating || !form.acceptTerms"
                class="flex-1 px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-semibold"
              >
                {{ creating ? 'Creating on Blockchain...' : '🚀 Launch Campaign' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SignedIn>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SignedIn, UserButton } from '@clerk/nuxt/components'
import { useRouter } from 'vue-router'

const router = useRouter()

const projectTypes = [
  { slug: 'album', name: 'Album', icon: '🎵' },
  { slug: 'film', name: 'Film', icon: '🎬' },
  { slug: 'game', name: 'Game', icon: '🎮' },
  { slug: 'book', name: 'Book', icon: '📚' },
  { slug: 'art', name: 'Art', icon: '🎨' },
  { slug: 'podcast', name: 'Podcast', icon: '🎙️' },
  { slug: 'software', name: 'Software', icon: '💻' },
  { slug: 'other', name: 'Other', icon: '✨' }
]

const user = ref<any>(null)
const creating = ref(false)

const form = ref({
  projectType: 'album',
  title: '',
  description: '',
  fundingGoal: '',
  creatorShare: 50,
  durationInDays: 30,
  privateKey: '',
  acceptTerms: false
})

const loadUser = async () => {
  try {
    const data = await $fetch('/api/auth/user')
    user.value = data
  } catch (error) {
    console.error('Failed to load user:', error)
  }
}

const createCampaign = async () => {
  if (!form.value.acceptTerms) return
  
  try {
    creating.value = true
    
    const result = await $fetch('/api/funding/campaigns/create', {
      method: 'POST',
      body: {
        title: form.value.title,
        description: form.value.description,
        projectType: form.value.projectType,
        fundingGoal: form.value.fundingGoal.toString(),
        creatorSharePercent: form.value.creatorShare,
        durationInDays: form.value.durationInDays,
        privateKey: form.value.privateKey
      }
    })
    
    alert('Campaign created successfully! Transaction hash: ' + result.transaction_hash)
    router.push('/funding')
  } catch (error: any) {
    alert('Failed to create campaign: ' + error.message)
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  loadUser()
})
</script>