<template>
  <div class="order-detail-page">
    <Shortcut />
    <Header />
    <div class="container">
      <div class="topbar">
        <h2>订单详情</h2>
        <el-button link @click="goList">返回订单列表</el-button>
      </div>
      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="!order">未找到该订单</div>
      <div v-else class="order">
        <div class="head">
          <div>下单时间：{{ order.create_time || '-' }}</div>
          <div>订单号：{{ order.order_no || order.id }}</div>
          <div>店铺名称：{{ order.store_name || (order.store?`店铺 #${order.store}`:'-') }}</div>
          <div>收货人：{{ order.recipient_name || '-' }}</div>
          <div>总金额：￥{{ order.total_amount || '0.00' }}｜实付：￥{{ order.actual_amount || '0.00' }}</div>
          <div>订单状态：{{ renderStatus(order.status) }}</div>
        </div>
        <div class="items">
          <div class="th">商品</div>
          <div class="th qty">数量</div>
          <div class="th price">单价</div>
          <div class="th total">小计</div>
          <div v-for="it in (order.items || [])" :key="it.id" class="row">
            <div class="col prod">
              <img class="thumb" :src="it.product_image" alt="thumb" />
              <div class="meta">
                <div class="name">{{ it.product_name }}</div>
                <router-link class="link" :to="{ name:'product-detail', params:{ id: it.product_id } }">查看商品</router-link>
              </div>
            </div>
            <div class="col qty">x{{ it.quantity }}</div>
            <div class="col price">￥{{ it.price }}</div>
            <div class="col total">￥{{ it.total_amount }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Shortcut from '@/components/common/Shortcut.vue'
import Header from '@/components/homepage/Header.vue'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { getOrderDetail } from '@/network/order'

const route = useRoute()
const router = useRouter()
const store = useStore()
const loading = ref(true)
const order = ref(null)

function renderStatus(s){
  return ({
    pending_payment: '待支付', paid: '已支付', shipped: '已发货', delivered: '已收货', completed: '已完成', cancelled: '已取消', refunded: '已退款',
  }[s] || s || '-')
}

function codeOK(code){ return code === 0 || code === 200 || code === 3000 || code === 4000 }
function goList(){ router.push({ name:'order-list' }) }

async function load(){
  loading.value = true
  try {
    const id = route.params.id
    const r = await getOrderDetail(id)
    if (r?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:`/order/${id}` } }) }
    if (codeOK(r?.code)) order.value = r?.data
    else ElMessage.error(r?.msg || '加载详情失败')
  } catch(e){
    ElMessage.error(e?.normalizedMessage || e?.message || '加载详情失败')
  } finally { loading.value = false }
}

onMounted(() => { if (!store.getters['auth/isLoggedIn']) router.push({ name:'login', query:{ next: route.fullPath || '/order/list' } }); else load() })
</script>

<style scoped>
.order-detail-page { background: var(--color-bg); }
.container { width: var(--content-width); margin: 16px auto; padding: 12px; }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.order { background: #fff; border-radius: 12px; padding: 12px; }
.head { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-bottom: 10px; border-bottom: 1px solid var(--color-divider); }
.items { display: grid; grid-template-columns: 1fr 120px 120px 140px; align-items: center; row-gap: 10px; padding-top: 10px; }
.th { font-weight: 700; color: #333; }
.row { display: contents; }
.col { padding: 4px 0; }
.prod { display: flex; align-items: center; gap: 10px; }
.thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; background: #f6f6f6; }
.link { color: var(--el-color-primary); font-size: 12px; }
.loading { padding: 16px; color: #666; }
</style>
