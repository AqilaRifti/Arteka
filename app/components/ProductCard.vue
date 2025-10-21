<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
    @click="$emit('click')">
    <div class="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
      <img v-if="product.work?.ipfs_hash" 
        :src="`https://gateway.pinata.cloud/ipfs/${product.work.ipfs_hash}`"
        :alt="product.title"
        class="w-full h-full object-cover" />
      <span v-else class="text-4xl">🎨</span>
    </div>
    <div class="p-4">
      <h3 class="font-bold text-lg mb-2 truncate">{{ product.title }}</h3>
      <p class="text-gray-600 text-sm mb-3 line-clamp-2">{{ product.description }}</p>
      <div class="flex justify-between items-center">
        <span class="text-purple-600 font-bold">{{ product.price }} ETH</span>
        <button class="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition">
          View
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  product: any;
}>();

defineEmits(['click']);
</script>
