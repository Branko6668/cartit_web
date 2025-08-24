<template>
    <div class="warpper">
        <div class="header">
            <template v-if="isLoggedIn">
                <a href="" @click.prevent="goProfile">欢迎你，{{ username }}</a>
                <a href="" @click.prevent="goOrders">我的订单</a>
                <a href="" @click.prevent="logout">退出</a>
            </template>
            <template v-else>
                <a href="" @click.prevent="goLogin">你好，请登录</a>
                <a href="" @click.prevent="goRegister">点击注册</a>
                |
                <a href="" @click.prevent="goOrders">我的订单</a>
            </template>
        </div>
    </div>
 </template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

const isLoggedIn = computed(() => store.getters['auth/isLoggedIn'])
const username = computed(() => store.getters['auth/username'])

function goLogin() { router.push({ name: 'login' }) }
function goRegister() { router.push({ name: 'register' }) }
function goProfile() { router.push({ name: 'user-profile' }) }
function goOrders() {
    if (!isLoggedIn.value) return router.push({ name: 'login', query: { next: '/order/list' } })
    router.push({ name: 'order-list' })
}
function logout() { store.dispatch('auth/logout') }
</script>

<style lang="less" scoped>
.warpper {
    /* 左上淡橙 → 右下淡紫 渐变背景 */
    background: linear-gradient(135deg, rgba(255, 183, 106, 0.25) 0%, rgba(199, 178, 255, 0.25) 100%);
    height: 30px;
    .header {
        width: var(--content-width);
        margin: 0 auto; 
        text-align: right;  
        line-height: 30px;
        a{
            margin-left: 10px;
            margin-right: 10px;
            color: var(--color-text);
            text-decoration: none;
        }
        a:hover{
            text-decoration: underline;
        }
    }
}
</style>