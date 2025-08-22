<template>
  <button v-show="visible" class="back-top" @click="scrollToTop" aria-label="回到顶部">
    ↑
  </button>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const visible = ref(false)

function onScroll() {
  visible.value = (window.pageYOffset || document.documentElement.scrollTop || 0) > 400
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.back-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--color-primary, #ff7d00);
  background: rgba(255, 125, 0, 0.08);
  color: var(--color-primary, #ff7d00);
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  z-index: 1000;
}
.back-top:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
  background: rgba(255, 125, 0, 0.16);
}
</style>
