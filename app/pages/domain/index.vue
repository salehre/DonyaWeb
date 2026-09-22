<script setup>
import { ref } from 'vue'
import {
  Search, Check, Globe, ShieldCheck, Lock, RotateCcw, Loader2,
  ArrowLeftRight, Settings2, Network, FolderKey, ChevronDown
} from 'lucide-vue-next'

useHead({
  title: 'ثبت دامنه | دنیاوب'
})

// --- TLD products and prices (از API) ---
const config = useRuntimeConfig()
const apiHeaders = useApiHeaders()
const DOMAIN_CATEGORY_ID = '1' // دسته‌ی "پسوند دامنه" در پنل دنیاوب
const tlds = ref([])
const isLoadingPrices = ref(true)

function displayPrice(tld) {
  if (!tld || tld.price === null || tld.price === undefined) {
    return isLoadingPrices.value ? 'در حال دریافت...' : 'قیمت ناموجود'
  }
  const amount = Number(tld.price).toLocaleString('fa-IR')
  return tld.currencyName ? `${amount} ${tld.currencyName}` : amount
}

async function fetchTldPrices() {
  try {
    const response = await $fetch(`${config.public.apiBase}/products/indexLite`, {
      method: 'POST',
      headers: apiHeaders.value,
      body: {
        allowSale: 0,
        amount: 100,
        direction: 'desc',
        filters: [],
        order: 'order',
        page: 1,
        category: DOMAIN_CATEGORY_ID,
        typeCode: 0,
        withAttrib: false
      }
    })

    if (Number(response?.code) !== 2000) {
      console.error('[Domain] پاسخ نامعتبر از products/indexLite:', response)
      return
    }

    const seenIds = new Set()
    tlds.value = (response.Products || [])
      .filter((product) => {
        if (!product.title_fa || seenIds.has(product.id)) return false
        seenIds.add(product.id)
        return true
      })
      .map((product) => {
        const lastPrice = product.product_last_prices
        const rawPrice = product.active_price ?? lastPrice?.price ?? product.final_price ?? product.price ?? null
        return {
          id: product.id,
          ext: product.title_fa, // مثل ".com" — همون‌طور که تو پنل ثبت شده
          slug: product.slug_fa,
          price: rawPrice !== null ? Number(rawPrice) : null,
          currencyName: lastPrice?.currency_name || null,
          currencySymbol: lastPrice?.currency_symbol || null,
          sellable: Boolean(product.allow_sale) && product.status === 1
        }
      })
  } catch (error) {
    console.error('[Domain] خطا در دریافت قیمت دامنه‌ها:', error)
  } finally {
    isLoadingPrices.value = false
  }
}

await fetchTldPrices()

// --- Domain search ---
// نکته: این جستجو فقط قیمت/فعال‌بودن پسوند رو از محصولات همین دسته نشون می‌ده.
// چک واقعی «آیا دقیقاً همین نام دامنه قبلاً ثبت شده یا نه» به یک endpoint جدا (مثل WHOIS/Check) نیاز داره
// که در نمونه‌کد فعلی وجود نداشت — اگه آدرسش رو داری بگو تا اینجا هم وصلش کنم.
const route = useRoute()
const query = ref(typeof route.query.domain === 'string' ? route.query.domain : '')
const isSearching = ref(false)
const results = ref(null)

function searchDomain() {
  const name = query.value.trim().replace(/\s+/g, '-')
  if (!name) return

  isSearching.value = true
  results.value = null

  setTimeout(() => {
    results.value = tlds.value.map((t) => ({
      domain: `${name}${t.ext}`,
      available: t.sellable,
      price: displayPrice(t)
    }))
    isSearching.value = false
  }, 700)
}

onMounted(() => {
  if (query.value) searchDomain()
})

// --- Why register with us ---
const features = [
  { icon: ShieldCheck, title: 'حریم خصوصی رایگان', desc: 'با ثبت WHOIS Privacy، اطلاعات هویتی شما از دید عموم پنهان می‌ماند' },
  { icon: Lock, title: 'قفل امنیتی دامنه', desc: 'جلوگیری از انتقال یا تغییرات غیرمجاز روی دامنه با یک کلیک' },
  { icon: RotateCcw, title: 'تمدید خودکار', desc: 'هیچ‌وقت دامنه‌تان را از دست نمی‌دهید؛ تمدید خودکار پیش از انقضا' }
]

// --- Domain management features ---
const managementFeatures = [
  { icon: Settings2, title: 'مدیریت DNS پیشرفته', desc: 'افزودن و ویرایش رکوردهای A، CNAME، MX و TXT از پنل کاربری' },
  { icon: Network, title: 'فوروارد و ساب‌دامنه', desc: 'ساخت نامحدود ساب‌دامنه و هدایت آدرس‌ها به هر مقصدی' },
  { icon: FolderKey, title: 'قفل و انتقال آسان', desc: 'دریافت کد Auth و انتقال دامنه بین ثبت‌کننده‌ها با چند کلیک' }
]

// --- Transfer form ---
const transferDomain = ref('')
const transferCode = ref('')

// --- FAQ ---
const faqs = ref([
  {
    q: 'چقدر طول می‌کشد تا دامنه‌ام فعال شود؟',
    a: 'اکثر پسوندها بلافاصله پس از پرداخت فعال می‌شوند. برخی پسوندهای خاص مثل .ir ممکن است تا چند ساعت زمان ببرند.',
    open: false
  },
  {
    q: 'آیا می‌توانم دامنه‌ام را از ثبت‌کننده دیگری منتقل کنم؟',
    a: 'بله، کافی است دامنه را قفل‌گشایی کرده و کد Auth را از پنل ثبت‌کننده فعلی دریافت کنید، سپس در فرم انتقال دنیاوب وارد کنید.',
    open: false
  },
  {
    q: 'تمدید خودکار دامنه چگونه کار می‌کند؟',
    a: 'در صورت فعال بودن تمدید خودکار، چند روز پیش از انقضا از روش پرداخت پیش‌فرض شما مبلغ تمدید کسر و دامنه تمدید می‌شود.',
    open: false
  },
  {
    q: 'آیا حریم خصوصی WHOIS شامل همه پسوندها می‌شود؟',
    a: 'برای بیشتر پسوندهای بین‌المللی مثل .com و .net رایگان است. برخی پسوندهای کشوری مانند .ir به دلیل قوانین محلی از این قابلیت پشتیبانی نمی‌کنند.',
    open: false
  }
])

function toggleFaq(index) {
  faqs.value[index].open = !faqs.value[index].open
}
</script>

<template>
  <div>
    <!-- Hero + Search -->
    <section class="relative pt-40 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
      <div class="inline-flex items-center gap-1 mb-4 px-4 py-1 rounded-full glass text-sm text-purple-300 border border-purple-500/30">
        <Globe class="inline w-4 h-4 -mt-1 ml-1" /> بیش از ۵۰ پسوند دامنه
      </div>

      <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
        دامنه‌ی <span class="bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">رویایی‌ات</span> را همین حالا پیدا کن
      </h1>

      <p class="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
        نام دامنه مورد نظرت را جستجو کن، در دسترس بودنش را ببین و در چند ثانیه ثبتش کن.
      </p>

      <div class="max-w-3xl mx-auto mb-6">
        <form class="glass-strong rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl" @submit.prevent="searchDomain">
          <label for="domain-search" class="sr-only">جستجوی دامنه</label>
          <input
            id="domain-search"
            v-model="query"
            type="text"
            placeholder="نام دامنه مورد نظر خود را وارد کنید..."
            class="flex-1 px-6 py-4 rounded-xl input-glass text-white placeholder-gray-400 text-lg"
          >
          <button
            type="submit"
            :disabled="isSearching"
            class="px-8 py-4 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Loader2 v-if="isSearching" class="w-5 h-5 animate-spin" />
            <Search v-else class="w-5 h-5" />
            {{ isSearching ? 'در حال جستجو...' : 'جستجو دامنه' }}
          </button>
        </form>

        <div class="flex flex-wrap justify-center gap-4 mt-4 text-sm text-gray-400">
          <span v-for="t in tlds" :key="t.id" class="flex items-center gap-1">
            <Check class="w-4 h-4 text-green-400" /> {{ t.ext }} {{ displayPrice(t) }}
          </span>
        </div>
      </div>

      <!-- Search Results -->
      <Transition name="fade">
        <div v-if="results" class="max-w-3xl mx-auto grid gap-3 mt-8">
          <div
            v-for="r in results"
            :key="r.domain"
            class="glass-card rounded-2xl px-6 py-4 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full" :class="r.available ? 'bg-green-400' : 'bg-red-400'" />
              <span class="text-lg font-medium" dir="ltr">{{ r.domain }}</span>
            </div>

            <div class="flex items-center gap-4">
              <span class="text-sm" :class="r.available ? 'text-green-400' : 'text-red-400'">
                {{ r.available ? 'در دسترس' : 'قبلاً ثبت شده' }}
              </span>
              <span v-if="r.available" class="text-gray-300 text-sm hidden sm:block">{{ r.price }}</span>
              <NuxtLink
                v-if="r.available"
                :to="`/checkout-domain?domain=${r.domain}`"
                class="px-4 py-2 rounded-lg bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all text-sm font-medium"
              >
                ثبت دامنه
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </section>

    <!-- Why register with us -->
    <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
      <div class="glass rounded-3xl p-8 md:p-16 relative overflow-hidden">
        <div class="absolute inset-0 bg-linear-to-r from-purple-900/20 to-blue-900/20" />
        <div class="relative z-10">
          <h2 class="text-3xl md:text-4xl font-bold mb-10 text-center">
            چرا دامنه‌ات را از <span class="text-purple-400">دنیاوب</span> بگیری؟
          </h2>

          <div class="grid md:grid-cols-3 gap-8">
            <div v-for="f in features" :key="f.title" class="text-center">
              <div class="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
                <component :is="f.icon" class="w-7 h-7" />
              </div>
              <h4 class="font-bold text-lg mb-2">{{ f.title }}</h4>
              <p class="text-gray-400 leading-relaxed">{{ f.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TLD Pricing Grid -->
    <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-bold mb-3">قیمت <span class="gradient-text">پسوندهای</span> محبوب</h2>
        <p class="text-gray-400">ثبت، انتقال و تمدید دامنه با بهترین نرخ بازار</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div v-for="t in tlds" :key="t.id" class="glass-card rounded-2xl p-6 text-center hover-lift">
          <div class="text-2xl font-bold text-purple-400 mb-2" dir="ltr">{{ t.ext }}</div>
          <div class="text-gray-300 text-sm">
            {{ displayPrice(t) }}
          </div>
        </div>
      </div>
    </section>

    <!-- Domain management features -->
    <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-bold mb-3">مدیریت کامل <span class="gradient-text">دامنه</span></h2>
        <p class="text-gray-400">همه چیز برای کنترل دامنه‌تان، از یک پنل ساده</p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div v-for="f in managementFeatures" :key="f.title" class="glass-card rounded-2xl p-6 hover-lift">
          <div class="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
            <component :is="f.icon" class="w-6 h-6 text-white" />
          </div>
          <h3 class="text-lg font-bold mb-2">{{ f.title }}</h3>
          <p class="text-gray-400 text-sm leading-relaxed">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Domain transfer -->
    <section class="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-16">
      <div class="glass-card rounded-3xl p-8 md:p-10">
        <div class="flex items-center gap-3 justify-center mb-2">
          <ArrowLeftRight class="w-6 h-6 text-purple-400" />
          <h2 class="text-2xl font-bold text-center">انتقال دامنه به دنیاوب</h2>
        </div>
        <p class="text-gray-400 text-sm text-center mb-8">
          دامنه‌ات را از هر ثبت‌کننده دیگری منتقل کن و از قیمت و پشتیبانی بهتر بهره‌مند شو
        </p>

        <form class="grid md:grid-cols-2 gap-4" @submit.prevent>
          <div class="md:col-span-2 md:mx-auto md:w-2/3">
            <label for="transfer-domain" class="block text-sm text-gray-300 mb-2">نام دامنه</label>
            <input
              id="transfer-domain"
              v-model="transferDomain"
              type="text"
              dir="ltr"
              placeholder="example.com"
              class="w-full px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
            >
          </div>
          <div class="md:col-span-2 md:mx-auto md:w-2/3">
            <label for="transfer-code" class="block text-sm text-gray-300 mb-2">کد Auth / EPP</label>
            <input
              id="transfer-code"
              v-model="transferCode"
              type="text"
              dir="ltr"
              placeholder="کد قفل‌گشایی دامنه"
              class="w-full px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
            >
          </div>
          <div class="md:col-span-2 flex justify-center mt-2">
            <button
              type="submit"
              class="px-8 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30"
            >
              شروع انتقال دامنه
            </button>
          </div>
        </form>
      </div>
    </section>

    <!-- FAQ -->
    <section class="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-16">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-bold mb-3">سوالات <span class="gradient-text">متداول</span></h2>
        <p class="text-gray-400">پاسخ پرتکرارترین سوالات درباره ثبت و مدیریت دامنه</p>
      </div>

      <div class="space-y-3">
        <div v-for="(faq, index) in faqs" :key="faq.q" class="glass rounded-2xl overflow-hidden border border-white/10">
          <button
            type="button"
            class="w-full flex items-center justify-between gap-4 px-6 py-4 text-right"
            @click="toggleFaq(index)"
          >
            <span class="font-medium">{{ faq.q }}</span>
            <ChevronDown
              class="w-5 h-5 text-gray-400 shrink-0 transition-transform"
              :class="faq.open ? 'rotate-180' : ''"
            />
          </button>
          <div v-if="faq.open" class="px-6 pb-4 text-gray-400 text-sm leading-relaxed">
            {{ faq.a }}
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-24">
      <div class="glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
        <div class="absolute inset-0 bg-linear-to-r from-purple-900/20 to-blue-900/20" />
        <div class="relative z-10">
          <h2 class="text-2xl md:text-3xl font-bold mb-3">همین حالا دامنه‌ات را رزرو کن</h2>
          <p class="text-gray-400 mb-8">پیش از اینکه دیگری آن را ثبت کند</p>
          <NuxtLink
            to="/start"
            class="inline-flex px-8 py-4 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold text-lg shadow-lg shadow-purple-500/30"
          >
            شروع کنید
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>