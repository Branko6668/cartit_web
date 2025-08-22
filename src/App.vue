<template>
<!--
建议将具体页面内容和业务逻辑放到单独的页面/组件中，而不是在 App.vue 中直接编写。

原因：
1) App.vue 应作为应用外壳（Shell），只承载全局布局、<router-view/>、全局过渡/keep-alive、Provider 等；
2) 在此编写页面逻辑或样式，容易造成全局样式污染、状态耦合与副作用，影响路由切换与性能；
3) 拆分有利于按需加载与代码分割，提升可维护性、可测试性与团队协作效率。

建议做法：
- 页面级内容放在 src/views 下并通过路由加载；
- 可复用组件放在 src/components 下；
- 业务逻辑提取到 src/composables 或状态管理（Pinia/Vuex）；
- 网络请求放到页面的 setup/onMounted 或独立 network 模块；
- 全局样式在 src/assets/styles 或 main.* 中统一导入，避免在 App.vue 写页面样式；
- 保持此处最小化：布局容器 + <router-view/>（必要时配合 <transition> / <keep-alive>）。
-->
<router-view/>
<BackToTop />
</template>

<script setup>
import BackToTop from './components/common/BackToTop.vue'
  // import { getMainMenu } from './network/home';

  // getMainMenu().then(response => {
  //   console.log('Main Menu:', response.data);
  // }).catch(error => {
  //   console.error('Error fetching main menu:', error);
  // });
</script>

<style lang="less">

</style>
