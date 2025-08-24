<template>
    <div class="main">
        <div class="content">
            <div class="logo">
                <CartitLogo />
            </div>
            <div class="center">
                <div class="row">
                    <div class="search-box">
                        <SearchBox />
                    </div>
                    <div class="cart">
                        <el-badge :value="cartCount" :max="99" class="cart-badge">
                            <button class="cart-btn" @click="goToCart">
                                <img
                                    class="cart-icon"
                                    src="@/assets/images/product_tag_icon/product_tag.png"
                                    alt="购物车"
                                />
                                <span class="cart-text">我的购物车</span>
                            </button>
                        </el-badge>
                    </div>
                </div>
            </div>
                        <div class="right">
                            <img class="promo" src="@/assets/images/right_content.png" alt="推广图"/>
                        </div>
        </div>
    </div>
</template>

<script setup>
    import CartitLogo from '@/components/common/CartitLogo.vue';
    import SearchBox from '@/components/homepage/SearchBox.vue';
    import { ref, onMounted, computed } from 'vue'
    import { useRouter } from 'vue-router'
    import { useStore } from 'vuex'

    const router = useRouter()
    const store = useStore()
    const cartCount = computed(() => store.getters['cart/count'])
    onMounted(() => { store.dispatch('cart/refresh') })

    const goToCart = () => {
        if (router.hasRoute('cart')) router.push({ name: 'cart' })
        else console.log('前往购物车')
    }


</script>


<style lang="less" scoped>
    .main {
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-divider);
        
        .content {
            width: var(--content-width);
            margin: 0 auto;
            height: 140px;
            display: flex;
            align-items: center;
            padding: 0 var(--spacing-md);
        }
        
        .logo {
            flex-shrink: 0;
            margin-right: var(--spacing-lg);
        }

        // 中间区域，包含 搜索框 + 购物车（同一行），整体居中，稍微靠上
        .center {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center; // 中间组垂直居中对齐
            margin-top: 6px; // 稍微靠上

            .row {
                display: flex;
                align-items: center; // 搜索框与购物车垂直对齐
                gap: var(--spacing-md);
            }

            .search-box {
                max-width: 540px; // 搜索框更短
                width: 540px;
            }

            .cart {
                display: flex;
                align-items: center;
            }

            .cart-badge {
                --el-badge-size: 18px;
                display: inline-flex;
                align-items: center;
            }

            .cart-btn {
                display: inline-flex;
                align-items: center;
                gap: var(--spacing-sm);
                height: 40px; // 与搜索框一致高度
                padding: 0 16px; // 水平内边距
                background: var(--color-bg);
                border: 2px solid var(--color-border); // 与搜索框一致的边框粗细
                border-radius: 9999px; // 胶囊椭圆形
                cursor: pointer;
                transition: all .2s ease;
            }

            .cart-btn:hover {
                border-color: var(--color-primary);
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            }

            .cart-icon {
                width: 18px;
                height: 18px;
            }

            .cart-text {
                font-size: var(--font-size-sm);
                color: var(--color-text);
            }
        }

        .right {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            
            .user-area { display: flex; align-items: center; gap: 12px; }
            .link { background: transparent; border: none; color: var(--el-color-primary); cursor: pointer; }
            .promo {
                height: 100px;
                width: auto;
                display: block;
            }
        }
    }
</style>