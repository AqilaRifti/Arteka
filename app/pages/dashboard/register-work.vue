// pages/dashboard/register-work.vue
<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <NuxtLink to="/" class="text-2xl font-bold text-purple-600">Arteka</NuxtLink>
          <div class="flex items-center gap-4">
            <NuxtLink to="/dashboard" class="text-gray-700 hover:text-purple-600">← Back to Dashboard</NuxtLink>
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
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Register Digital Work</h1>
          <p class="text-gray-600">Protect your creative work on the Ethereum blockchain with IPFS storage</p>
        </div>

        <!-- Wallet Check -->
        <div v-if="!user?.wallet_address" class="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
          <div class="flex items-start gap-4">
            <span class="text-4xl">❌</span>
            <div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Wallet Not Connected</h3>
              <p class="text-gray-700 mb-4">You need to setup your wallet before registering works.</p>
              <NuxtLink to="/dashboard" 
                        class="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
                Go to Dashboard
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Registration Form -->
        <div v-else class="bg-white rounded-xl shadow-lg p-8">
          <form @submit.prevent="registerWork" class="space-y-6">
            <!-- File Upload -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">
                Upload Your Work *
              </label>
              <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition">
                <input 
                  ref="fileInput"
                  type="file"
                  @change="handleFileSelect"
                  accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx"
                  class="hidden"
                />
                
                <div v-if="!selectedFile" @click="$refs.fileInput.click()" class="cursor-pointer">
                  <div class="text-6xl mb-4">📁</div>
                  <p class="text-lg font-semibold text-gray-900 mb-2">Click to upload or drag and drop</p>
                  <p class="text-sm text-gray-600">Images, Videos, Audio, Documents (Max 100MB)</p>
                </div>
                
                <div v-else class="space-y-4">
                  <div class="text-6xl">{{ getFileIcon(selectedFile.type) }}</div>
                  <div>
                    <p class="text-lg font-semibold text-gray-900">{{ selectedFile.name }}</p>
                    <p class="text-sm text-gray-600">{{ formatFileSize(selectedFile.size) }}</p>
                    <p class="text-xs text-gray-500 mt-1">{{ selectedFile.type }}</p>
                  </div>
                  <button 
                    type="button"
                    @click="selectedFile = null"
                    class="text-red-600 hover:text-red-700 text-sm font-semibold"
                  >
                    Remove File
                  </button>
                </div>
              </div>
            </div>

            <!-- Work Type -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">
                Work Type *
              </label>
              <div class="grid grid-cols-4 gap-4">
                <button
                  v-for="type in workTypes"
                  :key="type.value"
                  type="button"
                  @click="form.workType = type.value"
                  :class="[
                    'p-4 border-2 rounded-xl transition text-center',
                    form.workType === type.value
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-300'
                  ]"
                >
                  <div class="text-3xl mb-1">{{ type.icon }}</div>
                  <div class="text-sm font-semibold text-gray-900">{{ type.label }}</div>
                </button>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Work Title *
              </label>
              <input 
                v-model="form.title"
                type="text"
                required
                placeholder="e.g., 'Sunrise Over Jakarta' or 'Indonesian Folk Song'"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea 
                v-model="form.description"
                required
                rows="6"
                placeholder="Describe your work, its inspiration, and what makes it unique..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              ></textarea>
            </div>

            <!-- Language -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Original Language *
              </label>
              <select 
                v-model="form.language"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="">Select language</option>
                <option value="id">🇮🇩 Indonesian (Bahasa Indonesia)</option>
                <option value="en">🇬🇧 English</option>
                <option value="ms">🇲🇾 Malay (Bahasa Melayu)</option>
                <option value="jv">☕ Javanese (Basa Jawa)</option>
                <option value="su">🌄 Sundanese (Basa Sunda)</option>
              </select>
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
                placeholder="Enter your private key to sign the blockchain transaction"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">
                🔒 Required to register your work on the blockchain. Never shared.
              </p>
            </div>

            <!-- Info Box -->
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 class="font-semibold text-blue-900 mb-3">📘 What Happens Next?</h4>
              <ul class="text-sm text-blue-800 space-y-2">
                <li>✓ Your file will be uploaded to IPFS (decentralized storage)</li>
                <li>✓ Metadata will be created and stored on IPFS</li>
                <li>✓ Work will be registered on Ethereum blockchain</li>
                <li>✓ You'll get a permanent, immutable proof of ownership</li>
                <li>✓ Your work will be discoverable on the Explore page</li>
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
                  I confirm that I am the original creator of this work and have the right to register it. 
                  I understand that this registration is permanent on the blockchain and certifies my ownership.
                </label>
              </div>
            </div>

            <!-- Submit -->
            <div class="flex gap-4">
              <NuxtLink to="/dashboard" 
                        class="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-center">
                Cancel
              </NuxtLink>
              <button 
                type="submit"
                :disabled="registering || !form.acceptTerms || !selectedFile"
                class="flex-1 px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-semibold"
              >
                {{ registering ? 'Registering on Blockchain...' : '🔒 Register Work' }}
              </button>
            </div>

            <!-- Progress -->
            <div v-if="uploadProgress" class="bg-gray-50 rounded-lg p-4">
              <div class="flex justify-between text-sm mb-2">
                <span class="font-semibold">{{ uploadProgress.step }}</span>
                <span>{{ uploadProgress.percent }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div 
                  class="bg-purple-600 h-3 rounded-full transition-all"
                  :style="{ width: uploadProgress.percent + '%' }"
                ></div>
              </div>
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

const workTypes = [
  { value: 'image', label: 'Image', icon: '🖼️' },
  { value: 'video', label: 'Video', icon: '🎬' },
  { value: 'audio', label: 'Audio', icon: '🎵' },
  { value: 'text', label: 'Text', icon: '📝' }
]

const user = ref<any>(null)
const registering = ref(false)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadProgress = ref<any>(null)

const form = ref({
  workType: 'image',
  title: '',
  description: '',
  language: 'id',
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

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be less than 100MB')
      return
    }
    
    selectedFile.value = file
    
    // Auto-detect work type
    if (file.type.startsWith('image/')) {
      form.value.workType = 'image'
    } else if (file.type.startsWith('video/')) {
      form.value.workType = 'video'
    } else if (file.type.startsWith('audio/')) {
      form.value.workType = 'audio'
    } else {
      form.value.workType = 'text'
    }
  }
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  return '📝'
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const registerWork = async () => {
  if (!selectedFile.value || !form.value.acceptTerms) return
  
  try {
    registering.value = true
    uploadProgress.value = { step: 'Preparing upload...', percent: 0 }
    
    // Create FormData
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('title', form.value.title)
    formData.append('description', form.value.description)
    formData.append('workType', form.value.workType)
    formData.append('language', form.value.language)
    formData.append('privateKey', form.value.privateKey)
    
    uploadProgress.value = { step: 'Uploading to IPFS...', percent: 33 }
    
    const result = await $fetch('/api/digital-rights/register', {
      method: 'POST',
      body: formData
    })
    
    uploadProgress.value = { step: 'Registering on blockchain...', percent: 66 }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    uploadProgress.value = { step: 'Complete!', percent: 100 }
    
    alert(`Work registered successfully!\n\nTransaction: ${result.transactionHash}\n\nYour work is now protected on the blockchain!`)
    
    router.push('/explore')
  } catch (error: any) {
    alert('Failed to register work: ' + error.message)
  } finally {
    registering.value = false
    uploadProgress.value = null
  }
}

onMounted(() => {
  loadUser()
})
</script>