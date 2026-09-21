<script setup>
const sidebarOpen = useState('dashboardSidebarOpen', () => false)

// موجودی کیف پول در Topbar نشان داده می‌شود؛ با ورود به داشبورد از API تازه گرفته می‌شود
const { fetchBalance } = useWallet()

onMounted(() => {
  fetchBalance(true)
})
</script>

<template>
  <div class="relative bg-slate-900 text-white min-h-screen">
    <div class="fixed inset-0 -z-10 overflow-hidden">
      <BackgroundBlobs />
    </div>

    <DashboardSidebar />

    <div class="lg:mr-72 min-h-screen flex flex-col">
      <DashboardTopbar />
      <main class="flex-1 p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/60 z-30 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>