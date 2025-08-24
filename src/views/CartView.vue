<template>
  <div>
    <Shortcut />
    <Header />
  <div class="cart-page">
    <div class="container">
      <!-- 表头 -->
      <div class="thead row">
  <div class="col sel"><el-checkbox v-model="allSelected" :disabled="selectingAll" @change="onToggleAll">全选</el-checkbox></div>
        <div class="col info">商品</div>
        <div class="col price">单价</div>
        <div class="col qty">数量</div>
        <div class="col sub">小计</div>
        <div class="col ops">操作</div>
      </div>
      <!-- 列表 -->
      <div v-for="item in items" :key="item.id" class="tbody row">
        <div class="col sel"><el-checkbox v-model="item.selected" @change="onSelectChange(item)" /></div>
        <div class="col info">
          <router-link class="thumb-link" :to="{ name: 'product-detail', params: { id: item.product_id } }">
            <img class="thumb" :src="item.product_image" alt="商品图片" />
          </router-link>
          <div class="meta">
            <div class="name">{{ item.product_name }}</div>
            <div class="sku" v-if="item.sku_text">{{ item.sku_text }}</div>
            <div class="warn" v-if="item.is_off_shelf">已下架</div>
            <div class="warn" v-else-if="item.stock === 0">无库存</div>
          </div>
        </div>
        <div class="col price">￥{{ toYuan(item.unit_price) }}</div>
        <div class="col qty">
          <el-input-number :min="1" :max="item.stock || 99" v-model="item.quantity" @change="val=>onQtyChange(item, val)" />
        </div>
        <div class="col sub">￥{{ toYuan(item.unit_price * item.quantity) }}</div>
        <div class="col ops">
          <el-button link type="danger" @click="removeItem(item)">删除</el-button>
          <el-button link type="primary" @click="checkoutSingle(item)">本项结算</el-button>
        </div>
      </div>

    <!-- 底部汇总 -->
      <div class="tfoot">
        <div class="left">
          <el-button link type="danger" @click="removeSelected" :disabled="!hasSelected">删除所选</el-button>
          <el-divider direction="vertical" />
          <el-button link type="warning" @click="clearCartAll" :disabled="items.length===0">清空购物车</el-button>
        </div>
        <div class="right">
          <div class="info">已选 <b>{{ selectedCount }}</b> 件商品，合计 <b>￥{{ toYuan(selectedAmount) }}</b></div>
      <el-input v-model="recipientName" placeholder="收件人" style="width:120px" />
      <el-input v-model="recipientPhone" placeholder="手机号" style="width:150px" />
      <el-input v-model="recipientAddress" placeholder="收件地址（省市区详细）" style="width:260px" />
          <el-button type="primary" :loading="submitting" :disabled="!hasSelected" @click="submitOrder">提交订单</el-button>
        </div>
      </div>
    </div>
  </div>
  </div>
  
</template>

<script setup>
import Shortcut from '@/components/common/Shortcut.vue'
import Header from '@/components/homepage/Header.vue'
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCart, patchCartItem, deleteCartItem, clearCart, selectAll } from '@/network/cart'
import { createOrder } from '@/network/order'
import router from '@/router'

const store = useStore()
const items = ref([])
const summary = ref({ total_count:0, selected_count:0, total_amount:'0.00', selected_amount:'0.00', payable_amount:'0.00' })
const allSelected = ref(false)
const selectingAll = ref(false)
const submitting = ref(false)
// 简易/临时收件信息（可在后续替换为地址选择器）
const recipientName = ref('张三')
const recipientPhone = ref('13800000000')
const recipientAddress = ref('北京市海淀区知春路 1 号')

function toYuan(centsOrYuan) {
  // 兼容返回单位不确定：如果是整数大数，按分转；否则直接显示
  const n = Number(centsOrYuan || 0)
  if (n > 100000) return (n / 100).toFixed(2)
  return n.toFixed ? n.toFixed(2) : String(n)
}

const selectedCount = computed(() => Number(summary.value.selected_count || 0))
const selectedAmount = computed(() => summary.value.selected_amount || '0.00')
// 启用按钮用本地勾选态判断，避免接口延迟导致按钮不可点
const hasSelected = computed(() => items.value.some(i => i.selected))

async function loadCart() {
  // 未登录直接清空并返回，避免 401 报错
  try { if (!store.getters['auth/isLoggedIn']) { items.value = []; summary.value = { total_count:0, selected_count:0, total_amount:'0.00', selected_amount:'0.00', payable_amount:'0.00' }; allSelected.value = false; return } } catch {}
  try {
    const r = await getCart()
  if (r && (r.code === 3000 || r.code === 200)) {
      const data = Array.isArray(r.data?.items) ? r.data.items : []
      items.value = data.map(x => ({
        id: x.id,
        product_id: x.product,
        product_name: x.product_name || '',
        product_image: x.product_image || '',
        sku_id: x.sku_id,
        sku_text: x.sku_text,
        unit_price: x.unit_price ? Number(x.unit_price) : 0,
        quantity: Number(x.quantity || 1),
        selected: !!x.selected,
        stock: x.stock ?? 99,
        is_off_shelf: !!x.is_off_shelf,
      }))
  summary.value = r.data?.summary || summary.value
  // 同步角标
  try { store.commit('cart/setCount', summary.value.total_count ?? items.value.length) } catch {}
      allSelected.value = items.value.length>0 && items.value.every(i=>i.selected)
    } else {
      ElMessage.error(r?.msg || '获取购物车失败')
    }
  } catch(e) {
    ElMessage.error(e?.normalizedMessage || e?.message || '获取购物车失败')
  }
}

async function onToggleAll(val){
  const target = !!val
  const prev = items.value.map(i => i.selected)
  // 乐观更新
  selectingAll.value = true
  items.value.forEach(i => i.selected = target)
  allSelected.value = items.value.length>0 && items.value.every(i=>i.selected)
  try {
    const r = await selectAll({ selected: target })
    // 放宽成功判断：成功 code 或返回 summary/items 之一
    const ok = (r && (r.code === 3000 || r.code === 200)) || r?.data?.summary || Array.isArray(r?.data?.items)
    if (ok) {
      const data = r.data.items
      if (Array.isArray(data)) {
        items.value = data.map(x => ({
        id: x.id,
        product_id: x.product,
        product_name: x.product_name || '',
        product_image: x.product_image || '',
        sku_id: x.sku_id,
        sku_text: x.sku_text,
        unit_price: x.unit_price ? Number(x.unit_price) : 0,
        quantity: Number(x.quantity || 1),
        selected: !!x.selected,
        stock: x.stock ?? 99,
        is_off_shelf: !!x.is_off_shelf,
      }))
      }
      if (r?.data?.summary) summary.value = r.data.summary
      try { store.commit('cart/setCount', summary.value.total_count ?? items.value.length) } catch {}
      allSelected.value = items.value.length>0 && items.value.every(i=>i.selected)
    } else {
      // 回滚
      items.value.forEach((i, idx) => i.selected = prev[idx])
      allSelected.value = items.value.length>0 && items.value.every(i=>i.selected)
      ElMessage.error(r?.msg || '全选操作失败')
    }
  } catch(e) {
    items.value.forEach((i, idx) => i.selected = prev[idx])
    allSelected.value = items.value.length>0 && items.value.every(i=>i.selected)
    ElMessage.error(e?.normalizedMessage || e?.message || '全选操作失败')
  } finally { selectingAll.value = false }
}
function onSelectChange(item){
  patchCartItem({ id: item.id, selected: item.selected })
    .then(r => { if (r?.data?.summary) summary.value = r.data.summary })
    .catch(e => { item.selected = !item.selected; ElMessage.error(e?.normalizedMessage || e?.message || '更新选中失败') })
  allSelected.value = items.value.length>0 && items.value.every(i=>i.selected)
}
async function onQtyChange(item, val){
  if (!val || val < 1) return
  try {
    const r = await patchCartItem({ id: item.id, quantity: val })
    if (r?.data?.item) {
      const idx = items.value.findIndex(i=>i.id===item.id)
      if (idx>=0) items.value[idx] = { ...items.value[idx], quantity: Number(r.data.item.quantity || val) }
    }
    if (r?.data?.summary) summary.value = r.data.summary
  } catch(e) {
    // 回滚
    const old = items.value.find(i=>i.id===item.id)
    if (old) old.quantity = Math.max(1, old.quantity)
    ElMessage.error(e?.normalizedMessage || e?.message || '修改数量失败')
  }
}
async function removeItem(item){
  try {
  await ElMessageBox.confirm('确定删除该商品？','提示',{type:'warning', confirmButtonText:'确定', cancelButtonText:'取消'})
  const r = await deleteCartItem(item.id)
    items.value = items.value.filter(i=>i.id!==item.id)
  if (r?.data?.summary) summary.value = r.data.summary
  try { store.commit('cart/setCount', summary.value.total_count ?? items.value.length) } catch {}
  } catch{}
}
async function removeSelected(){
  const ids = items.value.filter(i=>i.selected).map(i=>i.id)
  if (!ids.length) return
  try {
  await ElMessageBox.confirm(`确定删除所选 ${ids.length} 项？`,'提示',{type:'warning', confirmButtonText:'确定', cancelButtonText:'取消'})
  const r = await clearCart({ only_selected: true })
  items.value = items.value.filter(i=>!i.selected)
  if (r?.data?.summary) summary.value = r.data.summary
  try { store.commit('cart/setCount', summary.value.total_count ?? items.value.length) } catch {}
  } catch{}
}
async function clearCartAll(){
  try {
  await ElMessageBox.confirm('确定清空购物车？','提示',{type:'warning', confirmButtonText:'确定', cancelButtonText:'取消'})
  const r = await clearCart({ only_selected: false })
  items.value = []
  if (r?.data?.summary) summary.value = r.data.summary
  try { store.commit('cart/setCount', summary.value.total_count ?? items.value.length) } catch {}
  } catch{}
}
function checkoutSingle(item){
  // 预留：跳转确认页前先下单预览
  ElMessage.info('本项结算 - 需要对接订单预览接口')
}
function checkoutSelected(){
  if (!selectedCount.value) return
  ElMessage.info('去结算 - 需要对接订单预览接口')
}

async function submitOrder(){
  // 前端仅在购物车点击“提交订单”联调创建订单接口
  if (!store.getters['auth/isLoggedIn']) {
    return router.push({ name: 'login', query: { next: router.currentRoute.value.fullPath } })
  }
  if (!items.value.some(i=>i.selected)) {
    return ElMessage.warning('请先选择要结算的商品')
  }
  // 组装临时收件信息（方案 B：下单快照）
  const recipient = {
    name: (recipientName.value || '').trim(),
    phone: (recipientPhone.value || '').trim(),
    address: (recipientAddress.value || '').trim(),
  }
  if (!recipient.name || !recipient.phone || !recipient.address) {
    return ElMessage.warning('请完整填写收件信息')
  }
  submitting.value = true
  try {
    const res = await createOrder({ recipient, remark: '' })
    const code = res?.code
    if (code === 4101) {
      // 未登录
  try { store.dispatch('auth/logout') } catch {}
  return router.push({ name: 'login', query: { next: router.currentRoute.value.fullPath } })
    }
    if (code === 3000 || code === 200) {
      const orders = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : [])
      if (orders.length > 1) {
        ElMessage.success(`已按店铺拆分为 ${orders.length} 个订单`)
      } else {
        ElMessage.success('下单成功')
      }
      try { store.commit('order/setLastOrders', orders) } catch {}
      try { store.dispatch('cart/refresh') } catch {}
      // 跳转占位成功页
      return router.push({ name: 'order-success' })
    }
    // 其他失败码处理
  if ([3408, 3409, 3402, 3410, 3404].includes(code)) {
      return ElMessage.error(res?.msg || '下单失败')
    }
    return ElMessage.error(res?.msg || '下单失败')
  } catch (e) {
    const msg = e?.normalizedMessage || e?.message || '下单失败'
    if (/401|未登录/.test(String(msg))) {
      return router.push({ name: 'login', query: { next: router.currentRoute.value.fullPath } })
    }
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}

onMounted(loadCart)
</script>

<style scoped lang="less">
.cart-page { background: var(--color-bg);
  .container { width: var(--content-width); margin: 20px auto; background: #fff; border-radius: 12px; padding: 12px 12px 0; }
  .row { display: grid; grid-template-columns: 60px 1fr 120px 160px 140px 140px; align-items: center; gap: 8px; padding: 10px 8px; border-bottom: 1px solid var(--color-divider);
    .col.info { display: flex; align-items: center; gap: 12px; }
  .thumb-link { display: inline-block; line-height: 0; }
    .thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; background: #f6f6f6; }
    .name { font-size: 14px; color: #111; }
    .sku { font-size: 12px; color: #666; }
    .warn { font-size: 12px; color: #d97706; }
    .price, .sub { font-weight: 700; color: #111; }
    .ops { display: flex; gap: 12px; }
  }
  .thead { font-weight: 700; color: #333; background: #fafafa; border-radius: 8px; }
  .tbody { background: #fff; }
  .tfoot { display: flex; justify-content: space-between; align-items: center; padding: 12px 8px; 
  .right { display: flex; align-items: center; gap: 12px; }
  }
}
</style>
