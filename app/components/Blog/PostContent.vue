<script setup>
defineProps({
  html: { type: String, required: true }
})
</script>

<template>
  <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
    <div class="glass-card rounded-3xl p-8 md:p-10">
      <div class="prose-blog text-gray-300 leading-8" v-html="html" />
    </div>
  </section>
</template>

<style scoped>
/* محتوای description_fa از ویرایشگر پنل میاد و معمولاً رنگ/بک‌گراند رو به‌صورت
   inline (برای پس‌زمینه‌ی روشن) ست می‌کنه؛ چون inline از کلاس قوی‌تره، با
   !important همه‌چی رو مجبور می‌کنیم از پالت تیره‌ی سایت پیروی کنه */
.prose-blog :deep(*) {
  color: #d1d5db !important;
  background-color: transparent !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}
.prose-blog :deep(h1),
.prose-blog :deep(h2),
.prose-blog :deep(h3),
.prose-blog :deep(h4) {
  font-weight: 700;
  line-height: 1.4;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #fff !important;
}
.prose-blog :deep(h2) { font-size: 1.5rem; }
.prose-blog :deep(h3) { font-size: 1.25rem; }
.prose-blog :deep(p) { margin-bottom: 1.25rem; line-height: 2; }
.prose-blog :deep(ul),
.prose-blog :deep(ol) { padding-right: 1.5rem; margin-bottom: 1.25rem; }
.prose-blog :deep(li) { margin-bottom: 0.5rem; line-height: 1.8; }
.prose-blog :deep(a) { color: #c084fc !important; text-decoration: underline; text-underline-offset: 3px; }
.prose-blog :deep(img) { border-radius: 16px; max-width: 100%; margin: 1.5rem auto; display: block; }
.prose-blog :deep(blockquote) {
  border-right: 3px solid rgba(192, 132, 252, 0.5) !important;
  padding-right: 1rem;
  margin: 1.5rem 0;
  color: rgba(209, 213, 219, 0.85) !important;
  font-style: italic;
}
.prose-blog :deep(strong),
.prose-blog :deep(b) { color: #fff !important; font-weight: 700; }
</style>