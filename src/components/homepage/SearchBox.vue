<template>
    <div class="main">
        <!-- 搜索框 -->
        <div class="search-container">
            <div class="search-input-box">
                <input 
                    type="text" 
                    v-model="searchText"
                    @focus="showSuggestions = true"
                    @blur="hideSuggestions"
                    @input="onInputChange"
                    placeholder="搜索商品、品牌或店铺"
                    class="search-input"
                >
                <button class="search-btn" @click="performSearch">
                    <img src="@/assets/images/search.png" class="search-icon" alt="搜索">
                </button>
            </div>
            
            <!-- 搜索建议下拉列表 -->
            <div class="suggestions-dropdown" v-show="showSuggestions && filteredSuggestions.length > 0">
                <div 
                    class="suggestion-item"
                    v-for="(suggestion, index) in filteredSuggestions"
                    :key="index"
                    @mousedown="selectSuggestion(suggestion)"
                >
                    <img src="@/assets/images/search.png" class="suggestion-icon" alt="">
                    <span>{{ suggestion }}</span>
                </div>
            </div>
        </div>

        <!-- 热门搜索标签/跨界跳转链接 -->
        <div class="hot-tags">
            <span class="tags-label">热门搜索：</span>
            <div class="tags-container">
                <a 
                    href="#" 
                    class="tag-item"
                    v-for="(tag, index) in hotTags"
                    :key="index"
                    @click="searchByTag(tag.name)"
                >
                    {{ tag.name }}
                </a>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 响应式数据
const searchText = ref('')
const showSuggestions = ref(false)

// 推荐搜索词
const searchSuggestions = ref([
    'iPhone 15', 'MacBook Pro', '连衣裙', '运动鞋', '化妆品',
    '笔记本电脑', '平板电脑', '耳机', '手机壳', '充电器',
    '女装', '男装', '包包', '手表', '项链',
    '护肤品', '口红', '面膜', '洗发水', '香水'
])

// 热门标签/跨界跳转
const hotTags = ref([
    { name: '电脑', category: 'electronics' },
    { name: '裙子', category: 'fashion' },
    { name: '手机', category: 'electronics' },
    { name: '化妆品', category: 'beauty' },
    { name: '运动鞋', category: 'sports' },
    { name: '包包', category: 'fashion' },
    { name: '耳机', category: 'electronics' },
    { name: '护肤品', category: 'beauty' }
])

// 计算属性 - 过滤后的搜索建议
const filteredSuggestions = computed(() => {
    if (!searchText.value) return []
    
    return searchSuggestions.value.filter(suggestion => 
        suggestion.toLowerCase().includes(searchText.value.toLowerCase())
    ).slice(0, 8) // 最多显示8个建议
})

// 方法
const onInputChange = () => {
    showSuggestions.value = searchText.value.length > 0
}

const hideSuggestions = () => {
    // 延迟隐藏，允许点击建议项
    setTimeout(() => {
        showSuggestions.value = false
    }, 200)
}

const selectSuggestion = (suggestion) => {
    searchText.value = suggestion
    showSuggestions.value = false
    performSearch()
}

const performSearch = () => {
    if (searchText.value.trim()) {
        console.log('搜索:', searchText.value)
        // 这里可以调用搜索API或跳转到搜索结果页
        // 例如: router.push({ name: 'SearchResults', query: { q: searchText.value } })
    }
}

const searchByTag = (tagName) => {
    searchText.value = tagName
    performSearch()
}
</script>

<style lang="less" scoped>
.main {
    width: 100%;
    padding: var(--spacing-md) 0;
}

.search-container {
    position: relative;
    margin-bottom: var(--spacing-md);
}

.search-input-box {
    display: flex;
    align-items: center;
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    background: var(--color-bg);
    overflow: hidden;
    
    &:focus-within {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
    }
}

.search-input {
    flex: 1;
    padding: 12px 16px;
    border: none;
    outline: none;
    font-size: var(--font-size-md);
    color: var(--color-text);
    background: transparent;
    
    &::placeholder {
        color: var(--color-text-muted);
    }
}

.search-btn {
    padding: 12px 16px;
    border: none;
    background: var(--color-primary);
    cursor: pointer;
    transition: background-color 0.2s ease;
    
    &:hover {
        background: var(--color-primary-hover);
    }
    
    .search-icon {
        width: 20px;
        height: 20px;
        filter: brightness(0) invert(1); // 使图标变白色
    }
}

.suggestions-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-bg);
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    box-shadow: var(--shadow-sm);
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
}

.suggestion-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    
    &:hover {
        background: var(--color-bg-secondary);
    }
    
    .suggestion-icon {
        width: 16px;
        height: 16px;
        margin-right: var(--spacing-sm);
        opacity: 0.6;
    }
    
    span {
        color: var(--color-text);
        font-size: var(--font-size-sm);
    }
}

.hot-tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
}

.tags-label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    margin-right: var(--spacing-sm);
    white-space: nowrap;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
}

.tag-item {
    padding: 6px 12px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-divider);
    border-radius: var(--border-radius-sm);
    text-decoration: none;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    transition: all 0.2s ease;
    
    &:hover {
        background: var(--color-primary-light);
        color: var(--color-bg);
        border-color: var(--color-primary);
        transform: translateY(-1px);
    }
}
</style>