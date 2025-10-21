<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
const colorMode = useColorMode();

const isDarkMode = ref(colorMode.preference !== "dark");

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

</script>

<template>
  <header
    class="relative z-10 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="container flex h-14 max-w-screen-2xl items-center">
      <!-- Logo -->
      <div class="mr-6 hidden md:flex">
        <NuxtLink to="/" class="mr-4 flex items-center space-x-1">
          <img class="h-5 w-5" src="/logo.png" />
          <span class="hidden font-bold sm:inline-block">Arteka</span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <NavigationMenu class="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/marketplace"
                :class="navigationMenuTriggerStyle()"
              >
                Marketplace
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/digital-rights"
                :class="navigationMenuTriggerStyle()"
              >
                Digital Rights
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/funding"
                :class="navigationMenuTriggerStyle()"
              >
                Funding
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <!-- Mobile Logo -->
      <div
        class="flex flex-1 items-center justify-between space-x-2 md:justify-end"
      >
        <div class="w-full flex-1 md:w-auto md:flex-none">
          <NuxtLink to="/" class="flex items-center space-x-2 md:hidden">
            <img class="h-5 w-5" src="/logo.png" />
            <span class="font-bold">Arteka</span>
          </NuxtLink>
        </div>

        <!-- Right Side Actions -->
        <nav class="flex items-center space-x-2">
          <!-- Dark Mode Toggle -->
          <Button
            variant="ghost"
            size="sm"
            class="h-9 w-9 px-0"
            @click="toggleDarkMode"
          >
            <svg
              v-if="!isDarkMode"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
            <svg
              v-else
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span class="sr-only">Toggle theme</span>
          </Button>

          <!-- Auth Buttons -->

          <ClientOnly>
            <div class="hidden md:flex items-center space-x-2">
              <SignedOut>
                <SignInButton>
                  <Button size="sm" class="p-4 text-bold" variant="secondary">
                    Masuk
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button size="sm" class="p-4 text-bold mr-1" variant="outline"> Daftar </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <section class="flex items-center justify-center gap-2">
                  <NuxtLink to="/dashboard">
                    <Button variant="secondary">
                      Dashboard
                      <LucideCircleChevronRight class="ml-1" :size="15" />
                    </Button>
                  </NuxtLink>
                </section>
              </SignedIn>
            </div>
          </ClientOnly>
          <!-- Mobile Menu -->
          <Sheet>
            <SheetTrigger as-child>
              <Button
                variant="ghost"
                class="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span class="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" class="pr-0">
              <NuxtLink to="/" class="flex items-center space-x-2">
                <img class="h-5 w-5" src="/logo.png" />
                <span class="font-bold">Arteka</span>
              </NuxtLink>
              <div class="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                <div class="flex flex-col space-y-3">
                  <div class="flex flex-col space-y-3">
                    <NuxtLink
                      v-for="item in components"
                      :key="item.title"
                      :to="item.href"
                    >
                      <h4 class="font-medium">{{ item.title }}</h4>
                    </NuxtLink>
                    <NuxtLink to="/units/grammar">
                      <h4 class="font-medium">Grammar</h4>
                    </NuxtLink>
                  </div>

                  <ClientOnly>
                    <div class="hidden md:flex items-center space-x-2">
                      <SignedOut>
                        <SignInButton>
                          <Button
                            size="sm"
                            class="p-4 text-bold"
                            variant="secondary"
                          >
                            Masuk
                          </Button>
                        </SignInButton>
                        <SignUpButton>
                          <Button size="sm" class="p-4 text-bold mr-1">
                            Daftar
                          </Button>
                        </SignUpButton>
                      </SignedOut>
                      <SignedIn>
                        <section class="flex items-center justify-center gap-2">
                          <NuxtLink to="/dashboard">
                            <Button variant="secondary">
                              Dashboard
                              <LucideCircleChevronRight
                                class="ml-1"
                                :size="15"
                              />
                            </Button>
                          </NuxtLink>
                        </section>
                      </SignedIn>
                    </div>
                  </ClientOnly>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </div>
  </header>
</template>
