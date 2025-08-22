<template>
  <section class="tag-grid-wrap">
    <div class="tag-tabs" role="tablist">
      <button
        v-for="t in tags"
        :key="t.id"
        class="tag-tab"
        :class="{ active: t.id === activeTag }"
        role="tab"
        :aria-selected="t.id === activeTag"
        @click="onSelectTag(t.id)"
      >
        {{ t.label }}
      </button>
    </div>

    <div class="grid-area" :aria-busy="isLoading ? 'true' : 'false'">
      <div v-if="isLoading" class="grid-skeleton">
        <div v-for="i in 10" :key="i" class="card-skeleton"></div>
      </div>
      <div v-else class="grid">
        <article v-for="p in currentItems" :key="p.id" class="card">
          <div class="thumb-wrap">
            <img :src="p.image" :alt="p.name" />
          </div>
          <div class="info">
            <h4 class="title" :title="p.name">{{ p.name }}</h4>
            <div class="meta">
              <span class="price">￥{{ formatPrice(p.price) }}</span>
            </div>
          </div>
        </article>
      </div>
      <div v-if="!isLoading && currentItems.length === 0" class="empty">暂无数据</div>
    </div>

    <div class="actions">
      <button class="change-btn" @click="onChangeBatch" :disabled="isLoading">换一批</button>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getProductsByTag } from '@/network/home'

const tags = [
  { id: 2, label: '热销爆款' },
  { id: 3, label: '显示优惠' },
  { id: 4, label: '人气精选' },
  { id: 5, label: '推荐好物' },
  { id: 6, label: '季节必备' },
  { id: 7, label: '特价清仓' },
  { id: 8, label: '多件优惠' },
]

const activeTag = ref(tags[0].id)
const isLoading = ref(false)
// 每个 tag 的当前页；默认都从 1 开始
const pages = reactive({})
// 缓存当前页的数据以减少闪屏
const itemsByTag = reactive({})
const PAGE_SIZE = 20

const currentItems = computed(() => itemsByTag[activeTag.value] || [])

function formatPrice(v) {
  const n = Number(v)
  return Number.isNaN(n) ? v : n.toFixed(2)
}

async function fetchPage(tagId, page) {
  isLoading.value = true
  try {
    const r = await getProductsByTag(tagId, page)
    if (r && (r.code === 2000 || r.code === 200)) {
      const list = (r.data || []).map((it, idx) => ({
        id: it.id ?? `${tagId}-${page}-${idx}`,
        name: it.name || it.title || '未命名商品',
        image: it.image_url || it.image || it.cover || it.pic_url || it.pic || '',
        price: Number(it.price ?? it.sale_price ?? it.min_price ?? 0),
      }))
      itemsByTag[tagId] = list
      pages[tagId] = page
      return list
    }
  } catch (e) {
    // noop
  } finally {
    isLoading.value = false
  }
  itemsByTag[tagId] = []
  return []
}

async function ensureFirstLoad(tagId) {
  if (!pages[tagId]) pages[tagId] = 1
  if (!itemsByTag[tagId]) await fetchPage(tagId, 1)
}

function onSelectTag(tagId) {
  activeTag.value = tagId
}

async function onChangeBatch() {
  const tagId = activeTag.value
  const currPage = pages[tagId] || 1
  const currLen = (itemsByTag[tagId]?.length) || 0
  const isLastPage = currLen > 0 && currLen < PAGE_SIZE
  const targetPage = isLastPage ? 1 : (currPage + 1)
  // 先跳到目标页
  const list = await fetchPage(tagId, targetPage)
  // 若目标页为空（例如越界），回到第一页
  if ((!list || list.length === 0) && targetPage !== 1) {
    await fetchPage(tagId, 1)
  }
}

onMounted(async () => {
  await ensureFirstLoad(activeTag.value)
})

watch(activeTag, async (val) => {
  await ensureFirstLoad(val)
})
</script>

<style scoped>
.tag-grid-wrap {
  width: var(--content-width);
  margin: var(--spacing-xl) auto 0; /* 与上方滚动模块留出更多呼吸感 */
}
.tag-tabs {
  display: flex;
  gap: 12px;
  padding: 8px 0 14px;
  flex-wrap: wrap;
}
.tag-tab {
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(0,0,0,0.03);
  border: 1px solid var(--color-divider);
  color: var(--color-text);
  font-weight: 600;
  letter-spacing: .3px;
  cursor: pointer;
  transition: background .2s ease, color .2s ease, transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.tag-tab:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,0.06); border-color: var(--color-border-light); }
.tag-tab.active {
  background: linear-gradient(135deg, rgba(255,137,0,.18), rgba(255,137,0,.08));
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 8px 22px rgba(255,125,0,0.18);
}

.grid-area { min-height: 300px; }
.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px; /* 增加间距，降低拥挤感 */
}
.card {
  border: 1px solid var(--color-divider);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0));
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(0,0,0,0.08);
  border-color: var(--color-primary);
  background: linear-gradient(180deg, rgba(255,137,0,0.06), rgba(0,0,0,0));
}
.thumb-wrap {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 1:1，确保图片充满上部分 */
  border-bottom: none; /* 去除分割线，避免缝隙感 */
  overflow: hidden;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
}
.thumb-wrap img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 填满容器 */
}
.info { padding: 8px 10px 10px; }
.title {
  font-size: 12.5px;
  color: var(--color-text);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  min-height: 34px;
}
.meta { margin-top: 6px; display: flex; justify-content: space-between; align-items: center; }
.price { color: var(--color-primary); font-weight: 800; font-size: 14px; }

.actions { display: flex; justify-content: center; margin-top: 18px; }
.change-btn {
  padding: 9px 20px;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: rgba(255,125,0,0.06);
  border-radius: 999px;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;
}
.change-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(255,125,0,0.15); }
.change-btn:disabled { opacity: .6; cursor: not-allowed; }

/* skeleton */
.grid-skeleton { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }
.card-skeleton { height: 220px; background: var(--color-bg-secondary); border-radius: 14px; }

@media (max-width: 1100px) {
  .grid, .grid-skeleton { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 860px) {
  .grid, .grid-skeleton { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .grid, .grid-skeleton { grid-template-columns: repeat(2, 1fr); }
}
</style>
