<template>
    <div class="warpper">
        <div class="header">
            <a href="">你好，请登录</a>
            <a href="">点击注册</a> | 
            <a href="">我的订单</a>
        </div>

    </div>
</template>

<script>
</script>

<style lang="less" scoped>
.warpper {
    background-color: var(--color-bg-secondary);
    height: 30px;
    .header {
        width: var(--content-width);
        margin: 0 auto; 
        text-align: right;  
        line-height: 30px;
        a{
            margin-left: 10px;
            margin-right: 10px;
        }
    }
}
</style>