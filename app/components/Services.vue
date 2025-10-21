<template>
  <div class="min-h-screen bg-background">
    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Hero Section -->
      <div class="mb-12 space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
          <Sparkles class="w-3.5 h-3.5" />
          <span class="font-medium">Blockchain Secured</span>
        </div>
        <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
          Creative Services<br />Marketplace
        </h2>
        <p class="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Hire talented creators for your projects with transparent, blockchain-secured transactions.
        </p>
      </div>

      <!-- Category Filter -->
      <div class="mb-8 flex flex-wrap gap-2">
        <Button
          @click="selectedCategory = null"
          :variant="selectedCategory === null ? 'default' : 'outline'"
          size="sm"
          class="gap-2"
        >
          <LayoutGrid class="w-4 h-4" />
          All Services
        </Button>
        <Button
          v-for="cat in categories"
          :key="cat.slug"
          @click="selectedCategory = cat.slug"
          :variant="selectedCategory === cat.slug ? 'default' : 'outline'"
          size="sm"
          class="gap-2"
        >
          <span>{{ cat.icon }}</span>
          <span>{{ cat.name }}</span>
        </Button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card v-for="i in 6" :key="i">
          <CardHeader>
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 bg-muted rounded-full animate-pulse" />
              <div class="flex-1 space-y-2">
                <div class="h-3 bg-muted rounded w-20 animate-pulse" />
                <div class="h-4 bg-muted rounded w-32 animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div class="h-4 bg-muted rounded animate-pulse" />
              <div class="h-4 bg-muted rounded w-5/6 animate-pulse" />
              <div class="h-10 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Services Grid -->
      <div v-else-if="filteredServices.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card 
          v-for="service in filteredServices" 
          :key="service.id"
          class="group hover:shadow-lg transition-all duration-300"
        >
          <CardHeader class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-xl shrink-0">
                {{ getCategoryIcon(service.category) }}
              </div>
              <div class="min-w-0">
                <Badge variant="secondary" class="mb-1">
                  {{ getCategoryName(service.category) }}
                </Badge>
                <CardTitle class="text-lg leading-tight line-clamp-1">
                  {{ service.title }}
                </CardTitle>
              </div>
            </div>
            
            <CardDescription class="line-clamp-3 text-sm leading-relaxed">
              {{ service.description }}
            </CardDescription>
          </CardHeader>

          <CardContent class="space-y-4">
            <div class="flex items-end justify-between pb-4 border-b border-border">
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground uppercase tracking-wider font-medium">Starting at</p>
                <div class="flex items-baseline gap-1.5">
                  <span class="text-2xl font-bold text-foreground">{{ formatPrice(service.price) }}</span>
                  <span class="text-sm text-muted-foreground font-medium">ETH</span>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs text-muted-foreground uppercase tracking-wider font-medium">Orders</p>
                <p class="text-lg font-semibold text-foreground">{{ service.sold_count }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 text-xs text-muted-foreground pb-4">
              <User class="w-3.5 h-3.5" />
              <code class="font-mono">{{ service.seller_wallet.slice(0, 6) }}...{{ service.seller_wallet.slice(-4) }}</code>
            </div>

            <div class="flex gap-2">
              <Button 
                @click="viewService(service)"
                class="flex-1 gap-2"
                size="sm"
              >
                <Eye class="w-4 h-4" />
                View Details
              </Button>
              <SignedIn>
                <Button 
                  @click="contactSeller(service)"
                  variant="outline"
                  size="icon"
                  title="Contact Seller"
                >
                  <MessageCircle class="w-4 h-4" />
                </Button>
              </SignedIn>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Empty State -->
      <Card v-else class="border-dashed">
        <CardContent class="flex flex-col items-center justify-center py-16 sm:py-24">
          <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Sparkles class="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle class="text-2xl mb-3">
            {{ selectedCategory ? 'No Services in This Category' : 'No Services Available' }}
          </CardTitle>
          <CardDescription class="text-center mb-8 max-w-md">
            {{ selectedCategory ? 'Try exploring a different category' : 'Be the first to offer your creative services' }}
          </CardDescription>
          <SignedIn>
            <NuxtLink to="/dashboard/create-listing">
              <Button size="lg" class="gap-2">
                <Plus class="w-4 h-4" />
                Offer Your Service
              </Button>
            </NuxtLink>
          </SignedIn>
        </CardContent>
      </Card>
    </main>

    <!-- Service Detail Dialog -->
    <Dialog :open="!!selectedService" @update:open="val => !val && (selectedService = null)">
      <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
        <div v-if="selectedService">
          <!-- Service Header -->
          <div class="flex items-start gap-4 mb-6">
            <div class="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-3xl shrink-0">
              {{ getCategoryIcon(selectedService.category) }}
            </div>
            <div class="flex-1 min-w-0">
              <Badge variant="secondary" class="mb-2">
                {{ getCategoryName(selectedService.category) }}
              </Badge>
              <DialogTitle class="text-3xl font-bold tracking-tight mb-1">
                {{ selectedService.title }}
              </DialogTitle>
            </div>
          </div>

          <Separator class="mb-6" />

          <!-- Service Description -->
          <div class="space-y-6">
            <div>
              <Label class="text-sm font-medium mb-2 block">Description</Label>
              <p class="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {{ selectedService.description }}
              </p>
            </div>

            <!-- Pricing & Stats -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-1">Starting Price</p>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-foreground">{{ formatPrice(selectedService.price) }}</span>
                  <span class="text-lg text-muted-foreground font-medium">ETH</span>
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                  ≈ ${{ (parseFloat(formatPrice(selectedService.price)) * 3000).toFixed(2) }}
                </p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-1">Completed Orders</p>
                <div class="flex items-center gap-2">
                  <span class="text-3xl font-bold text-foreground">{{ selectedService.sold_count }}</span>
                  <CheckCircle class="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <Separator />

            <!-- Blockchain Info -->
            <div class="space-y-4">
              <div class="space-y-2">
                <Label class="text-sm font-medium flex items-center gap-2">
                  <User class="w-4 h-4" />
                  Seller Wallet
                </Label>
                <div class="bg-muted rounded-md px-3 py-2.5 border border-border">
                  <code class="font-mono text-xs sm:text-sm text-foreground break-all">
                    {{ selectedService.seller_wallet }}
                  </code>
                </div>
              </div>

              <div class="space-y-2">
                <Label class="text-sm font-medium flex items-center gap-2">
                  <Link class="w-4 h-4" />
                  Listing Transaction
                </Label>
                <a 
                  :href="`https://sepolia.etherscan.io/tx/${selectedService.transaction_hash}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-2 bg-muted hover:bg-accent rounded-md px-3 py-2.5 border border-border transition-colors"
                >
                  <code class="font-mono text-xs sm:text-sm text-foreground break-all flex-1">
                    {{ selectedService.transaction_hash }}
                  </code>
                  <ExternalLink class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </a>
              </div>
            </div>

            <Separator />

            <!-- Actions -->
            <div class="flex gap-3">
              <SignedIn>
                <Button 
                  @click="orderService"
                  :disabled="ordering"
                  size="lg"
                  class="flex-1 gap-2"
                >
                  <ShoppingCart class="w-4 h-4" />
                  {{ ordering ? 'Processing...' : 'Order Service' }}
                </Button>
                <Button 
                  @click="contactSeller(selectedService)"
                  size="lg"
                  variant="outline"
                  class="gap-2"
                >
                  <MessageCircle class="w-4 h-4" />
                  Contact
                </Button>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal" class="w-full">
                  <Button size="lg" class="w-full gap-2">
                    <LogIn class="w-4 h-4" />
                    Sign In to Order
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nuxt/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles, LayoutGrid, Eye, User, MessageCircle, Plus, 
  CheckCircle, Link, ExternalLink, ShoppingCart, LogIn 
} from 'lucide-vue-next'

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

const services = ref<any[]>([])
const loading = ref(true)
const selectedCategory = ref<string | null>(null)
const selectedService = ref<any>(null)
const ordering = ref(false)

const filteredServices = computed(() => {
  if (!selectedCategory.value) return services.value
  return services.value.filter(s => s.category === selectedCategory.value)
})

const loadServices = async () => {
  try {
    loading.value = true
    const data = await $fetch('/api/listings?type=service')
    services.value = data as any[]
  } catch (error) {
    console.error('Failed to load services:', error)
  } finally {
    loading.value = false
  }
}

const viewService = (service: any) => {
  selectedService.value = service
}

const formatPrice = (priceInWei: string) => {
  const eth = parseFloat(priceInWei) / 1e18
  return eth.toFixed(4)
}

const getCategoryIcon = (slug: string) => {
  return categories.find(c => c.slug === slug)?.icon || '✨'
}

const getCategoryName = (slug: string) => {
  return categories.find(c => c.slug === slug)?.name || slug
}

const orderService = async () => {
  if (!selectedService.value) return
  
  const privateKey = prompt('Enter your wallet private key to place the order:')
  if (!privateKey) return
  
  try {
    ordering.value = true
    
    const result = await $fetch('/api/purchases/create', {
      method: 'POST',
      body: {
        listingId: selectedService.value.listing_id,
        privateKey
      }
    })
    
    alert('Order placed successfully! Transaction hash: ' + result.transactionHash)
    selectedService.value = null
    await loadServices()
  } catch (error: any) {
    alert('Order failed: ' + error.message)
  } finally {
    ordering.value = false
  }
}

const contactSeller = async (service: any) => {
  try {
    const { data: sellerData } = await $fetch('/api/users/by-wallet', {
      method: 'POST',
      body: { walletAddress: service.seller_wallet }
    }) as any
    
    if (!sellerData) {
      alert('Seller not found. They may not have set up their account yet.')
      return
    }
    
    await $fetch('/api/messaging/conversations/create', {
      method: 'POST',
      body: {
        participant2Id: sellerData.id,
        listingId: service.id
      }
    })
    
    navigateTo('/messages')
  } catch (error: any) {
    alert('Failed to start conversation: ' + error.message)
  }
}

onMounted(() => {
  loadServices()
})
</script>