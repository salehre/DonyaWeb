<script setup>
import { Clock, Calendar, ArrowLeft } from 'lucide-vue-next'

defineProps({
  post: { type: Object, required: true }
})
</script>

<template>
  <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
    <NuxtLink :to="`/blog/${post.slug}`" class="glass-card rounded-3xl overflow-hidden grid md:grid-cols-2 hover-lift">
      <div class="h-56 md:h-full relative bg-linear-to-br" :class="!post.coverImage && post.cover">
        <img v-if="post.coverImage" :src="post.coverImage" :alt="post.title" class="w-full h-full object-cover">
        <span class="absolute top-5 right-5 px-3 py-1 rounded-full glass-strong text-xs font-medium">
          مطلب ویژه
        </span>
      </div>
      <div class="p-8 flex flex-col justify-center">
        <span v-if="post.categoryLabel" class="text-purple-300 text-sm font-medium mb-3">{{ post.categoryLabel }}</span>
        <h2 class="text-2xl md:text-3xl font-bold mb-4 leading-snug">{{ post.title }}</h2>
        <p class="text-gray-400 leading-relaxed mb-6">{{ post.excerpt }}</p>
        <div class="flex items-center gap-4 text-sm text-gray-500 mb-6">
          <span class="flex items-center gap-1"><Calendar class="w-4 h-4" /> {{ post.date }}</span>
          <span class="flex items-center gap-1"><Clock class="w-4 h-4" /> {{ post.readTime }}</span>
        </div>
        <span class="inline-flex items-center gap-2 text-purple-300 font-medium">
          ادامه مطلب
          <ArrowLeft class="w-4 h-4" />
        </span>
      </div>
    </NuxtLink>
  </section>
</template>
