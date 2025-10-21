<template>
  <div class="min-h-screen bg-background">
    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Hero Section -->
      <div class="mb-12 space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
          <Sparkles class="w-3.5 h-3.5" />
          <span class="font-medium">Revenue Share Model</span>
        </div>
        <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
          Creative Funding<br />Campaigns
        </h2>
        <p class="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Back creative projects and earn revenue share when they succeed. Support artists and creators with blockchain-secured investments.
        </p>
      </div>

      <!-- Category Filter -->
      <div class="mb-8 flex flex-wrap gap-2">
        <Button
          @click="selectedType = null"
          :variant="selectedType === null ? 'default' : 'outline'"
          size="sm"
          class="gap-2"
        >
          <Grid3x3 class="w-4 h-4" />
          All Projects
        </Button>
        <Button
          v-for="type in projectTypes"
          :key="type.slug"
          @click="selectedType = type.slug"
          :variant="selectedType === type.slug ? 'default' : 'outline'"
          size="sm"
          class="gap-2"
        >
          <span>{{ type.icon }}</span>
          <span>{{ type.name }}</span>
        </Button>
      </div>

      <!-- Stats Bar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p class="text-muted-foreground">
          <span class="font-semibold text-foreground">{{ filteredCampaigns.length }}</span> campaigns found
        </p>
        <SignedIn>
          <NuxtLink to="/funding/create">
            <Button size="lg" class="gap-2">
              <Plus class="w-4 h-4" />
              Create Campaign
            </Button>
          </NuxtLink>
        </SignedIn>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card v-for="i in 6" :key="i">
          <CardHeader>
            <div class="h-5 bg-muted rounded animate-pulse mb-2" />
            <div class="h-4 bg-muted rounded w-3/4 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div class="h-3 bg-muted rounded animate-pulse" />
              <div class="h-10 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Campaigns Grid -->
      <div v-else-if="filteredCampaigns.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card 
          v-for="campaign in filteredCampaigns" 
          :key="campaign.id"
          class="group hover:shadow-lg transition-all duration-300"
        >
          <CardHeader class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-2xl shrink-0">
                {{ getProjectIcon(campaign.project_type) }}
              </div>
              <Badge 
                :variant="campaign.is_funded ? 'default' : isExpired(campaign.deadline) ? 'destructive' : 'secondary'"
                class="shrink-0"
              >
                <CheckCircle v-if="campaign.is_funded" class="w-3 h-3 mr-1" />
                <XCircle v-else-if="isExpired(campaign.deadline)" class="w-3 h-3 mr-1" />
                <Clock v-else class="w-3 h-3 mr-1" />
                {{ campaign.is_funded ? 'Funded' : isExpired(campaign.deadline) ? 'Expired' : 'Active' }}
              </Badge>
            </div>

            <div class="space-y-2">
              <CardTitle class="text-lg leading-tight line-clamp-1">
                {{ campaign.title }}
              </CardTitle>
              <CardDescription class="line-clamp-2 text-sm leading-relaxed">
                {{ campaign.description }}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent class="space-y-4">
            <!-- Progress Bar -->
            <div class="space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">Progress</span>
                <span class="font-semibold">{{ getProgress(campaign) }}%</span>
              </div>
              <Progress :value="getProgress(campaign)" class="h-2" />
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3 pb-4 border-b border-border">
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground uppercase tracking-wider">Raised</p>
                <div class="flex items-baseline gap-1">
                  <span class="text-lg font-bold text-foreground">{{ formatEth(campaign.total_funded) }}</span>
                  <span class="text-xs text-muted-foreground">ETH</span>
                </div>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground uppercase tracking-wider">Goal</p>
                <div class="flex items-baseline gap-1">
                  <span class="text-lg font-bold text-foreground">{{ formatEth(campaign.funding_goal) }}</span>
                  <span class="text-xs text-muted-foreground">ETH</span>
                </div>
              </div>
            </div>

            <!-- Revenue Share -->
            <div class="bg-muted/50 rounded-lg p-3 space-y-2">
              <p class="text-xs text-muted-foreground uppercase tracking-wider font-medium">Revenue Share</p>
              <div class="flex items-center justify-between text-sm">
                <span class="font-semibold">Creator: {{ campaign.creator_share / 100 }}%</span>
                <span class="font-semibold">Backers: {{ campaign.backers_share / 100 }}%</span>
              </div>
            </div>

            <!-- Deadline -->
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock class="w-3.5 h-3.5" />
              <span>{{ isExpired(campaign.deadline) ? 'Ended' : 'Ends' }}: {{ formatDate(campaign.deadline) }}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-2">
              <Button 
                @click="viewCampaign(campaign)"
                variant="outline"
                size="sm"
                class="flex-1 gap-2"
              >
                <Eye class="w-4 h-4" />
                Details
              </Button>
              <SignedIn>
                <Button 
                  v-if="!campaign.is_funded && !isExpired(campaign.deadline)"
                  @click="backCampaign(campaign)"
                  size="sm"
                  class="flex-1 gap-2"
                >
                  <DollarSign class="w-4 h-4" />
                  Back
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
            <Target class="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle class="text-2xl mb-3">No Campaigns Yet</CardTitle>
          <CardDescription class="text-center mb-8 max-w-md">
            Be the first to create a funding campaign for your creative project
          </CardDescription>
          <SignedIn>
            <NuxtLink to="/funding/create">
              <Button size="lg" class="gap-2">
                <Plus class="w-4 h-4" />
                Create Campaign
              </Button>
            </NuxtLink>
          </SignedIn>
        </CardContent>
      </Card>
    </main>

    <!-- Campaign Detail Dialog -->
    <Dialog :open="!!selectedCampaign" @update:open="val => !val && (selectedCampaign = null)">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div v-if="selectedCampaign" class="space-y-6">
          <!-- Header -->
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-3xl shrink-0">
              {{ getProjectIcon(selectedCampaign.project_type) }}
            </div>
            <div class="flex-1 min-w-0">
              <DialogTitle class="text-3xl font-bold tracking-tight mb-2">
                {{ selectedCampaign.title }}
              </DialogTitle>
              <p class="text-sm text-muted-foreground">
                by {{ selectedCampaign.creator.email?.split('@')[0] }}
              </p>
            </div>
          </div>

          <!-- Campaign Status -->
          <Badge 
            :variant="selectedCampaign.is_funded ? 'default' : isExpired(selectedCampaign.deadline) ? 'destructive' : 'secondary'"
            class="gap-2"
          >
            <CheckCircle v-if="selectedCampaign.is_funded" class="w-4 h-4" />
            <XCircle v-else-if="isExpired(selectedCampaign.deadline)" class="w-4 h-4" />
            <Clock v-else class="w-4 h-4" />
            {{ selectedCampaign.is_funded ? 'Successfully Funded - Generating Revenue' : 
               isExpired(selectedCampaign.deadline) ? 'Campaign Ended' : 
               `Active Campaign - ${daysRemaining(selectedCampaign.deadline)} days left` }}
          </Badge>

          <Separator />

          <!-- Description -->
          <div class="space-y-2">
            <Label class="text-base font-semibold">About This Project</Label>
            <p class="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {{ selectedCampaign.description }}
            </p>
          </div>

          <Separator />

          <!-- Funding Progress -->
          <div class="bg-muted/30 rounded-lg p-6 space-y-4">
            <Label class="text-base font-semibold">Funding Progress</Label>
            <Progress :value="getProgress(selectedCampaign)" class="h-3" />
            <div class="grid grid-cols-3 gap-4 text-center">
              <div class="space-y-1">
                <p class="text-2xl font-bold text-primary">{{ formatEth(selectedCampaign.total_funded) }}</p>
                <p class="text-xs text-muted-foreground uppercase tracking-wider">ETH Raised</p>
              </div>
              <div class="space-y-1">
                <p class="text-2xl font-bold text-foreground">{{ formatEth(selectedCampaign.funding_goal) }}</p>
                <p class="text-xs text-muted-foreground uppercase tracking-wider">ETH Goal</p>
              </div>
              <div class="space-y-1">
                <p class="text-2xl font-bold text-foreground">{{ selectedCampaign.backers?.length || 0 }}</p>
                <p class="text-xs text-muted-foreground uppercase tracking-wider">Backers</p>
              </div>
            </div>
          </div>

          <!-- Revenue Share -->
          <div class="bg-muted/50 rounded-lg p-6 space-y-4">
            <Label class="text-base font-semibold">Revenue Distribution</Label>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-4 bg-background rounded-lg border border-border">
                <p class="text-3xl font-bold text-primary mb-1">{{ selectedCampaign.creator_share / 100 }}%</p>
                <p class="text-xs text-muted-foreground uppercase tracking-wider">Creator Share</p>
              </div>
              <div class="text-center p-4 bg-background rounded-lg border border-border">
                <p class="text-3xl font-bold text-primary mb-1">{{ selectedCampaign.backers_share / 100 }}%</p>
                <p class="text-xs text-muted-foreground uppercase tracking-wider">Backers Share</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground text-center leading-relaxed">
              All revenue generated by this project will be automatically split and distributed according to these shares
            </p>
          </div>

          <!-- Revenue Stats (if funded) -->
          <div v-if="selectedCampaign.is_funded" class="bg-green-50 dark:bg-green-950/20 rounded-lg p-6 space-y-4 border border-green-200 dark:border-green-900">
            <div class="flex items-center gap-2">
              <TrendingUp class="w-5 h-5 text-green-600" />
              <Label class="text-base font-semibold text-green-900 dark:text-green-100">Revenue Generated</Label>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-2xl font-bold text-green-600">{{ formatEth(selectedCampaign.total_revenue) }} ETH</p>
                <p class="text-xs text-green-700 dark:text-green-300 uppercase tracking-wider">Total Revenue</p>
              </div>
              <div class="space-y-1">
                <p class="text-2xl font-bold text-green-600">{{ formatEth(selectedCampaign.total_distributed) }} ETH</p>
                <p class="text-xs text-green-700 dark:text-green-300 uppercase tracking-wider">Distributed</p>
              </div>
            </div>
          </div>

          <!-- Backers List -->
          <div v-if="selectedCampaign.backers && selectedCampaign.backers.length > 0" class="space-y-4">
            <Label class="text-base font-semibold">Backers ({{ selectedCampaign.backers.length }})</Label>
            <ScrollArea class="h-40 rounded-md border border-border">
              <div class="p-4 space-y-2">
                <div v-for="backer in selectedCampaign.backers" :key="backer.id"
                     class="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div class="flex items-center gap-3">
                    <Avatar class="w-8 h-8">
                      <AvatarFallback class="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xs">
                        {{ backer.user.email?.charAt(0).toUpperCase() }}
                      </AvatarFallback>
                    </Avatar>
                    <span class="text-sm font-semibold">{{ backer.user.email?.split('@')[0] }}</span>
                  </div>
                  <span class="text-sm font-bold text-primary">{{ formatEth(backer.amount) }} ETH</span>
                </div>
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <Button 
              as="a"
              :href="`https://sepolia.etherscan.io/tx/${selectedCampaign.transaction_hash}`"
              target="_blank"
              variant="outline"
              size="lg"
              class="flex-1 gap-2"
            >
              <ExternalLink class="w-4 h-4" />
              View on Etherscan
            </Button>
            <SignedIn>
              <Button 
                v-if="!selectedCampaign.is_funded && !isExpired(selectedCampaign.deadline)"
                @click="backCampaignFromModal"
                size="lg"
                class="flex-1 gap-2"
              >
                <DollarSign class="w-4 h-4" />
                Back This Campaign
              </Button>
            </SignedIn>
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
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Sparkles, Grid3x3, Plus, Eye, DollarSign, Target, 
  CheckCircle, XCircle, Clock, TrendingUp, ExternalLink 
} from 'lucide-vue-next'

const projectTypes = [
  { slug: 'album', name: 'Music Album', icon: '🎵' },
  { slug: 'film', name: 'Film/Video', icon: '🎬' },
  { slug: 'game', name: 'Game', icon: '🎮' },
  { slug: 'book', name: 'Book', icon: '📚' },
  { slug: 'art', name: 'Art Collection', icon: '🎨' },
  { slug: 'podcast', name: 'Podcast', icon: '🎙️' },
  { slug: 'software', name: 'Software', icon: '💻' },
  { slug: 'other', name: 'Other', icon: '✨' }
]

const campaigns = ref<any[]>([])
const loading = ref(true)
const selectedType = ref<string | null>(null)
const selectedCampaign = ref<any>(null)

const filteredCampaigns = computed(() => {
  if (!selectedType.value) return campaigns.value
  return campaigns.value.filter(c => c.project_type === selectedType.value)
})

const loadCampaigns = async () => {
  try {
    loading.value = true
    const data = await $fetch('/api/funding/campaigns')
    campaigns.value = data as any[]
  } catch (error) {
    console.error('Failed to load campaigns:', error)
  } finally {
    loading.value = false
  }
}

const viewCampaign = (campaign: any) => {
  selectedCampaign.value = campaign
}

const formatEth = (weiString: string) => {
  const eth = parseFloat(weiString) / 1e18
  return eth.toFixed(4)
}

const getProgress = (campaign: any) => {
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

const daysRemaining = (deadline: string) => {
  const now = new Date()
  const end = new Date(deadline)
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const backCampaign = async (campaign: any) => {
  const amount = prompt('Enter amount to back (in ETH):')
  if (!amount || parseFloat(amount) <= 0) return
  
  const privateKey = prompt('Enter your wallet private key:')
  if (!privateKey) return
  
  try {
    const result = await $fetch('/api/funding/back-campaign', {
      method: 'POST',
      body: {
        campaignId: campaign.id,
        amount,
        privateKey
      }
    })
    
    alert('Successfully backed the campaign! Transaction hash: ' + result.transactionHash)
    await loadCampaigns()
  } catch (error: any) {
    alert('Failed to back campaign: ' + error.message)
  }
}

const backCampaignFromModal = () => {
  if (selectedCampaign.value) {
    backCampaign(selectedCampaign.value)
  }
}

onMounted(() => {
  loadCampaigns()
})
</script>