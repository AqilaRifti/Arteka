
<!-- components/ServiceCard.vue -->
<template>
  <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition cursor-pointer"
    @click="$emit('click')">
    <div class="flex items-start justify-between mb-4">
      <div class="text-3xl">{{ icon }}</div>
      <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
        {{ categoryName }}
      </span>
    </div>
    <h3 class="font-bold text-xl mb-2">{{ service.title }}</h3>
    <p class="text-gray-600 text-sm mb-4 line-clamp-3">{{ service.description }}</p>
    <div class="flex items-center justify-between">
      <div>
        <span class="text-blue-600 font-bold text-lg">{{ service.price }} ETH</span>
        <p class="text-gray-500 text-xs">Starting at</p>
      </div>
      <button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        View Details
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  service: any;
  icon: string;
  categoryName: string;
}>();

defineEmits(['click']);
</script>