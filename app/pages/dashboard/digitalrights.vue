

<!-- pages/dashboard.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <NuxtLink to="/" class="text-2xl font-bold text-purple-600">
            Arteka
          </NuxtLink>
          <div class="flex items-center gap-4">
            <NuxtLink to="/explore" class="text-gray-700 hover:text-purple-600">
              Explore
            </NuxtLink>
            <UserButton />
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Your Dashboard</h1>
        <p class="text-gray-600 mt-2">Manage your digital works and blockchain assets</p>
      </div>
      <WalletManager class="mb-8" />
      <!-- Upload Section -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-bold mb-4">Register New Work</h2>
        <form @submit.prevent="submitWork" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              v-model="form.title"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="My Creative Work"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Describe your work..."
            ></textarea>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Work Type *
              </label>
              <select
                v-model="form.workType"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="">Select type</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="text">Text</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Original Language
              </label>
              <select
                v-model="form.originalLanguage"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="id">Indonesian</option>
                <option value="en">English</option>
                <option value="ms">Malay</option>
                <option value="jv">Javanese</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Upload File *
            </label>
            <input
              type="file"
              @change="handleFileChange"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
            <p class="text-sm text-gray-500 mt-1">
              Max size: 100MB. Supported: images, videos, audio, documents
            </p>
          </div>

          <button
            type="submit"
            :disabled="uploading"
            class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ uploading ? 'Registering on Blockchain...' : 'Register Work' }}
          </button>
        </form>

        <!-- Success Message -->
        <div v-if="uploadSuccess" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 class="text-green-800 font-semibold mb-2">✅ Work Registered Successfully!</h3>
          <div class="text-sm text-green-700 space-y-1">
            <p><strong>Work ID:</strong> {{ uploadSuccess.workId }}</p>
            <p><strong>Transaction:</strong> 
              <a :href="`https://sepolia.etherscan.io/tx/${uploadSuccess.transactionHash}`" 
                 target="_blank" 
                 class="text-purple-600 hover:underline">
                {{ uploadSuccess.transactionHash.slice(0, 10) }}...
              </a>
            </p>
            <p><strong>IPFS:</strong> 
              <a :href="uploadSuccess.ipfsUrl" 
                 target="_blank" 
                 class="text-purple-600 hover:underline">
                View on IPFS
              </a>
            </p>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="uploadError" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800">❌ {{ uploadError }}</p>
        </div>
      </div>

      <!-- Your Works Section -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-2xl font-bold mb-4">Your Registered Works</h2>
        
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p class="mt-2 text-gray-600">Loading your works...</p>
        </div>

        <div v-else-if="works.length === 0" class="text-center py-8 text-gray-500">
          No works registered yet. Upload your first work above!
        </div>

        <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="work in works"
            :key="work.work_id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition"
          >
            <div class="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
              <span class="text-4xl">
                {{ getWorkIcon(work.work_type) }}
              </span>
            </div>
            <h3 class="font-bold text-lg mb-2 truncate">{{ work.title }}</h3>
            <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ work.description }}</p>
            <div class="flex justify-between items-center text-xs text-gray-500 mb-3">
              <span class="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                {{ work.work_type }}
              </span>
              <span>{{ formatDate(work.created_at) }}</span>
            </div>
            <NuxtLink
              :to="`/work/${work.work_id}`"
              class="block text-center bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
            >
              View Details
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UserButton } from '@clerk/nuxt/components'
import { useAuth } from '@clerk/nuxt/composables'


const { userId } = useAuth()

const form = ref({
  title: '',
  description: '',
  workType: '',
  originalLanguage: 'id',
  file: null as File | null
})

const uploading = ref(false)
const uploadSuccess = ref<any>(null)
const uploadError = ref('')
const loading = ref(true)
const works = ref<any[]>([])

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    form.value.file = target.files[0]
  }
}

const submitWork = async () => {
  if (!form.value.file) return

  uploading.value = true
  uploadSuccess.value = null
  uploadError.value = ''

  try {
    const formData = new FormData()
    formData.append('file', form.value.file)
    formData.append('title', form.value.title)
    formData.append('description', form.value.description)
    formData.append('workType', form.value.workType)
    formData.append('originalLanguage', form.value.originalLanguage)

    const response = await $fetch('/api/digital-rights/register', {
      method: 'POST',
      body: formData
    })

    uploadSuccess.value = response
    
    // Reset form
    form.value = {
      title: '',
      description: '',
      workType: '',
      originalLanguage: 'id',
      file: null
    }

    // Reload works list
    await loadWorks()
  } catch (error: any) {
    uploadError.value = error.message || 'Failed to register work'
  } finally {
    uploading.value = false
  }
}

const loadWorks = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/digital-rights/list', {
      params: { creator: userId.value }
    })
    works.value = response.works
  } catch (error) {
    console.error('Failed to load works:', error)
  } finally {
    loading.value = false
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

onMounted(() => {
  loadWorks()
})
</script>
