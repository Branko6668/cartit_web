<template>
  <div class="hero" :style="{ height: height + 'px' }">
    <div class="slides" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
      <div class="slide" v-for="(item, i) in items" :key="i">
        <img :src="item.image" :alt="item.alt || `banner-${i}`" />
      </div>
    </div>
    <div class="dots">
      <span
        v-for="(item, i) in items"
        :key="i"
        :class="['dot', { active: i === currentIndex }]"
        @mouseenter="onDotEnter(i)"
        @mouseleave="onDotLeave"
      ></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] }, // [{image, alt, link?}]
  interval: { type: Number, default: 3500 },
  height: { type: Number, default: 420 }
})

const currentIndex = ref(0)
let timer = null
let pausedByDot = false

const start = () => {
  stop()
  if (props.items.length > 1) {
    timer = setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % props.items.length
    }, props.interval)
  }
}
const stop = () => { if (timer) { clearInterval(timer); timer = null } }
const go = (i) => { currentIndex.value = i; start() }

const onDotEnter = (i) => {
  pausedByDot = true
  stop()
  currentIndex.value = i
}
const onDotLeave = () => {
  pausedByDot = false
  start()
}

onMounted(start)
watch(() => props.items, start, { deep: true })
onBeforeUnmount(stop)
</script>

<style lang="less" scoped>
.hero {
  position: relative; overflow: hidden; border-radius: var(--border-radius-md);
  width: 100%; background: var(--color-bg-secondary);
}
.slides { display: flex; transition: transform .4s ease; height: 100%; }
.slide { min-width: 100%; height: 100%; }
.slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dots { position: absolute; left: 0; right: 0; bottom: 10px; display: flex; justify-content: center; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.6); cursor: pointer; }
.dot.active { background: var(--color-primary); }
</style>
