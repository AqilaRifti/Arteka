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
            <NuxtLink to="/dashboard" class="text-gray-700 hover:text-purple-600">
              Dashboard
            </NuxtLink>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p class="mt-4 text-gray-600">Loading work from blockchain...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-6xl mb-4">❌</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Error Loading Work</h3>
        <p class="text-gray-600">{{ error }}</p>
        <NuxtLink to="/explore" class="inline-block mt-4 text-purple-600 hover:underline">
          ← Back to Explore
        </NuxtLink>
      </div>

      <!-- Work Details -->
      <div v-else-if="work" class="grid lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Media Preview -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="aspect-video bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
              <span class="text-8xl">{{ getWorkIcon(work.workType) }}</span>
            </div>
            <div class="p-6">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ work.title }}</h1>
                  <p class="text-gray-600">{{ work.description || 'No description provided' }}</p>
                </div>
                <span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  {{ work.workType }}
                </span>
              </div>

              <!-- IPFS Link -->
              <a
                :href="work.ipfsUrl"
                target="_blank"
                class="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                <span>📦</span>
                View on IPFS
              </a>
            </div>
          </div>

          <!-- Blockchain Information -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>⛓️</span>
              Blockchain Verification
            </h2>
            <div class="space-y-3">
              <div class="border-b pb-3">
                <p class="text-sm text-gray-600 mb-1">Work ID</p>
                <p class="font-mono text-lg font-semibold text-purple-600">
                  #{{ work.workId }}
                </p>
              </div>
              <div class="border-b pb-3">
                <p class="text-sm text-gray-600 mb-1">Creator Address</p>
                <a
                  :href="`https://sepolia.etherscan.io/address/${work.creator}`"
                  target="_blank"
                  class="font-mono text-sm hover:text-purple-600 break-all"
                >
                  {{ work.creator }}
                </a>
              </div>
              <div class="border-b pb-3">
                <p class="text-sm text-gray-600 mb-1">Transaction Hash</p>
                <a
                  :href="`https://sepolia.etherscan.io/tx/${work.dbInfo?.transaction_hash}`"
                  target="_blank"
                  class="font-mono text-sm text-purple-600 hover:underline break-all"
                >
                  {{ work.dbInfo?.transaction_hash }}
                </a>
              </div>
              <div class="border-b pb-3">
                <p class="text-sm text-gray-600 mb-1">Block Number</p>
                <p class="font-mono text-lg font-semibold">
                  {{ work.dbInfo?.block_number }}
                </p>
              </div>
              <div class="border-b pb-3">
                <p class="text-sm text-gray-600 mb-1">IPFS Hash (Content)</p>
                <a
                  :href="`https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${work.ipfsHash}`"
                  target="_blank"
                  class="font-mono text-sm text-purple-600 hover:underline break-all"
                >
                  {{ work.ipfsHash }}
                </a>
              </div>
              <div class="border-b pb-3">
                <p class="text-sm text-gray-600 mb-1">IPFS Hash (Metadata)</p>
                <a
                  :href="`https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${work.metadataHash}`"
                  target="_blank"
                  class="font-mono text-sm text-purple-600 hover:underline break-all"
                >
                  {{ work.metadataHash }}
                </a>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">Registration Time</p>
                <p class="text-lg">
                  {{ formatDateTime(work.timestamp) }}
                </p>
              </div>
            </div>

            <!-- Verify Button -->
            <div class="mt-6">
              <button
                @click="verifyOnBlockchain"
                :disabled="verifying"
                class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
              >
                {{ verifying ? 'Verifying...' : '✓ Verify on Sepolia Testnet' }}
              </button>
              <div v-if="verificationResult" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p class="text-green-800 font-semibold mb-2">✅ Verification Successful</p>
                <div class="text-sm text-green-700 space-y-1">
                  <p><strong>Status:</strong> {{ verificationResult.status }}</p>
                  <p><strong>Confirmations:</strong> {{ verificationResult.confirmations }}</p>
                  <p><strong>Gas Used:</strong> {{ verificationResult.gasUsed }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Work Metadata -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>📋</span>
              Work Metadata
            </h2>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600 mb-1">File Name</p>
                <p class="font-semibold">{{ work.metadata.fileName }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">File Size</p>
                <p class="font-semibold">{{ formatFileSize(work.metadata.fileSize) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">MIME Type</p>
                <p class="font-semibold">{{ work.metadata.mimeType }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">Original Language</p>
                <p class="font-semibold">{{ getLanguageName(work.metadata.originalLanguage) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Status Card -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold mb-4">Status</h3>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ work.isActive ? '✅' : '⛔' }}</span>
                <div>
                  <p class="font-semibold">{{ work.isActive ? 'Active' : 'Deactivated' }}</p>
                  <p class="text-sm text-gray-600">On Blockchain</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-2xl">🔒</span>
                <div>
                  <p class="font-semibold">Protected</p>
                  <p class="text-sm text-gray-600">Digital Rights Registered</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-2xl">🌐</span>
                <div>
                  <p class="font-semibold">Decentralized</p>
                  <p class="text-sm text-gray-600">Stored on IPFS</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Network Info -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold mb-4">Network Information</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-600 mb-1">Blockchain</p>
                <p class="font-semibold">Ethereum Sepolia Testnet</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">Smart Contract</p>
                <a
                  href="https://sepolia.etherscan.io/address/0x..."
                  target="_blank"
                  class="font-mono text-sm text-purple-600 hover:underline break-all"
                >
                  View Contract
                </a>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">Storage</p>
                <p class="font-semibold">IPFS (Pinata)</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold mb-4">Actions</h3>
            <div class="space-y-3">
              <a
                :href="`https://sepolia.etherscan.io/tx/${work.dbInfo?.transaction_hash}`"
                target="_blank"
                class="block w-full bg-purple-600 text-white text-center px-4 py-3 rounded-lg hover:bg-purple-700 transition font-medium"
              >
                View on Etherscan
              </a>
              <button
                @click="shareWork"
                class="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                📤 Share Work
              </button>
              <button
                @click="downloadMetadata"
                class="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                💾 Download Metadata
              </button>
            </div>
          </div>

          <!-- Creator Info -->
          <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow p-6">
            <h3 class="text-xl font-bold mb-3">About the Creator</h3>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {{ work.creator.slice(2, 4).toUpperCase() }}
              </div>
              <div>
                <p class="font-semibold text-sm">Creator</p>
                <p class="text-xs font-mono text-gray-600">
                  {{ work.creator.slice(0, 10) }}...
                </p>
              </div>
            </div>
            <NuxtLink
              to="/explore"
              class="block text-center bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
            >
              View More Works
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SignedIn, UserButton } from '@clerk/nuxt/components'
import { useRoute } from 'vue-router'

const route = useRoute()
const workId = route.params.id as string

const loading = ref(true)
const error = ref('')
const work = ref<any>(null)
const verifying = ref(false)
const verificationResult = ref<any>(null)

const loadWork = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await $fetch(`/api/digital-rights/${workId}`)
    work.value = response
  } catch (err: any) {
    error.value = err.message || 'Failed to load work'
  } finally {
    loading.value = false
  }
}

const verifyOnBlockchain = async () => {
  if (!work.value?.dbInfo?.transaction_hash) return
  
  try {
    verifying.value = true
    const response = await $fetch('/api/blockchain/verify', {
      method: 'POST',
      body: {
        transactionHash: work.value.dbInfo.transaction_hash
      }
    })
    verificationResult.value = response
  } catch (err) {
    console.error('Verification failed:', err)
  } finally {
    verifying.value = false
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

const formatDateTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFileSize = (bytes: string) => {
  const size = parseInt(bytes)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

const getLanguageName = (code: string) => {
  const languages: Record<string, string> = {
    id: 'Indonesian',
    en: 'English',
    ms: 'Malay',
    jv: 'Javanese'
  }
  return languages[code] || code
}

const shareWork = () => {
  if (navigator.share) {
    navigator.share({
      title: work.value.title,
      text: work.value.description,
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
  }
}

const downloadMetadata = () => {
  const metadata = {
    workId: work.value.workId,
    title: work.value.title,
    description: work.value.description,
    creator: work.value.creator,
    ipfsHash: work.value.ipfsHash,
    metadataHash: work.value.metadataHash,
    timestamp: work.value.timestamp,
    transactionHash: work.value.dbInfo?.transaction_hash,
    blockNumber: work.value.dbInfo?.block_number
  }
  
  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `arteka-work-${workId}-metadata.json`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  loadWork()
})
</script>