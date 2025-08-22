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