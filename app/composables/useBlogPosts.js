// وبلاگ از API واقعی پنل خونده می‌شه (blog/indexWithImages برای لیست/پیجینیشن،
// blog/show برای یک مقاله)؛ دقیقاً همون منطقی که توی صفحات نمونه‌ی «مجله» استفاده
// شده، فقط اینجا به‌جای useGarnetApiFetch مستقیم توی هر صفحه، توی یک composable
// جمع شده تا بین صفحه‌ی لیست، صفحه‌ی جزئیات و بخش وبلاگ صفحه‌ی اصلی مشترک باشه.

export const BLOG_PAGE_SIZE = 12

// چون کاور ثابت نداریم (ممکنه مقاله عکس نداشته باشه)، برای مقاله‌های بدون تصویر
// یکی از این گرادیان‌ها به‌صورت چرخشی (بر اساس id) به‌عنوان پس‌زمینه‌ی جایگزین انتخاب می‌شه
const FALLBACK_GRADIENTS = [
  'from-purple-600 via-pink-600 to-blue-600',
  'from-blue-600 via-purple-600 to-pink-600',
  'from-pink-600 via-blue-600 to-purple-600',
  'from-blue-600 via-pink-600 to-purple-600'
]

function fallbackGradient(id) {
  const n = Number(id) || 0
  return FALLBACK_GRADIENTS[n % FALLBACK_GRADIENTS.length]
}

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatBlogDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr.replace(' ', 'T')).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function estimateReadTime(html) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 120))} دقیقه`
}

// API فعلاً نویسنده‌ی جدا برای هر مقاله برنمی‌گردونه؛ مثل schema.org توی نمونه
// (author: Organization) همه‌ی مقالات به‌عنوان تیم دنیاوب نمایش داده می‌شن
const BLOG_AUTHOR = {
  name: 'تیم دنیاوب',
  role: 'تیم تولید محتوا',
  initials: 'د.و',
  color: 'from-purple-500 to-blue-600'
}

// خروجی blog/indexWithImages و blog/show رو به شکلی که کامپوننت‌های Blog/* انتظار دارن تبدیل می‌کنه
function normalizeBlog(raw) {
  if (!raw) return null
  const coverImage = raw.blog_images?.[0]?.file || null

  return {
    id: raw.id,
    slug: String(raw.id),
    title: raw.title_fa || '',
    excerpt: stripHtml(raw.summary_fa || raw.seo_description_fa || ''),
    category: raw.category ?? null,
    categoryLabel: raw.category_text_fa || '',
    date: formatBlogDate(raw.created_at),
    readTime: estimateReadTime(raw.description_fa),
    author: BLOG_AUTHOR,
    coverImage,
    cover: fallbackGradient(raw.id),
    images: raw.blog_images || [],
    descriptionHtml: raw.description_fa || '',
    allowComment: raw.allow_comment === 1,
    comments: raw.blog_comments || []
  }
}

export function useBlogPosts() {
  // لیست مقالات با پیجینیشن و فیلتر دسته‌بندی (دقیقاً پارامترهای blog/indexWithImages نمونه)
  async function fetchBlogList({ page = 1, category = null } = {}) {
    const params = {
      amount: String(BLOG_PAGE_SIZE),
      direction: 'desc',
      order: 'order',
      page
    }
    if (category && category !== 'all') params.category = String(category)

    try {
      const response = await useGarnetApiFetch('blog/indexWithImages', params)
      return {
        posts: (response.Blog || []).map(normalizeBlog),
        total: response.TotalCount ?? 0
      }
    } catch (error) {
      console.error('[Blog] خطا در دریافت لیست مقالات:', error)
      return { posts: [], total: 0 }
    }
  }

  // یک مقاله بر اساس id (پارامتر صفحه‌ی [slug] همون id عددی مقاله‌ست)
  async function fetchPostById(id) {
    try {
      const response = await useGarnetApiFetch('blog/show', { id })
      return normalizeBlog(response.Blog)
    } catch (error) {
      console.error('[Blog] خطا در دریافت مقاله:', error)
      return null
    }
  }

  // مقالات مرتبط: چند مقاله‌ی دیگه از همون دسته‌بندی، به‌جز خود مقاله
  async function fetchRelatedPosts(categoryId, currentId, limit = 3) {
    if (!categoryId) return []
    const { posts } = await fetchBlogList({ page: 1, category: categoryId })
    return posts.filter((p) => p.id !== currentId).slice(0, limit)
  }

  // دسته‌بندی‌های موجود از روی همون مقاله‌هایی که گرفته شدن استخراج می‌شه
  // (API endpoint جدایی برای لیست دسته‌بندی‌ها نداریم)
  function extractCategories(posts) {
    const seen = new Set()
    const categories = [{ value: 'all', label: 'همه مطالب' }]

    posts.forEach((p) => {
      if (p.category !== null && p.categoryLabel && !seen.has(p.category)) {
        seen.add(p.category)
        categories.push({ value: p.category, label: p.categoryLabel })
      }
    })

    return categories
  }

  return { fetchBlogList, fetchPostById, fetchRelatedPosts, extractCategories }
}
