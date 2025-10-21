<template>
  <div class="min-h-screen bg-background">
    <SignedIn>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Card class="overflow-hidden" style="height: calc(100vh - 120px)">
          <div class="grid grid-cols-1 md:grid-cols-12 h-full">
            <!-- Conversations List -->
            <div 
              :class="[
                'md:col-span-4 border-b md:border-b-0 md:border-r border-border flex flex-col',
                selectedConversation && 'hidden md:flex'
              ]"
            >
              <div class="p-4 border-b border-border">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-2xl font-bold text-foreground">Messages</h2>
                    <p class="text-sm text-muted-foreground">{{ conversations.length }} conversations</p>
                  </div>
                  <Badge v-if="unreadCount > 0" variant="destructive" class="h-6 min-w-6 flex items-center justify-center">
                    {{ unreadCount }}
                  </Badge>
                </div>
              </div>
              
              <ScrollArea class="flex-1">
                <div v-if="loadingConversations" class="p-4 text-center text-muted-foreground">
                  <Loader2 class="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p class="text-sm">Loading conversations...</p>
                </div>
                
                <div v-else-if="conversations.length === 0" class="p-8 text-center">
                  <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MessageCircle class="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p class="text-muted-foreground mb-4">No messages yet</p>
                  <NuxtLink to="/marketplace/services">
                    <Button variant="link" size="sm">Browse marketplace to start chatting</Button>
                  </NuxtLink>
                </div>
                
                <div v-else>
                  <button
                    v-for="conv in conversations"
                    :key="conv.id"
                    @click="selectConversation(conv)"
                    :class="[
                      'w-full p-4 text-left hover:bg-accent transition border-b border-border',
                      selectedConversation?.id === conv.id ? 'bg-accent' : ''
                    ]"
                  >
                    <div class="flex items-start gap-3">
                      <Avatar class="w-10 h-10 shrink-0">
                        <AvatarFallback class="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                          {{ getOtherParticipant(conv).email?.charAt(0).toUpperCase() }}
                        </AvatarFallback>
                      </Avatar>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                          <p class="font-semibold text-foreground truncate">
                            {{ getOtherParticipant(conv).email?.split('@')[0] }}
                          </p>
                          <p class="text-xs text-muted-foreground shrink-0 ml-2">
                            {{ formatTime(conv.last_message_at) }}
                          </p>
                        </div>
                        <p class="text-xs text-muted-foreground truncate mb-1">
                          {{ conv.listing?.title || 'General conversation' }}
                        </p>
                        <div class="flex items-center justify-between">
                          <p v-if="conv.last_message?.length > 0" 
                             class="text-sm text-muted-foreground truncate flex-1">
                            {{ conv.last_message[0].content || '📎 Attachment' }}
                          </p>
                          <Badge v-if="conv.unread_count > 0" 
                                 variant="default" 
                                 class="ml-2 shrink-0 h-5 min-w-5 flex items-center justify-center text-xs">
                            {{ conv.unread_count }}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </ScrollArea>
            </div>

            <!-- Chat Area -->
            <div 
              :class="[
                'md:col-span-8 flex flex-col',
                !selectedConversation && 'hidden md:flex'
              ]"
            >
              <div v-if="!selectedConversation" class="flex-1 flex items-center justify-center p-8">
                <div class="text-center">
                  <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <MessageCircle class="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 class="text-xl font-semibold text-foreground mb-2">No conversation selected</h3>
                  <p class="text-muted-foreground">Choose a conversation to start messaging</p>
                </div>
              </div>

              <div v-else class="flex-1 flex flex-col min-h-0">
                <!-- Chat Header -->
                <div class="p-4 border-b border-border flex items-center justify-between shrink-0">
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      class="md:hidden shrink-0"
                      @click="selectedConversation = null"
                    >
                      <ArrowLeft class="w-5 h-5" />
                    </Button>
                    <Avatar class="w-10 h-10 shrink-0">
                      <AvatarFallback class="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                        {{ getOtherParticipant(selectedConversation).email?.charAt(0).toUpperCase() }}
                      </AvatarFallback>
                    </Avatar>
                    <div class="min-w-0 flex-1">
                      <h3 class="font-bold text-foreground truncate">
                        {{ getOtherParticipant(selectedConversation).email?.split('@')[0] }}
                      </h3>
                      <p class="text-sm text-muted-foreground truncate">
                        {{ selectedConversation.listing?.title || 'General conversation' }}
                      </p>
                    </div>
                  </div>
                  <code class="hidden sm:block text-xs text-muted-foreground font-mono shrink-0 ml-2">
                    {{ getOtherParticipant(selectedConversation).wallet_address?.slice(0, 6) }}...{{ getOtherParticipant(selectedConversation).wallet_address?.slice(-4) }}
                  </code>
                </div>

                <!-- Messages -->
                <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4">
                  <div v-if="loadingMessages" class="text-center py-8">
                    <Loader2 class="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p class="text-sm text-muted-foreground">Loading messages...</p>
                  </div>
                  
                  <div v-else-if="messages.length === 0" class="text-center py-8">
                    <p class="text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                  
                  <div v-else class="space-y-4">
                    <div v-for="msg in messages" :key="msg.id"
                         :class="[
                           'flex',
                           msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                         ]">
                      <div :class="[
                        'max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2',
                        msg.sender_id === user?.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-foreground'
                      ]">
                        <div v-if="msg.message_type === 'text'">
                          <p class="whitespace-pre-wrap break-words text-sm">{{ msg.content }}</p>
                        </div>
                        
                        <div v-else-if="msg.message_type === 'image'">
                          <a :href="msg.file_url" target="_blank" rel="noopener noreferrer">
                            <img :src="msg.file_url" 
                                 :alt="msg.file_name"
                                 class="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90" />
                          </a>
                          <p v-if="msg.content" class="text-sm mt-2">{{ msg.content }}</p>
                        </div>
                        
                        <div v-else-if="msg.message_type === 'file'">
                          <a :href="msg.file_url" 
                             target="_blank"
                             download
                             :class="[
                               'flex items-center gap-2 p-3 rounded-lg hover:opacity-90 transition',
                               msg.sender_id === user?.id ? 'bg-primary/80' : 'bg-accent'
                             ]">
                            <Paperclip class="w-5 h-5 shrink-0" />
                            <div class="flex-1 min-w-0">
                              <p class="font-semibold text-sm truncate">{{ msg.file_name }}</p>
                              <p class="text-xs opacity-75">{{ formatFileSize(msg.file_size) }}</p>
                            </div>
                            <Download class="w-4 h-4 shrink-0" />
                          </a>
                          <p v-if="msg.content" class="text-sm mt-2">{{ msg.content }}</p>
                        </div>
                        
                        <p class="text-xs opacity-75 mt-1">
                          {{ formatTime(msg.created_at) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Message Input -->
                <div class="p-3 sm:p-4 border-t border-border">
                  <div class="flex gap-2">
                    <input
                      type="file"
                      ref="fileInput"
                      @change="handleFileSelect"
                      class="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                    />
                    
                    <Button
                      type="button"
                      @click="$refs.fileInput?.click()"
                      :disabled="uploading"
                      variant="outline"
                      size="icon"
                      class="shrink-0"
                    >
                      <Loader2 v-if="uploading" class="w-4 h-4 animate-spin" />
                      <Paperclip v-else class="w-4 h-4" />
                    </Button>
                    
                    <Input
                      v-model="newMessage"
                      placeholder="Type a message..."
                      :disabled="sending"
                      @keydown.enter.prevent="sendTextMessage"
                      class="flex-1"
                    />
                    
                    <Button
                      @click="sendTextMessage"
                      :disabled="!newMessage.trim() || sending"
                      size="icon"
                      class="shrink-0"
                    >
                      <Loader2 v-if="sending" class="w-4 h-4 animate-spin" />
                      <Send v-else class="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </SignedIn>

    <!-- Signed Out State -->
    <SignedOut>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Lock class="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 class="text-3xl font-bold text-foreground mb-4">Sign In Required</h2>
        <p class="text-muted-foreground mb-8 max-w-md mx-auto">
          Please sign in to access your messages and conversations
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
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nuxt/components'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  MessageCircle, Lock, LogIn, ArrowLeft, Paperclip, 
  Send, Download, Loader2 
} from 'lucide-vue-next'

const user = ref<any>(null)
const conversations = ref<any[]>([])
const selectedConversation = ref<any>(null)
const messages = ref<any[]>([])
const newMessage = ref('')
const loadingConversations = ref(true)
const loadingMessages = ref(false)
const sending = ref(false)
const uploading = ref(false)
const unreadCount = ref(0)
const messagesContainer = ref<any>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Load user
const loadUser = async () => {
  try {
    const data = await $fetch('/api/auth/user')
    user.value = data
  } catch (error) {
    console.error('Failed to load user:', error)
  }
}

// Load conversations
const loadConversations = async () => {
  try {
    loadingConversations.value = true
    const data = await $fetch('/api/messaging/conversations/list')
    conversations.value = data as any[]
  } catch (error) {
    console.error('Failed to load conversations:', error)
  } finally {
    loadingConversations.value = false
  }
}

// Load unread count
const loadUnreadCount = async () => {
  try {
    const data = await $fetch('/api/messaging/unread-count')
    unreadCount.value = (data as any).count
  } catch (error) {
    console.error('Failed to load unread count:', error)
  }
}

// Select conversation and load messages
const selectConversation = async (conv: any) => {
  selectedConversation.value = conv
  await loadMessages(conv.id)
}

// Load messages for selected conversation
const loadMessages = async (conversationId: string) => {
  try {
    loadingMessages.value = true
    const data = await $fetch(`/api/messaging/conversations/${conversationId}`)
    messages.value = (data as any).messages
    await nextTick()
    scrollToBottom()
    
    // Reload conversations to update unread counts
    await loadConversations()
    await loadUnreadCount()
  } catch (error) {
    console.error('Failed to load messages:', error)
  } finally {
    loadingMessages.value = false
  }
}

// Send text message
const sendTextMessage = async () => {
  if (!newMessage.value.trim() || !selectedConversation.value) return
  
  try {
    sending.value = true
    
    await $fetch('/api/messaging/messages/send', {
      method: 'POST',
      body: {
        conversationId: selectedConversation.value.id,
        messageType: 'text',
        content: newMessage.value
      }
    })
    
    newMessage.value = ''
    await loadMessages(selectedConversation.value.id)
  } catch (error: any) {
    alert('Failed to send message: ' + error.message)
  } finally {
    sending.value = false
  }
}

// Handle file selection
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file || !selectedConversation.value) return
  
  try {
    uploading.value = true
    
    // Create FormData
    const formData = new FormData()
    formData.append('file', file)
    
    // Upload file
    const uploadResult = await $fetch('/api/messaging/upload', {
      method: 'POST',
      body: formData
    })
    
    const { fileData } = uploadResult as any
    
    // Determine message type
    const messageType = file.type.startsWith('image/') ? 'image' : 'file'
    
    // Send message with file
    await $fetch('/api/messaging/messages/send', {
      method: 'POST',
      body: {
        conversationId: selectedConversation.value.id,
        messageType,
        fileData
      }
    })
    
    // Clear file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    
    await loadMessages(selectedConversation.value.id)
  } catch (error: any) {
    alert('Failed to upload file: ' + error.message)
  } finally {
    uploading.value = false
  }
}

// Get other participant
const getOtherParticipant = (conv: any) => {
  if (!user.value) return {}
  return conv.participant1_id === user.value.id 
    ? conv.participant2 
    : conv.participant1
}

// Format time
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else if (diffInHours < 168) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    })
  }
}

// Format file size
const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Scroll to bottom
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Watch messages and scroll to bottom
watch(() => messages.value.length, () => {
  nextTick(() => scrollToBottom())
})

// Load data on mount
onMounted(async () => {
  await loadUser()
  await loadConversations()
  await loadUnreadCount()
  
  // Poll for new messages every 5 seconds
  setInterval(() => {
    if (selectedConversation.value) {
      loadMessages(selectedConversation.value.id)
    }
    loadUnreadCount()
  }, 5000)
})
</script>