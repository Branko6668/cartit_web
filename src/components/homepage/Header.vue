<template>
    <div class="main">
        <div class="content">
            <div class="logo float-left">
                <CartitLogo />
            </div>
            <div class="search-box float-left">
                我是搜索框
            </div>
            <div class="right float-right">
                <img src="@/assets/images/right_content.png" alt="">
            </div>
        </div>
    </div>
</template>

<script setup>
import CartitLogo from '@/components/common/CartitLogo.vue';

</script>


<style lang="less" scoped>
    .main {
        .content {
            width: var(--content-width);
            margin: 0 auto;
            height: 140px;
            border: 1px solid var(--color-divider);
        }
        .search-box {
            width: 800px;
            padding: 0 20px;
        }
        .right {
            img {
                height: 120px;
                margin-top: 10px;
            }
        }
    }


</style>