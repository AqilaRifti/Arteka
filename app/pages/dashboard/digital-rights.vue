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
          Explore Digital<br />Works
        </h2>
        <p class="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Discover blockchain-protected creative works from talented Indonesian artists and creators.
        </p>
      </div>

      <!-- Search and Filters -->
      <Card class="mb-8">
        <CardContent class="p-6 space-y-4">
          <div class="grid md:grid-cols-3 gap-4">
            <!-- Search -->
            <div class="md:col-span-2 relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                v-model="searchQuery"
                placeholder="Search by title, description, or creator..."
                class="pl-10"
              />
            </div>
            
            <!-- Work Type Filter -->
            <Select v-model="selectedType">
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">🖼️ Images</SelectItem>
                <SelectItem value="video">🎬 Videos</SelectItem>
                <SelectItem value="audio">🎵 Audio</SelectItem>
                <SelectItem value="text">📝 Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <!-- Language Filter -->
          <div class="flex flex-wrap gap-2">
            <Button
              @click="selectedLanguage = ''"
              :variant="selectedLanguage === '' ? 'default' : 'outline'"
              size="sm"
            >
              All Languages
            </Button>
            <Button
              v-for="lang in languages"
              :key="lang.code"
              @click="selectedLanguage = lang.code"
              :variant="selectedLanguage === lang.code ? 'default' : 'outline'"
              size="sm"
              class="gap-2"
            >
              <span>{{ lang.flag }}</span>
              <span>{{ lang.name }}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card v-for="i in 6" :key="i" class="overflow-hidden">
          <div class="aspect-video bg-muted animate-pulse" />
          <CardHeader>
            <div class="h-5 bg-muted rounded animate-pulse mb-2" />
            <div class="h-4 bg-muted rounded w-3/4 animate-pulse" />
          </CardHeader>
          <CardFooter>
            <div class="h-4 bg-muted rounded w-full animate-pulse" />
          </CardFooter>
        </Card>
      </div>

      <!-- Works Grid -->
      <div v-else-if="filteredWorks.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card 
          v-for="work in filteredWorks" 
          :key="work.id"
          class="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
          @click="viewWork(work)"
        >
          <!-- Preview -->
          <div class="aspect-video bg-gradient-to-br from-muted to-accent relative overflow-hidden">
            <img v-if="work.work_type === 'image'" 
                 :src="`https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${work.ipfs_hash}`"
                 :alt="work.title"
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                 loading="lazy" />
            <video v-else-if="work.work_type === 'video'"
                   class="w-full h-full object-cover"
                   preload="metadata">
              <source :src="`https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${work.ipfs_hash}`" />
            </video>
            <div v-else class="absolute inset-0 flex items-center justify-center">
              <span class="text-7xl opacity-40">{{ getWorkIcon(work.work_type) }}</span>
            </div>
            
            <!-- Type Badge -->
            <div class="absolute top-3 right-3">
              <Badge variant="secondary" class="backdrop-blur-sm bg-background/80">
                {{ getWorkTypeLabel(work.work_type) }}
              </Badge>
            </div>
          </div>
          
          <!-- Info -->
          <CardHeader class="space-y-3">
            <CardTitle class="text-lg leading-tight line-clamp-1">
              {{ work.title }}
            </CardTitle>
            <CardDescription class="line-clamp-2 text-sm leading-relaxed">
              {{ work.description }}
            </CardDescription>
          </CardHeader>

          <CardContent class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Avatar class="w-8 h-8">
                  <AvatarFallback class="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xs">
                    {{ work.creator?.email?.charAt(0).toUpperCase() }}
                  </AvatarFallback>
                </Avatar>
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">Creator</p>
                  <p class="text-sm font-semibold truncate">{{ work.creator?.email?.split('@')[0] }}</p>
                </div>
              </div>
              
              <div class="text-right">
                <p class="text-xs text-muted-foreground">Size</p>
                <p class="text-sm font-semibold">{{ formatFileSize(work.file_size) }}</p>
              </div>
            </div>

            <Separator />
            
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <Link2 class="w-3.5 h-3.5" />
              <span>Blockchain</span>
              <span>•</span>
              <span>{{ getLanguageFlag(work.original_language) }} {{ getLanguageName(work.original_language) }}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Empty State -->
      <Card v-else class="border-dashed">
        <CardContent class="flex flex-col items-center justify-center py-16 sm:py-24">
          <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <SearchX class="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle class="text-2xl mb-3">No Works Found</CardTitle>
          <CardDescription class="text-center mb-8 max-w-md">
            Try adjusting your filters or search query to discover more works
          </CardDescription>
          <SignedIn>
            <NuxtLink to="/dashboard/register-work">
              <Button size="lg" class="gap-2">
                <Plus class="w-4 h-4" />
                Register Your Work
              </Button>
            </NuxtLink>
          </SignedIn>
        </CardContent>
      </Card>
    </main>

    <!-- Work Detail Dialog -->
    <Dialog :open="!!selectedWork" @update:open="val => !val && (selectedWork = null)">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div v-if="selectedWork" class="space-y-6">
          <!-- Header -->
          <div class="p-6 pb-0">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div class="flex-1 min-w-0">
                <DialogTitle class="text-3xl font-bold tracking-tight mb-3">
                  {{ selectedWork.title }}
                </DialogTitle>
                <div class="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {{ getWorkTypeLabel(selectedWork.work_type) }}
                  </Badge>
                  <Badge variant="outline" class="gap-1">
                    <span>{{ getLanguageFlag(selectedWork.original_language) }}</span>
                    <span>{{ getLanguageName(selectedWork.original_language) }}</span>
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <!-- Media Preview -->
          <div class="bg-muted">
            <img v-if="selectedWork.work_type === 'image'" 
                 :src="`https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${selectedWork.ipfs_hash}`"
                 :alt="selectedWork.title"
                 class="w-full" />
            <video v-else-if="selectedWork.work_type === 'video'"
                   controls
                   class="w-full">
              <source :src="`https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${selectedWork.ipfs_hash}`" />
            </video>
            <audio v-else-if="selectedWork.work_type === 'audio'"
                   controls
                   class="w-full p-6">
              <source :src="`https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${selectedWork.ipfs_hash}`" />
            </audio>
            <div v-else class="aspect-video flex items-center justify-center">
              <span class="text-9xl opacity-40">{{ getWorkIcon(selectedWork.work_type) }}</span>
            </div>
          </div>

          <div class="px-6 space-y-6">
            <!-- Description -->
            <div class="space-y-2">
              <Label class="text-base font-semibold">Description</Label>
              <p class="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {{ selectedWork.description }}
              </p>
            </div>

            <Separator />

            <!-- Creator Info -->
            <div class="bg-muted/50 rounded-lg p-4">
              <Label class="text-base font-semibold mb-3 block">Creator Information</Label>
              <div class="flex items-center gap-3">
                <Avatar class="w-12 h-12">
                  <AvatarFallback class="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-lg">
                    {{ selectedWork.creator?.email?.charAt(0).toUpperCase() }}
                  </AvatarFallback>
                </Avatar>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold">{{ selectedWork.creator?.email?.split('@')[0] }}</p>
                  <code class="text-xs text-muted-foreground font-mono">
                    {{ selectedWork.creator_wallet.slice(0, 6) }}...{{ selectedWork.creator_wallet.slice(-4) }}
                  </code>
                </div>
              </div>
            </div>

            <Separator />

            <!-- Blockchain Verification -->
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <Shield class="w-5 h-5" />
                <Label class="text-base font-semibold">Blockchain Verification</Label>
              </div>

              <div class="space-y-3">
                <div class="space-y-1.5">
                  <Label class="text-sm text-muted-foreground">Work ID</Label>
                  <div class="bg-muted rounded-md px-3 py-2 border border-border">
                    <code class="font-mono text-sm font-semibold text-primary">
                      #{{ selectedWork.work_id }}
                    </code>
                  </div>
                </div>

                <div class="space-y-1.5">
                  <Label class="text-sm text-muted-foreground">Transaction Hash</Label>
                  <a 
                    :href="`https://sepolia.etherscan.io/tx/${selectedWork.transaction_hash}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center gap-2 bg-muted hover:bg-accent rounded-md px-3 py-2 border border-border transition-colors"
                  >
                    <code class="font-mono text-xs text-foreground break-all flex-1">
                      {{ selectedWork.transaction_hash }}
                    </code>
                    <ExternalLink class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </a>
                </div>

                <div class="space-y-1.5">
                  <Label class="text-sm text-muted-foreground">IPFS Hash (Content)</Label>
                  <a 
                    :href="`https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${selectedWork.ipfs_hash}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center gap-2 bg-muted hover:bg-accent rounded-md px-3 py-2 border border-border transition-colors"
                  >
                    <code class="font-mono text-xs text-foreground break-all flex-1">
                      {{ selectedWork.ipfs_hash }}
                    </code>
                    <ExternalLink class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </a>
                </div>

                <div class="space-y-1.5">
                  <Label class="text-sm text-muted-foreground">IPFS Hash (Metadata)</Label>
                  <a 
                    :href="`https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${selectedWork.metadata_hash}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center gap-2 bg-muted hover:bg-accent rounded-md px-3 py-2 border border-border transition-colors"
                  >
                    <code class="font-mono text-xs text-foreground break-all flex-1">
                      {{ selectedWork.metadata_hash }}
                    </code>
                    <ExternalLink class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </a>
                </div>

                <div class="space-y-1.5">
                  <Label class="text-sm text-muted-foreground">Registration Time</Label>
                  <div class="bg-muted rounded-md px-3 py-2 border border-border">
                    <p class="text-sm font-medium flex items-center gap-2">
                      <Clock class="w-4 h-4" />
                      {{ formatDateTime(selectedWork.created_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <!-- File Details -->
            <div class="space-y-4">
              <Label class="text-base font-semibold">File Details</Label>
              <div class="grid sm:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">File Name</Label>
                  <p class="text-sm font-medium truncate">{{ selectedWork.file_name }}</p>
                </div>
                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">File Size</Label>
                  <p class="text-sm font-medium">{{ formatFileSize(selectedWork.file_size) }}</p>
                </div>
                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">MIME Type</Label>
                  <code class="text-xs font-mono">{{ selectedWork.mime_type }}</code>
                </div>
                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">Language</Label>
                  <p class="text-sm font-medium">
                    {{ getLanguageFlag(selectedWork.original_language) }} {{ getLanguageName(selectedWork.original_language) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="p-6 pt-0 flex gap-3">
            <Button 
              as="a"
              :href="`https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${selectedWork.ipfs_hash}`"
              target="_blank"
              download
              size="lg"
              class="flex-1 gap-2"
            >
              <Download class="w-4 h-4" />
              Download Work
            </Button>
            <Button 
              as="a"
              :href="`https://sepolia.etherscan.io/tx/${selectedWork.transaction_hash}`"
              target="_blank"
              variant="outline"
              size="lg"
              class="gap-2"
            >
              <ExternalLink class="w-4 h-4" />
              Etherscan
            </Button>
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Shield, Search, SearchX, Plus, ExternalLink, Download, 
  Clock, Link2 
} from 'lucide-vue-next'

const works = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedType = ref('')
const selectedLanguage = ref('')
const selectedWork = ref<any>(null)

const languages = [
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'jv', name: 'Javanese', flag: '☕' }
]

const filteredWorks = computed(() => {
  let filtered = works.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(w => 
      w.title.toLowerCase().includes(query) ||
      w.description?.toLowerCase().includes(query)
    )
  }

  if (selectedType.value && selectedType.value !== 'all') {
    filtered = filtered.filter(w => w.work_type === selectedType.value)
  }

  if (selectedLanguage.value) {
    filtered = filtered.filter(w => w.original_language === selectedLanguage.value)
  }

  return filtered
})

const loadWorks = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/digital-rights/list')
    works.value = response.works
  } catch (error) {
    console.error('Failed to load works:', error)
  } finally {
    loading.value = false
  }
}

const viewWork = (work: any) => {
  selectedWork.value = work
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

const getWorkTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    text: 'Text'
  }
  return labels[type] || type
}

const getLanguageName = (code: string) => {
  const lang = languages.find(l => l.code === code)
  return lang?.name || code
}

const getLanguageFlag = (code: string) => {
  const lang = languages.find(l => l.code === code)
  return lang?.flag || '🌐'
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
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

onMounted(() => {
  loadWorks()
})
</script>