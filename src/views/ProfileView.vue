<template>
  <div class="profile-page">
    <Shortcut />
    <Header />
    <div class="container">
      <h2>我的主页</h2>
      <div v-if="loading" class="loading">加载中…</div>
      <div v-else>
        <section class="box">
          <h3>基本资料</h3>
          <div class="profile-row" v-if="profile">
            <div class="avatar">
              <img :src="resolvedAvatar(profile.avatar_url)" alt="avatar" />
              <el-upload :show-file-list="false" accept=".jpg,.jpeg,.png,.webp" :before-upload="beforeAvatarUpload" :http-request="handleAvatarUpload">
                <el-button size="small">更换头像</el-button>
              </el-upload>
            </div>
            <div class="info">
              <div>用户名：{{ profile.username || '-' }}</div>
              <div>姓名：{{ profile.name || '-' }}</div>
              <div>手机号：{{ profile.phone || '-' }}</div>
              <div>邮箱：{{ profile.email || '-' }}</div>
              <div>性别：{{ profile.gender || '-' }}</div>
              <div>生日：{{ profile.birthday || '-' }}</div>
            </div>
          </div>
          <div class="edit-entry">
            <el-button type="primary" @click="goEdit">编辑资料</el-button>
          </div>
        </section>

        <section class="box">
          <h3>地址管理</h3>
          <div class="addr-actions">
            <el-button type="primary" @click="openAdd = true">新增地址</el-button>
          </div>
          <div v-if="addresses.length === 0" class="empty">暂无地址</div>
          <ul class="addr-list">
            <li v-for="a in addresses" :key="a.id">
              <span class="tag" v-if="a.is_default">默认</span>
              {{ a.recipient_name }} {{ a.recipient_phone }}｜{{ fullAddr(a) }}
              <span class="ops">
                <el-button link type="primary" :disabled="a.is_default" @click="setDefault(a)">设为默认</el-button>
                <el-button link type="danger" @click="removeAddr(a)">删除</el-button>
              </span>
            </li>
          </ul>
          <div class="pager" v-if="pageInfo.count > pageInfo.page_size">
            <el-pagination background layout="prev, pager, next" :page-size="pageInfo.page_size" :total="pageInfo.count" :current-page="page" @current-change="onPageChange" />
          </div>
        </section>
      </div>
    </div>

    <!-- 新增地址弹窗（极简示例） -->
    <el-dialog v-model="openAdd" title="新增地址" width="520px">
      <div class="addr-form">
        <el-input v-model="form.recipient_name" placeholder="收件人" />
        <el-input v-model="form.recipient_phone" placeholder="手机号（11位）" />
        <el-input v-model="form.province" placeholder="省" />
        <el-input v-model="form.city" placeholder="市" />
        <el-input v-model="form.district" placeholder="区/县" />
        <el-input v-model="form.detail_address" placeholder="详细地址" />
        <el-switch v-model="form.is_default" active-text="设为默认" />
      </div>
      <template #footer>
        <el-button @click="openAdd=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitAddr">保存</el-button>
      </template>
    </el-dialog>
  </div>
}</template>

<script setup>
import Shortcut from '@/components/common/Shortcut.vue'
import Header from '@/components/homepage/Header.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { getUserProfile, listAddresses, createAddress, setDefaultAddress, deleteAddress } from '@/network/user'

const router = useRouter()
const store = useStore()

const loading = ref(true)
const profile = ref(null)
const addresses = ref([])
const page = ref(1)
const pageInfo = ref({ count: 0, page: 1, page_size: 10 })

const openAdd = ref(false)
const saving = ref(false)
const form = ref({ recipient_name:'', recipient_phone:'', province:'', city:'', district:'', detail_address:'', is_default:false })
function goEdit(){ router.push({ name: 'user-profile-edit' }) }

function resolvedAvatar(url){
  if (!url) return 'https://via.placeholder.com/96x96.png?text=Avatar'
  // 若后端返回相对路径，可在此拼接 baseURL；这里直接返回
  return url
}

function fullAddr(a){
  return `${a.province||''}${a.city||''}${a.district||''}${a.detail_address||''}`
}

async function loadAll(){
  loading.value = true
  try {
    const p = await getUserProfile()
    if (p?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/user/profile' } }) }
  if (p?.code === 4000 || p?.code === 3000 || p?.code === 200) { profile.value = p.data }
    const uid = profile.value?.id
    const r = await listAddresses({ user: uid, page: page.value, page_size: pageInfo.value.page_size })
    if (r?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/user/profile' } }) }
    if (r?.code === 4000 || r?.code === 3000 || r?.code === 200) {
      addresses.value = r.data?.results || []
      pageInfo.value = { count: r.data?.count||0, page: r.data?.page||1, page_size: r.data?.page_size||10 }
    }
  } catch(e){
    ElMessage.error(e?.normalizedMessage || e?.message || '加载失败')
  } finally { loading.value = false }
}

function onPageChange(p){ page.value = p; loadAll() }

async function submitAddr(){
  // 简单前端校验
  const f = form.value
  if (!f.recipient_name || f.recipient_name.length>50) return ElMessage.warning('请填写收件人（≤50）')
  if (!/^\d{11}$/.test(f.recipient_phone||'')) return ElMessage.warning('请填写11位手机号')
  const addrStr = `${f.province}${f.city}${f.district}${f.detail_address}`
  if (!addrStr || addrStr.length>500) return ElMessage.warning('请完善地址（≤500）')
  saving.value = true
  try {
    const c = await createAddress({
      recipient_name: f.recipient_name,
      recipient_phone: f.recipient_phone,
      province: f.province, city: f.city, district: f.district, detail_address: f.detail_address,
      postal_code: f.postal_code,
    })
    if (c?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/user/profile' } }) }
    if (c?.code === 4000 || c?.code === 3000 || c?.code === 200) {
      const newId = c?.data?.id
      if (f.is_default && newId) {
        try { await setDefaultAddress(newId) } catch {}
      }
      openAdd.value = false
      form.value = { recipient_name:'', recipient_phone:'', province:'', city:'', district:'', detail_address:'', is_default:false }
      ElMessage.success('保存成功')
      await loadAll()
    } else {
      ElMessage.error(c?.msg || '保存失败')
    }
  } catch(e) {
    ElMessage.error(e?.normalizedMessage || e?.message || '保存失败')
  } finally { saving.value = false }
}

async function setDefault(a){
  try {
    const r = await setDefaultAddress(a.id)
    if (r?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/user/profile' } }) }
    if (r?.code === 4000 || r?.code === 3000 || r?.code === 200) { ElMessage.success('已设为默认'); loadAll() }
    else ElMessage.error(r?.msg || '操作失败')
  } catch(e) { ElMessage.error(e?.normalizedMessage || e?.message || '操作失败') }
}

async function removeAddr(a){
  try {
    const r = await deleteAddress(a.id)
    if (r?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/user/profile' } }) }
    if (r?.code === 4000 || r?.code === 3000 || r?.code === 200) { ElMessage.success('已删除'); loadAll() }
    else ElMessage.error(r?.msg || '删除失败')
  } catch(e) { ElMessage.error(e?.normalizedMessage || e?.message || '删除失败') }
}

onMounted(() => { if (!store.getters['auth/isLoggedIn']) router.push({ name:'login', query:{ next:'/user/profile' } }); else loadAll() })

// 移除本页编辑/上传逻辑，保留只读展示
</script>

<style scoped>
.profile-page { background: var(--color-bg); }
.container { width: var(--content-width); margin: 16px auto; padding: 12px; }
.box { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
.addr-actions { margin-bottom: 8px; }
.addr-list { list-style: none; padding-left: 0; }
.addr-list li { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--color-divider); }
.addr-list .tag { color: #fff; background: var(--el-color-primary); border-radius: 4px; padding: 2px 6px; margin-right: 8px; font-size: 12px; }
.empty { color: #888; padding: 8px 0; }
.loading { padding: 8px 0; }
.addr-form :deep(.el-input) { margin-bottom: 8px; }
</style>
