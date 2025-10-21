<template>
  <div class="min-h-screen bg-background">

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Hero Section -->
      <div class="mb-12 space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
          <Shield class="w-3.5 h-3.5" />
          <span class="font-medium">Blockchain Protected</span>
        </div>
        <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
          Discover Digital<br />Products
        </h2>
        <p class="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Explore unique digital works secured by blockchain technology. Each product is verified and protected.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card v-for="i in 6" :key="i" class="overflow-hidden">
          <div class="aspect-[4/3] bg-muted animate-pulse" />
          <CardHeader>
            <div class="h-5 bg-muted rounded animate-pulse mb-2" />
            <div class="h-4 bg-muted rounded w-3/4 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div class="h-8 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>

      <!-- Products Grid -->
      <div v-else-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card 
          v-for="product in products" 
          :key="product.id"
          class="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border"
          @click="viewProduct(product)"
        >
          <div class="aspect-[4/3] bg-gradient-to-br from-muted to-accent relative overflow-hidden">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-6xl sm:text-7xl opacity-40 group-hover:scale-110 transition-transform duration-300">
                🖼️
              </div>
            </div>
            <div class="absolute top-3 right-3">
              <Badge variant="secondary" class="backdrop-blur-sm bg-background/80">
                <TrendingUp class="w-3 h-3 mr-1" />
                {{ product.sold_count }} sold
              </Badge>
            </div>
          </div>
          
          <CardHeader class="space-y-2">
            <CardTitle class="text-xl group-hover:text-primary transition-colors line-clamp-1">
              {{ product.title }}
            </CardTitle>
            <CardDescription class="line-clamp-2 text-sm leading-relaxed">
              {{ product.description }}
            </CardDescription>
          </CardHeader>

          <CardContent class="space-y-4">
            <div class="flex items-end justify-between">
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground uppercase tracking-wider font-medium">Price</p>
                <div class="flex items-baseline gap-1.5">
                  <span class="text-2xl font-bold text-foreground">{{ formatPrice(product.price) }}</span>
                  <span class="text-sm text-muted-foreground font-medium">ETH</span>
                </div>
              </div>
              <Button size="sm" variant="outline" class="gap-2">
                <Eye class="w-4 h-4" />
                View
              </Button>
            </div>

            <Separator />

            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet class="w-3.5 h-3.5" />
              <code class="font-mono">{{ product.seller_wallet.slice(0, 6) }}...{{ product.seller_wallet.slice(-4) }}</code>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Empty State -->
      <Card v-else class="border-dashed">
        <CardContent class="flex flex-col items-center justify-center py-16 sm:py-24">
          <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Package class="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle class="text-2xl mb-3">No Products Available</CardTitle>
          <CardDescription class="text-center mb-8 max-w-md">
            Be the first to list a digital product on the marketplace
          </CardDescription>
          <NuxtLink to="/dashboard/create-listing">
            <Button size="lg" class="gap-2">
              <Plus class="w-4 h-4" />
              Create Listing
            </Button>
          </NuxtLink>
        </CardContent>
      </Card>
    </main>

    <!-- Product Detail Dialog -->
    <Dialog :open="!!selectedProduct" @update:open="val => !val && (selectedProduct = null)">
      <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div v-if="selectedProduct">
          <!-- Product Image -->
          <div class="aspect-video bg-gradient-to-br from-muted to-accent relative">
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-9xl opacity-60">🖼️</span>
            </div>
          </div>

          <!-- Product Info -->
          <div class="p-6 sm:p-8 space-y-6">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-4">
                <DialogTitle class="text-3xl font-bold tracking-tight">
                  {{ selectedProduct.title }}
                </DialogTitle>
                <Badge variant="secondary" class="shrink-0">
                  <TrendingUp class="w-3 h-3 mr-1" />
                  {{ selectedProduct.sold_count }} sold
                </Badge>
              </div>
              <DialogDescription class="text-base leading-relaxed">
                {{ selectedProduct.description }}
              </DialogDescription>
            </div>

            <Separator />

            <!-- Price Section -->
            <div class="bg-muted/50 rounded-lg p-4 sm:p-6">
              <div class="flex items-end justify-between">
                <div class="space-y-1">
                  <p class="text-sm text-muted-foreground uppercase tracking-wider font-medium">Current Price</p>
                  <div class="flex items-baseline gap-2">
                    <span class="text-4xl font-bold text-foreground">{{ formatPrice(selectedProduct.price) }}</span>
                    <span class="text-lg text-muted-foreground font-medium">ETH</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign class="w-4 h-4" />
                  <span>≈ ${{ (parseFloat(formatPrice(selectedProduct.price)) * 3000).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <!-- Blockchain Info -->
            <div class="space-y-4">
              <div class="space-y-2">
                <Label class="text-sm font-medium flex items-center gap-2">
                  <Wallet class="w-4 h-4" />
                  Seller Wallet
                </Label>
                <div class="bg-muted rounded-md px-3 py-2.5 border border-border">
                  <code class="font-mono text-xs sm:text-sm text-foreground break-all">
                    {{ selectedProduct.seller_wallet }}
                  </code>
                </div>
              </div>

              <div class="space-y-2">
                <Label class="text-sm font-medium flex items-center gap-2">
                  <Link class="w-4 h-4" />
                  Transaction Hash
                </Label>
                <a 
                  :href="`https://sepolia.etherscan.io/tx/${selectedProduct.transaction_hash}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-2 bg-muted hover:bg-accent rounded-md px-3 py-2.5 border border-border transition-colors"
                >
                  <code class="font-mono text-xs sm:text-sm text-foreground break-all flex-1">
                    {{ selectedProduct.transaction_hash }}
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
                  @click="purchaseProduct"
                  :disabled="purchasing"
                  size="lg"
                  class="flex-1 gap-2"
                >
                  <ShoppingCart class="w-4 h-4" />
                  {{ purchasing ? 'Processing...' : 'Purchase Now' }}
                </Button>
                <Button 
                  @click="contactSeller(selectedProduct)"
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
                    Sign In to Purchase
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
import { ref, onMounted } from 'vue'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nuxt/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Search, Shield, Eye, Wallet, Package, Plus, TrendingUp, 
  X, ExternalLink, ShoppingCart, MessageCircle, LogIn, 
  DollarSign, Link 
} from 'lucide-vue-next'

const products = ref<any[]>([])
const loading = ref(true)
const selectedProduct = ref<any>(null)
const purchasing = ref(false)

const loadProducts = async () => {
  try {
    loading.value = true
    const data = await $fetch('/api/listings?type=product')
    products.value = data as any[]
  } catch (error) {
    console.error('Failed to load products:', error)
  } finally {
    loading.value = false
  }
}

const viewProduct = (product: any) => {
  selectedProduct.value = product
}

const formatPrice = (priceInWei: string) => {
  const eth = parseFloat(priceInWei) / 1e18
  return eth.toFixed(4)
}

const purchaseProduct = async () => {
  if (!selectedProduct.value) return
  
  const privateKey = prompt('Enter your wallet private key to complete the purchase:')
  if (!privateKey) return
  
  try {
    purchasing.value = true
    
    const result = await $fetch('/api/purchases/create', {
      method: 'POST',
      body: {
        listingId: selectedProduct.value.listing_id,
        privateKey
      }
    })
    
    alert('Purchase successful! Transaction hash: ' + result.transactionHash)
    selectedProduct.value = null
    await loadProducts()
  } catch (error: any) {
    alert('Purchase failed: ' + error.message)
  } finally {
    purchasing.value = false
  }
}

const contactSeller = async (product: any) => {
  try {
    const { data: sellerData } = await $fetch('/api/users/by-wallet', {
      method: 'POST',
      body: { walletAddress: product.seller_wallet }
    }) as any
    
    if (!sellerData) {
      alert('Seller not found. They may not have set up their account yet.')
      return
    }
    
    await $fetch('/api/messaging/conversations/create', {
      method: 'POST',
      body: {
        participant2Id: sellerData.id,
        listingId: product.id
      }
    })
    
    navigateTo('/messages')
  } catch (error: any) {
    alert('Failed to start conversation: ' + error.message)
  }
}

onMounted(() => {
  loadProducts()
})
</script>