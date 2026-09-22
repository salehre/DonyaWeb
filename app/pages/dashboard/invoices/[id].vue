<script setup>
import { ref } from 'vue'
import { ArrowRight, Download, Printer, CreditCard, Loader2 } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const { getInvoiceById, user } = useDashboard()
const { createOrder } = useCheckout()

const invoice = getInvoiceById(route.params.id)

if (!invoice) {
  throw createError({ statusCode: 404, statusMessage: 'فاکتور مورد نظر پیدا نشد' })
}

useHead({
  title: `فاکتور ${invoice.id} | دنیاوب`
})

// در نبود درگاه پرداخت واقعی، مبلغ خام برای محاسبه مالیات به‌صورت ساده استخراج می‌شود
const amountNumber = Number(invoice.amount.replace(/[^\d]/g, ''))
const taxAmount = Math.round(amountNumber * 0.09)
const totalAmount = amountNumber + taxAmount

function formatNumber(n) {
  return n.toLocaleString('fa-IR')
}

// پرداخت فاکتورهای «در انتظار پرداخت» / «ناموفق» از همان مسیر شبیه‌ساز درگاه بانکی چک‌اوت‌ها
const isPaying = ref(false)
function payInvoice() {
  isPaying.value = true
  const order = createOrder({
    type: 'invoice',
    invoiceId: invoice.id,
    title: `فاکتور ${invoice.id} (${invoice.service})`,
    identifier: invoice.id,
    amount: totalAmount,
    cycleLabel: '',
    summary: [{ label: 'شرح', value: invoice.service }],
    customer: { fullName: user.name, email: user.email, phone: user.phone },
    paymentMethod: 'gateway'
  })
  router.push(`/payment/gateway/${order.id}`)
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <NuxtLink to="/dashboard/invoices" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowRight class="w-4 h-4" />
        بازگشت به لیست
      </NuxtLink>
      <div class="flex items-center gap-2">
        <button type="button" class="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-all text-sm flex items-center gap-1.5">
          <Printer class="w-4 h-4" />
          چاپ
        </button>
        <button type="button" class="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-all text-sm flex items-center gap-1.5">
          <Download class="w-4 h-4" />
          دانلود PDF
        </button>
        <button
          v-if="invoice.status !== 'paid'"
          type="button"
          :disabled="isPaying"
          class="px-4 py-2 rounded-lg bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all text-sm flex items-center gap-1.5 disabled:opacity-60"
          @click="payInvoice"
        >
          <Loader2 v-if="isPaying" class="w-4 h-4 animate-spin" />
          <CreditCard v-else class="w-4 h-4" />
          پرداخت فاکتور
        </button>
      </div>
    </div>

    <div class="glass-card rounded-3xl p-8 md:p-10">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 pb-8 border-b border-white/10">
        <div>
          <h1 class="text-2xl font-bold mb-1" dir="ltr">{{ invoice.id }}</h1>
          <p class="text-gray-400 text-sm">تاریخ صدور: {{ invoice.date }}</p>
        </div>
        <DashboardStatusBadge :status="invoice.status" />
      </div>

      <div class="grid sm:grid-cols-2 gap-6 mb-8">
        <div>
          <p class="text-xs text-gray-500 mb-1">صادر شده برای</p>
          <p class="font-medium">{{ user.name }}</p>
          <p class="text-gray-400 text-sm" dir="ltr">{{ user.email }}</p>
        </div>
        <div class="sm:text-left">
          <p class="text-xs text-gray-500 mb-1">صادر شده توسط</p>
          <p class="font-medium">دنیا وب</p>
          <p class="text-gray-400 text-sm"> خیابان ولیعصر، بالاتر از پارک وی، خیابان فیاضی، پلاک 148، طبقه دوم</p>
        </div>
      </div>

      <div class="rounded-2xl overflow-hidden border border-white/10 mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-white/5 text-gray-400 text-right">
              <th class="px-5 py-3 font-medium">شرح</th>
              <th class="px-5 py-3 font-medium">مبلغ (تومان)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-white/10">
              <td class="px-5 py-4">{{ invoice.service }}</td>
              <td class="px-5 py-4">{{ formatNumber(amountNumber) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-2 max-w-xs mr-auto text-sm">
        <div class="flex justify-between text-gray-400">
          <span>جمع جزء</span>
          <span>{{ formatNumber(amountNumber) }} تومان</span>
        </div>
        <div class="flex justify-between text-gray-400">
          <span>مالیات بر ارزش افزوده (۹٪)</span>
          <span>{{ formatNumber(taxAmount) }} تومان</span>
        </div>
        <div class="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
          <span>مبلغ نهایی</span>
          <span>{{ formatNumber(totalAmount) }} تومان</span>
        </div>
      </div>
    </div>
  </div>
</template>
