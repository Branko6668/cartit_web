<template>
  <div>
    <Shortcut />
    <Header />
    <div class="detail-page">
      <div class="content">
        <!-- 上半：商品信息 -->
        <section class="product-section">
          <div class="gallery">
            <img :src="product.image_url || product.thumbnail" :alt="product.name" />
          </div>
          <div class="summary">
            <h1 class="name">{{ product.name || '商品' }}</h1>
            <div class="price">￥{{ product.price }}</div>
            <div class="sort-hint" v-if="sortLabel">当前排序：<span>{{ sortLabel }}</span></div>
            <div class="qty">
              <button @click="decQty" :disabled="qty<=1">-</button>
              <input type="number" v-model.number="qty" min="1" />
              <button @click="incQty">+</button>
            </div>
            <button class="add-cart" @click="onAddToCart">加入购物车</button>
          </div>
        </section>

        <!-- 下半：评论列表 -->
        <section class="review-section">
          <div class="review-head">
            <h2 class="title">用户评论</h2>
            <button class="create-review">写评论</button>
          </div>
          <div v-if="loadingReviews" class="loading">评论加载中…</div>
          <div v-else-if="reviews.length === 0" class="empty">还没有评论</div>
          <ul v-else class="review-list">
            <li v-for="r in reviews" :key="r.id" class="review-item">
              <img class="avatar" :src="r.user_avatar_url" alt="avatar" />
              <div class="body">
                <div class="row">
                  <span class="user">{{ maskedUsername(r.user_username) }}</span>
                  <span class="stars" v-html="renderStars(r.rating)"></span>
                </div>
                <div class="content">{{ r.content }}</div>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import Shortcut from '@/components/common/Shortcut.vue'
import Header from '@/components/homepage/Header.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { addToCart as apiAddToCart } from '@/network/cart'
import { getProductById, getReviewsByProduct } from '@/network/product'

const route = useRoute()
const router = useRouter()
const store = useStore()
const productId = computed(() => Number(route.params.id))

const product = ref({})
const qty = ref(1)
const reviews = ref([])
const loadingProduct = ref(false)
const loadingReviews = ref(false)

const sortLabel = computed(() => {
  const s = Number(route.query.sort ?? 0)
  switch (s) {
    case 1: return '价格↑'
    case 2: return '价格↓'
    case 3: return '评论数↑'
    case 4: return '评论数↓'
    default: return '默认'
  }
})

function decQty() { if (qty.value > 1) qty.value-- }
function incQty() { qty.value++ }

function maskedUsername(name) {
  if (!name) return ''
  const s = name.toString()
  if (s.length <= 1) return '*'
  return '*'.repeat(s.length - 1) + s[s.length - 1]
}
function renderStars(n = 0) {
  const full = Math.max(0, Math.min(5, Math.round(n)))
  const star = '<span style="color:#f59e0b">★</span>'
  const gray = '<span style="color:#d1d5db">★</span>'
  return star.repeat(full) + gray.repeat(5-full)
}

async function loadProduct() {
  loadingProduct.value = true
  try {
    const r = await getProductById(productId.value)
    if (r && (r.code === 2001 || r.code === 200)) {
      product.value = r.data || {}
    } else {
      product.value = {}
    }
  } finally { loadingProduct.value = false }
}
async function loadReviews() {
  loadingReviews.value = true
  try {
    const r = await getReviewsByProduct(productId.value, 1, 10)
    if (r && (r.code === 5000 || r.code === 200)) {
      reviews.value = r.data || []
    } else { reviews.value = [] }
  } finally { loadingReviews.value = false }
}

onMounted(() => { loadProduct(); loadReviews() })

async function onAddToCart(){
  const isLoggedIn = store.getters['auth/isLoggedIn']
  if (!isLoggedIn) { router.push({ name: 'login', query: { next: route.fullPath } }); return }
  try {
    const user = store.state.auth.user
  const r = await apiAddToCart({ product_id: productId.value, quantity: qty.value, mode: 'add' })
  if (r && (r.code === 3000 || r.code === 3001 || r.code === 200)) { ElMessage.success('已加入购物车'); store.dispatch('cart/refresh') }
  else { ElMessage.error(r?.msg || '加入购物车失败') }
  } catch(e){ ElMessage.error(e?.normalizedMessage || e?.message || '加入购物车失败') }
}
</script>

<style scoped>
.detail-page { background: var(--color-bg); padding: var(--spacing-md) 0 var(--spacing-xl); }
.content { width: var(--content-width); margin: 0 auto; }
.product-section { display: grid; grid-template-columns: 520px 1fr; gap: 24px; align-items: start; }
.gallery { background: var(--color-bg); border: 1px solid var(--color-divider); border-radius: 12px; overflow: hidden; }
.gallery img { width: 100%; height: 100%; object-fit: cover; display: block; }
.summary .name { font-size: 20px; font-weight: 700; color: var(--color-text); }
.summary .price { margin-top: 12px; font-size: 22px; color: #e53935; font-weight: 800; }
.sort-hint { margin-top: 6px; color: var(--color-text-secondary); font-size: 12px; }
.qty { margin-top: 16px; display: inline-flex; border: 1px solid var(--color-divider); border-radius: 8px; overflow: hidden; }
.qty button { width: 36px; height: 36px; border: none; background: var(--color-bg-secondary); cursor: pointer; }
.qty input { width: 60px; text-align: center; border: none; outline: none; }
.add-cart { margin-top: 16px; height: 40px; padding: 0 18px; border: none; border-radius: 8px; background: linear-gradient(90deg, #ffb37a, #ff6b35); color: #fff; font-weight: 700; cursor: pointer; }

.review-section { margin-top: 36px; }
.review-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.review-head .title { font-size: 18px; font-weight: 800; color: var(--color-text); }
.create-review { height: 32px; padding: 0 12px; border: 1px solid var(--color-divider); border-radius: 6px; background: var(--color-bg); cursor: pointer; }
.review-list { list-style: none; padding: 0; margin: 0; }
.review-item { display: grid; grid-template-columns: 44px 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--color-divider); }
.avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.review-item .row { display: flex; align-items: center; gap: 10px; }
.user { font-weight: 700; color: var(--color-text); }
.content { color: var(--color-text); }
</style>
