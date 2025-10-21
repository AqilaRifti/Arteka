<template>
  <div class="min-h-screen bg-background">
    <SignedIn>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <!-- Wallet Setup Required -->
        <Alert v-if="!user?.wallet_address" variant="destructive" class="mb-8">
          <AlertCircle class="h-5 w-5" />
          <AlertTitle class="text-lg font-semibold">Wallet Setup Required</AlertTitle>
          <AlertDescription class="mt-2 space-y-3">
            <p class="text-sm leading-relaxed">
              To use the marketplace, you need to connect your Ethereum wallet. 
              Your private key will be encrypted and stored securely.
            </p>
            <Button @click="showWalletSetup = true" size="sm" variant="default">
              Setup Wallet Now
            </Button>
          </AlertDescription>
        </Alert>

        <!-- Dashboard Content -->
        <div v-if="user?.wallet_address" class="space-y-8">
          <!-- Header -->
          <div class="space-y-2">
            <h1 class="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p class="text-lg text-muted-foreground">Manage your listings, orders, and digital works</p>
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader class="flex flex-row items-center justify-between pb-2">
                <CardTitle class="text-sm font-medium text-muted-foreground">My Listings</CardTitle>
                <Package class="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-3xl font-bold text-foreground">{{ myListings.length }}</div>
                <p class="text-xs text-muted-foreground mt-1">Total active listings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="flex flex-row items-center justify-between pb-2">
                <CardTitle class="text-sm font-medium text-muted-foreground">Purchases</CardTitle>
                <ShoppingCart class="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-3xl font-bold text-foreground">{{ myPurchases.length }}</div>
                <p class="text-xs text-muted-foreground mt-1">Items purchased</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="flex flex-row items-center justify-between pb-2">
                <CardTitle class="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                <CheckCircle class="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-3xl font-bold text-foreground">{{ totalSales }}</div>
                <p class="text-xs text-muted-foreground mt-1">Successful transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="flex flex-row items-center justify-between pb-2">
                <CardTitle class="text-sm font-medium text-muted-foreground">Earnings</CardTitle>
                <DollarSign class="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold text-foreground">{{ totalEarnings }} ETH</div>
                <p class="text-xs text-muted-foreground mt-1">Total revenue</p>
              </CardContent>
            </Card>
          </div>

          <!-- Wallet Info -->
          <Card class="bg-gradient-to-br from-primary to-primary/80 border-0 text-primary-foreground">
            <CardContent class="p-6">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="space-y-1 min-w-0 flex-1">
                  <p class="text-sm opacity-90 font-medium">Connected Wallet</p>
                  <code class="text-base sm:text-lg font-mono font-semibold break-all">
                    {{ user.wallet_address }}
                  </code>
                </div>
                <div class="text-left sm:text-right shrink-0">
                  <p class="text-sm opacity-90 font-medium">Network</p>
                  <p class="text-base font-semibold">Sepolia Testnet</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Quick Actions -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NuxtLink to="/dashboard/create-listing">
              <Card class="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                <CardContent class="p-6 text-center space-y-3">
                  <div class="text-5xl">➕</div>
                  <CardTitle class="text-lg">Create Listing</CardTitle>
                  <CardDescription>List a product or service</CardDescription>
                </CardContent>
              </Card>
            </NuxtLink>

            <NuxtLink to="/explore">
              <Card class="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                <CardContent class="p-6 text-center space-y-3">
                  <div class="text-5xl">🔍</div>
                  <CardTitle class="text-lg">Browse Works</CardTitle>
                  <CardDescription>Explore digital rights</CardDescription>
                </CardContent>
              </Card>
            </NuxtLink>

            <Card 
              class="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
              @click="loadData"
            >
              <CardContent class="p-6 text-center space-y-3">
                <div class="text-5xl">🔄</div>
                <CardTitle class="text-lg">Refresh Data</CardTitle>
                <CardDescription>Update listings & purchases</CardDescription>
              </CardContent>
            </Card>
          </div>

          <!-- My Listings -->
          <Card>
            <CardHeader>
              <CardTitle class="text-2xl">My Listings</CardTitle>
              <CardDescription>Manage your marketplace listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="myListings.length === 0" class="text-center py-12">
                <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Package class="w-8 h-8 text-muted-foreground" />
                </div>
                <p class="text-muted-foreground mb-4">You haven't created any listings yet</p>
                <NuxtLink to="/dashboard/create-listing">
                  <Button>Create Your First Listing</Button>
                </NuxtLink>
              </div>

              <div v-else class="space-y-3">
                <Card v-for="listing in myListings" :key="listing.id" class="border-border">
                  <CardContent class="p-4">
                    <div class="flex flex-col sm:flex-row items-start gap-4">
                      <div class="flex-1 min-w-0 space-y-3 w-full">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="text-2xl">{{ listing.listing_type === 'product' ? '📦' : '✨' }}</span>
                          <h3 class="text-lg font-bold text-foreground">{{ listing.title }}</h3>
                          <Badge :variant="listing.is_active ? 'default' : 'secondary'">
                            {{ listing.is_active ? 'Active' : 'Inactive' }}
                          </Badge>
                        </div>
                        <p class="text-sm text-muted-foreground line-clamp-2">{{ listing.description }}</p>
                        <div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span class="flex items-center gap-1">
                            <DollarSign class="w-3.5 h-3.5" />
                            {{ formatPrice(listing.price) }} ETH
                          </span>
                          <span class="flex items-center gap-1">
                            <TrendingUp class="w-3.5 h-3.5" />
                            {{ listing.sold_count }} sales
                          </span>
                          <Badge variant="outline" class="text-xs">
                            {{ listing.listing_type }}
                          </Badge>
                        </div>
                      </div>
                      <div class="flex sm:flex-col gap-2 w-full sm:w-auto">
                        <Button 
                          as="a"
                          :href="`https://sepolia.etherscan.io/tx/${listing.transaction_hash}`"
                          target="_blank"
                          variant="outline"
                          size="sm"
                          class="flex-1 sm:flex-none gap-2"
                        >
                          <ExternalLink class="w-4 h-4" />
                          View TX
                        </Button>
                        <Button 
                          v-if="listing.is_active"
                          @click="deactivateListing(listing.id)"
                          variant="destructive"
                          size="sm"
                          class="flex-1 sm:flex-none"
                        >
                          Deactivate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <!-- My Purchases -->
          <Card>
            <CardHeader>
              <CardTitle class="text-2xl">My Purchases</CardTitle>
              <CardDescription>View your purchase history</CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="myPurchases.length === 0" class="text-center py-12">
                <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart class="w-8 h-8 text-muted-foreground" />
                </div>
                <p class="text-muted-foreground mb-4">You haven't made any purchases yet</p>
                <NuxtLink to="/marketplace/products">
                  <Button>Browse Marketplace</Button>
                </NuxtLink>
              </div>

              <div v-else class="space-y-3">
                <Card v-for="purchase in myPurchases" :key="purchase.id" class="border-border">
                  <CardContent class="p-4">
                    <div class="flex flex-col sm:flex-row items-start gap-4">
                      <div class="flex-1 min-w-0 space-y-3 w-full">
                        <div class="flex flex-wrap items-center gap-2">
                          <ShoppingCart class="w-5 h-5 text-muted-foreground" />
                          <h3 class="text-lg font-bold text-foreground">
                            {{ purchase.listing?.title || 'Purchase' }}
                          </h3>
                          <Badge variant="default">
                            {{ purchase.status }}
                          </Badge>
                        </div>
                        <div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span class="flex items-center gap-1">
                            <DollarSign class="w-3.5 h-3.5" />
                            {{ formatPrice(purchase.price) }} ETH
                          </span>
                          <span class="flex items-center gap-1">
                            <Calendar class="w-3.5 h-3.5" />
                            {{ new Date(purchase.created_at).toLocaleDateString() }}
                          </span>
                          <span class="flex items-center gap-1">
                            <User class="w-3.5 h-3.5" />
                            From: <code class="font-mono text-xs">{{ purchase.seller_wallet.slice(0, 6) }}...{{ purchase.seller_wallet.slice(-4) }}</code>
                          </span>
                        </div>
                      </div>
                      <Button 
                        as="a"
                        :href="`https://sepolia.etherscan.io/tx/${purchase.transaction_hash}`"
                        target="_blank"
                        size="sm"
                        class="gap-2 w-full sm:w-auto"
                      >
                        <ExternalLink class="w-4 h-4" />
                        View TX
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </SignedIn>

    <!-- Wallet Setup Dialog -->
    <Dialog :open="showWalletSetup" @update:open="val => showWalletSetup = val">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="text-2xl">Setup Your Wallet</DialogTitle>
          <DialogDescription>
            Connect your Ethereum wallet to start using the marketplace
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label htmlFor="wallet-address">Wallet Address</Label>
            <Input 
              id="wallet-address"
              v-model="walletAddress"
              placeholder="0x..."
            />
          </div>

          <div class="space-y-2">
            <Label htmlFor="private-key">Private Key</Label>
            <Input 
              id="private-key"
              v-model="privateKey"
              type="password"
              placeholder="0x..."
            />
            <p class="text-xs text-muted-foreground flex items-center gap-1">
              <Lock class="w-3 h-3" />
              Your private key will be encrypted and stored securely
            </p>
          </div>

          <Alert>
            <AlertCircle class="h-4 w-4" />
            <AlertTitle class="text-sm">Important</AlertTitle>
            <AlertDescription class="text-xs">
              Make sure you're on Sepolia Testnet. Never share your private key with anyone.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            @click="showWalletSetup = false"
            class="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button 
            @click="setupWallet"
            :disabled="!walletAddress || !privateKey || savingWallet"
            class="flex-1 sm:flex-none"
          >
            {{ savingWallet ? 'Saving...' : 'Save Wallet' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Signed Out State -->
    <SignedOut>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Lock class="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 class="text-3xl font-bold text-foreground mb-4">Sign In Required</h2>
        <p class="text-muted-foreground mb-8 max-w-md mx-auto">
          Please sign in to access your dashboard and manage your listings
        </p>
        <SignInButton mode="modal">
          <Button size="lg" class="gap-2">
            <LogIn class="w-4 h-4" />
            Sign In to Continue
          </Button>
        </SignInButton>
      </div>
    </SignedOut>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nuxt/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Package, ShoppingCart, CheckCircle, DollarSign, ExternalLink, 
  TrendingUp, User, Calendar, Lock, AlertCircle, LogIn 
} from 'lucide-vue-next'

const user = ref<any>(null)
const myListings = ref<any[]>([])
const myPurchases = ref<any[]>([])
const showWalletSetup = ref(false)
const walletAddress = ref('')
const privateKey = ref('')
const savingWallet = ref(false)

const totalSales = computed(() => {
  return myListings.value.reduce((sum, listing) => sum + listing.sold_count, 0)
})

const totalEarnings = computed(() => {
  const totalWei = myListings.value.reduce((sum, listing) => {
    return sum + (parseFloat(listing.price) * listing.sold_count)
  }, 0)
  return (totalWei / 1e18).toFixed(4)
})

const loadUser = async () => {
  try {
    const data = await $fetch('/api/auth/user')
    user.value = data
  } catch (error) {
    console.error('Failed to load user:', error)
  }
}

const loadMyListings = async () => {
  try {
    const data = await $fetch('/api/listings/my-listings')
    myListings.value = data as any[]
  } catch (error) {
    console.error('Failed to load listings:', error)
  }
}

const loadMyPurchases = async () => {
  try {
    const data = await $fetch('/api/purchases/my-purchases')
    myPurchases.value = data as any[]
  } catch (error) {
    console.error('Failed to load purchases:', error)
  }
}

const loadData = async () => {
  await Promise.all([
    loadUser(),
    loadMyListings(),
    loadMyPurchases()
  ])
}

const setupWallet = async () => {
  if (!walletAddress.value || !privateKey.value) return
  
  try {
    savingWallet.value = true
    
    await $fetch('/api/auth/wallet', {
      method: 'POST',
      body: {
        walletAddress: walletAddress.value,
        privateKey: privateKey.value
      }
    })
    
    alert('Wallet setup successful!')
    showWalletSetup.value = false
    walletAddress.value = ''
    privateKey.value = ''
    await loadUser()
  } catch (error: any) {
    alert('Failed to setup wallet: ' + error.message)
  } finally {
    savingWallet.value = false
  }
}

const formatPrice = (priceInWei: string) => {
  const eth = parseFloat(priceInWei) / 1e18
  return eth.toFixed(4)
}

const deactivateListing = async (id: string) => {
  if (!confirm('Are you sure you want to deactivate this listing?')) return
  
  try {
    await $fetch(`/api/listings/${id}/deactivate`, {
      method: 'POST'
    })
    alert('Listing deactivated successfully')
    await loadMyListings()
  } catch (error: any) {
    alert('Failed to deactivate listing: ' + error.message)
  }
}

onMounted(() => {
  loadData()
})
</script>