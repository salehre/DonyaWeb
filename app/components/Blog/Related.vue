<script setup>
defineProps({
  posts: { type: Array, required: true }
})
</script>

<template>
  <section v-if="posts.length" class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
    <h2 class="text-2xl font-bold mb-8 text-center">مطالب <span class="gradient-text">مرتبط</span></h2>
    <div class="grid md:grid-cols-3 gap-6">
      <BlogPostCard
        v-for="p in posts"
        :key="p.slug"
        :post="p"
      />
    </div>
  </section>
</template>
