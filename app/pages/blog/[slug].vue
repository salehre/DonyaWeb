<script setup>
const route = useRoute()
const { fetchPostById, fetchRelatedPosts } = useBlogPosts()

// پارامتر مسیر همون id عددی مقاله‌ست (بلاگ API اسلاگ متنی جدا نداره)
const postId = route.params.slug

const { data: post, error } = await useAsyncData(`blog-post-${postId}`, () => fetchPostById(postId))

if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'مطلب مورد نظر پیدا نشد' })
}

const { data: relatedPosts } = await useAsyncData(
  `blog-related-${postId}`,
  () => fetchRelatedPosts(post.value.category, post.value.id),
  { default: () => [] }
)

useHead({
  title: `${post.value.title} | دنیاوب`,
  meta: [
    { name: 'description', content: post.value.excerpt }
  ]
})
</script>

<template>
  <div>
    <BlogPostHeader :post="post" />
    <BlogPostContent :html="post.descriptionHtml" />
    <BlogAuthor :author="post.author" />
    <BlogRelated :posts="relatedPosts" />
    <BlogNewsletter />
  </div>
</template>
