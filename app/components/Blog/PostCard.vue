<script setup>
import { Clock } from 'lucide-vue-next'

defineProps({
  post: { type: Object, required: true }
})
</script>

<template>
  <NuxtLink :to="`/blog/${post.slug}`" class="glass-card rounded-3xl overflow-hidden hover-lift flex flex-col">
    <div class="h-40 relative bg-linear-to-br" :class="!post.coverImage && post.cover">
      <img v-if="post.coverImage" :src="post.coverImage" :alt="post.title" class="w-full h-full object-cover">
      <span v-if="post.categoryLabel" class="absolute top-4 right-4 px-3 py-1 rounded-full glass-strong text-xs font-medium">
        {{ post.categoryLabel }}
      </span>
    </div>
    <div class="p-6 flex flex-col flex-1">
      <h3 class="text-lg font-bold mb-2 leading-snug">{{ post.title }}</h3>
      <p class="text-gray-400 text-sm leading-relaxed mb-4 flex-1">{{ post.excerpt }}</p>
      <div class="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/10">
        <span>{{ post.author.name }}</span>
        <span class="flex items-center gap-1"><Clock class="w-3.5 h-3.5" /> {{ post.readTime }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
