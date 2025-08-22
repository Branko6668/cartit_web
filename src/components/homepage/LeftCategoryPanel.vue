<template>
  <div class="left-panel" @mouseleave="resetHover" :style="panelStyle" ref="containerRef">
    <ul class="level1">
      <li
        v-for="(l1, i) in level1"
        :key="l1.id"
        :class="[itemClass(l1), { 'is-active': hover.l1 === i }]"
        @mouseenter="onEnterL1(i, l1)"
        :ref="(el) => setL1ItemRef(i, el)"
      >
        <span class="l1-name">{{ l1.name }}</span>

        <!-- 二级面板 -->
        <div
          class="panel level2"
          v-if="hover.l1 === i"
          :ref="setL2PanelEl"
          :style="{
            top: l2Pos.top + 'px',
            width: l2Pos.width + 'px'
          }"
        >
          <div v-if="loading.l2" class="loading">加载中...</div>
          <div v-else-if="(l2Map[l1.id] || []).length === 0" class="empty">暂无分类</div>
          <ul v-else class="l2-list"
            :style="{
              columnWidth: l2Metrics.colWidth + 'px',
              columnGap: l2Metrics.gap + 'px',
              columnCount: l2Metrics.cols
            }">
            <li v-for="(l2, j) in (l2Map[l1.id] || [])" :key="l2.id" @mouseenter="onEnterL2(j, l2)" :ref="(el) => setL2ItemRef(j, el)">
              <span class="l2-name">{{ l2.name }}</span>
            </li>
          </ul>
        </div>
      </li>
    </ul>
    <!-- 独立的三级面板（浮层） -->
    <div
      v-if="active.l2Id"
      class="panel level3 floating"
      :ref="setL3PanelEl"
      :style="{ top: l3Abs.top + 'px', left: l3Abs.left + 'px', width: l3Pos.width + 'px' }"
    >
  <div v-if="loading.l3" class="loading">加载中...</div>
  <div v-else-if="(l3Map[active.l2Id] || []).length === 0" class="empty">暂无子分类</div>
  <ul v-else class="l3-list" :style="{ columnWidth: l3Metrics.colWidth + 'px', columnGap: l3Metrics.gap + 'px', columnCount: l3Metrics.cols }">
        <li v-for="l3 in (l3Map[active.l2Id] || [])" :key="l3.id">
          <a href="#" @click.prevent="$emit('navigate', l3)">{{ l3.name }}</a>
        </li>
      </ul>
    </div>
  </div>
  
</template>

<script setup>
import { reactive, computed, ref, nextTick } from 'vue'

const props = defineProps({
  level1: { type: Array, default: () => [] },
  fetchL2: { type: Function, required: true },
  fetchL3: { type: Function, required: true },
  height: { type: Number, default: 420 }
})

const hover = reactive({ l1: -1, l2: -1 })
const loading = reactive({ l2: false, l3: false })
const l2Map = reactive({})
const l3Map = reactive({})
defineEmits(['navigate'])

// Refs
const containerRef = ref(null)
const l1ItemRefs = ref([])
const setL1ItemRef = (i, el) => { l1ItemRefs.value[i] = el }
const l2ItemRefs = ref([])
const setL2ItemRef = (i, el) => { l2ItemRefs.value[i] = el }
const l2PanelRef = ref(null)
const l3PanelRef = ref(null)
const setL2PanelEl = (el) => { l2PanelRef.value = el && el.$el ? el.$el : el }
const setL3PanelEl = (el) => { l3PanelRef.value = el && el.$el ? el.$el : el }

// Layout state
const l2Pos = reactive({ top: 0, height: 0, width: 320 })
const l3Pos = reactive({ top: 0, left: 0, maxHeight: 0, width: 340 })
const l3Abs = reactive({ top: 0, left: 0 })
const l2Metrics = reactive({ colWidth: 160, minColWidth: 90, maxColWidth: 180, gap: 8, paddingX: 8, paddingY: 8, cols: 1 })
const l3Metrics = reactive({ colWidth: 140, minColWidth: 90, maxColWidth: 180, gap: 8, paddingX: 8, paddingY: 8, cols: 1 })
const active = reactive({ l1Id: null, l2Id: null })

const updateL2Position = async (i) => {
  await nextTick()
  const container = containerRef.value
  const l1El = l1ItemRefs.value[i]
  const panel = l2PanelRef.value
  if (!container || !l1El || !panel || typeof panel.getBoundingClientRect !== 'function') return

  const viewportH = window.innerHeight
  const viewportW = window.innerWidth
  const margin = 8
  const l1Rect = l1El.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()

  let topInViewport = l1Rect.top
  const maxTop = Math.max(margin, viewportH - panelRect.height - margin)
  topInViewport = Math.min(Math.max(topInViewport, margin), maxTop)
  l2Pos.top = topInViewport - l1Rect.top

  const heightLimit = Math.min(props.height, viewportH - margin * 2)
  l2Pos.height = heightLimit

  const list = (l2Map[active.l1Id] || [])

  // Measure one LI height
  let liH = 24
  const firstLi = panel.querySelector('.l2-list li')
  if (firstLi) {
    const r = firstLi.getBoundingClientRect()
    if (r && r.height) liH = r.height
  }

  // Measure max text width
  let maxText = 0
  const nameNodes = panel.querySelectorAll('.l2-name')
  nameNodes.forEach(n => { const r = n.getBoundingClientRect(); if (r && r.width) maxText = Math.max(maxText, r.width) })
  const desiredColW = Math.max(l2Metrics.minColWidth, Math.min(l2Metrics.maxColWidth, Math.ceil(maxText + 8)))

  const availableWidth = Math.max(240, viewportW - l1Rect.right - margin)
  const maxColsByWidth = Math.max(1, Math.floor((availableWidth - l2Metrics.paddingX * 2 + l2Metrics.gap) / (desiredColW + l2Metrics.gap)))

  let cols = 1
  if (list.length > 0) {
    cols = Math.max(1, Math.ceil((list.length * liH) / l2Pos.height))
    cols = Math.min(cols, maxColsByWidth)
    let rows = Math.ceil(list.length / cols)
    let contentH = rows * liH + l2Metrics.paddingY * 2
    while (contentH > l2Pos.height && cols < maxColsByWidth) {
      cols++
      rows = Math.ceil(list.length / cols)
      contentH = rows * liH + l2Metrics.paddingY * 2
    }
    // shrink height to content if shorter
    l2Pos.height = Math.min(l2Pos.height, contentH)
  }

  l2Metrics.cols = cols
  l2Metrics.colWidth = desiredColW
  l2Pos.width = l2Metrics.paddingX * 2 + cols * desiredColW + (cols - 1) * l2Metrics.gap
}

const updateL3Position = async (j) => {
  await nextTick()
  const l2El = l2ItemRefs.value[j]
  const panel = l3PanelRef.value
  const l2Panel = l2PanelRef.value
  if (!l2El || !panel || !l2Panel || typeof panel.getBoundingClientRect !== 'function') return

  const viewportH = window.innerHeight
  const viewportW = window.innerWidth
  const margin = 8
  const l2ItemRect = l2El.getBoundingClientRect()
  const l2PanelRect = l2Panel.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()

  let topInViewport = l2ItemRect.top
  const maxTop = Math.max(margin, viewportH - panelRect.height - margin)
  topInViewport = Math.min(Math.max(topInViewport, margin), maxTop)
  l3Pos.top = topInViewport - l2ItemRect.top
  l3Pos.maxHeight = Math.min(viewportH - margin * 2, props.height)

  const containerRect = containerRef.value.getBoundingClientRect()
  const list = (l3Map[active.l2Id] || [])

  // measure li height
  let liH = 20
  const firstLi = panel.querySelector('.l3-list li')
  if (firstLi) { const r = firstLi.getBoundingClientRect(); if (r && r.height) liH = r.height }

  // max link width
  let maxText = 0
  const linkNodes = panel.querySelectorAll('.l3-list a')
  linkNodes.forEach(n => { const r = n.getBoundingClientRect(); if (r && r.width) maxText = Math.max(maxText, r.width) })
  const desiredColW = Math.max(l3Metrics.minColWidth, Math.min(l3Metrics.maxColWidth, Math.ceil(maxText + 8)))

  const spaceRight = viewportW - l2PanelRect.right - margin
  const spaceLeft = l2PanelRect.left - margin
  const willOverflowRight = spaceRight < (desiredColW + l3Metrics.gap) + l3Metrics.paddingX * 2
  const openLeft = willOverflowRight && spaceLeft > spaceRight
  const availableWidth = openLeft ? spaceLeft : spaceRight
  const maxColsByWidth = Math.max(1, Math.floor((availableWidth - l3Metrics.paddingX * 2 + l3Metrics.gap) / (desiredColW + l3Metrics.gap)))

  let cols = Math.max(1, Math.ceil((list.length * liH) / l3Pos.maxHeight))
  cols = Math.min(cols, maxColsByWidth)
  let rows = Math.ceil(list.length / cols)
  let contentH = rows * liH + l3Metrics.paddingY * 2
  while (contentH > l3Pos.maxHeight && cols < maxColsByWidth) {
    cols++
    rows = Math.ceil(list.length / cols)
    contentH = rows * liH + l3Metrics.paddingY * 2
  }

  l3Metrics.cols = cols
  l3Metrics.colWidth = desiredColW
  l3Pos.width = l3Metrics.paddingX * 2 + cols * desiredColW + (cols - 1) * l3Metrics.gap

  const leftAbs = openLeft ? (l2PanelRect.left - l3Pos.width) : (l2PanelRect.right)
  l3Abs.left = leftAbs - containerRect.left
  l3Abs.top = topInViewport - containerRect.top
}

const onEnterL1 = async (i, l1) => {
  hover.l1 = i; hover.l2 = -1
  active.l1Id = l1.id; active.l2Id = null
  l2ItemRefs.value = []
  if (!l2Map[l1.id]) {
    loading.l2 = true
    try {
      const res = await props.fetchL2(l1)
      if (Array.isArray(res)) l2Map[l1.id] = res
    } finally {
      loading.l2 = false
    }
  }
  updateL2Position(i)
}

const onEnterL2 = async (j, l2) => {
  hover.l2 = j
  active.l2Id = l2.id
  if (!l3Map[l2.id]) {
    loading.l3 = true
    try {
      const res = await props.fetchL3(l2)
      if (Array.isArray(res)) l3Map[l2.id] = res
    } finally {
      loading.l3 = false
    }
  }
  updateL3Position(j)
}

const resetHover = () => { hover.l1 = -1; hover.l2 = -1; active.l1Id = null; active.l2Id = null }
const panelStyle = computed(() => ({ height: props.height + 'px' }))
const isShortName = (name) => (name || '').replace(/\s/g, '').length <= 4
const itemClass = (l1) => isShortName(l1.name) ? 'short' : 'long'
</script>

<style lang="less" scoped>
.left-panel {
  width: 260px;
  background: transparent; // 不显示框
  border: none;
  position: relative;
}
.level1 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)); // 两列混排
  gap: 6px 10px;
  list-style: none; // 去掉前置小点
  padding: 0;
  margin: 0;
}
.level1 > li {
  position: relative;
  padding: 6px 4px;
  cursor: default;
}
.level1 > li.short { grid-column: span 1; }
.level1 > li.long { grid-column: 1 / -1; }
.level1 > li:hover .l1-name { color: var(--color-primary) }
/* 关联引导提示：在激活的一级项右侧画一个小箭头，指向二级面板 */
.level1 > li.is-active::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
  width: 0; height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 6px solid var(--color-divider);
}
.level1 > li.is-active::before {
  content: '';
  position: absolute;
  top: 50%;
  right: -7px;
  transform: translateY(-50%);
  width: 0; height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 7px solid var(--color-bg);
}
.panel.level2 {
  position: absolute; top: 0; left: 100%;
  background: var(--color-bg);
  border: 1px solid var(--color-divider);
  box-shadow: var(--shadow-sm);
  z-index: 10;
  overscroll-behavior: contain;
  min-width: 160px;
  min-height: 120px;
  /* 创建到三级面板的无缝桥接，避免鼠标经过间隙导致失焦 */
}
.panel.level2::after {
  content: '';
  position: absolute;
  top: 0; right: -8px;
  width: 8px; height: 100%;
}
.panel.level3.floating::before {
  content: '';
  position: absolute;
  top: 0; left: -8px;
  width: 8px; height: 100%;
}
.panel.level2 ul { padding: 8px 8px; margin: 0; list-style: none }
.panel.level2 li { position: relative; padding: 2px 6px; break-inside: avoid; line-height: 24px; font-size: 13px; }
.panel.level2 li:hover { background: var(--color-bg-secondary) }
.panel.level2 .l2-list { column-fill: auto; }
.panel.level3 {
  position: absolute; top: 0; left: 100%;
  max-width: 440px;
  background: var(--color-bg);
  border: 1px solid var(--color-divider);
  box-shadow: var(--shadow-sm);
  z-index: 20;
  padding: 8px 8px;
  overscroll-behavior: contain;
  min-width: 160px;
  min-height: 120px;
}
.panel.level3.floating { position: absolute; margin-left: 0; }
.loading { padding: 12px; color: var(--color-text-secondary); font-size: var(--font-size-sm) }
.empty { padding: 12px; color: var(--color-text-secondary); font-size: var(--font-size-sm); }
.panel.level3 .l3-list { list-style: none; margin: 0; padding: 0; column-fill: auto; }
.panel.level3 .l3-list li { break-inside: avoid; padding: 1px 4px; line-height: 22px; }
.panel.level3 a { color: var(--color-text-secondary); font-size: 13px; line-height: 20px; display: inline-block; }
.panel.level3 a:hover { color: var(--color-primary); text-decoration: underline }
</style>
