<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
</script>

<template>
  <Tabs default-value="products" class="w-full">
    <TabsList class="grid w-full grid-cols-2">
      <TabsTrigger value="products">
        Products
      </TabsTrigger>
      <TabsTrigger value="services">
        Services
      </TabsTrigger>
    </TabsList>
    <TabsContent value="products">
      <Products />
    </TabsContent>
    <TabsContent value="services">
      <Services />
    </TabsContent>
  </Tabs>
</template>