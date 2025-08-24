<template>
  <div class="order-list-page">
    <Shortcut />
    <Header />
    <div class="container">
      <div class="topbar">
        <h2>我的订单</h2>
        <div class="filters">
          <el-select v-model="status" placeholder="全部状态" clearable @change="onFilterChange" style="width: 180px;">
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中…</div>
      <div v-else>
        <div v-if="orders.length===0" class="empty">暂无订单</div>
        <div v-else class="list">
          <div v-for="o in orders" :key="o.id" class="order-card">
            <div class="order-head">
              <div class="row1">
                <div class="l">
                  <span class="time">{{ o.create_time || '-' }}</span>
                  <span class="sep">|</span>
                  <span class="ono">订单号：{{ o.order_no || o.id }}</span>
                </div>
                <div class="r">
                  <span class="amount">实付：￥{{ o.actual_amount || o.total_amount || '0.00' }}</span>
                  <span class="status" :data-status="o.status">{{ renderStatus(o.status) }}</span>
                </div>
              </div>
              <div class="row2">
                <div class="l">
                  <span class="store">店铺：{{ o.store_name || (o.store?`店铺 #${o.store}`:'-') }}</span>
                  <span class="sep">|</span>
                  <span class="recv">收货人：{{ o.recipient_name || '-' }}</span>
                </div>
                <div class="r ops">
                  <template v-for="(btn, idx) in actionsFor(o)" :key="idx">
                    <el-button :type="btn.type||'default'" size="small" :link="btn.link||false" :disabled="processingId===o.id"
                      @click="btn.onClick(o)">{{ btn.label }}</el-button>
                  </template>
                </div>
              </div>
            </div>
            <div class="order-items">
              <div v-for="it in (o.items || [])" :key="it.id" class="item-row">
                <img class="thumb" :src="it.product_image" alt="thumb" />
                <div class="meta">
                  <div class="name">{{ it.product_name }}</div>
                  <div class="price">单价：￥{{ it.price }}</div>
                </div>
                <div class="qty">x{{ it.quantity }}</div>
                <div class="line-total">￥{{ it.total_amount }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="pager" v-if="pageInfo.count > pageInfo.page_size">
          <el-pagination background layout="prev, pager, next" :page-size="pageInfo.page_size" :total="pageInfo.count" :current-page="page" @current-change="onPageChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Shortcut from '@/components/common/Shortcut.vue'
import Header from '@/components/homepage/Header.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { listOrders } from '@/network/order'
import { createAlipayPayment } from '@/network/payment'
import { addToCart } from '@/network/cart'

const router = useRouter()
const store = useStore()
const loading = ref(true)
const orders = ref([])
const page = ref(1)
const pageInfo = ref({ count: 0, page: 1, page_size: 10 })
const status = ref('')
const statusOptions = [
  { label: '全部', value: '' },
  { label: '待支付', value: 'pending_payment' },
  { label: '已支付', value: 'paid' },
  { label: '已发货', value: 'shipped' },
  { label: '已收货', value: 'delivered' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
  { label: '已退款', value: 'refunded' },
]

function renderStatus(s){
  return ({
    pending_payment: '待支付',
    paid: '已支付',
    shipped: '已发货',
    delivered: '已收货',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
  }[s] || s || '-')
}

function codeOK(code){ return code === 0 || code === 200 || code === 3000 || code === 4000 }

async function load(){
  loading.value = true
  try {
    const r = await listOrders({ status: status.value || undefined, page: page.value, page_size: pageInfo.value.page_size })
    if (r?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/order/list' } }) }
    if (codeOK(r?.code)) {
      orders.value = r?.data?.results || []
      pageInfo.value = { count: r?.data?.count||0, page: r?.data?.page||1, page_size: r?.data?.page_size||10 }
    } else {
      ElMessage.error(r?.msg || '加载订单失败')
    }
  } catch(e){ ElMessage.error(e?.normalizedMessage || e?.message || '加载订单失败') }
  finally { loading.value = false }
}

function onPageChange(p){ page.value = p; load() }
function onFilterChange(){ page.value = 1; load() }
function goDetail(o){ router.push({ name: 'order-detail', params: { id: o.id } }) }

const processingId = ref(null)
function actionsFor(o){
  const commonDetail = { label: '查看详情', link: true, onClick: goDetail }
  const map = {
  pending_payment: [ { label:'去支付', type:'primary', onClick:onPay }, { label:'取消订单', onClick:onCancel }, commonDetail ],
    paid: [ { label:'申请退款', onClick:onRefund }, { label:'催发货', onClick:onUrgeShip }, commonDetail ],
    shipped: [ { label:'查看物流', onClick:onViewLogistics }, { label:'确认收货', type:'primary', onClick:onConfirmReceive }, { label:'申请售后', onClick:onAfterSale }, commonDetail ],
    delivered: [ { label:'去评价', onClick:onReview }, { label:'申请售后', onClick:onAfterSale }, commonDetail, { label:'确认完成', onClick:onComplete } ],
    completed: [ { label:'再次购买', type:'primary', onClick:onBuyAgain }, { label:'查看评价', onClick:onReview }, commonDetail ],
    cancelled: [ { label:'再次购买', type:'primary', onClick:onBuyAgain }, { label:'删除订单', type:'danger', onClick:onDelete }, commonDetail ],
    refunded: [ { label:'再次购买', type:'primary', onClick:onBuyAgain }, commonDetail, { label:'查看退款单', onClick:onViewRefund } ],
  }
  return map[o.status] || [commonDetail]
}

function toastTodo(msg='功能待接入'){ ElMessage.info(msg) }
async function onPay(o){
  try {
    processingId.value = o.id
    const r = await createAlipayPayment(o.id)
    if (r?.code === 4101) return router.push({ name:'login', query:{ next:'/order/list' } })
    if (r?.code === 4000 && r?.data?.pay_url) {
      window.location.href = r.data.pay_url
    } else {
      ElMessage.error(r?.msg || '创建支付链接失败')
    }
  } catch(e){ ElMessage.error(e?.normalizedMessage || e?.message || '发起支付失败') }
  finally { processingId.value = null }
}
function onCancel(o){ toastTodo('取消订单功能待接入') }
function onRefund(o){ toastTodo('退款申请功能待接入') }
function onUrgeShip(o){ toastTodo('已为您提交催发货需求') }
function onViewLogistics(o){ toastTodo('查看物流功能待接入') }
function onConfirmReceive(o){ toastTodo('确认收货功能待接入') }
function onAfterSale(o){ toastTodo('售后功能待接入') }
function onReview(o){ toastTodo('评价功能待接入') }
function onComplete(o){ toastTodo('确认完成功能待接入') }
function onDelete(o){ toastTodo('删除订单功能待接入') }
function onViewRefund(o){ toastTodo('退款单功能待接入') }

async function onBuyAgain(o){
  try {
    processingId.value = o.id
    const arr = Array.isArray(o.items) ? o.items : []
    if (!arr.length) return ElMessage.warning('无可再次购买的商品')
    for (const it of arr) {
      try { await addToCart({ product_id: it.product_id, quantity: it.quantity || 1, mode: 'add' }) } catch {}
    }
    try { store.dispatch('cart/refresh') } catch {}
    ElMessage.success('已加入购物车')
    router.push({ name:'cart' })
  } catch(e) {
    ElMessage.error(e?.normalizedMessage || e?.message || '加入购物车失败')
  } finally { processingId.value = null }
}

onMounted(() => { if (!store.getters['auth/isLoggedIn']) router.push({ name:'login', query:{ next:'/order/list' } }); else load() })
</script>

<style scoped>
.order-list-page { background: var(--color-bg); }
.container { width: var(--content-width); margin: 16px auto; padding: 12px; }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.list { display: flex; flex-direction: column; gap: 12px; }
.order-card { background: #fff; border-radius: 12px; padding: 14px; box-shadow: 0 1px 2px rgba(0,0,0,.03); }
.order-head { display: flex; flex-direction: column; gap: 6px; padding-bottom: 10px; border-bottom: 1px solid var(--color-divider); }
.order-head .row1, .order-head .row2 { display: flex; align-items: center; justify-content: space-between; }
.order-head .l { display: flex; gap: 8px; align-items: center; color: #555; flex-wrap: wrap; }
.order-head .r { display: flex; gap: 8px; align-items: center; }
.order-head .ops :deep(button) { margin-left: 4px; }
.order-head .amount { font-weight: 700; color: #111; }
.order-head .status { color: var(--el-color-primary); }
.order-items { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
.item-row { display: grid; grid-template-columns: 64px 1fr 80px 120px; gap: 12px; align-items: center; }
.thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; background: #f6f6f6; }
.meta .name { color: #111; }
.meta .price { color: #666; font-size: 12px; }
.qty { text-align: right; }
.line-total { text-align: right; font-weight: 700; }
.empty, .loading { padding: 16px; color: #666; }
.pager { margin-top: 12px; display: flex; justify-content: center; }
</style>
