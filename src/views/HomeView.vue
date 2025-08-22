<template>
  <div>
    <Shortcut />
    <Header />
    <div class="home-body">
      <div class="content">
        <div class="left">
          <LeftCategoryPanel
            :level1="categories"
            :fetchL2="fetchL2"
            :fetchL3="fetchL3"
            :height="sectionHeight"
            @navigate="onNavigate"
          />
        </div>
        <div class="right">
          <RightHeroCarousel :items="banners" :interval="4000" :height="sectionHeight" />
        </div>
      </div>
  <ProductMarquee :items="marquee" :speed="50" />
  <TaggedProductGrid />
    </div>
  </div>
</template>

<script setup>
import Shortcut from '@/components/common/Shortcut.vue'
import Header from '@/components/homepage/Header.vue' 
import LeftCategoryPanel from '@/components/homepage/LeftCategoryPanel.vue'
import RightHeroCarousel from '@/components/homepage/RightHeroCarousel.vue'
import ProductMarquee from '@/components/homepage/ProductMarquee.vue'
import TaggedProductGrid from '@/components/homepage/TaggedProductGrid.vue'
import { ref, onMounted } from 'vue'
import { getMainMenu, getSubMenu, getSubSubMenu, getProductsByTag } from '@/network/home'

// 数据占位：实际将从后端获取
const categories = ref([])
const banners = ref([
  { image: new URL('@/assets/images/carousel/Manhattan.jpg', import.meta.url).href, alt: 'banner-1' },
  { image: new URL('@/assets/images/carousel/retouch_2023100508553748.jpg', import.meta.url).href, alt: 'banner-2' },
  { image: new URL('@/assets/images/carousel/retouch_2023100508562969.jpg', import.meta.url).href, alt: 'banner-3' },
  { image: new URL('@/assets/images/carousel/retouch_2023100508570558.jpg', import.meta.url).href, alt: 'banner-4' },
  { image: new URL('@/assets/images/carousel/wallhaven-2ylwkm.jpg', import.meta.url).href, alt: 'banner-5' },
  { image: new URL('@/assets/images/carousel/wallhaven-2yxp16.jpg', import.meta.url).href, alt: 'banner-6' },
  { image: new URL('@/assets/images/carousel/wallhaven-4gxdj7.png', import.meta.url).href, alt: 'banner-7' },
  { image: new URL('@/assets/images/carousel/wallhaven-4l3okp.jpg', import.meta.url).href, alt: 'banner-8' },
  { image: new URL('@/assets/images/carousel/wallhaven-4okj79.jpg', import.meta.url).href, alt: 'banner-9' },
  { image: new URL('@/assets/images/carousel/wallhaven-4vr1k3.jpg', import.meta.url).href, alt: 'banner-10' },
  { image: new URL('@/assets/images/carousel/wallhaven-5go671.png', import.meta.url).href, alt: 'banner-11' }
])
const sectionHeight = ref(500) // 提高栏目高度，左右一致
const marquee = ref([])

import { useRouter } from 'vue-router'
const router = useRouter()
const onNavigate = (item) => {
  const keyword = item?.name || ''
  if (keyword) router.push({ name: 'search', query: { q: keyword, sort: 0, page: 1, page_size: 20 } })
}

// 懒加载二级/三级数据，供 LeftCategoryPanel 通过 emit 调用
const fetchL2 = async (l1) => {
  try {
    const res = await getSubMenu(l1.id)
    if (res && res.code === 1001) return res.data
  } catch (e) {
    // fallback mock to allow hover panel to appear
    return [
      { id: l1.id * 100 + 1, name: l1.name + ' 热门' },
      { id: l1.id * 100 + 2, name: l1.name + ' 新品' },
      { id: l1.id * 100 + 3, name: l1.name + ' 特价' }
    ]
  }
  return []
}
const fetchL3 = async (l2) => {
  try {
    const res = await getSubSubMenu(l2.id)
    if (res && res.code === 1002) return res.data
  } catch (e) {
    // fallback mock
    return [
      { id: l2.id * 100 + 1, name: l2.name + ' A' },
      { id: l2.id * 100 + 2, name: l2.name + ' B' },
      { id: l2.id * 100 + 3, name: l2.name + ' C' },
      { id: l2.id * 100 + 4, name: l2.name + ' D' }
    ]
  }
  return []
}

onMounted(async () => {
  try {
    const res = await getMainMenu()
    if (res && res.code === 1000) {
      categories.value = res.data || []
    } else {
      categories.value = []
    }
  } catch (e) {
    console.warn('加载分类失败，使用本地示例数据')
    categories.value = [
  { id: 1, name: '数码' },
  { id: 2, name: '服饰' },
    ]
  }

  // 加载“新品推荐”（tag=1）的横向滚动商品数据，第一页
  try {
    const r = await getProductsByTag(1, 1)
    if (r && (r.code === 2000 || r.code === 200)) {
      const list = (r.data || []).slice(0, 20) // 仅前 20 条
      marquee.value = list.map((it, idx) => ({
        id: it.id ?? idx,
        name: it.name || it.title || '未命名商品',
        image: it.image_url || it.image || it.cover || it.pic_url || it.pic || '',
        price: Number(it.price ?? it.sale_price ?? it.min_price ?? 0),
      })).filter(it => it.image)
    }
  } catch (e) {
    console.warn('加载新品推荐失败，将使用空列表')
    marquee.value = []
  }
})
</script>

<style lang="less" scoped>
.home-body {
  background: var(--color-bg);
  padding: var(--spacing-md) 0 var(--spacing-xl);
}
.content {
  width: var(--content-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: var(--spacing-md);
  align-items: start; // 顶部对齐
}
</style>
