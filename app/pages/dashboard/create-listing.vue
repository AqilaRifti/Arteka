<template>
  <div class="min-h-screen bg-background">
    <SignedIn>
      <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <!-- Header -->
        <div class="mb-8 space-y-2">
          <h1 class="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">Create New Listing</h1>
          <p class="text-lg text-muted-foreground">List your digital product or service on the blockchain marketplace</p>
        </div>

        <!-- Wallet Check -->
        <Alert v-if="!user?.wallet_address" variant="destructive" class="mb-8">
          <AlertCircle class="h-5 w-5" />
          <AlertTitle class="text-lg font-semibold">Wallet Not Connected</AlertTitle>
          <AlertDescription class="mt-2 space-y-3">
            <p class="text-sm">You need to setup your wallet before creating listings.</p>
            <NuxtLink to="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </NuxtLink>
          </AlertDescription>
        </Alert>

        <!-- Create Listing Form -->
        <Card v-else>
          <CardContent class="p-6 sm:p-8 space-y-6">
            <!-- Listing Type -->
            <div class="space-y-3">
              <Label class="text-base font-semibold">Listing Type *</Label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card
                  @click="form.listingType = 'product'"
                  :class="[
                    'cursor-pointer transition-all duration-200 hover:shadow-md',
                    form.listingType === 'product'
                      ? 'border-primary border-2 bg-accent'
                      : 'border-border hover:border-primary/50'
                  ]"
                >
                  <CardContent class="p-6 text-center space-y-2">
                    <div class="text-4xl">📦</div>
                    <CardTitle class="text-lg">Product</CardTitle>
                    <CardDescription>Digital goods for sale</CardDescription>
                  </CardContent>
                </Card>
                <Card
                  @click="form.listingType = 'service'"
                  :class="[
                    'cursor-pointer transition-all duration-200 hover:shadow-md',
                    form.listingType === 'service'
                      ? 'border-primary border-2 bg-accent'
                      : 'border-border hover:border-primary/50'
                  ]"
                >
                  <CardContent class="p-6 text-center space-y-2">
                    <div class="text-4xl">✨</div>
                    <CardTitle class="text-lg">Service</CardTitle>
                    <CardDescription>Creative services</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>

            <!-- Category (for services) -->
            <div v-if="form.listingType === 'service'" class="space-y-2">
              <Label htmlFor="category" class="text-base font-semibold">
                Service Category *
              </Label>
              <Select v-model="form.category" required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="cat in categories" :key="cat.slug" :value="cat.slug">
                    {{ cat.icon }} {{ cat.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Work ID (optional for products) -->
            <div v-if="form.listingType === 'product'" class="space-y-2">
              <Label htmlFor="work-id" class="text-base font-semibold">
                Digital Work ID (Optional)
              </Label>
              <Input 
                id="work-id"
                v-model.number="form.workId"
                type="number"
                placeholder="Link to registered digital work"
              />
              <p class="text-xs text-muted-foreground flex items-start gap-1">
                <Info class="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>If you've registered this work in the Digital Rights system, enter its ID</span>
              </p>
            </div>

            <!-- Title -->
            <div class="space-y-2">
              <Label htmlFor="title" class="text-base font-semibold">
                Title *
              </Label>
              <Input 
                id="title"
                v-model="form.title"
                required
                placeholder="Enter a clear, descriptive title"
              />
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <Label htmlFor="description" class="text-base font-semibold">
                Description *
              </Label>
              <Textarea 
                id="description"
                v-model="form.description"
                required
                rows="6"
                placeholder="Describe what you're offering in detail..."
              />
              <p class="text-xs text-muted-foreground flex items-start gap-1">
                <Info class="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Include details about what buyers/clients will receive</span>
              </p>
            </div>

            <!-- Price -->
            <div class="space-y-2">
              <Label htmlFor="price" class="text-base font-semibold">
                Price (ETH) *
              </Label>
              <div class="relative">
                <Input 
                  id="price"
                  v-model="form.price"
                  type="number"
                  step="0.0001"
                  required
                  min="0.0001"
                  placeholder="0.01"
                  class="pr-16"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                  ETH
                </span>
              </div>
              <p class="text-xs text-muted-foreground flex items-center gap-1">
                <BadgePercent class="w-3.5 h-3.5" />
                <span>Platform fee: 2.5% • You receive: <strong>{{ calculateNetPrice() }} ETH</strong></span>
              </p>
            </div>

            <!-- Private Key -->
            <div class="space-y-2">
              <Label htmlFor="private-key" class="text-base font-semibold">
                Wallet Private Key *
              </Label>
              <Input 
                id="private-key"
                v-model="form.privateKey"
                type="password"
                required
                placeholder="Enter your private key to sign the transaction"
              />
              <p class="text-xs text-muted-foreground flex items-start gap-1">
                <Lock class="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Required to create the listing on blockchain. Not stored permanently.</span>
              </p>
            </div>

            <Separator />

            <!-- Terms -->
            <Alert class="flex gap">
                <input 
                  type="checkbox"
                  v-model="form.acceptTerms"
                  required
                  id="terms"
                  class="mt-1 w-4 h-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <label for="terms" class="text-sm text-gray-700">
                  I understand that this listing will be recorded on the Sepolia blockchain 
                  and cannot be deleted, only deactivated. I agree to the platform's 2.5% fee 
                  and encrypted messaging terms.
                </label>
            </Alert>

            <!-- Submit Buttons -->
            <div class="flex flex-col sm:flex-row gap-3 pt-4">
              <NuxtLink to="/dashboard" class="flex-1">
                <Button variant="outline" class="w-full" size="lg">
                  Cancel
                </Button>
              </NuxtLink>
              <Button 
                @click="createListing"
                :disabled="creating || !form.acceptTerms"
                size="lg"
                class="flex-1 gap-2"
              >
                <Loader2 v-if="creating" class="w-4 h-4 animate-spin" />
                <Rocket v-else class="w-4 h-4" />
                {{ creating ? 'Creating on Blockchain...' : 'Create Listing' }}
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Info Box -->
        <Alert v-if="user?.wallet_address" class="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Info class="h-5 w-5 text-blue-600" />
          <AlertTitle class="text-blue-900 dark:text-blue-100">What happens next?</AlertTitle>
          <AlertDescription class="text-blue-800 dark:text-blue-200">
            <ul class="mt-2 space-y-1.5 text-sm list-disc list-inside">
              <li>Your listing will be recorded on the Sepolia blockchain</li>
              <li>A smart contract will manage purchases and payments</li>
              <li>Buyers can message you through encrypted blockchain messaging</li>
              <li>You'll receive 97.5% of each sale (2.5% platform fee)</li>
              <li>All transactions are transparent and verifiable</li>
            </ul>
          </AlertDescription>
        </Alert>
      </main>
    </SignedIn>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SignedIn, UserButton } from '@clerk/nuxt/components'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, AlertCircle, Info, Lock, BadgePercent, 
  Rocket, Loader2 
} from 'lucide-vue-next'

const router = useRouter()

const categories = [
  { slug: 'illustration', name: 'Illustration', icon: '🎨' },
  { slug: 'graphic_design', name: 'Graphic Design', icon: '✨' },
  { slug: 'video_editing', name: 'Video Editing', icon: '🎬' },
  { slug: 'animation', name: 'Animation', icon: '🎞️' },
  { slug: 'music_production', name: 'Music', icon: '🎵' },
  { slug: 'voice_over', name: 'Voice Over', icon: '🎙️' },
  { slug: 'writing', name: 'Writing', icon: '✍️' },
  { slug: 'photography', name: 'Photography', icon: '📷' },
  { slug: '3d_modeling', name: '3D Modeling', icon: '🧊' },
  { slug: 'web_design', name: 'Web Design', icon: '💻' }
]

const user = ref<any>(null)
const creating = ref(false)

const form = ref({
  listingType: 'product' as 'product' | 'service',
  category: '',
  workId: null as number | null,
  title: '',
  description: '',
  price: '',
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

const calculateNetPrice = () => {
  if (!form.value.price) return '0.0000'
  const price = parseFloat(form.value.price)
  const net = price * 0.975 // 97.5% after 2.5% fee
  return net.toFixed(4)
}

const createListing = async () => {
  if (!form.value.acceptTerms) return
  
  try {
    creating.value = true
    
    const body: any = {
      listingType: form.value.listingType,
      title: form.value.title,
      description: form.value.description,
      price: form.value.price.toString(),
      privateKey: form.value.privateKey
    }
    
    if (form.value.listingType === 'service') {
      body.category = form.value.category
    }
    
    if (form.value.workId) {
      body.workId = form.value.workId
    }
    
    const result = await $fetch('/api/listings/create', {
      method: 'POST',
      body
    })
    
    alert('Listing created successfully! Transaction hash: ' + result.transaction_hash)
    router.push('/dashboard')
  } catch (error: any) {
    alert('Failed to create listing: ' + error.message)
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  loadUser()
})
</script>