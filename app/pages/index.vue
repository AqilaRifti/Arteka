<template>
  <div class="flex justify-center items-center">
    <main
      class="border-gray-900 max-w-5xl"
      style="padding-left: 1rem !important; padding-right: 1rem !important"
    >
      <HomepageNavbar />
      <main class="py-12">
        <div
          class="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden"
        >
          <HomepageGlobe class="absolute" />

          <span
            class="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-8xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10 z-10"
          >
            Start, Secure, Sell
            <br />
            <Button variant="outline" class="text-black dark:text-white"
              >Access Global Market 🚀</Button
            >
          </span>
          <ParticlesBg
            class="absolute inset-0"
            :quantity="100"
            :ease="100"
            :color="isDark ? '#FFF' : '#000'"
            :staticity="10"
            refresh
          />
        </div>
      </main>
      <ImageTrailSection />
      <div class="flex flex-col">
        <DigitalRightsSection />
        <ServicesCalendar />
        <FundingSection />
        <AISection />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useColorMode } from "@vueuse/core";

const isDark = computed(() => useColorMode().value == "dark");
</script>
