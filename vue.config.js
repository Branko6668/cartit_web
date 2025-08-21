const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  // ...existing code...
  chainWebpack: config => {
    config.plugin('define').tap(definitions => {
      Object.assign(definitions[0], {
        __VUE_OPTIONS_API__: true,              // "我的项目需要 Options API"
        __VUE_PROD_DEVTOOLS__: false,           // "生产环境不需要 DevTools"
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false  // "不需要 SSR 水合错误详情"
      })
      return definitions
    })
  }
})