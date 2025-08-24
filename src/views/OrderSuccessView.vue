<template>
  <div class="order-success-page">
    <div class="container">
      <h2>下单成功</h2>
      <p v-if="orders && orders.length">共生成 {{ orders.length }} 笔订单。</p>
      <ul v-if="orders && orders.length" class="orders">
        <li v-for="o in orders" :key="o.id">
          订单号：{{ o.order_no || o.id }}｜应付：￥{{ o.actual_amount || o.total_amount || '0.00' }}｜状态：{{ o.status || 'pending_payment' }}
        </li>
      </ul>
      <p v-else>没有可显示的订单数据。</p>
      <router-link class="back" :to="{ name: 'home' }">返回首页</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const orders = computed(() => store.state.order?.lastOrders || (() => {
  try { return JSON.parse(localStorage.getItem('lastOrders')||'[]') } catch { return [] }
})())
</script>

<style scoped>
.order-success-page { padding: 40px 16px; }
.container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; }
h2 { margin: 0 0 12px; }
.orders { margin: 12px 0 20px; }
.back { color: var(--el-color-primary); }
</style>
