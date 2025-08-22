<template>
  <div class="marquee-wrap" v-if="baseItems.length">
    <!-- 新品标识 -->
    <div class="label-new" aria-label="新品">
      <span class="dot"></span>
      <span class="text">新品</span>
    </div>
    <div class="marquee">
      <div class="marquee-track" :style="{ animationDuration: duration + 's' }">
        <ul class="marquee-list">
          <li v-for="p in baseItems" :key="'a-'+p.id" class="marquee-item">
            <img :src="p.image" :alt="p.name" class="thumb" />
            <div class="name" :title="p.name">{{ p.name }}</div>
            <div class="price">￥{{ formatPrice(p.price) }}</div>
          </li>
        </ul>
        <!-- 无缝拷贝一份，形成连续循环 -->
        <ul class="marquee-list">
          <li v-for="p in baseItems" :key="'b-'+p.id" class="marquee-item">
            <img :src="p.image" :alt="p.name" class="thumb" />
            <div class="name" :title="p.name">{{ p.name }}</div>
            <div class="price">￥{{ formatPrice(p.price) }}</div>
          </li>
        </ul>
      </div>
    </div>
  <!-- 左侧直边遮挡（A4割纸效果） -->
  <div class="left-mask" aria-hidden="true"></div>
  <div class="right-fade" aria-hidden="true"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  speed: { type: Number, default: 40 }, // px/s
})

// 基础项：仅前 20 个
const baseItems = computed(() => {
  return Array.isArray(props.items) ? props.items.slice(0, 20) : []
})

// 根据卡片宽度估算一轮滚动时长，保持连续且不闪现
const CARD_W = 180
const GAP = 22
const duration = computed(() => {
  const count = baseItems.value.length
  if (!count) return 30
  const oneTrackWidth = count * (CARD_W + GAP)
  const pxPerSec = Math.max(20, props.speed)
  return Math.max(10, Math.round(oneTrackWidth / pxPerSec))
})

const formatPrice = (v) => {
  const n = Number(v)
  if (Number.isNaN(n)) return v
  return n.toFixed(2)
}
</script>

<style scoped>
.marquee-wrap {
  width: var(--content-width);
  margin: var(--spacing-xl) auto 0; /* 与上方模块拉开距离 */
  position: relative;
  overflow: hidden;
}
.marquee {
  width: 100%;
  overflow: hidden; /* 只显示一行 */
}
.marquee-track {
  display: flex;
  align-items: stretch;
  width: max-content;
  animation-name: marquee-right; /* 改为从左往右 */
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.marquee-list {
  display: flex;
  flex-wrap: nowrap; /* 强制单行 */
  gap: 22px;
  padding: 14px 0;
  margin: 0;
  list-style: none;
}
.marquee-item {
  width: 180px; /* 固定宽度避免折行 */
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-bg);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  padding: 10px 10px 12px;
  transition: transform .2s ease, box-shadow .2s ease;
}
.thumb {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--color-divider);
}
.name {
  margin-top: 10px;
  font-size: 14px;
  color: var(--color-text);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.price {
  margin-top: 6px;
  font-size: 16px;
  color: var(--color-primary);
  font-weight: 700;
  background: rgba(255, 125, 0, 0.08);
  border: 1px solid rgba(255, 125, 0, 0.2);
  padding: 2px 8px;
  border-radius: 999px;
}
.marquee-item:hover {
  transform: translateY(-2px);
  /* 柔和的黄/粉/紫背景光，替代黑色阴影 */
  box-shadow:
    0 8px 18px rgba(255, 224, 130, 0.35),   /* 淡黄 */
    0 12px 28px rgba(255, 171, 190, 0.20),  /* 粉色 */
    0 16px 36px rgba(195, 168, 255, 0.30);  /* 淡紫 */
}
/* 左右渐隐 */
.right-fade {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 140px;
  background: linear-gradient(270deg, var(--color-bg), rgba(255,255,255,0));
  z-index: 2;
  pointer-events: none;
}

/* 左侧直边白色遮挡 */
.left-mask {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 120px; /* 直边宽度，可按需调整 */
  background: var(--color-bg);
  z-index: 2;
  pointer-events: none;
  box-shadow: 16px 0 24px -12px rgba(0,0,0,0.25); /* 更明显的右侧阴影 */
}
.label-new {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 10px;
  background: linear-gradient(135deg, #ff9a6b, #c3a8ff);
  color: #fff;
  border-radius: 9999px;
  z-index: 3; /* 高于 left-mask */
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 8px 20px rgba(255, 125, 0, 0.25), inset 0 0 0 1px rgba(255,255,255,0.35);
  pointer-events: none; /* 不拦截交互 */
}
.label-new .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.95);
  box-shadow: 0 0 8px rgba(255,255,255,0.5);
}
.label-new .text { line-height: 1; }

/* 从左往右滚动 */
@keyframes marquee-right {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}
</style>
