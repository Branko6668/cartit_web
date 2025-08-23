<template>
  <div>
    <Shortcut />
    <Header />
    <div class="search-page">
      <div class="content">
        

        <!-- 工具栏：排序 + 概览 -->
        <div class="toolbar">
          <div class="summary" v-if="loaded && total >= 0">
            共 <strong>{{ total }}</strong> 件商品，当前第 <strong>{{ page }}</strong>/<strong>{{ totalPages }}</strong> 页
          </div>
          <div class="sorters">
            <button :class="['sort-btn', { active: sort === 0 }]" @click="setSort(0)">默认</button>
            <button :class="['sort-btn', { active: sort === 3 || sort === 4 }]" @click="toggleReviewSort">
              评论数
              <span class="arrow" :data-dir="sort === 4 ? 'desc' : (sort === 3 ? 'asc' : '')"></span>
            </button>
            <button :class="['sort-btn', { active: sort === 1 || sort === 2 }]" @click="togglePriceSort">
              价格
              <span class="arrow" :data-dir="sort === 2 ? 'desc' : (sort === 1 ? 'asc' : '')"></span>
            </button>
          </div>
        </div>

        <!-- 结果区 -->
        <div v-if="loading" class="loading">正在搜索…</div>
        <div v-else-if="error" class="error">搜索失败：{{ error }}</div>
        <div v-else>
          <div v-if="results.length === 0" class="empty">没有找到相关商品</div>
          <div class="grid" v-else>
            <div class="card clickable" v-for="item in results" :key="item.id" @click="goDetail(item.id)" role="button" :aria-label="'查看 ' + item.name">
              <div class="thumb">
                <img :src="item.image" :alt="item.name" loading="lazy"/>
              </div>
              <div class="info">
                <div class="name" :title="item.name">{{ item.name }}</div>
                <div class="meta">
                  <span class="price">￥{{ item.price }}</span>
                  <span class="reviews">评论 {{ item.review_count }}</span>
                </div>
                <div class="store">店铺：{{ item.store_name || '-' }}</div>
              </div>
              <button class="add-cart" @click.stop="addToCart(item)">加入购物车</button>
            </div>
          </div>

          <!-- 翻页 -->
          <div class="pager" v-if="totalPages > 1">
            <el-pagination
              background
              layout="prev, pager, next"
              :page-size="pageSize"
              :total="total"
              :current-page="page"
              @current-change="onPageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Shortcut from '@/components/common/Shortcut.vue'
import Header from '@/components/homepage/Header.vue'
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchProducts } from '@/network/search'

const route = useRoute()
const router = useRouter()

// state
const q = ref('')
const sort = ref(0) // 0 默认, 1 价格升, 2 价格降, 3 评论升, 4 评论降
const page = ref(1)
const pageSize = ref(20)

const loading = ref(false)
const loaded = ref(false)
const error = ref('')
const total = ref(0)
const totalPages = ref(0)
const results = ref([])
// 防抖标记：当我们手动触发路由变更时，忽略一次路由监听中的自动拉取
const routeSyncSkip = ref(false)

function resolveImage(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `http://127.0.0.1:8000${url}`
  return url
}

async function fetchData() {
  if (!q.value || !q.value.trim()) {
    results.value = []
    total.value = 0
    totalPages.value = 0
    loaded.value = true
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await searchProducts({ q: q.value.trim(), page: page.value, page_size: pageSize.value, sort: sort.value })
    if (res && res.code === 2002 && res.data) {
      const d = res.data
      total.value = d.total ?? 0
      totalPages.value = d.total_pages ?? Math.ceil((d.total ?? 0) / pageSize.value)
      results.value = (d.results || []).map((it, idx) => ({
        id: it.id ?? idx,
        name: it.name || '未命名商品',
        price: it.price ?? '0.00',
        image: resolveImage(it.thumbnail || it.image_url || ''),
        review_count: it.review_count ?? 0,
        store_id: it.store_id ?? null,
        store_name: it.store_name || ''
      }))
    } else {
      throw new Error(res?.msg || '搜索接口返回异常')
    }
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
    loaded.value = true
  }
}

function syncFromRoute(r = route) {
  q.value = (r.query.q || '').toString()
  sort.value = Number(r.query.sort ?? 0)
  page.value = Math.max(1, Number(r.query.page ?? 1))
  pageSize.value = Math.min(100, Math.max(1, Number(r.query.page_size ?? 20)))
}

function pushRoute(upd = {}) {
  routeSyncSkip.value = true
  router.push({ name: 'search', query: { q: q.value, sort: sort.value, page: page.value, page_size: pageSize.value, ...upd } })
}

function setSort(v) {
  if (sort.value === v) return
  sort.value = v
  page.value = 1
  fetchData()
  pushRoute()
}
function togglePriceSort() {
  sort.value = sort.value === 1 ? 2 : 1
  page.value = 1
  fetchData()
  pushRoute()
}
function toggleReviewSort() {
  sort.value = sort.value === 3 ? 4 : 3
  page.value = 1
  fetchData()
  pushRoute()
}
function onPageChange(p) {
  page.value = p
  fetchData()
  pushRoute()
}

function addToCart(item) {
  console.log('加入购物车', item)
}

function goDetail(id) {
  if (id != null) router.push({ name: 'product-detail', params: { id }, query: { sort: sort.value } })
}

onMounted(() => {
  syncFromRoute()
  fetchData()
})

watch(() => route.query, () => {
  syncFromRoute()
  if (routeSyncSkip.value) { routeSyncSkip.value = false; return }
  // 始终在路由查询参数变化时刷新，确保新搜索一定更新结果
  fetchData()
})
</script>

<style scoped lang="less">
.search-page {
  background: var(--color-bg);
  padding: var(--spacing-md) 0 var(--spacing-xl);
}
.content {
  width: var(--content-width);
  margin: 0 auto;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}
.summary { color: var(--color-text-secondary); }
.sorters { display: flex; gap: 8px; }
.sort-btn {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--color-divider);
  border-radius: 6px;
  background: var(--color-bg);
  cursor: pointer;
}
.sort-btn.active { border-color: var(--color-primary); color: var(--color-primary); }
.sort-btn .arrow::before {
  content: attr(data-dir);
  font-size: 10px;
  margin-left: 4px;
  color: var(--color-text-secondary);
}
.grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--spacing-md);
}
@media (max-width: 1280px) { .grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 960px) { .grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 720px) { .grid { grid-template-columns: repeat(2, 1fr); } }
.card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border: 1px solid var(--color-divider);
  border-radius: 10px;
  overflow: hidden;
}
.thumb { aspect-ratio: 1 / 1; background: var(--color-bg-secondary); }
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.info { padding: 10px 12px; }
.name {
  font-size: 14px;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  line-clamp: 2;
}
.meta { display: flex; justify-content: space-between; margin-top: 6px; }
.price { color: #e53935; font-weight: 600; }
.reviews { color: var(--color-text-secondary); font-size: 12px; }
.store { margin-top: 4px; color: var(--color-text-secondary); font-size: 12px; }
.add-cart {
  margin: 8px 12px 12px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(90deg, #ffb37a, #ff6b35);
  border: none;
  color: #fff; font-weight: 600; cursor: pointer;
}
.clickable { cursor: pointer; }
.pager { display: flex; justify-content: center; margin-top: var(--spacing-lg); }
.loading, .empty, .error { padding: 24px; color: var(--color-text-secondary); }
.error { color: #d93025; }
</style>
