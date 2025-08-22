import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SearchView from '../views/SearchView.vue'

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
  
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Default Title';
  next()
})

export default router
