<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowRight, X, Loader2 } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const toast = useToast()
const { user } = useUserInfo()
const { options: siteOptions, ensureLoaded: loadSiteOptions } = useSiteOptions()
const { t, apiFetch, numberWithSeparator, formatJalali, getStatusBadgeClass } = usePurchaseRecords()

const language = ref('fa')
const Invoice = ref({})
const Transactions = ref([])
const loading = ref(true)
const notFound = ref(false)

const dialogReturnedGoods = ref(false)
const dialogChangeStatus = ref(false)
const btnLoadingPayment = ref(false)
const submitReturnLoading = ref(false)
const returnData = ref([])
const returnReasons = ref([])

// شناسه‌ی فاکتور از آدرس صفحه؛ اگه عددی بود به عدد تبدیل می‌شه تا همون چیزی که قبلاً (item.id) به API می‌رفت بره
const invoiceId = computed(() => {
  const id = String(route.params.id)
  return /^\d+$/.test(id) ? Number(id) : id
})

// برگشت به لیست روی همون تبی که کاربر ازش اومده
const backLink = computed(() => ({
  path: '/dashboard/purchaserecords',
  query: route.query.tab ? { tab: route.query.tab } : {}
}))

useHead({
  title: computed(() => (Invoice.value?.id ? `فاکتور ${Invoice.value.invoice_number || Invoice.value.id}` : 'جزئیات فاکتور')),
  titleTemplate: '%s - فاکتور ها'
})

const loadInvoice = () => {
  loading.value = true
  notFound.value = false
  return apiFetch('/invoices/show', { invoice_id: invoiceId.value })
    .then((response) => {
      if (response.code === 2000) {
        Invoice.value = response.Invoice || response.data?.Invoice || {}
        Transactions.value = response.Transactions || response.data?.Transactions || []
        if (!Invoice.value?.id) notFound.value = true
      } else {
        notFound.value = true
      }
    })
    .catch((error) => {
      notFound.value = true
      toast.error(t('error') + ': ' + t(error?.data?.message || error?.message || error))
    })
    .finally(() => {
      loading.value = false
    })
}

function loadReturnItems() {
  apiFetch('/dynamicKinds/showByType', { type: 'Return' }).then((response) => {
    returnReasons.value = response.DynamicKinds || []
  })
}

onMounted(() => {
  // کاربری که status اش ۳ هست به سوابق خرید دسترسی نداره
  if (user.value?.status === 3) {
    navigateTo('/dashboard')
    return
  }
  loadReturnItems()
  loadInvoice()
  loadSiteOptions()
})

const goPayment = (transactionsId) => {
  if (user.value?.presenter_id) {
    toast.warning('جهت پرداخت قسط، لطفاً با نماینده خود هماهنگ فرمایید.')
    return
  }

  btnLoadingPayment.value = true
  apiFetch('/wallets/paymentInstallment', {
    selectedPaymentProcedure: 170,
    selectedGateway: 1,
    transactions_id: transactionsId
  })
    .then((response) => {
      const gatewayTitle = response.GatewayTitle
      const paymentUrl =
        response.GatewayResult?.payment_url || response.GatewayResult?.data?.payment_url || response.GatewayResult?.url
      if (['jibit', 'zibal', 'zarinpal', 'saman', 'free', 'wallet'].includes(gatewayTitle)) {
        if (paymentUrl) {
          window.location.replace(paymentUrl)
        } else {
          toast.error(t('payment_url_not_found'))
        }
      } else {
        toast.error(t('gateway_not_supported'))
      }
    })
    .catch((error) => {
      toast.error(t('error') + ': ' + t(error?.data?.message || error?.message || error))
    })
    .finally(() => {
      btnLoadingPayment.value = false
    })
}

function openDialogReturnedGoods() {
  returnData.value = (Invoice.value.invoice_details || []).map((item) => ({
    product_id: item.products?.id,
    product: item.products,
    amount: item.amount,
    return: 0,
    return_amount: item.return_amount || 0,
    max_return_amount: item.amount - (item.return_amount || 0),
    id: item.id,
    return_reason: '',
    return_description: '',
    price_kind: item.price_kind,
    invoice_id: Invoice.value.id
  }))
  dialogReturnedGoods.value = true
}

async function submitReturnItems() {
  if (submitReturnLoading.value) return

  const items = Invoice.value.invoice_details || []
  if (!items.length) return
  if (!returnData.value || !Array.isArray(returnData.value)) return
  if (!Invoice.value || !Invoice.value.id) return

  const returnItem = returnData.value.filter((item) => Number(item.return) > 0)

  for (const item of returnItem) {
    if (!item.return_reason || !item.return_description) {
      toast.error('لطفا دلیل و توضیحات مرجوعی را وارد کنید')
      return
    }
  }

  if (returnItem.length === 0) return

  const return_detail = returnItem.map((item) => ({
    product_id: item.product.id,
    amount: Number(item.return),
    invoice_detail_id: item.id,
    return_reason: item.return_reason,
    description: item.return_description
  }))

  const payload = {
    invoice_id: Invoice.value.id,
    return_detail
  }

  submitReturnLoading.value = true

  apiFetch('/invoices/saveReturn', payload)
    .then((response) => {
      if (response.code === 2000) {
        toast.success('درخواست مرجوعی با موفقیت ثبت شد')
        dialogReturnedGoods.value = false
        navigateTo(backLink.value)
      } else {
        toast.error(t(response.error))
      }
    })
    .catch(() => {
      toast.error('خطا در ثبت درخواست مرجوعی')
    })
    .finally(() => {
      submitReturnLoading.value = false
    })
}

const convertToEnglishNumbers = (input) => {
  const persianToEnglish = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' }
  if (input) {
    return input.replace(/[۰-۹]/g, (match) => persianToEnglish[match])
  }
  return input
}

const formatInput = (item) => {
  let val = String(item.return || 0)
  val = convertToEnglishNumbers(val)
  if (val.length > 1 && val.startsWith('0')) {
    val = val.replace(/^0/, '')
  }
  const num = parseInt(val) || 0
  const max = parseInt(item.max_return_amount) || 0
  item.return = Math.min(num, max)
  return item.return
}

function openDialogChangeStatus() {
  dialogChangeStatus.value = true
}

function updateStatus(id, status) {
  apiFetch('/invoices/updateStatus', {
    invoice_id: id,
    newStatus: status,
    description: 'درخواست لغو مرجوعی از سمت کاربر'
  }).then((response) => {
    if (response.code === 2000) {
      toast.success(t('status_change_saved'))
      dialogChangeStatus.value = false
      loadInvoice()
    } else {
      toast.error('خطا در تغییر وضعیت')
    }
  })
}

// فاکتور در انتظار پرداخت. اگه کالای فیزیکی (type_code = 1) داشته باشه به آدرس و زمان ارسال نیاز داره
// که این صفحه پشتیبانی نمی‌کنه.
const isAwaitingPayment = computed(() => Invoice.value.status_text === 'awaiting_payment')
const hasShippable = computed(() => (Invoice.value.invoice_details || []).some((d) => d.products?.type_code === 1))

const showTransactions = computed(() => [3, 4, 5, 6].includes(Invoice.value.status) && Transactions.value.length > 0)

const isAllReturned = computed(() => {
  if (!returnData.value.length) return true
  return returnData.value.every((item) => item.max_return_amount === 0)
})
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6" dir="rtl">
    <!-- بازگشت + دکمه‌های عملیات -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <NuxtLink :to="backLink" class="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white">
        <ArrowRight class="w-4 h-4" />
        بازگشت به لیست
      </NuxtLink>

      <div v-if="!loading && !notFound" class="flex flex-wrap items-center gap-2">
        <button
          v-if="Invoice.status_text?.includes('return') && Invoice.status === 9"
          type="button"
          class="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
          @click="openDialogChangeStatus"
        >
          لغو مرجوعی
        </button>
        <button
          v-if="Invoice.status === 6 && Invoice.returnable"
          type="button"
          class="rounded-lg border border-sky-500/30 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/10"
          @click="openDialogReturnedGoods()"
        >
          ثبت مرجوعی
        </button>

        <DashboardPrintInvoice
          v-if="Invoice.status === 11 || Invoice.status === 6"
          :data="Invoice"
          :custom="siteOptions"
          rounded="lg"
          color="blue"
          kind="invoice"
        />
      </div>
    </div>

    <!-- loading -->
    <div v-if="loading" class="glass-card flex justify-center rounded-3xl py-16">
      <Loader2 class="w-6 h-6 text-purple-400 animate-spin" />
    </div>

    <!-- not found / error -->
    <div v-else-if="notFound" class="glass-card rounded-3xl px-6 py-16 text-center">
      <p class="text-sm text-gray-400">فاکتور مورد نظر پیدا نشد.</p>
      <NuxtLink :to="backLink" class="mt-4 inline-block rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10">
        بازگشت به لیست فاکتورها
      </NuxtLink>
    </div>

    <!-- invoice details -->
    <div v-else class="glass-card rounded-3xl p-5 text-gray-300 sm:p-8">
      <div class="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <div class="flex justify-between px-1 sm:block">
          {{ Invoice.status_text?.includes('return') ? 'شماره سفارش مرجوعی' : t('order_code') }} :
          <strong class="text-white">{{ Invoice.id }}</strong>
        </div>
        <div class="flex justify-between px-1 sm:block">
          {{ Invoice.status_text?.includes('return') ? 'شماره فاکتور مرجوعی' : 'شماره فاکتور' }} :
          <strong class="text-white">{{ Invoice.invoice_number }}</strong>
        </div>
        <div v-if="Invoice.status_text?.includes('return')" class="flex justify-between px-1 sm:block">
          شماره فاکتور مرجع :
          <strong class="text-white">{{ Invoice.return_from_invoice_id }}</strong>
        </div>
        <div class="flex justify-between px-1 sm:block">
          {{ t('status') }} :
          <strong class="text-white">{{ t(Invoice.status_text) }}</strong>
        </div>
        <div class="flex justify-between px-1 sm:block">
          {{ Invoice.status_text?.includes('return') ? 'تاریخ درخواست مرجوعی' : t('date') }} :
          <strong class="text-white">{{ formatJalali(Invoice.document_date) }}</strong>
        </div>
        <div v-if="Invoice.send_date" class="flex justify-between px-1 sm:block">
          {{ t('delivery_date') }} :
          <strong class="text-white">{{ formatJalali(Invoice.send_date) }}</strong>
        </div>
        <div v-if="Invoice.send_date" class="flex justify-between px-1 sm:block">
          {{ t('delivery_time') }}:
          <strong class="text-white">{{ Invoice.send_time }}</strong>
        </div>
        <div v-if="Invoice.receiver_address" class="px-1 sm:col-span-2">
          {{ t('delivery_address') }}:
          <strong class="leading-relaxed text-white">{{ Invoice.receiver_address }}</strong>
        </div>
      </div>

      <div v-if="Invoice.status === 9 || Invoice.status === 10" class="mt-4">
        <div class="rounded-xl bg-blue-500/10 border border-blue-500/30 p-3 text-sm text-blue-300">
          برای درخواست مرجوعی، پس از ارسال، درخواست شما بررسی می‌شود و در صورتی که تایید شود، فرآیند ثبت و تایید
          مرجوعی انجام خواهد شد.
        </div>
      </div>

      <div v-if="Invoice.invoice_details?.length" class="my-4 overflow-x-auto rounded-xl border border-white/10">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/10 text-gray-400">
              <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ t('product_title') }}</th>
              <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ t('price') }}</th>
              <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ Invoice.status_text?.includes('return') ? 'تعداد مرجوعی' : t('quantity') }}</th>
              <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ t('discount') }}</th>
              <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ t('tax') }}</th>
              <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ Invoice.status_text?.includes('return') ? 'مبلغ قابل استرداد' : t('total_price') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(item, i) in Invoice.invoice_details" :key="i">
              <tr class="border-b border-white/5">
                <td class="px-2 py-2.5 text-center">
                  <div class="whitespace-nowrap">
                    {{ item.price_kind === 0 ? 'خرید' : item.price_kind === 1 ? 'تمدید' : 'تجدید' }}
                    {{ item.products['title_' + language] }}
                  </div>
                  <div v-if="item.description" class="mt-1 text-xs text-gray-500">
                    {{ item.description }}
                  </div>
                </td>
                <td class="px-2 py-2.5 text-center">{{ numberWithSeparator(item.unit_price) }}</td>
                <td class="px-2 py-2.5 text-center">{{ item.amount }}</td>
                <td class="px-2 py-2.5 text-center">{{ numberWithSeparator(Number(item.discount_price || 0) * Number(item.amount || 0)) }}</td>
                <td class="px-2 py-2.5 text-center">{{ numberWithSeparator(item.tax_price) }}</td>
                <td class="px-2 py-2.5 text-center">{{ numberWithSeparator(item.total_price) }}</td>
              </tr>
              <tr v-if="Invoice.status_text?.includes('return') && item.description" class="border-b border-white/5 bg-purple-500/5">
                <td colspan="12" class="px-2 py-2 text-start">
                  <span class="text-sm font-medium text-gray-500">علت مرجوعی</span>
                  <span class="mx-1">:</span>
                  <template v-if="item.return_reason_title">
                    <span class="text-sm text-gray-400">{{ item.return_reason_title }}</span>
                    <span class="mx-1">-</span>
                  </template>
                  <span class="text-sm text-gray-400">{{ item.description }}</span>
                </td>
              </tr>
              <tr v-else-if="item.dynamic_column_01" class="border-b border-white/5 bg-white/5">
                <td colspan="2" class="max-w-30 px-2 py-2 text-center">
                  <p class="text-xs text-gray-400 leading-relaxed">
                    {{ JSON.parse(item.dynamic_column_01).product_id }} -
                    {{ JSON.parse(item.dynamic_column_01).product_title }}
                  </p>
                </td>
                <td colspan="10" class="px-0 py-2 text-center">
                  <div class="flex items-center justify-start text-sm text-gray-400">
                    <template v-for="a in JSON.parse(item.dynamic_column_01).attibs">
                      <span class="mx-2 h-4 w-px bg-white/10" />
                      <p class="me-1 text-xs">{{ a.title }}</p> :
                      <p class="ms-1 text-xs">{{ a.reslt }}</p>
                    </template>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-else class="my-4 rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-gray-400">
        جزئیات این فاکتور در پاسخ API ثبت نشده است.
      </div>

      <div class="grid grid-cols-1 gap-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <div v-if="Invoice.description" class="pb-5">
            <div class="flex justify-between px-1">{{ t('description') }}:</div>
            <div class="px-1"><strong class="leading-relaxed text-white">{{ Invoice.description }}</strong></div>
          </div>
        </div>
        <div class="space-y-2">
          <div class="flex justify-between px-1">
            <p>{{ t('order_value') }}:</p>
            <strong class="text-white">{{ numberWithSeparator(Invoice.impure_price) }} تومان</strong>
          </div>
          <template v-if="!Invoice.status_text?.includes('return')">
            <div class="flex justify-between px-1">
              <p>تخفیف پایه :</p>
              <strong class="text-white">{{ numberWithSeparator(Invoice.discount_price) }} تومان</strong>
            </div>
            <div class="flex justify-between px-1">
              <p>کد تخفیف :</p>
              <strong class="text-white">{{ numberWithSeparator(Invoice.other_price ?? 0) }} تومان</strong>
            </div>
              <div class="flex justify-between px-1">
              <p>عوارض و مالیات :</p>
              <strong class="text-white">{{ numberWithSeparator(Invoice.tax_price ?? 0) }} تومان</strong>
            </div>
          </template>
          <div class="flex justify-between px-1">
            <p>{{ Invoice.status_text?.includes('return') ? 'مبلغ کل قابل استرداد' : t('total_price') }} :</p>
            <strong class="text-white">{{ numberWithSeparator(Invoice.total_price) }} تومان</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- لیست تراکنش‌ها -->
    <div v-if="!loading && !notFound && showTransactions" class="glass-card rounded-3xl p-5 sm:p-8">
      <h3 class="mb-4 text-base font-bold text-purple-300">لیست تراکنش‌ها</h3>
      <div class="overflow-x-auto rounded-xl border border-white/10">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/10 text-gray-400 text-right">
              <th class="px-4 py-3 font-medium">شناسه تراکنش</th>
              <th class="px-4 py-3 font-medium">نوع تراکنش</th>
              <th class="px-4 py-3 font-medium">تاریخ سررسید</th>
              <th class="px-4 py-3 font-medium">مبلغ</th>
              <th class="px-4 py-3 font-medium">وضعیت</th>
              <!-- <th class="px-4 py-3 font-medium text-center">پرداخت</th> -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in Transactions" :key="item.id" class="border-b border-white/5 last:border-0">
              <td class="px-4 py-3 text-gray-300">{{ item.wallet_transactions_id }}</td>
              <td class="px-4 py-3 text-gray-300">{{ t(item.kind_text) }}</td>
              <td class="px-4 py-3 text-gray-400">{{ formatJalali(item.document_date) }}</td>
              <td class="px-4 py-3 text-gray-200">{{ numberWithSeparator(parseInt(item.amount)) }} تومان</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium border" :class="getStatusBadgeClass(item.status)">{{ t(item.status_text) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- پرداخت فاکتور در انتظار پرداخت -->
    <template v-if="!loading && !notFound && isAwaitingPayment">
      <DashboardInvoicePayment v-if="!hasShippable" :invoice="Invoice" />
      <div v-else class="glass-card rounded-3xl p-6 text-center text-sm text-gray-400">
        این فاکتور شامل کالای فیزیکی است و برای پرداخت به انتخاب آدرس و زمان ارسال نیاز دارد.
      </div>
    </template>

    <!-- ================= DIALOG: returned goods (dialogReturnedGoods) ================= -->
    <Transition name="garnet-slide-up">
      <div v-if="dialogReturnedGoods" class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
        <div class="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl glass-strong border border-white/10 p-4 shadow-2xl sm:rounded-2xl">
          <div class="flex items-center justify-between px-0">
            <h3 class="text-base font-bold text-purple-300">{{ t('select_return_items') }}</h3>
            <button type="button" class="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white" @click="dialogReturnedGoods = false">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="overflow-y-auto scrollbar-thin px-1 pt-0" style="max-height: 50dvh">
            <div v-for="item in returnData" :key="item.id" class="my-4 rounded-xl border border-white/10">
              <div class="flex">
                <div class="flex items-center justify-center px-2 py-2 md:px-4">
                  <img :src="item.product.cover_image" class="h-25 w-25 rounded-lg object-cover" alt="">
                </div>
                <div class="flex flex-1 items-start">
                  <p class="pe-2 pt-2 text-sm font-normal text-gray-200">{{ item.product.title_fa }}</p>
                </div>
              </div>

              <div class="px-4 py-0">
                <div class="mb-2 rounded-lg bg-sky-500/10 border border-sky-500/20 p-2">
                  <p v-if="item.price_kind !== 0" class="text-xs text-gray-400">این ردیف قابل برگشت نیست</p>
                  <p v-else class="text-xs text-gray-400">
                    <template v-if="item.max_return_amount === 0">
                      تمامی {{ item.amount }} عدد از این محصول مرجوع شده است.
                    </template>
                    <template v-else>
                      از مجموع {{ item.amount }} عدد، {{ item.return_amount }} عدد مرجوع شده است.
                    </template>
                  </p>
                </div>

                <template v-if="item.max_return_amount !== 0 && item.price_kind === 0">
                  <div class="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-xs text-gray-400">تعداد مرجوعی</label>
                      <input
                        v-model="item.return"
                        type="number"
                        :min="0"
                        :max="item.max_return_amount"
                        class="w-full rounded-lg input-glass px-3 py-2 text-sm text-white outline-none"
                        @keyup="item.return = formatInput(item)"
                      >
                    </div>
                    <div>
                      <label class="mb-1 block text-xs text-gray-400">{{ t('return_reason') }}</label>
                      <select v-model="item.return_reason" class="w-full rounded-lg input-glass px-3 py-2 text-sm text-white outline-none">
                        <option value="" disabled class="bg-slate-800">{{ t('return_reason') }}</option>
                        <option v-for="reason in returnReasons" :key="reason.id" :value="reason.id" class="bg-slate-800">{{ reason.title }}</option>
                      </select>
                    </div>
                  </div>
                  <div class="mb-4">
                    <textarea
                      v-model="item.return_description"
                      :placeholder="t('description')"
                      rows="3"
                      class="w-full resize-none rounded-lg input-glass px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
                    />
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-5">
            <button type="button" class="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10" @click="dialogReturnedGoods = false">
              {{ t('close') }}
            </button>
            <button
              type="button"
              :disabled="isAllReturned || submitReturnLoading"
              class="flex items-center gap-2 rounded-lg bg-linear-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              @click="submitReturnItems()"
            >
              <Loader2 v-if="submitReturnLoading" class="h-4 w-4 animate-spin" />
              {{ t('submit') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ================= DIALOG: change return status (dialogChangeStatus) ================= -->
    <Transition name="garnet-slide-up">
      <div v-if="dialogChangeStatus" class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
        <div class="w-full max-w-md rounded-t-2xl glass-strong border border-white/10 p-4 shadow-2xl sm:rounded-2xl">
          <div class="flex items-center justify-between px-0">
            <h3 class="text-base font-bold text-purple-300">درخواست لغو از مرجوعی</h3>
            <button type="button" class="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white" @click="dialogChangeStatus = false">
              <X class="w-5 h-5" />
            </button>
          </div>
          <p class="px-1 py-4 text-sm text-gray-300">آیا از مرجوع کردن محصولات منصرف شده‌اید؟</p>
          <div class="flex justify-end">
            <button
              type="button"
              class="rounded-lg border border-orange-500/30 px-4 py-2 text-sm font-medium text-orange-300 hover:bg-orange-500/10"
              @click="updateStatus(Invoice.id, 12)"
            >
              تایید لغو از مرجوعی
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.garnet-fade-enter-active,
.garnet-fade-leave-active {
  transition: opacity 0.18s ease;
}
.garnet-fade-enter-from,
.garnet-fade-leave-to {
  opacity: 0;
}

.garnet-slide-up-enter-active,
.garnet-slide-up-leave-active {
  transition: opacity 0.18s ease, transform 0.22s cubic-bezier(0.32, 0.72, 0, 1);
}
.garnet-slide-up-enter-from,
.garnet-slide-up-leave-to {
  opacity: 0;
  transform: translateY(24px);
}
</style>