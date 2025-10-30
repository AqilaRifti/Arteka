<script setup lang="ts">
import { ref } from 'vue'
import Cerebras from '@cerebras/cerebras_cloud_sdk'

// API Keys for load balancing
const API_KEYS = [
  'csk-c9ddc69fd3pk9jj3py24jmhydft6c2ymmdk59tyt6em6derk',
  'csk-nrtfnn56xmvkyckdt9nwn3rh8ef8vwx9xxktvxwmk6yxw566',
  'csk-hrtwc24p9mtw48m4dmvf95j4xx539nth4y63wxympjhkdhfp',
  'csk-4r22m82n6pve9ywhd9hkpdneek6t52keethr5dn66jpw6fyw',
  'csk-wp589vwjn2hfhnxhv9rwyj54tnpexc6yfxev5en9x6ffej5m',
  'csk-6232phepe8nxn25vrwjenf2p9mpke9txvw6pjjd6jx8reh2n',
  'csk-4f9vfnrkmd898h5dyr98y8j2ftnjhvhee322mvy8tmhnfthh',
  'csk-mennk8jmdnxptr4r56xv9mc95t9vwjpwhhnr54jhp4382wjt'
]

let currentKeyIndex = 0

const originLanguage = ref('')
const targetLanguage = ref('')
const textToTranslate = ref('')
const translatedText = ref('')
const isLoading = ref(false)
const error = ref('')

const getNextApiKey = () => {
  const key = API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  return key
}

const translateText = async () => {
  if (!originLanguage.value.trim() || !targetLanguage.value.trim() || !textToTranslate.value.trim()) {
    error.value = 'Please fill in all fields (origin language, target language, and text)'
    return
  }

  isLoading.value = true
  error.value = ''
  translatedText.value = ''

  try {
    const apiKey = getNextApiKey()
    const cerebras = new Cerebras({ apiKey })

    const completionCreateResponse = await cerebras.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the given text from ${originLanguage.value} to ${targetLanguage.value}. Only provide the translation without any explanations or additional text.`
        },
        {
          role: 'user',
          content: textToTranslate.value
        }
      ],
      model: 'qwen-3-235b-a22b-thinking-2507',
      stream: false,
      max_completion_tokens: 65536,
      temperature: 0.6,
      top_p: 0.95
    })

    const rawContent = completionCreateResponse.choices[0].message.content || ''
    translatedText.value = rawContent.replace(/^[\s\S]*?<\/think>/, '').trim()
  } catch (err: any) {
    error.value = err.message || 'An error occurred during translation'
    console.error('Translation error:', err)
  } finally {
    isLoading.value = false
  }
}

const clearFields = () => {
  originLanguage.value = ''
  targetLanguage.value = ''
  textToTranslate.value = ''
  translatedText.value = ''
  error.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2 text-center">
          AI Translator
        </h1>

        <div class="space-y-6">
          <!-- Language Selection Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Origin Language Input -->
            <div>
              <label for="origin-language" class="block text-sm font-medium text-gray-700 mb-2">
                From (Origin Language)
              </label>
              <input
                id="origin-language"
                v-model="originLanguage"
                type="text"
                placeholder="e.g., English, Spanish, Indonesian"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                :disabled="isLoading"
              />
            </div>

            <!-- Target Language Input -->
            <div>
              <label for="target-language" class="block text-sm font-medium text-gray-700 mb-2">
                To (Target Language)
              </label>
              <input
                id="target-language"
                v-model="targetLanguage"
                type="text"
                placeholder="e.g., French, Japanese, Korean"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                :disabled="isLoading"
              />
            </div>
          </div>

          <!-- Text to Translate -->
          <div>
            <label for="text" class="block text-sm font-medium text-gray-700 mb-2">
              Text to Translate
            </label>
            <textarea
              id="text"
              v-model="textToTranslate"
              rows="6"
              placeholder="Enter the text you want to translate..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
              :disabled="isLoading"
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              @click="translateText"
              :disabled="isLoading"
              class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <svg v-if="isLoading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? 'Translating...' : 'Translate' }}
            </button>
            <button
              @click="clearFields"
              :disabled="isLoading"
              class="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Clear
            </button>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {{ error }}
          </div>

          <!-- Translation Result -->
          <div v-if="translatedText" class="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Translation Result
            </h2>
            <p class="text-gray-700 whitespace-pre-wrap">{{ translatedText }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>