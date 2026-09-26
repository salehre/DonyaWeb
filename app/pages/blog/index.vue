<script setup>
import { computed, ref, watch } from 'vue'

useHead({
  title: 'وبلاگ | دنیاوب'
})

const { fetchBlogList, extractCategories } = useBlogPosts()

const search = ref('')
const activeCategory = ref('all')
const currentPage = ref(1)

// اولین بارگذاری: صفحه‌ی ۱، بدون فیلتر دسته‌بندی (سمت سرور هم اجرا می‌شه)
const { data, pending, error, refresh } = await useAsyncData(
  'blog-list',
  () => fetchBlogList({ page: currentPage.value, category: activeCategory.value }),
  { default: () => ({ posts: [], total: 0 }) }
)

const posts = computed(() => data.value?.posts || [])
const totalCount = computed(() => data.value?.total || 0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / 12)))

// دسته‌بندی‌ها فقط از روی اولین نتیجه (فیلترنشده) ساخته می‌شه تا تب «همه» گم نشه
const categories = ref([{ value: 'all', label: 'همه مطالب' }])
watch(data, (val) => {
  if (categories.value.length === 1 && val?.posts?.length) {
    categories.value = extractCategories(val.posts)
  }
}, { immediate: true })

// مقاله‌ی ویژه فقط در حالت «همه» + صفحه‌ی اول + بدون جستجو نشون داده می‌شه
const showFeatured = computed(() => activeCategory.value === 'all' && currentPage.value === 1 && !search.value)
const featuredPost = computed(() => (showFeatured.value ? posts.value[0] : null))

// جستجو فقط روی همون مقاله‌های صفحه‌ی جاری اعمال می‌شه (API فعلاً پارامتر جستجو نداره)
const gridPosts = computed(() => {
  const base = showFeatured.value ? posts.value.slice(1) : posts.value
  if (!search.value.trim()) return base
  const q = search.value.trim()
  return base.filter((p) => p.title.includes(q) || p.excerpt.includes(q))
})

function selectCategory(value) {
  if (activeCategory.value === value) return
  activeCategory.value = value
  currentPage.value = 1
  refresh()
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  refresh()
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <!-- Hero + search -->
    <BlogHero v-model="search" />

    <!-- Category filter -->
    <BlogCategories :model-value="activeCategory" :categories="categories" @update:model-value="selectCategory" />

    <!-- لودینگ -->
    <section v-if="pending" class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
      <div class="grid md:grid-cols-3 gap-6">
        <div v-for="n in 6" :key="n" class="rounded-3xl border border-white/10 bg-white/5 h-64 animate-pulse" />
      </div>
    </section>

    <!-- خطا -->
    <div v-else-if="error" class="text-center text-gray-400 py-20">
      خطا در دریافت مقالات، لطفاً دوباره تلاش کنید.
    </div>

    <template v-else>
      <!-- Featured post -->
      <BlogFeaturedPost v-if="featuredPost" :post="featuredPost" />

      <!-- Post grid -->
      <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
        <div v-if="gridPosts.length" class="grid md:grid-cols-3 gap-6">
          <BlogPostCard
            v-for="post in gridPosts"
            :key="post.slug"
            :post="post"
          />
        </div>
        <div v-else class="text-center text-gray-400 py-16">
          مطلبی با این مشخصات پیدا نشد.
        </div>

        <!-- Pagination -->
        <div v-if="!search && totalPages > 1" class="flex items-center justify-center gap-2 pt-10">
          <button
            type="button"
            :disabled="currentPage === 1"
            class="w-9 h-9 grid place-items-center rounded-full glass border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            @click="goToPage(currentPage - 1)"
          >
            ‹
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            type="button"
            class="w-9 h-9 grid place-items-center rounded-full text-xs font-bold transition-colors"
            :class="p === currentPage
              ? 'bg-linear-to-r from-purple-600 to-blue-600'
              : 'glass border border-white/10 text-gray-300 hover:text-white'"
            @click="goToPage(p)"
          >
            {{ p }}
          </button>
          <button
            type="button"
            :disabled="currentPage === totalPages"
            class="w-9 h-9 grid place-items-center rounded-full glass border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            @click="goToPage(currentPage + 1)"
          >
            ›
          </button>
        </div>
      </section>
    </template>

    <!-- Newsletter -->
    <BlogNewsletter />
  </div>
</template>
