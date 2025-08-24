<template>
  <div class="profile-edit-page">
    <Shortcut />
    <Header />
    <div class="container">
      <div class="header">
        <h2>编辑资料</h2>
        <el-button link @click="goBack">返回我的主页</el-button>
      </div>
      <div v-if="loading" class="loading">加载中…</div>
      <div v-else class="box">
        <div class="avatar-block">
          <img class="avatar" :src="resolvedAvatar(uform.avatar_url)" alt="avatar" />
          <el-upload :show-file-list="false" accept=".jpg,.jpeg,.png,.webp" :before-upload="beforeAvatarUpload" :http-request="handleAvatarUpload">
            <el-button size="small">更换头像</el-button>
          </el-upload>
        </div>
        <el-form :model="uform" label-width="88px" class="edit-form">
          <el-form-item label="用户名"><el-input v-model="uform.username" /></el-form-item>
          <el-form-item label="姓名"><el-input v-model="uform.name" /></el-form-item>
          <el-form-item label="手机号"><el-input v-model="uform.phone" /></el-form-item>
          <el-form-item label="邮箱"><el-input v-model="uform.email" /></el-form-item>
          <el-form-item label="头像URL"><el-input v-model="uform.avatar_url" /></el-form-item>
          <el-form-item label="性别">
            <el-select v-model="uform.gender" placeholder="请选择">
              <el-option label="男" value="male" />
              <el-option label="女" value="female" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="生日">
            <el-date-picker v-model="uform.birthday" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
          </el-form-item>
          <el-form-item label="新密码"><el-input v-model="uform.password" type="password" show-password placeholder="可不填" /></el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="submitProfile">保存</el-button>
            <el-button @click="goBack">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import Shortcut from '@/components/common/Shortcut.vue'
import Header from '@/components/homepage/Header.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { getUserProfile, updateUserProfile, uploadAvatar } from '@/network/user'

const router = useRouter()
const store = useStore()
const loading = ref(true)
const saving = ref(false)
const uform = ref({ id: null, username:'', name:'', phone:'', email:'', avatar_url:'', gender:'', birthday:'', password:'' })

function resolvedAvatar(url){
  if (!url) return 'https://via.placeholder.com/96x96.png?text=Avatar'
  return url
}
function goBack(){ router.push({ name:'user-profile' }) }

async function load(){
  loading.value = true
  try {
    const p = await getUserProfile()
    if (p?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/user/profile/edit' } }) }
    if (p?.code === 4000 || p?.code === 3000 || p?.code === 200) {
      const d = p.data || {}
      uform.value = { id: d.id, username: d.username||'', name: d.name||'', phone: d.phone||'', email: d.email||'', avatar_url: d.avatar_url||'', gender: d.gender||'', birthday: d.birthday||'', password:'' }
    }
  } catch(e){ ElMessage.error(e?.normalizedMessage || e?.message || '加载失败') }
  finally { loading.value = false }
}

async function submitProfile(){
  const body = { ...uform.value }
  if (!body.id) { const p = await getUserProfile(); body.id = p?.data?.id }
  saving.value = true
  try {
    const r = await updateUserProfile(body)
    if (r?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/user/profile/edit' } }) }
    if (r?.code === 2000 || r?.code === 4000 || r?.code === 3000 || r?.code === 200) {
      ElMessage.success(r?.msg || '更新成功')
      goBack()
    } else { ElMessage.error(r?.msg || '更新失败') }
  } catch(e){ ElMessage.error(e?.normalizedMessage || e?.message || '更新失败') } finally { saving.value = false }
}

function beforeAvatarUpload(file){
  const okType = ['image/jpeg','image/png','image/webp'].includes(file.type)
  const okSize = file.size <= 2 * 1024 * 1024
  if (!okType) ElMessage.error('仅支持 jpg/jpeg/png/webp')
  if (!okSize) ElMessage.error('文件大小需 ≤ 2MB')
  return okType && okSize
}

async function handleAvatarUpload({ file }){
  try {
    const r = await uploadAvatar(file)
    if (r?.code === 4101) { store.dispatch('auth/logout'); return router.push({ name:'login', query:{ next:'/user/profile/edit' } }) }
    if (r?.code === 4000 || r?.code === 3000 || r?.code === 200) {
      ElMessage.success('头像已更新')
      const url = r?.data?.avatar_url
      if (url) { uform.value.avatar_url = url }
    } else { ElMessage.error(r?.msg || '上传失败') }
  } catch(e){ ElMessage.error(e?.normalizedMessage || e?.message || '上传失败') }
}

onMounted(() => { if (!store.getters['auth/isLoggedIn']) router.push({ name:'login', query:{ next:'/user/profile/edit' } }); else load() })
</script>

<style scoped>
.profile-edit-page { background: var(--color-bg); }
.container { width: var(--content-width); margin: 16px auto; padding: 12px; }
.box { background: #fff; border-radius: 12px; padding: 16px; }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.avatar-block { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; background: #f5f5f5; }
.edit-form :deep(.el-form-item) { max-width: 520px; }
.loading { padding: 8px 0; }
</style>
