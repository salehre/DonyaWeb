<script setup>
import { Calendar, Clock, ArrowRight } from 'lucide-vue-next'

defineProps({
  post: { type: Object, required: true }
})
</script>

<template>
  <section class="relative pt-40 pb-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
    <NuxtLink to="/blog" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
      <ArrowRight class="w-4 h-4" />
      بازگشت به وبلاگ
    </NuxtLink>

    <span v-if="post.categoryLabel" class="inline-flex items-center gap-1 mb-4 px-4 py-1 rounded-full glass text-sm text-purple-300 border border-purple-500/30">
      {{ post.categoryLabel }}
    </span>

    <h1 class="text-3xl md:text-5xl font-bold mb-6 leading-tight">{{ post.title }}</h1>

    <div class="flex flex-wrap items-center gap-5 text-sm text-gray-400 mb-8">
      <div class="flex items-center gap-2">
        <div
          class="w-9 h-9 rounded-full bg-linear-to-br flex items-center justify-center text-xs font-bold text-white"
          :class="post.author.color"
        >
          {{ post.author.initials }}
        </div>
        <span>{{ post.author.name }}</span>
      </div>
      <span class="flex items-center gap-1"><Calendar class="w-4 h-4" /> {{ post.date }}</span>
      <span class="flex items-center gap-1"><Clock class="w-4 h-4" /> {{ post.readTime }} مطالعه</span>
    </div>

    <div class="h-56 md:h-72 rounded-3xl overflow-hidden bg-linear-to-br" :class="!post.coverImage && post.cover">
      <img v-if="post.coverImage" :src="post.coverImage" :alt="post.title" class="w-full h-full object-cover">
    </div>
  </section>
</template>
