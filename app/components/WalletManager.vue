<template>
  <div class="bg-white rounded-xl shadow-lg p-6">
    <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
      <span>🔐</span>
      Wallet Management
    </h2>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      <p class="text-gray-600 mt-2">{{ loadingMessage }}</p>
    </div>

    <!-- Wallet Connected -->
    <div v-else-if="currentWallet" class="space-y-6">
      <!-- Wallet Info -->
      <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="text-sm text-purple-700 font-medium mb-1">Your Wallet Address</div>
            <div class="font-mono text-sm break-all">{{ currentWallet.address }}</div>
          </div>
          <button
            @click="copyAddress"
            class="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            📋 Copy
          </button>
        </div>
        
        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-gray-600">Type:</span>
            <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
              {{ currentWallet.type }}
            </span>
          </div>
          <div class="text-gray-500">
            Connected {{ formatDate(currentWallet.createdAt) }}
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="grid md:grid-cols-2 gap-4">
        <button
          @click="showConnectModal = true"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          🔄 Change Wallet
        </button>
        <button
          @click="showGenerateModal = true"
          class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
        >
          ✨ Generate New Wallet
        </button>
      </div>

      <!-- Warning -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p class="text-sm text-yellow-800">
          <strong>⚠️ Important:</strong> Make sure you have access to this wallet's private key. 
          You'll need it to sign transactions and access your funds.
        </p>
      </div>
    </div>

    <!-- No Wallet -->
    <div v-else class="space-y-6">
      <div class="text-center py-8">
        <div class="text-6xl mb-4">👛</div>
        <h3 class="text-xl font-bold mb-2">No Wallet Connected</h3>
        <p class="text-gray-600 mb-6">Connect your wallet or generate a new one to get started</p>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <button
          @click="showConnectModal = true"
          class="bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition font-medium text-lg"
        >
          🔗 Connect Wallet
        </button>
        <button
          @click="showGenerateModal = true"
          class="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition font-medium text-lg"
        >
          ✨ Generate Wallet
        </button>
      </div>
    </div>

    <!-- Connect Wallet Modal -->
    <div
      v-if="showConnectModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeConnectModal"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
        <h3 class="text-2xl font-bold mb-4">Connect Your Wallet</h3>
        
        <div class="space-y-4">
          <!-- Wallet Address Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Wallet Address *
            </label>
            <input
              v-model="connectForm.address"
              type="text"
              placeholder="0x..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              :class="{ 'border-red-500': addressError }"
            />
            <p v-if="addressError" class="text-red-600 text-sm mt-1">{{ addressError }}</p>
            <p class="text-xs text-gray-500 mt-1">Enter your Ethereum wallet address</p>
          </div>

          <!-- Private Key Input (Optional) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Private Key (Optional)
            </label>
            <input
              v-model="connectForm.privateKey"
              :type="showPrivateKey ? 'text' : 'password'"
              placeholder="0x... (optional)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
            <div class="flex items-center gap-2 mt-2">
              <input
                v-model="showPrivateKey"
                type="checkbox"
                id="showKey"
                class="rounded"
              />
              <label for="showKey" class="text-sm text-gray-600">Show private key</label>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Needed for transactions. Leave empty if connecting view-only wallet.
            </p>
          </div>

          <!-- Warning -->
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-xs text-red-800">
              <strong>🔒 Security Note:</strong> Your private key is encrypted and stored securely. 
              Never share your private key with anyone!
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              @click="connectWallet"
              :disabled="connecting || !connectForm.address"
              class="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium"
            >
              {{ connecting ? 'Connecting...' : 'Connect' }}
            </button>
            <button
              @click="closeConnectModal"
              class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>

          <p v-if="connectError" class="text-red-600 text-sm">{{ connectError }}</p>
        </div>
      </div>
    </div>

    <!-- Generate Wallet Modal -->
    <div
      v-if="showGenerateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showGenerateModal = false"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
        <h3 class="text-2xl font-bold mb-4">Generate New Wallet</h3>
        
        <!-- Before Generation -->
        <div v-if="!generatedWallet" class="space-y-4">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-800 mb-2">
              <strong>⚠️ Warning:</strong> This will create a brand new wallet with a random private key.
            </p>
            <p class="text-sm text-yellow-800">
              Make sure to save your private key and mnemonic phrase securely!
            </p>
          </div>

          <div class="flex gap-2">
            <button
              @click="generateWallet"
              :disabled="generating"
              class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium"
            >
              {{ generating ? 'Generating...' : '✨ Generate Wallet' }}
            </button>
            <button
              @click="showGenerateModal = false"
              class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>

          <p v-if="generateError" class="text-red-600 text-sm">{{ generateError }}</p>
        </div>

        <!-- After Generation -->
        <div v-else class="space-y-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p class="text-green-800 font-semibold mb-2">✅ Wallet Generated Successfully!</p>
            <p class="text-sm text-green-700">Save these details in a secure location.</p>
          </div>

          <!-- Address -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-600 mb-1">Address</div>
            <div class="font-mono text-sm break-all mb-2">{{ generatedWallet.address }}</div>
            <button
              @click="copyToClipboard(generatedWallet.address)"
              class="text-sm text-purple-600 hover:underline"
            >
              📋 Copy Address
            </button>
          </div>

          <!-- Private Key -->
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="text-sm text-red-700 font-semibold mb-1">Private Key (Keep Secret!)</div>
            <div class="font-mono text-xs break-all mb-2">{{ generatedWallet.privateKey }}</div>
            <button
              @click="copyToClipboard(generatedWallet.privateKey)"
              class="text-sm text-red-600 hover:underline"
            >
              📋 Copy Private Key
            </button>
          </div>

          <!-- Mnemonic -->
          <div v-if="generatedWallet.mnemonic" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="text-sm text-yellow-800 font-semibold mb-1">Recovery Phrase (Mnemonic)</div>
            <div class="text-sm mb-2">{{ generatedWallet.mnemonic }}</div>
            <button
              @click="copyToClipboard(generatedWallet.mnemonic)"
              class="text-sm text-yellow-700 hover:underline"
            >
              📋 Copy Mnemonic
            </button>
          </div>

          <div class="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p class="text-sm text-red-900 font-bold">
              🚨 CRITICAL: Save these details NOW! You cannot recover them later.
            </p>
          </div>

          <button
            @click="closeGenerateModal"
            class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium"
          >
            I've Saved My Keys Securely
          </button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div
      v-if="showSuccess"
      class="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-fade-in"
    >
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)
const loadingMessage = ref('Loading wallet...')
const currentWallet = ref<any>(null)

const showConnectModal = ref(false)
const connectForm = ref({
  address: '',
  privateKey: ''
})
const showPrivateKey = ref(false)
const connecting = ref(false)
const connectError = ref('')
const addressError = ref('')

const showGenerateModal = ref(false)
const generating = ref(false)
const generateError = ref('')
const generatedWallet = ref<any>(null)

const showSuccess = ref(false)
const successMessage = ref('')

// Load current wallet
const loadWallet = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/wallet/current')
    if (response.hasWallet) {
      currentWallet.value = response.wallet
    }
  } catch (error) {
    console.error('Failed to load wallet:', error)
  } finally {
    loading.value = false
  }
}

// Connect wallet
const connectWallet = async () => {
  connectError.value = ''
  addressError.value = ''
  
  // Validate address format
  if (!connectForm.value.address.match(/^0x[a-fA-F0-9]{40}$/)) {
    addressError.value = 'Invalid Ethereum address format'
    return
  }

  connecting.value = true
  try {
    const response = await $fetch('/api/wallet/connect', {
      method: 'POST',
      body: {
        walletAddress: connectForm.value.address,
        privateKey: connectForm.value.privateKey || null,
        walletType: 'imported'
      }
    })

    currentWallet.value = response.wallet
    showSuccessToast(response.message)
    closeConnectModal()
    
  } catch (error: any) {
    connectError.value = error.data?.message || error.message || 'Failed to connect wallet'
  } finally {
    connecting.value = false
  }
}

// Generate new wallet
const generateWallet = async () => {
  generating.value = true
  generateError.value = ''
  
  try {
    const response = await $fetch('/api/wallet/generate', {
      method: 'POST'
    })

    generatedWallet.value = response.wallet
    
  } catch (error: any) {
    generateError.value = error.data?.message || error.message || 'Failed to generate wallet'
  } finally {
    generating.value = false
  }
}

// Close modals
const closeConnectModal = () => {
  showConnectModal.value = false
  connectForm.value = { address: '', privateKey: '' }
  connectError.value = ''
  addressError.value = ''
  showPrivateKey.value = false
}

const closeGenerateModal = () => {
  showGenerateModal.value = false
  generatedWallet.value = null
  generateError.value = ''
  loadWallet() // Reload to show new wallet
  showSuccessToast('Wallet generated successfully!')
}

// Utility functions
const copyAddress = () => {
  copyToClipboard(currentWallet.value.address)
  showSuccessToast('Address copied!')
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}

const showSuccessToast = (message: string) => {
  successMessage.value = message
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  loadWallet()
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
