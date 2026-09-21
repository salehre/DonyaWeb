<script setup>
import { Menu, Bell, ChevronDown, CheckCheck, CreditCard, Server, MessageSquare, Wallet } from 'lucide-vue-next'
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'

const { balance, formatNumber } = useWallet()

const sidebarOpen = useState('dashboardSidebarOpen', () => false)
const route = useRoute()
const router = useRouter()

const tokenCookie = useCookie("donyaweb_auth_token")
const { user, clearUser } = useUserInfo()
// const { user } = useDashboard()

const menuOpen = ref(false)
const notifOpen = ref(false)

// دکمه‌های trigger (برای محاسبه موقعیت) و خودِ پنل‌های teleport‌شده (برای تشخیص کلیک بیرون)
const menuTriggerEl = ref(null)
const menuPanelEl = ref(null)
const notifTriggerEl = ref(null)
const notifPanelEl = ref(null)

const menuPanelStyle = ref({})
const notifPanelStyle = ref({})

// ---- وضعیت لودینگ هدر (تا زمانی که اطلاعات کاربر/کیف‌پول آماده بشه، اسکلتون نمایش داده می‌شه) ----
const headerLoading = computed(() => {
  return user?.value == null || balance?.value == null
})

// ---- اعلانات ----
const notifications = ref([
  {
    id: 1,
    icon: CreditCard,
    color: 'text-emerald-400 bg-emerald-500/10',
    title: 'پرداخت موفق',
    text: 'فاکتور #INV-1042 با موفقیت پرداخت شد.',
    time: '۱۰ دقیقه پیش',
    read: false,
    to: '/dashboard/invoices'
  },
  {
    id: 2,
    icon: Server,
    color: 'text-amber-400 bg-amber-500/10',
    title: 'انقضای سرویس',
    text: 'سرویس هاست شما ۳ روز دیگر منقضی می‌شود.',
    time: '۲ ساعت پیش',
    read: false,
    to: '/dashboard/services'
  },
  {
    id: 3,
    icon: MessageSquare,
    color: 'text-blue-400 bg-blue-500/10',
    title: 'پاسخ تیکت',
    text: 'تیکت #4521 توسط پشتیبانی پاسخ داده شد.',
    time: 'دیروز',
    read: true,
    to: '/dashboard/tickets'
  }
])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

// موقعیت پنل رو نسبت به viewport (fixed) از روی مختصات واقعی دکمه‌ی trigger محاسبه می‌کنیم
// چون پنل با Teleport بیرون از هدر رندر می‌شه، دیگه محدود به stacking context هدر/کارت‌ها نیست
function computePanelStyle(triggerEl, widthPx) {
  if (!triggerEl) return {}
  const rect = triggerEl.getBoundingClientRect()
  const width = widthPx || rect.width
  let left = rect.right - width
  // جلوگیری از خروج پنل از لبه‌ی چپ صفحه
  left = Math.max(8, left)
  return {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    left: `${left}px`,
    width: `${width}px`
  }
}

function updateNotifPosition() {
  notifPanelStyle.value = computePanelStyle(notifTriggerEl.value, Math.min(352, window.innerWidth - 16))
}

function updateMenuPosition() {
  menuPanelStyle.value = computePanelStyle(menuTriggerEl.value, 192)
}

function addTrackingListeners(updateFn) {
  window.addEventListener('scroll', updateFn, true)
  window.addEventListener('resize', updateFn)
}

function removeTrackingListeners(updateFn) {
  window.removeEventListener('scroll', updateFn, true)
  window.removeEventListener('resize', updateFn)
}

async function toggleNotif() {
  menuOpen.value = false
  notifOpen.value = !notifOpen.value
  if (notifOpen.value) {
    await nextTick()
    updateNotifPosition()
    // اندازه‌گیری دوباره توی فریم بعد، چون بار اول ممکنه فونت/تصویر هنوز لود نشده باشه
    requestAnimationFrame(updateNotifPosition)
    addTrackingListeners(updateNotifPosition)
  } else {
    removeTrackingListeners(updateNotifPosition)
  }
}

async function toggleMenu() {
  notifOpen.value = false
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) {
    await nextTick()
    updateMenuPosition()
    requestAnimationFrame(updateMenuPosition)
    addTrackingListeners(updateMenuPosition)
  } else {
    removeTrackingListeners(updateMenuPosition)
  }
}

function closeNotif() {
  if (!notifOpen.value) return
  notifOpen.value = false
  removeTrackingListeners(updateNotifPosition)
}

function closeMenu() {
  if (!menuOpen.value) return
  menuOpen.value = false
  removeTrackingListeners(updateMenuPosition)
}

function markAllRead() {
  notifications.value.forEach(n => (n.read = true))
}

function openNotification(notif) {
  notif.read = true
  closeNotif()
  if (notif.to) navigateTo(notif.to)
}

// ---- بستن با کلیک بیرون (هم trigger و هم پنل teleport‌شده رو چک می‌کنیم) ----
function handleClickOutside(e) {
  if (
    menuOpen.value &&
    !menuTriggerEl.value?.contains(e.target) &&
    !menuPanelEl.value?.contains(e.target)
  ) {
    closeMenu()
  }
  if (
    notifOpen.value &&
    !notifTriggerEl.value?.contains(e.target) &&
    !notifPanelEl.value?.contains(e.target)
  ) {
    closeNotif()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  removeTrackingListeners(updateNotifPosition)
  removeTrackingListeners(updateMenuPosition)
})

// ---- عنوان صفحه ----
const titleMap = {
  '/dashboard': 'داشبورد',
  '/dashboard/services': 'سرویس‌های من',
  '/dashboard/invoices': 'صورت‌حساب‌ها',
  '/dashboard/tickets': 'تیکت‌های پشتیبانی',
  '/dashboard/tickets/new': 'ثبت تیکت جدید',
  '/dashboard/account': 'حساب کاربری',
  '/dashboard/domains': 'مدیریت دامنه‌ها',
  '/dashboard/domains/renew': 'تمدید دامنه',
  '/dashboard/domains/transfer': 'انتقال دامنه',
  '/dashboard/cdn': 'شبکه توزیع محتوا (CDN)',
  '/dashboard/finance/topup': 'افزایش موجودی کیف پول',
  '/dashboard/finance/gift-card': 'کارت هدیه',
  '/dashboard/affiliate': 'همکاری در فروش',
  '/dashboard/transfer-ownership': 'انتقال مالکیت سرویس'
}

const pageTitle = computed(() => {
  if (titleMap[route.path]) return titleMap[route.path]
  const base = '/' + route.path.split('/').slice(1, 3).join('/')
  return titleMap[base] || 'پنل کاربری'
})

const userInitial = computed(() => {
  return user.value?.first_name?.charAt(0) || user.value?.full_name?.charAt(0) || '؟'
})

const logOut = () => {
  tokenCookie.value = null;
  clearUser();
  if (process.client) localStorage.clear();
  router.replace("/login");
}
</script>

<template>
  <!-- ---- اسکلتون هدر (تا لود شدن اطلاعات کاربر/کیف‌پول) ---- -->
  <header
    v-if="headerLoading"
    class="h-20 glass border-b border-white/10 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20"
  >
    <div class="flex items-center gap-4">
      <div class="lg:hidden w-6 h-6 rounded-md skeleton" />
      <div class="h-6 w-28 sm:w-36 rounded-md skeleton" />
    </div>

    <div class="flex items-center gap-3 sm:gap-4">
      <!-- کیف پول -->
      <div class="flex items-center gap-2 px-3 h-10 rounded-full glass">
        <div class="w-4.5 h-4.5 rounded-full skeleton shrink-0" />
        <div class="hidden md:block h-3.5 w-24 rounded skeleton" />
      </div>

      <!-- اعلانات -->
      <div class="relative w-10 h-10 rounded-full glass flex items-center justify-center">
        <div class="w-5 h-5 rounded-full skeleton" />
      </div>

      <!-- منوی کاربر -->
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-full skeleton shrink-0" />
        <div class="hidden sm:block h-3.5 w-16 rounded skeleton" />
        <div class="w-4 h-4 rounded skeleton" />
      </div>
    </div>
  </header>

  <!-- ---- هدر اصلی ---- -->
  <header v-else class="h-20 glass border-b border-white/10 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
    <div class="flex items-center gap-4">
      <button type="button" class="lg:hidden text-gray-300 hover:text-white transition-colors" @click="sidebarOpen = true">
        <Menu class="w-6 h-6" />
      </button>
      <h1 class="text-lg sm:text-xl font-bold">{{ pageTitle }}</h1>
    </div>

    <div class="flex items-center gap-3 sm:gap-4">
      <NuxtLink
        to="/dashboard/finance/wallet"
        class="flex items-center gap-2 px-3 h-10 rounded-full glass hover:bg-white/20 transition-all group"
      >
        <Wallet class="w-4.5 h-4.5 text-emerald-400" />

        <span class="hidden md:block text-sm font-medium">
        {{ formatNumber(balance) }} تومان
        </span>
        <!-- <span class="hidden md:block text-sm font-medium">
          کیف پول
        </span> -->
      </NuxtLink>

      <!-- اعلانات -->
      <!-- <div class="relative">
        <button
          ref="notifTriggerEl"
          type="button"
          class="relative w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-all"
          @click="toggleNotif"
        >
          <Bell class="w-5 h-5" />
          <span v-if="unreadCount > 0" class="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
        </button>

        <Teleport to="body">
          <Transition name="fade">
            <div
              v-if="notifOpen"
              ref="notifPanelEl"
              class="dropdown-panel rounded-xl overflow-hidden text-sm"
              :style="notifPanelStyle"
            >
              <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span class="font-bold">اعلانات</span>
                <button
                  v-if="unreadCount > 0"
                  type="button"
                  class="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  @click="markAllRead"
                >
                  <CheckCheck class="w-3.5 h-3.5" />
                  خواندن همه
                </button>
              </div>

              <div class="max-h-80 overflow-y-auto scrollbar-thin">
                <template v-if="notifications.length">
                  <button
                    v-for="notif in notifications"
                    :key="notif.id"
                    type="button"
                    class="w-full flex items-start gap-3 px-4 py-3 text-right hover:bg-white/10 transition-all"
                    :class="{ 'opacity-60': notif.read }"
                    @click="openNotification(notif)"
                  >
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="notif.color">
                      <component :is="notif.icon" class="w-4.5 h-4.5" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-white">{{ notif.title }}</span>
                        <span v-if="!notif.read" class="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                      </div>
                      <p class="text-gray-400 text-xs mt-0.5 truncate">{{ notif.text }}</p>
                      <span class="text-gray-500 text-[11px] mt-1 block">{{ notif.time }}</span>
                    </div>
                  </button>
                </template>
                <div v-else class="py-10 text-center text-gray-500">
                  <Bell class="w-8 h-8 mx-auto mb-2 opacity-40" />
                  اعلان جدیدی ندارید
                </div>
              </div>

              <div class="border-t border-white/10 p-2">
                <NuxtLink
                  to="/dashboard/notifications"
                  class="block text-center px-4 py-2 rounded-lg hover:bg-white/10 text-purple-400 transition-all"
                  @click="closeNotif"
                >
                  مشاهده همه اعلانات
                </NuxtLink>
              </div>
            </div>
          </Transition>
        </Teleport>
      </div> -->

      <!-- منوی کاربر -->
      <div class="relative">
        <button ref="menuTriggerEl" type="button" class="flex items-center gap-2" @click="toggleMenu">
          <div class="w-9 h-9 rounded-full overflow-hidden bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
            <img
              v-if="user?.photo"
              :src="user.photo"
              :alt="user?.full_name"
              class="w-full h-full object-cover"
            />
            <span v-else>{{ userInitial }}</span>
          </div>

          <span class="hidden sm:block text-sm">{{ user?.full_name || 'کاربر' }}</span>
          <ChevronDown class="w-4 h-4 text-gray-400 transition-transform" :class="{ 'rotate-180': menuOpen }" />
        </button>

        <Teleport to="body">
          <Transition name="fade">
            <div
              v-if="menuOpen"
              ref="menuPanelEl"
              class="dropdown-panel rounded-xl p-2 text-sm"
              :style="menuPanelStyle"
              @click="closeMenu"
            >
              <NuxtLink to="/dashboard/account" class="block px-4 py-2 rounded-lg hover:bg-white/10 transition-all">حساب کاربری</NuxtLink>
              <NuxtLink to="/" class="block px-4 py-2 rounded-lg hover:bg-white/10 transition-all">بازگشت به سایت</NuxtLink>
              <button @click="logOut" type="button" class="w-full text-right px-4 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all">خروج</button>
            </div>
          </Transition>
        </Teleport>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* پنل دراپ‌داون با بکگراند و بلور صریح */
.dropdown-panel {
  background: rgba(31, 31, 61, 0.897);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 50;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ---- اسکلتون ---- */
.skeleton {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.14),
    transparent
  );
  animation: shimmer 1.6s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton::after {
    animation: none;
  }
}
</style>