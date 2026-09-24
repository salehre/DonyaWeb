<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, RotateCcw, FileText, LifeBuoy, Loader2 } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t, apiFetch, numberWithSeparator, formatJalali } = usePurchaseRecords()

const service = ref(null)
const loading = ref(true)
const notFound = ref(false)

const isRenewMode = computed(() => route.query.action === 'renew')

useHead({
  title: computed(() => (service.value ? `${service.value.name} | مدیریت سرویس | دنیاوب` : 'مدیریت سرویس | دنیاوب'))
})

// شناسه‌ی سرویس «شماره فاکتور-شماره آیتم» هست؛ فاکتور از API گرفته می‌شه و آیتم مربوطه بین invoice_details پیدا می‌شه
async function loadService() {
  loading.value = true
  notFound.value = false

  const { invoiceId, detailId } = parseServiceId(route.params.id)
  if (!invoiceId || !detailId) {
    notFound.value = true
    loading.value = false
    return
  }

  try {
    const response = await apiFetch('/invoices/show', { invoice_id: Number(invoiceId) })
    const invoice = response?.code === 2000 ? response.Invoice || response.data?.Invoice : null
    const found = invoice ? servicesFromInvoice(invoice).find((s) => s.id === `${invoice.id}-${detailId}`) : null

    if (!found) {
      notFound.value = true
      return
    }

    // دامنه‌ها صفحه‌ی مدیریت اختصاصی خودشون رو دارن
    if (found.type === 'domain') {
      await navigateTo('/dashboard/domains')
      return
    }

    service.value = found
  } catch (error) {
    notFound.value = true
    toast.error(t('error') + ': ' + t(error?.data?.message || error?.message || error))
  } finally {
    loading.value = false
  }
}

onMounted(loadService)

function goBack() {
  router.push({ path: '/dashboard/services', query: route.query.type ? { type: route.query.type } : {} })
}

function startRenew() {
  router.replace({ query: { action: 'renew' } })
}

const renewDate = computed(() => (service.value?.expireRaw ? formatJalali(service.value.expireRaw) : '—'))
const purchaseDate = computed(() => formatJalali(service.value?.purchasedAt))
const price = computed(() => numberWithSeparator(service.value?.price))
const invoiceLink = computed(() => `/dashboard/purchaserecords/${service.value?.invoiceId}`)
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-7 h-7 text-purple-400 animate-spin" />
    </div>

    <div v-else-if="notFound || !service" class="glass-card rounded-3xl p-12 text-center space-y-4">
      <p class="text-gray-300">سرویس مورد نظر پیدا نشد.</p>
      <NuxtLink
        to="/dashboard/services"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-sm font-medium"
      >
        بازگشت به لیست سرویس‌ها
      </NuxtLink>
    </div>

    <template v-else>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            @click="goBack"
          >
            <ArrowRight class="w-4 h-4 rotate-180" />
            بازگشت به سرویس‌ها
          </button>
          <h1 class="text-2xl font-bold mt-4">مدیریت سرویس «{{ service.name }}»</h1>
          <p class="text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
            نوع سرویس: {{ service.typeLabel }}
            <DashboardStatusBadge :status="service.status" />
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-sm hover:bg-white/10 transition-all shrink-0"
          @click="startRenew"
        >
          <RotateCcw class="w-4 h-4" />
          تمدید سرویس
        </button>
      </div>

      <!-- بلاک تمدید -->
      <div v-if="isRenewMode" class="glass-card rounded-3xl border border-purple-500/30 p-6 bg-purple-500/5">
        <div class="flex items-start gap-3">
          <RotateCcw class="w-6 h-6 text-purple-300 shrink-0" />
          <div>
            <h4 class="text-lg font-semibold">تمدید سرویس</h4>
            <p class="text-gray-400 mt-2 text-sm leading-relaxed">
              برای تمدید این سرویس، یک تیکت به واحد فروش ثبت کنید تا فاکتور تمدید برای شما صادر شود.
            </p>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap gap-3">
          <NuxtLink
            to="/dashboard/tickets/new"
            class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <LifeBuoy class="w-4 h-4" />
            ثبت تیکت تمدید
          </NuxtLink>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/20 text-sm hover:bg-white/10 transition-all"
            @click="router.replace({ query: {} })"
          >
            بازگشت به مدیریت
          </button>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div class="space-y-6">
          <!-- جزئیات کلی -->
          <section class="glass-card rounded-3xl p-6 space-y-4">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-xl font-semibold">جزئیات سرویس</h2>
              <span class="rounded-full px-3 py-1 text-xs font-semibold text-white bg-white/10">{{ service.cycle }}</span>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <p class="text-gray-400 text-xs">شناسه سرویس</p>
                <p class="font-medium" dir="ltr">{{ service.id }}</p>
              </div>
              <div>
                <p class="text-gray-400 text-xs">{{ service.type === 'vps' ? 'آدرس IP' : 'دامنه اصلی' }}</p>
                <p class="font-medium" dir="ltr">{{ service.identifier }}</p>
              </div>
              <div>
                <p class="text-gray-400 text-xs">تاریخ خرید</p>
                <p class="font-medium">{{ purchaseDate }}</p>
              </div>
              <div>
                <p class="text-gray-400 text-xs">تاریخ تمدید</p>
                <p class="font-medium">{{ renewDate }}</p>
              </div>
              <div>
                <p class="text-gray-400 text-xs">هزینه</p>
                <p class="font-medium">{{ price }} تومان</p>
              </div>
              <div>
                <p class="text-gray-400 text-xs">شماره فاکتور</p>
                <p class="font-medium">{{ service.invoiceNumber ?? service.invoiceId }}</p>
              </div>
            </div>
          </section>

          <!-- مشخصات فنی ثبت‌شده روی آیتم فاکتور -->
          <section v-if="service.attributes.length" class="glass-card rounded-3xl p-6 space-y-4">
            <h2 class="text-lg font-semibold">مشخصات سرویس</h2>
            <div class="divide-y divide-white/5 text-sm">
              <div v-for="(a, i) in service.attributes" :key="i" class="py-3 flex items-center justify-between gap-4">
                <span class="text-gray-400">{{ a.title }}</span>
                <span class="font-medium text-gray-200">{{ a.value }}</span>
              </div>
            </div>
          </section>
        </div>

        <aside class="space-y-6">
          <div class="glass-card rounded-3xl p-6">
            <h2 class="text-lg font-semibold mb-3">عملیات سریع</h2>
            <div class="space-y-3">
              <button
                type="button"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 text-sm font-medium hover:bg-white/20 transition-all"
                @click="startRenew"
              >
                <RotateCcw class="w-4 h-4" />
                شروع تمدید
              </button>
              <NuxtLink
                :to="invoiceLink"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-white/10 text-sm font-medium hover:border-purple-500/30 transition-all"
              >
                <FileText class="w-4 h-4" />
                مشاهده فاکتور
              </NuxtLink>
              <NuxtLink
                to="/dashboard/services"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-white/10 text-sm font-medium hover:border-purple-500/30 transition-all"
              >
                <ArrowRight class="w-4 h-4 rotate-180" />
                بازگشت به لیست سرویس‌ها
              </NuxtLink>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>