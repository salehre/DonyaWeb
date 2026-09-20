<script setup>
import { reactive, watch } from 'vue'
import {
  Home, ShoppingCart, Settings, Server, Globe, Cpu, Network, Wallet, FileText,
  CreditCard, Gift, LifeBuoy, Users, Repeat, ChevronDown, LogOut, X,
  FileTextIcon
} from 'lucide-vue-next'

const sidebarOpen = useState('dashboardSidebarOpen', () => false)
const route = useRoute()
const router = useRouter()

// احراز هویت
const { clearUser } = useUserInfo()
const tokenCookie = useCookie("donyaweb_auth_token");

const navItems = [
  { type: 'link', label: 'صفحه کاربری', to: '/dashboard', icon: Home },
  { type: 'link', label: 'خرید جدید', to: '/start', icon: ShoppingCart },
  { type: 'link', label: 'همه سرویس‌ها', to: { path: '/dashboard/services', query: {} }, icon: Settings },
  // {
  //   type: 'group',
  //   key: 'domains',
  //   label: 'دامنه‌ها',
  //   icon: Globe,
  //   children: [
  //     { type: 'link', label: 'مدیریت دامنه‌ها', to: '/dashboard/domains' },
  //     { type: 'link', label: 'ثبت دامنه جدید', to: '/domain' },
  //     { type: 'link', label: 'تمدید دامنه', to: '/dashboard/domains/renew' },
  //     { type: 'link', label: 'انتقال دامنه', to: '/dashboard/domains/transfer' }
  //   ]
  // },
  // {
  //   type: 'group',
  //   key: 'hosting',
  //   label: 'هاست',
  //   icon: Server,
  //   children: [
  //     { type: 'link', label: 'مدیریت هاست', to: { path: '/dashboard/services', query: { type: 'hosting' } } },
  //     { type: 'link', label: 'خرید هاست جدید', to: '/cloudhosting' }
  //   ]
  // },
  // {
  //   type: 'group',
  //   key: 'vps',
  //   label: 'VPS',
  //   icon: Cpu,
  //   children: [
  //     { type: 'link', label: 'مدیریت VPS', to: { path: '/dashboard/services', query: { type: 'vps' } } },
  //     { type: 'link', label: 'خرید VPS جدید', to: '/vps' }
  //   ]
  // },
  // { type: 'link', label: 'شبکه توزیع محتوا (CDN)', to: '/dashboard/cdn', icon: Network },
  {
    type: 'group',
    key: 'finance',
    label: 'مالی',
    icon: Wallet,
    children: [
      { type: 'link', label: 'کیف پول', to: '/dashboard/finance/wallet', icon: Wallet },
      { type: 'link', label: 'فهرست خرید', to: '/dashboard/invoices', icon: FileText },
      { type: 'link', label: 'فاکتورها', to: '/dashboard/purchaserecords', icon: FileTextIcon }
      // { type: 'link', label: 'کارت هدیه', to: '/dashboard/finance/gift-card', icon: Gift },
    ]
  },
  { type: 'link', label: 'پشتیبانی', to: '/dashboard/tickets', icon: LifeBuoy, prefix: true },
  // { type: 'link', label: 'همکاری در فروش', to: '/dashboard/affiliate', icon: Users },
  // { type: 'link', label: 'انتقال مالکیت سرویس', to: '/dashboard/transfer-ownership', icon: Repeat }
]

const openGroups = reactive({
  domains: false,
  hosting: false,
  vps: false,
  finance: false
})

function toggleGroup(key) {
  openGroups[key] = !openGroups[key]
}

function isActive(item) {
  const to = item.to

  if (typeof to === 'object') {
    if (route.path !== to.path) return false
    const expected = to.query || {}
    const keys = new Set([...Object.keys(expected), ...Object.keys(route.query)])
    return [...keys].every((key) => (expected[key] ?? '') === (route.query[key] ?? ''))
  }

  const path = to.split('?')[0]
  if (path === '/dashboard') return route.path === path

  if (item.prefix) {
    return route.path === path || route.path.startsWith(path + '/')
  }

  return route.path === path
}

function groupHasActiveChild(children) {
  return children.some((c) => isActive(c))
}

watch(
  () => route.path,
  () => {
    navItems.forEach((item) => {
      if (item.type === 'group' && groupHasActiveChild(item.children)) {
        openGroups[item.key] = true
      }
    })
  },
  { immediate: true }
)

function closeMobileSidebar() {
  sidebarOpen.value = false
}

const logOut = () => {
  tokenCookie.value = null;
  clearUser();
  if (process.client) localStorage.clear();
  router.replace("/login");
}
</script>

<template>
  <!-- بک‌دراپ موبایل -->
  <Transition name="fade">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
      @click="closeMobileSidebar"
    />
  </Transition>

  <aside
    class="fixed top-0 right-0 h-dvh w-72 glass border-l border-white/10 z-40 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 will-change-transform"
    :class="sidebarOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- هدر سایدبار -->
    <div class="flex items-center justify-between h-20 px-5 border-b border-white/10 shrink-0">
      <NuxtLink to="/" class="flex items-center gap-2.5 group" @click="closeMobileSidebar">
        <div class="w-20 flex items-center justify-center group-hover:scale-[1.02] transition-transform">
          <NuxtImg src="/logo.png" cover alt="دنیا وب" />
        </div>
        <span class="font-bold text-base">دنیا وب</span>
      </NuxtLink>

      <button
        type="button"
        class="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        @click="sidebarOpen = false"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- منو -->
    <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
      <template v-for="item in navItems" :key="item.label">
        <!-- لینک ساده -->
        <NuxtLink
          v-if="item.type === 'link'"
          :to="item.to"
          class="nav-link group"
          :class="isActive(item) ? 'nav-link-active' : 'nav-link-inactive'"
          @click="closeMobileSidebar"
        >
          <div class="nav-link-icon">
            <component :is="item.icon" class="w-5 h-5" />
          </div>
          <span class="truncate">{{ item.label }}</span>
        </NuxtLink>

        <!-- گروه -->
        <div v-else class="group-wrapper">
          <button
            type="button"
            class="nav-group-btn"
            :class="groupHasActiveChild(item.children) ? 'nav-group-btn-active' : 'nav-group-btn-inactive'"
            :aria-expanded="openGroups[item.key]"
            @click="toggleGroup(item.key)"
          >
            <span class="flex items-center gap-3 min-w-0">
              <div class="nav-link-icon">
                <component :is="item.icon" class="w-5 h-5" />
              </div>
              <span class="truncate">{{ item.label }}</span>
            </span>

            <ChevronDown
              class="w-4 h-4 shrink-0 transition-transform duration-300 ease-out"
              :class="openGroups[item.key] ? 'rotate-180' : ''"
            />
          </button>

          <!-- زیرمنو -->
          <div
            class="grid transition-all duration-300 ease-out"
            :class="openGroups[item.key] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
          >
            <div class="overflow-hidden">
              <div class="submenu-wrapper">
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.label"
                  :to="child.to"
                  class="submenu-link"
                  :class="isActive(child) ? 'submenu-link-active' : 'submenu-link-inactive'"
                  @click="closeMobileSidebar"
                >
                  <span class="submenu-dot" :class="isActive(child) ? 'submenu-dot-active' : ''" />
                  <span class="truncate">{{ child.label }}</span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </template>
    </nav>

    <!-- فوتر سایدبار -->
    <div class="p-3 border-t border-white/10 space-y-1.5 shrink-0">
      <NuxtLink
        to="/"
        class="nav-link nav-link-inactive"
        @click="closeMobileSidebar"
      >
        <div class="nav-link-icon">
          <Home class="w-5 h-5" />
        </div>
        <span>بازگشت به سایت</span>
      </NuxtLink>

      <button @click="logOut"
        type="button"
        class="nav-link text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all w-full"
      >
        <div class="nav-link-icon">
          <LogOut class="w-5 h-5" />
        </div>
        <span>خروج از حساب</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-glass {
  background: rgba(12, 12, 20, 0.3);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  box-shadow: 0 10px 60px -15px rgba(0, 0, 0, 0.5);
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.875rem;
  border-radius: 0.875rem;
  font-size: 0.925rem;
  line-height: 1.5;
  transition: all 150ms ease-out;
  outline: none;
}

.nav-link:focus-visible {
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.45);
}

.nav-link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  transition: transform 150ms ease-out;
}

.nav-link-inactive {
  color: rgb(156, 163, 175);
}

.nav-link-inactive:hover {
  color: rgb(255, 255, 255);
  background: rgba(255, 255, 255, 0.07);
}

.nav-link-inactive:hover .nav-link-icon {
  transform: translateY(-1px);
}

.nav-link-active {
  color: rgb(255, 255, 255);
  background: radial-gradient(120% 120% at 100% 0%, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.18) 100%);
  border: 1px solid rgba(139, 92, 246, 0.35);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05) inset,
              0 10px 40px -12px rgba(124, 58, 237, 0.45);
}

.nav-link-active::before {
  content: '';
  position: absolute;
  right: 0.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 1.25rem;
  border-radius: 999px;
  background: linear-gradient(to bottom, rgb(168, 85, 247), rgb(59, 130, 246));
}

.nav-group-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.875rem;
  border-radius: 0.875rem;
  font-size: 0.925rem;
  transition: all 150ms ease-out;
  outline: none;
}

.nav-group-btn:focus-visible {
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.45);
}

.nav-group-btn-inactive {
  color: rgb(156, 163, 175);
}

.nav-group-btn-inactive:hover {
  color: rgb(255, 255, 255);
  background: rgba(255, 255, 255, 0.07);
}

.nav-group-btn-active {
  color: rgb(255, 255, 255);
  background: rgba(139, 92, 246, 0.12);
}

.submenu-wrapper {
  margin-right: 0.625rem;
  padding-right: 0.625rem;
  margin-top: 0.375rem;
  margin-bottom: 0.25rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.submenu-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  transition: all 150ms ease-out;
  outline: none;
}

.submenu-link:focus-visible {
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.45);
}

.submenu-link-inactive {
  color: rgb(156, 163, 175);
}

.submenu-link-inactive:hover {
  color: rgb(255, 255, 255);
  background: rgba(255, 255, 255, 0.07);
}

.submenu-link-active {
  color: rgb(255, 255, 255);
  background: radial-gradient(120% 120% at 100% 0%, rgba(139, 92, 246, 0.18) 0%, rgba(59, 130, 246, 0.14) 100%);
  border: 1px solid rgba(139, 92, 246, 0.28);
}

.submenu-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
  transition: all 150ms ease-out;
}

.submenu-dot-active {
  background: linear-gradient(to bottom, rgb(168, 85, 247), rgb(59, 130, 246));
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.25);
  scale: 1.1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>