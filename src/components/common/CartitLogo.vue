<template>
    <router-link to="/" class="logo-link" aria-label="前往首页">
        <img class="logo" src="@/assets/images/cartit_logo.png" alt="Cartit 首页">
    </router-link>
    
</template>

<style lang="less" scoped>
    .logo-link {
        display: flex;
        align-items: center; // 垂直居中
    }
    .logo {
        width: 130px;
        height: 130px;
        display: block;
    }
</style>