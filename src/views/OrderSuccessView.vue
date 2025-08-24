<template>
  <div class="order-checkout-page">
    <Shortcut />
    <Header />
    <div class="container">
      <h2>订单确认与支付</h2>

      <!-- 收货信息 -->
      <section class="box">
        <div class="section-title">收货信息</div>
        <div v-if="addrLoading" class="loading">地址加载中…</div>
        <div v-else>
          <div v-if="addresses.length === 0" class="empty">暂无地址，请新增</div>
          <el-radio-group v-model="selectedAddressId" class="addr-group">
            <el-radio v-for="a in addresses" :key="a.id" :label="a.id">
              <span class="tag" v-if="a.is_default">默认</span>
              {{ a.recipient_name }} {{ a.recipient_phone }}｜{{ fullAddr(a) }}
            </el-radio>
          </el-radio-group>
          <div class="addr-actions">
            <el-button size="small" type="primary" @click="openAdd = true">新增收货地址</el-button>
          </div>
        </div>
      </section>

      <!-- 支付与配送选项 -->
      <section class="box options">
        <div class="row">
          <div class="col">
            <div class="section-title">支付方式</div>
            <el-radio-group v-model="payMethod">
              <el-radio-button label="alipay">支付宝支付</el-radio-button>
              <el-radio-button label="wechat">微信支付</el-radio-button>
            </el-radio-group>
          </div>
          <div class="col">
            <div class="section-title">配送方式</div>
            <el-radio-group v-model="shipMethod">
              <el-radio-button label="small_cat">小猫快递</el-radio-button>
              <el-radio-button label="big_cat">大猫快递</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </section>

      <!-- 商品清单 -->
      <section class="box">
        <div class="section-title">商品清单</div>
        <template v-if="flatItems.length">
          <div class="items">
            <div class="th">商品</div><div class="th qty">数量</div><div class="th price">单价</div><div class="th total">小计</div>
            <div v-for="it in flatItems" :key="it._key" class="row">
              <div class="col prod">
                <img class="thumb" :src="it.product_image" alt="thumb" />
                <div class="meta">
                  <div class="name">{{ it.product_name }}</div>
                  <div class="store">{{ it._storeName }}</div>
                </div>
              </div>
              <div class="col qty">x{{ it.quantity }}</div>
              <div class="col price">￥{{ it.price }}</div>
              <div class="col total">￥{{ it.total_amount }}</div>
            </div>
          </div>
        </template>
        <div v-else class="empty">暂无商品</div>
      </section>

      <!-- 结算尾部 -->
      <section class="box footer">
        <div class="left">应付金额：</div>
        <div class="right">￥<b>{{ totalPayable }}</b>
          <el-button type="primary" size="large" :loading="paying" @click="goPay">前往支付</el-button>
        </div>
      </section>
    </div>

    <!-- 新增地址弹窗 -->
    <el-dialog v-model="openAdd" title="新增地址" width="520px">
      <div class="addr-form">
        <el-input v-model="form.recipient_name" placeholder="收件人" />
        <el-input v-model="form.recipient_phone" placeholder="手机号（11位）" />
        <el-input v-model="form.province" placeholder="省" />
        <el-input v-model="form.city" placeholder="市" />
        <el-input v-model="form.district" placeholder="区/县" />
        <el-input v-model="form.detail_address" placeholder="详细地址" />
        <el-switch v-model="form.is_default" active-text="设为默认" />
      </div>
      <template #footer>
        <el-button @click="openAdd=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitAddr">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import Shortcut from '@/components/common/Shortcut.vue'
import Header from '@/components/homepage/Header.vue'
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserProfile, listAddresses, createAddress, setDefaultAddress } from '@/network/user'

const store = useStore()
const router = useRouter()
const orders = computed(() => store.state.order?.lastOrders || (() => { try { return JSON.parse(localStorage.getItem('lastOrders')||'[]') } catch { return [] } })())

// 地址数据
const addrLoading = ref(true)
const addresses = ref([])
const selectedAddressId = ref(null)
const openAdd = ref(false)
const saving = ref(false)
const form = ref({ recipient_name:'', recipient_phone:'', province:'', city:'', district:'', detail_address:'', is_default:false })

const payMethod = ref('alipay')
const shipMethod = ref('small_cat')
const paying = ref(false)

function fullAddr(a){ return `${a.province||''}${a.city||''}${a.district||''}${a.detail_address||''}` }

const flatItems = computed(() => {
  const arr = []
  const os = Array.isArray(orders.value)? orders.value : []
  for (const o of os) {
    const storeName = o.store_name || (o.store?`店铺 #${o.store}`:'')
    for (const it of (o.items||[])) {
      arr.push({ ...it, _key: `${o.id}_${it.id}`, _storeName: storeName })
    }
  }
  return arr
})

const totalPayable = computed(() => {
  const os = Array.isArray(orders.value)? orders.value : []
  let sum = 0
  for (const o of os) {
    const v = parseFloat(o.actual_amount || o.total_amount || '0')
    if (!isNaN(v)) sum += v
  }
  return sum.toFixed(2)
})

async function loadAddresses(){
  addrLoading.value = true
  try {
    const p = await getUserProfile()
    if (p?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/order/success' } }) }
    const uid = p?.data?.id
    const r = await listAddresses({ user: uid, page: 1, page_size: 20 })
    if (r?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/order/success' } }) }
    addresses.value = r?.data?.results || []
    // 默认选中 is_default，否则第一条
    const def = addresses.value.find(a=>a.is_default) || addresses.value[0]
    selectedAddressId.value = def?.id || null
  } catch(e){ ElMessage.error(e?.normalizedMessage || e?.message || '加载地址失败') }
  finally { addrLoading.value = false }
}

async function submitAddr(){
  const f = form.value
  if (!f.recipient_name || f.recipient_name.length>50) return ElMessage.warning('请填写收件人（≤50）')
  if (!/^\d{11}$/.test(f.recipient_phone||'')) return ElMessage.warning('请填写11位手机号')
  const addrStr = `${f.province}${f.city}${f.district}${f.detail_address}`
  if (!addrStr || addrStr.length>500) return ElMessage.warning('请完善地址（≤500）')
  saving.value = true
  try {
    const c = await createAddress({
      recipient_name: f.recipient_name,
      recipient_phone: f.recipient_phone,
      province: f.province, city: f.city, district: f.district, detail_address: f.detail_address,
      postal_code: f.postal_code,
    })
    if (c?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/order/success' } }) }
    if (c?.code === 4000 || c?.code === 3000 || c?.code === 200) {
      const newId = c?.data?.id
      if (f.is_default && newId) { try { await setDefaultAddress(newId) } catch {} }
      openAdd.value = false
      form.value = { recipient_name:'', recipient_phone:'', province:'', city:'', district:'', detail_address:'', is_default:false }
      await loadAddresses()
      if (newId) selectedAddressId.value = newId
      ElMessage.success('地址已保存')
    } else { ElMessage.error(c?.msg || '保存失败') }
  } catch(e) { ElMessage.error(e?.normalizedMessage || e?.message || '保存失败') } finally { saving.value = false }
}

async function goPay(){
  if (!selectedAddressId.value) return ElMessage.warning('请选择收货地址')
  paying.value = true
  try {
    // 暂时仅做前端占位
    ElMessage.success(`已选择 ${payMethod.value==='alipay'?'支付宝':'微信'}，应付￥${totalPayable.value}（模拟）`)
    router.push({ name: 'order-list' })
  } catch(e) { ElMessage.error(e?.normalizedMessage || e?.message || '支付发起失败') }
  finally { paying.value = false }
}

onMounted(() => {
  if (!store.getters['auth/isLoggedIn']) return router.push({ name:'login', query:{ next:'/order/success' } })
  // 若无 lastOrders，回到订单列表
  const os = Array.isArray(orders.value)? orders.value : []
  if (!os.length) {
    ElMessage.info('暂无待支付订单，已返回订单列表')
    return router.push({ name: 'order-list' })
  }
  loadAddresses()
})
</script>

<style scoped>
.order-checkout-page { background: var(--color-bg); }
.container { width: var(--content-width); margin: 16px auto; padding: 12px; }
h2 { margin: 0 0 12px; }
.box { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
.section-title { font-weight: 700; margin-bottom: 8px; }
.addr-group { display: flex; flex-direction: column; gap: 8px; }
.tag { display: inline-block; background: var(--el-color-primary); color: #fff; font-size: 12px; padding: 0 6px; border-radius: 10px; margin-right: 6px; }
.addr-actions { margin-top: 8px; }
.options .row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.items { display: grid; grid-template-columns: 1fr 120px 120px 140px; align-items: center; row-gap: 10px; }
.th { font-weight: 700; color: #333; }
.row { display: contents; }
.col { padding: 4px 0; }
.prod { display: flex; align-items: center; gap: 10px; }
.thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; background: #f6f6f6; }
.meta .name { color: #111; }
.meta .store { color: #666; font-size: 12px; }
.footer { display: flex; align-items: center; justify-content: space-between; }
.right { display: flex; align-items: center; gap: 12px; font-size: 18px; }
.loading, .empty { color: #666; }
</style>
