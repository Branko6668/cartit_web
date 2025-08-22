<template>
    <div class="main">
        <div class="content">
            <div class="logo">
                <CartitLogo />
            </div>
            <div class="search-box">
                <SearchBox />
            </div>
            <div class="right">
                <img src="@/assets/images/right_content.png" alt="用户中心">
            </div>
        </div>
    </div>
</template>

<script setup>
    import CartitLogo from '@/components/common/CartitLogo.vue';
    import SearchBox from '@/components/homepage/SearchBox.vue';

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
        
        .search-box {
            flex: 1;
            max-width: 800px;
            margin: 0 var(--spacing-lg);
        }
        
        .right {
            flex-shrink: 0;
            
            img {
                height: 120px;
                width: auto;
            }
        }
    }
</style>