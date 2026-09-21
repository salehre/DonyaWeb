// app/composables/useWallet.js
// state مشترکِ کیف‌پول (موجودی + تاریخچه تراکنش‌ها) بین تمام صفحات/کامپوننت‌ها.
// از useState استفاده شده (نه یک متغیر ماژولی ساده) چون در SSR هر کاربر باید
// نسخه‌ی جدا و ایزوله‌ی خودش از این state رو داشته باشه.
// با فراخوانی fetchBalance/fetchTransactions فقط یک‌بار per session به API واقعی
// زده می‌شه و نتیجه بین همه‌ی مصرف‌کننده‌ها به اشتراک گذاشته می‌شه (بدون درخواست تکراری).
//
// موجودی مطابق منطق پروژه‌ی مرجع: wallets/getBalance → response.Wallets و انتخاب
// کیف‌پولی که currency_id آن برابر currencyId است (پیش‌فرض ۱، مثل currencyCode در مرجع).

export function useWallet(currencyId = 1) {
  const config = useRuntimeConfig()
  const headers = useApiHeaders()
  const toast = useToast()

  // پاسخ خام API
  const wallets = useState('wallet-wallets', () => [])
  const rawTransactions = useState('wallet-transactions', () => [])

  const balancePending = useState('wallet-balance-pending', () => false)
  const transactionsPending = useState('wallet-transactions-pending', () => false)

  const balanceLoaded = useState('wallet-balance-loaded', () => false)
  const transactionsLoaded = useState('wallet-transactions-loaded', () => false)

  // کیف‌پول ارز اصلی (currency_id = 1)
  const wallet = computed(
    () => wallets.value.find((w) => Number(w.currency_id) === Number(currencyId)) ?? null
  )
  const balance = computed(() => Number(wallet.value?.balance ?? 0))

  // تاریخچه‌ی تراکنش‌ها با قالب یکسان، برای استفاده مستقیم در جدول‌ها/فیلترها
  const transactions = computed(() =>
    rawTransactions.value.map((t) => ({
      id: t.wallet_transactions_id,
      type: t.kind_text,
      amount: Number(t.amount),
      method: t.payment_procedure_title || t.gateway_title || '-',
      date: t.document_date,
      status: t.status_text,
      trackingCode: t.tracking_code
    }))
  )

  const pendingItems = computed(() => transactions.value.filter((t) => t.status === 'pending'))
  const totalDeposited = computed(() =>
    transactions.value
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  )
  const totalSpent = computed(() =>
    transactions.value
      .filter((t) => t.type === 'purchase')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  )

  function formatNumber(n) {
    return Math.abs(Number(n) || 0).toLocaleString('fa-IR')
  }

  // دریافت موجودی از API — با force=true دوباره از سرور می‌گیرد، در غیر این‌صورت
  // در صورت وجود داده‌ی کش‌شده، از درخواست مجدد صرف‌نظر می‌کند.
  async function fetchBalance(force = false) {
    if (balanceLoaded.value && !force) return
    balancePending.value = true
    try {
      const response = await $fetch(`${config.public.apiBase}/wallets/getBalance`, {
        method: 'POST',
        headers: headers.value
      })

      if (!Array.isArray(response?.Wallets)) {
        console.warn('wallets/getBalance unexpected response:', response)
      }

      wallets.value = response?.Wallets ?? []
      balanceLoaded.value = true
    } catch (error) {
      console.error('Wallet balance fetch error:', error, error?.data)
      if (import.meta.client) {
        toast.error('دریافت موجودی کیف پول ناموفق بود.')
      }
    } finally {
      balancePending.value = false
    }
  }

  async function fetchTransactions(force = false) {
    if (transactionsLoaded.value && !force) return
    transactionsPending.value = true
    try {
      const { data } = await useFetch(`${config.public.apiBase}/wallets/showTransactions`, {
        method: 'POST',
        headers
      })
      rawTransactions.value = data.value?.WalletTransactions ?? []
      transactionsLoaded.value = true
    } finally {
      transactionsPending.value = false
    }
  }

  // بارگذاری اولیه‌ی هر دو (فقط اگر قبلاً بارگذاری نشده باشند)
  async function ensureLoaded() {
    await Promise.all([fetchBalance(), fetchTransactions()])
  }

  // به‌روزرسانی اجباری هر دو (بعد از تراکنش جدید مثل شارژ/برداشت)
  async function refresh() {
    await Promise.all([fetchBalance(true), fetchTransactions(true)])
  }

  function hasEnoughBalance(amount) {
    return balance.value >= Number(amount || 0)
  }

  // ثبت درخواست برداشت وجه از کیف‌پول و رفرش خودکار موجودی/تاریخچه
  async function requestWithdraw(amount, destination) {
    const { data, error } = await useFetch(
      `${config.public.apiBase}/wallets/createTransactionsRequest`,
      {
        method: 'POST',
        headers,
        body: {
          amount,
          dynamic_column_01: destination,
          kind: 2
        }
      }
    )

    if (error.value || data.value?.code !== 2000) {
      throw new Error(data.value?.message || 'ثبت درخواست برداشت ناموفق بود.')
    }

    await refresh()
    return data.value
  }

  return {
    // state
    balance,
    transactions,
    pendingItems,
    totalDeposited,
    totalSpent,
    balancePending,
    transactionsPending,
    // actions
    fetchBalance,
    fetchTransactions,
    ensureLoaded,
    refresh,
    requestWithdraw,
    hasEnoughBalance,
    // helpers
    formatNumber
  }
}