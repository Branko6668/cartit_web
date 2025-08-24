import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SearchView from '../views/SearchView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import AuthView from '../views/AuthView.vue'
import store from '@/store'
const CartView = () => import('../views/CartView.vue')
const OrderSuccessView = () => import('../views/OrderSuccessView.vue')
const ProfileView = () => import('../views/ProfileView.vue')
const ProfileEditView = () => import('../views/ProfileEditView.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Cartit!' }
  },
  {
    path: '/search',
    name: 'search',
    component: SearchView,
    meta: { title: '搜索结果 - Cartit' }
  },
  {
    path: '/product/:id',
    name: 'product-detail',
    component: ProductDetailView,
    meta: { title: '商品详情 - Cartit' }
  },
  { path: '/login', name: 'login', component: AuthView, meta: { title: '登录 - Cartit' } },
  { path: '/register', name: 'register', component: AuthView, meta: { title: '注册 - Cartit' } },
  { path: '/forgot', name: 'forgot', component: AuthView, meta: { title: '找回密码 - Cartit' } },
  { path: '/cart', name: 'cart', component: CartView, meta: { title: '我的购物车 - Cartit', requiresAuth: true } },
  { path: '/order/success', name: 'order-success', component: OrderSuccessView, meta: { title: '下单成功 - Cartit', requiresAuth: true } },
  { path: '/user/profile', name: 'user-profile', component: ProfileView, meta: { title: '我的主页 - Cartit', requiresAuth: true } },
  { path: '/user/profile/edit', name: 'user-profile-edit', component: ProfileEditView, meta: { title: '编辑资料 - Cartit', requiresAuth: true } },
  
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  if (!store.state.auth?.inited) store.dispatch('auth/init')
  // 仅对示例受保护页面做登录校验，商品/搜索默认放行
  const protectedPrefixes = ['/order', '/user', '/review', '/cart']
  const needLogin = protectedPrefixes.some(p => to.path === p || to.path.startsWith(p + '/'))
  const isAuthed = store.getters['auth/isLoggedIn']
  if (needLogin && !isAuthed && !['login','register','forgot'].includes(to.name)) {
    return next({ name: 'login', query: { next: to.fullPath } })
  }
  document.title = to.meta.title || 'Default Title';
  next()
})

export default router
