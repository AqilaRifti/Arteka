<template>
  <div class="min-h-screen bg-background">
    <SignedIn>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <!-- Header -->
        <div class="mb-8 space-y-2">
          <h1 class="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">My Funding Dashboard</h1>
          <p class="text-lg text-muted-foreground">Manage your campaigns and track your investments</p>
        </div>

        <!-- Tabs -->
        <Tabs v-model="activeTab" class="space-y-6">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="created" class="gap-2">
              <Rocket class="w-4 h-4" />
              <span class="hidden sm:inline">My Campaigns</span>
              <Badge variant="secondary" class="ml-1">{{ myCampaigns.length }}</Badge>
            </TabsTrigger>
            <TabsTrigger value="backed" class="gap-2">
              <Wallet class="w-4 h-4" />
              <span class="hidden sm:inline">Backed</span>
              <Badge variant="secondary" class="ml-1">{{ backedCampaigns.length }}</Badge>
            </TabsTrigger>
            <TabsTrigger value="earnings" class="gap-2">
              <TrendingUp class="w-4 h-4" />
              <span class="hidden sm:inline">Earnings</span>
            </TabsTrigger>
          </TabsList>

          <!-- My Campaigns Tab -->
          <TabsContent value="created" class="space-y-6">
            <div v-if="loadingCampaigns" class="text-center py-12">
              <Loader2 class="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p class="text-muted-foreground">Loading campaigns...</p>
            </div>

            <Card v-else-if="myCampaigns.length === 0" class="border-dashed">
              <CardContent class="flex flex-col items-center justify-center py-16">
                <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Target class="w-8 h-8 text-muted-foreground" />
                </div>
                <CardTitle class="text-2xl mb-3">No Campaigns Yet</CardTitle>
                <CardDescription class="mb-6">Create your first funding campaign</CardDescription>
                <NuxtLink to="/dashboard/create-funding">
                  <Button size="lg" class="gap-2">
                    <Plus class="w-4 h-4" />
                    Create Campaign
                  </Button>
                </NuxtLink>
              </CardContent>
            </Card>

            <Card v-for="campaign in myCampaigns" :key="campaign.id" v-else>
              <CardContent class="p-6 space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-3xl shrink-0">
                      {{ getProjectIcon(campaign.project_type) }}
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-foreground">{{ campaign.title }}</h3>
                      <p class="text-sm text-muted-foreground">{{ campaign.project_type }}</p>
                    </div>
                  </div>
                  <Badge :variant="campaign.is_funded ? 'default' : 'secondary'" class="shrink-0">
                    <CheckCircle v-if="campaign.is_funded" class="w-3 h-3 mr-1" />
                    {{ campaign.is_funded ? 'Funded' : 'Active' }}
                  </Badge>
                </div>

                <!-- Progress -->
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="font-semibold">{{ formatEth(campaign.total_funded) }} ETH raised</span>
                    <span class="text-muted-foreground">Goal: {{ formatEth(campaign.funding_goal) }} ETH</span>
                  </div>
                  <Progress :value="getProgress(campaign)" class="h-2" />
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card class="border-border">
                    <CardContent class="p-4 text-center space-y-1">
                      <p class="text-2xl font-bold text-primary">{{ getProgress(campaign) }}%</p>
                      <p class="text-xs text-muted-foreground">Funded</p>
                    </CardContent>
                  </Card>
                  <Card class="border-border">
                    <CardContent class="p-4 text-center space-y-1">
                      <p class="text-2xl font-bold text-foreground">{{ campaign.backers?.length || 0 }}</p>
                      <p class="text-xs text-muted-foreground">Backers</p>
                    </CardContent>
                  </Card>
                  <Card class="border-border">
                    <CardContent class="p-4 text-center space-y-1">
                      <p class="text-2xl font-bold text-green-600">{{ formatEth(campaign.total_revenue) }}</p>
                      <p class="text-xs text-muted-foreground">Revenue</p>
                    </CardContent>
                  </Card>
                  <Card class="border-border">
                    <CardContent class="p-4 text-center space-y-1">
                      <p class="text-2xl font-bold text-foreground">{{ campaign.creator_share / 100 }}%</p>
                      <p class="text-xs text-muted-foreground">Your Share</p>
                    </CardContent>
                  </Card>
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row gap-2">
                  <Button 
                    @click="viewCampaignDetails(campaign)"
                    variant="outline"
                    size="sm"
                    class="flex-1 gap-2"
                  >
                    <BarChart3 class="w-4 h-4" />
                    View Details
                  </Button>
                  <Button 
                    v-if="campaign.is_funded"
                    @click="sendRevenue(campaign)"
                    variant="default"
                    size="sm"
                    class="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <DollarSign class="w-4 h-4" />
                    Send Revenue
                  </Button>
                  <Button 
                    v-else-if="!isExpired(campaign.deadline)"
                    @click="shareCampaign(campaign)"
                    size="sm"
                    class="flex-1 gap-2"
                  >
                    <Share2 class="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <!-- Backed Campaigns Tab -->
          <TabsContent value="backed" class="space-y-6">
            <div v-if="loadingBacked" class="text-center py-12">
              <Loader2 class="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p class="text-muted-foreground">Loading investments...</p>
            </div>

            <Card v-else-if="backedCampaigns.length === 0" class="border-dashed">
              <CardContent class="flex flex-col items-center justify-center py-16">
                <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Wallet class="w-8 h-8 text-muted-foreground" />
                </div>
                <CardTitle class="text-2xl mb-3">No Investments Yet</CardTitle>
                <CardDescription class="mb-6">Start backing creative projects to earn revenue share</CardDescription>
                <NuxtLink to="/funding">
                  <Button size="lg" class="gap-2">
                    <Search class="w-4 h-4" />
                    Browse Campaigns
                  </Button>
                </NuxtLink>
              </CardContent>
            </Card>

            <Card v-for="backed in backedCampaigns" :key="backed.id" v-else>
              <CardContent class="p-6 space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-3xl shrink-0">
                      {{ getProjectIcon(backed.campaign?.project_type) }}
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-foreground">{{ backed.campaign?.title }}</h3>
                      <p class="text-sm text-muted-foreground">Your investment: {{ formatEth(backed.amount) }} ETH</p>
                    </div>
                  </div>
                  <Badge :variant="backed.campaign?.is_funded ? 'default' : 'secondary'" class="shrink-0">
                    {{ backed.campaign?.is_funded ? 'Funded - Earning' : 'Funding' }}
                  </Badge>
                </div>

                <!-- Investment Stats -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card class="border-border bg-purple-50 dark:bg-purple-950/20">
                    <CardContent class="p-4 text-center space-y-1">
                      <p class="text-2xl font-bold text-purple-600">{{ formatEth(backed.amount) }}</p>
                      <p class="text-xs text-muted-foreground">Invested</p>
                    </CardContent>
                  </Card>
                  <Card class="border-border bg-indigo-50 dark:bg-indigo-950/20">
                    <CardContent class="p-4 text-center space-y-1">
                      <p class="text-2xl font-bold text-indigo-600">{{ getBackerShare(backed) }}%</p>
                      <p class="text-xs text-muted-foreground">Your Share</p>
                    </CardContent>
                  </Card>
                  <Card class="border-border bg-green-50 dark:bg-green-950/20">
                    <CardContent class="p-4 text-center space-y-1">
                      <p class="text-2xl font-bold text-green-600">{{ formatEth(backed.claimed_revenue) }}</p>
                      <p class="text-xs text-muted-foreground">Earned</p>
                    </CardContent>
                  </Card>
                  <Card class="border-border">
                    <CardContent class="p-4 text-center space-y-1">
                      <p class="text-2xl font-bold text-foreground">{{ getROI(backed) }}%</p>
                      <p class="text-xs text-muted-foreground">ROI</p>
                    </CardContent>
                  </Card>
                </div>

                <!-- Progress -->
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="font-semibold">Campaign Progress</span>
                    <span class="text-muted-foreground">{{ getProgress(backed.campaign) }}%</span>
                  </div>
                  <Progress :value="getProgress(backed.campaign)" class="h-2" />
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row gap-2">
                  <Button 
                    @click="viewCampaignDetails(backed.campaign)"
                    variant="outline"
                    size="sm"
                    class="flex-1 gap-2"
                  >
                    <BarChart3 class="w-4 h-4" />
                    View Campaign
                  </Button>
                  <Button 
                    as="a"
                    :href="`https://sepolia.etherscan.io/tx/${backed.transaction_hash}`"
                    target="_blank"
                    variant="outline"
                    size="sm"
                    class="flex-1 gap-2"
                  >
                    <ExternalLink class="w-4 h-4" />
                    View Transaction
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <!-- Earnings Tab -->
          <TabsContent value="earnings" class="space-y-6">
            <div v-if="loadingEarnings" class="text-center py-12">
              <Loader2 class="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p class="text-muted-foreground">Loading earnings...</p>
            </div>

            <div v-else class="space-y-6">
              <!-- Earnings Summary -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card class="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white">
                  <CardContent class="p-6 space-y-2">
                    <p class="text-sm opacity-90">Total Earnings</p>
                    <p class="text-4xl font-bold">{{ totalEarnings }} ETH</p>
                    <p class="text-sm opacity-75">From all investments</p>
                  </CardContent>
                </Card>
                <Card class="bg-gradient-to-br from-purple-500 to-indigo-600 border-0 text-white">
                  <CardContent class="p-6 space-y-2">
                    <p class="text-sm opacity-90">Active Investments</p>
                    <p class="text-4xl font-bold">{{ activeInvestments }}</p>
                    <p class="text-sm opacity-75">Campaigns earning revenue</p>
                  </CardContent>
                </Card>
                <Card class="bg-gradient-to-br from-blue-500 to-cyan-600 border-0 text-white">
                  <CardContent class="p-6 space-y-2">
                    <p class="text-sm opacity-90">Average ROI</p>
                    <p class="text-4xl font-bold">{{ averageROI }}%</p>
                    <p class="text-sm opacity-75">Return on investment</p>
                  </CardContent>
                </Card>
              </div>

              <!-- Earnings History -->
              <Card>
                <CardHeader>
                  <CardTitle class="text-2xl">Earnings History</CardTitle>
                  <CardDescription>Track your revenue from backed campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div v-if="earnings.length === 0" class="text-center py-12">
                    <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                      <Coins class="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p class="text-muted-foreground">No earnings yet. Back funded campaigns to start earning!</p>
                  </div>

                  <div v-else class="space-y-3">
                    <Card v-for="earning in earnings" :key="earning.id" class="border-border">
                      <CardContent class="p-4">
                        <div class="flex items-center justify-between gap-4">
                          <div class="flex items-center gap-3 min-w-0 flex-1">
                            <div class="w-10 h-10 bg-green-100 dark:bg-green-950/20 rounded-full flex items-center justify-center shrink-0">
                              <Coins class="w-5 h-5 text-green-600" />
                            </div>
                            <div class="min-w-0 flex-1">
                              <p class="font-semibold text-foreground truncate">{{ earning.campaign?.title }}</p>
                              <p class="text-sm text-muted-foreground">{{ formatDate(earning.created_at) }}</p>
                            </div>
                          </div>
                          <div class="text-right shrink-0">
                            <p class="text-xl font-bold text-green-600">+{{ formatEth(earning.amount) }} ETH</p>
                            <a :href="`https://sepolia.etherscan.io/tx/${earning.transaction_hash}`"
                               target="_blank"
                               class="text-xs text-primary hover:underline flex items-center gap-1 justify-end">
                              View TX
                              <ExternalLink class="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </SignedIn>

    <!-- Send Revenue Dialog -->
    <Dialog :open="showRevenueModal" @update:open="val => showRevenueModal = val">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="text-2xl">Send Revenue to Campaign</DialogTitle>
          <DialogDescription>
            Revenue will be automatically split: <strong>{{ selectedCampaign?.creator_share / 100 }}%</strong> to you, 
            <strong>{{ selectedCampaign?.backers_share / 100 }}%</strong> to backers
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input 
              id="amount"
              v-model="revenueForm.amount"
              type="number"
              step="0.001"
              min="0.001"
              placeholder="0.1"
            />
          </div>

          <div class="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select v-model="revenueForm.source">
              <SelectTrigger id="source">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="song_purchase">Song Purchase</SelectItem>
                <SelectItem value="album_sale">Album Sale</SelectItem>
                <SelectItem value="streaming">Streaming Revenue</SelectItem>
                <SelectItem value="merchandise">Merchandise</SelectItem>
                <SelectItem value="licensing">Licensing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label htmlFor="private-key">Private Key</Label>
            <Input 
              id="private-key"
              v-model="revenueForm.privateKey"
              type="password"
              placeholder="Enter your wallet private key"
            />
          </div>

          <Alert class="border-green-200 bg-green-50 dark:bg-green-950/20">
            <Info class="h-4 w-4 text-green-600" />
            <AlertTitle class="text-green-900 dark:text-green-100 text-sm">Distribution Preview</AlertTitle>
            <AlertDescription class="text-green-800 dark:text-green-200 text-sm">
              • You receive: <strong>{{ calculateCreatorAmount() }} ETH</strong><br/>
              • Backers split: <strong>{{ calculateBackersAmount() }} ETH</strong>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            @click="showRevenueModal = false"
            class="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button 
            @click="submitRevenue"
            :disabled="sendingRevenue"
            class="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 gap-2"
          >
            <Loader2 v-if="sendingRevenue" class="w-4 h-4 animate-spin" />
            {{ sendingRevenue ? 'Sending...' : 'Send Revenue' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { SignedIn, UserButton } from '@clerk/nuxt/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Rocket, Wallet, TrendingUp, Target, Plus, CheckCircle, 
  BarChart3, DollarSign, Share2, Search, ExternalLink, 
  Coins, Info, Loader2 
} from 'lucide-vue-next'

const activeTab = ref('created')
const myCampaigns = ref<any[]>([])
const backedCampaigns = ref<any[]>([])
const earnings = ref<any[]>([])
const loadingCampaigns = ref(true)
const loadingBacked = ref(true)
const loadingEarnings = ref(true)

const showRevenueModal = ref(false)
const selectedCampaign = ref<any>(null)
const sendingRevenue = ref(false)
const revenueForm = ref({
  amount: '',
  source: 'song_purchase',
  privateKey: ''
})

const projectTypes = [
  { slug: 'album', icon: '🎵' },
  { slug: 'film', icon: '🎬' },
  { slug: 'game', icon: '🎮' },
  { slug: 'book', icon: '📚' },
  { slug: 'art', icon: '🎨' },
  { slug: 'podcast', icon: '🎙️' },
  { slug: 'software', icon: '💻' },
  { slug: 'other', icon: '✨' }
]

const totalEarnings = computed(() => {
  const total = earnings.value.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  return (total / 1e18).toFixed(4)
})

const activeInvestments = computed(() => {
  return backedCampaigns.value.filter(b => b.campaign?.is_funded).length
})

const averageROI = computed(() => {
  const backed = backedCampaigns.value.filter(b => parseFloat(b.amount) > 0)
  if (backed.length === 0) return 0
  const avgROI = backed.reduce((sum, b) => sum + parseFloat(getROI(b)), 0) / backed.length
  return avgROI.toFixed(1)
})

const loadMyCampaigns = async () => {
  try {
    loadingCampaigns.value = true
    const data = await $fetch('/api/funding/campaigns/my-campaigns')
    myCampaigns.value = data as any[]
  } catch (error) {
    console.error('Failed to load campaigns:', error)
  } finally {
    loadingCampaigns.value = false
  }
}

const loadBackedCampaigns = async () => {
  try {
    loadingBacked.value = true
    const data = await $fetch('/api/funding/campaigns/backed')
    backedCampaigns.value = data as any[]
  } catch (error) {
    console.error('Failed to load backed campaigns:', error)
  } finally {
    loadingBacked.value = false
  }
}

const loadEarnings = async () => {
  try {
    loadingEarnings.value = true
    const data = await $fetch('/api/funding/my-earnings')
    earnings.value = data as any[]
  } catch (error) {
    console.error('Failed to load earnings:', error)
  } finally {
    loadingEarnings.value = false
  }
}

const formatEth = (weiString: string) => {
  const eth = parseFloat(weiString) / 1e18
  return eth.toFixed(4)
}

const getProgress = (campaign: any) => {
  if (!campaign) return 0
  const funded = parseFloat(campaign.total_funded)
  const goal = parseFloat(campaign.funding_goal)
  if (goal === 0) return 0
  return Math.round((funded / goal) * 100)
}

const getProjectIcon = (type: string) => {
  return projectTypes.find(t => t.slug === type)?.icon || '✨'
}

const isExpired = (deadline: string) => {
  return new Date(deadline) < new Date()
}

const getBackerShare = (backed: any) => {
  const totalFunded = parseFloat(backed.campaign?.total_funded || '0')
  const myAmount = parseFloat(backed.amount)
  if (totalFunded === 0) return 0
  return ((myAmount / totalFunded) * (backed.campaign?.backers_share / 100)).toFixed(2)
}

const getROI = (backed: any) => {
  const invested = parseFloat(backed.amount)
  const earned = parseFloat(backed.claimed_revenue || '0')
  if (invested === 0) return 0
  return ((earned / invested) * 100).toFixed(1)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const viewCampaignDetails = (campaign: any) => {
  navigateTo(`/funding?campaign=${campaign.id}`)
}

const sendRevenue = (campaign: any) => {
  selectedCampaign.value = campaign
  showRevenueModal.value = true
}

const calculateCreatorAmount = () => {
  if (!revenueForm.value.amount || !selectedCampaign.value) return '0.0000'
  const amount = parseFloat(revenueForm.value.amount)
  const creatorShare = selectedCampaign.value.creator_share / 10000
  return (amount * creatorShare).toFixed(4)
}

const calculateBackersAmount = () => {
  if (!revenueForm.value.amount || !selectedCampaign.value) return '0.0000'
  const amount = parseFloat(revenueForm.value.amount)
  const backersShare = selectedCampaign.value.backers_share / 10000
  return (amount * backersShare).toFixed(4)
}

const submitRevenue = async () => {
  if (!revenueForm.value.amount || !revenueForm.value.privateKey) {
    alert('Please fill in all fields')
    return
  }

  try {
    sendingRevenue.value = true
    
    const result = await $fetch('/api/funding/revenue/send', {
      method: 'POST',
      body: {
        campaignId: selectedCampaign.value.id,
        amount: revenueForm.value.amount,
        source: revenueForm.value.source,
        privateKey: revenueForm.value.privateKey
      }
    })
    
    alert('Revenue sent and distributed! TX: ' + result.transactionHash)
    showRevenueModal.value = false
    revenueForm.value = { amount: '', source: 'song_purchase', privateKey: '' }
    await loadMyCampaigns()
  } catch (error: any) {
    alert('Failed to send revenue: ' + error.message)
  } finally {
    sendingRevenue.value = false
  }
}

const shareCampaign = (campaign: any) => {
  const url = `${window.location.origin}/funding?campaign=${campaign.id}`
  if (navigator.share) {
    navigator.share({
      title: campaign.title,
      text: `Back my campaign: ${campaign.title}`,
      url
    })
  } else {
    navigator.clipboard.writeText(url)
    alert('Campaign link copied to clipboard!')
  }
}

onMounted(() => {
  loadMyCampaigns()
  loadBackedCampaigns()
  loadEarnings()
})
</script>