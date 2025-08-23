<template>
  <div class="auth-wrap">
  <img class="login-logo" :src="loginLogoImg" alt="login logo" />
    <div class="box" :class="stateClass">
      <!-- 单一完整卡片内部：信息区 30% 与 表单区 70% -->
      <div class="info-pane">
        <transition name="fade-swap" mode="out-in">
          <div class="info-content" :key="state" :class="`mode-${state}`">
            <div class="image" :style="{ backgroundImage: `url(${cardImage})` }"></div>
            <div class="legend">
              <h3>{{ cardTitle }}</h3>
              <p>{{ cardDesc }}</p>
            </div>
          </div>
        </transition>
      </div>
      <div class="form-pane">
        <div class="form-inner">
        <section v-if="state==='login'">
          <h2>账号登录</h2>
          <form @submit.prevent="onLogin">
            <div class="field"><input v-model.trim="login.phone" placeholder="手机号" /></div>
            <div class="field pass">
              <input :type="showPassLogin?'text':'password'" v-model.trim="login.password" placeholder="密码" />
              <button class="toggle" type="button" @click="showPassLogin=!showPassLogin">{{ showPassLogin?'隐藏':'显示' }}</button>
            </div>
            <button class="primary" type="submit" :disabled="loading">登录</button>
          </form>
          <div class="actions">
            <a href="" @click.prevent="goForgot">忘记密码</a>
            <a href="" @click.prevent="goRegister">立即注册</a>
          </div>
        </section>

        <section v-else-if="state==='register'">
          <h2>注册账号</h2>
          <form @submit.prevent="onRegister">
            <div class="field"><input v-model.trim="register.phone" placeholder="手机号" /></div>
            <div class="field pass">
              <input :type="showPassReg?'text':'password'" v-model.trim="register.password" placeholder="密码（字母+数字≥6）" />
              <button class="toggle" type="button" @click="showPassReg=!showPassReg">{{ showPassReg?'隐藏':'显示' }}</button>
            </div>
            <div class="field code">
              <input v-model.trim="register.code" placeholder="验证码" />
              <button type="button" class="ghost" :disabled="cooldown>0||loading" @click="sendCode('register')">{{ cooldown>0?cooldown+'s':'获取验证码' }}</button>
            </div>
            <button class="primary" type="submit" :disabled="loading">注册</button>
          </form>
          <div class="actions">
            <a href="" @click.prevent="goLogin">返回登录</a>
          </div>
        </section>

        <section v-else>
          <h2>找回密码</h2>
          <form @submit.prevent="onReset">
            <div class="field"><input v-model.trim="forgot.phone" placeholder="手机号" /></div>
            <div class="field code">
              <input v-model.trim="forgot.code" placeholder="验证码" />
              <button type="button" class="ghost" :disabled="cooldown>0||loading" @click="sendCode('reset')">{{ cooldown>0?cooldown+'s':'获取验证码' }}</button>
            </div>
            <div class="field"><input :type="showPassNew?'text':'password'" v-model.trim="forgot.new_password" placeholder="新密码（字母+数字≥6）" /></div>
            <button class="primary" type="submit" :disabled="loading">更改密码</button>
          </form>
          <div class="actions">
            <a href="" @click.prevent="goLogin">返回登录</a>
          </div>
        </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { apiLogin, apiRegister, apiSendCode, apiResetPassword } from '@/network/auth'
import { ElMessage } from 'element-plus'
import img01 from '@/assets/images/loginimages/01.png'
import img02 from '@/assets/images/loginimages/02.png'
import loginLogoImg from '@/assets/images/loginlogo.png'

const router = useRouter()
const route = useRoute()
const store = useStore()

const state = ref('login') // 'login' | 'register' | 'forgot'
const loading = ref(false)
const cooldown = ref(0)
let timer = null

const login = ref({ phone: '', password: '' })
const register = ref({ phone: '', password: '', code: '' })
const forgot = ref({ phone: '', code: '', new_password: '' })

const showPassLogin = ref(false)
const showPassReg = ref(false)
const showPassNew = ref(false)

function toLogin(){ state.value='login' }
function toRegister(){ state.value='register' }
function toForgot(){ state.value='forgot' }

function goLogin(){ router.push({ name: 'login' }) }
function goRegister(){ router.push({ name: 'register' }) }
function goForgot(){ router.push({ name: 'forgot' }) }

function startCooldown() {
  cooldown.value = 60
  timer && clearInterval(timer)
  timer = setInterval(()=>{
    cooldown.value -= 1
    if (cooldown.value <= 0) { clearInterval(timer); timer=null }
  }, 1000)
}

function validPhone(v){ return /^1\d{10}$/.test(v||'') }
function validPass(v){ return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(v||'') }

async function onLogin(){
  if (!validPhone(login.value.phone)) return ElMessage.error('手机号格式不正确')
  if (!login.value.password) return ElMessage.error('密码不能为空')
  loading.value = true
  try {
    const r = await apiLogin({ phone: login.value.phone, password: login.value.password })
    if (r && r.code === 4000 && r.data?.token) {
      store.dispatch('auth/loginSuccess', { token: r.data.token, user: r.data.user })
      ElMessage.success('登录成功')
      const next = route.query.next || '/'
      router.replace(next)
    } else {
      ElMessage.error(r?.msg || '登录失败')
    }
  } catch(e){ ElMessage.error(e?.normalizedMessage || e?.message || '登录失败') }
  finally { loading.value = false }
}

async function sendCode(scene){
  if (!validPhone((state.value==='register'?register:forgot).value.phone)) return ElMessage.error('手机号格式不正确')
  try {
    const p = state.value==='register'? register.value.phone : forgot.value.phone
    const r = await apiSendCode({ phone: p, scene: scene })
    if (r && (r.code === 4500 || r.code === 200)) { ElMessage.success('验证码已发送'); startCooldown() }
    else { ElMessage.error(r?.msg || '发送失败') }
  } catch(e){ ElMessage.error(e?.normalizedMessage || e?.message || '发送失败') }
}

async function onRegister(){
  if (!validPhone(register.value.phone)) return ElMessage.error('手机号格式不正确')
  if (!validPass(register.value.password)) return ElMessage.error('密码需字母+数字且不少于6位')
  if (!/^\d{6}$/.test(register.value.code||'')) return ElMessage.error('验证码格式不正确')
  loading.value = true
  try {
    const r = await apiRegister({ phone: register.value.phone, password: register.value.password, code: register.value.code })
    if (r && r.code === 4000) { ElMessage.success('用户注册成功'); toLogin() }
    else { ElMessage.error(r?.msg || '注册失败') }
  } catch(e){ ElMessage.error(e?.normalizedMessage || e?.message || '注册失败') }
  finally { loading.value = false }
}

async function onReset(){
  if (!validPhone(forgot.value.phone)) return ElMessage.error('手机号格式不正确')
  if (!/^\d{6}$/.test(forgot.value.code||'')) return ElMessage.error('验证码格式不正确')
  if (!validPass(forgot.value.new_password)) return ElMessage.error('新密码需字母+数字且不少于6位')
  loading.value = true
  try {
    const r = await apiResetPassword({ phone: forgot.value.phone, code: forgot.value.code, new_password: forgot.value.new_password })
    if (r && (r.code === 4504 || r.code === 200)) { ElMessage.success('密码重置成功'); toLogin() }
    else { ElMessage.error(r?.msg || '重置失败') }
  } catch(e){ ElMessage.error(e?.normalizedMessage || e?.message || '重置失败') }
  finally { loading.value = false }
}

onMounted(()=>{
  state.value = route.name === 'register' ? 'register' : route.name === 'forgot' ? 'forgot' : 'login'
})

watch(() => route.name, (n) => {
  state.value = n === 'register' ? 'register' : n === 'forgot' ? 'forgot' : 'login'
})

const stateClass = computed(() => `state-${state.value}`)
const cardImage = computed(() => state.value === 'login' ? img01 : img02)
const cardTitle = computed(() => state.value === 'login' ? '欢迎回来' : state.value === 'register' ? '加入我们' : '找回密码')
const cardDesc = computed(() => state.value === 'login' ? '登录后解锁更多精彩内容' : state.value === 'register' ? '注册新账号，畅享购物体验' : '通过验证重设你的密码')
</script>

<style scoped lang="less">
.auth-wrap { position: relative; min-height: 100vh; background: linear-gradient(135deg, #9ED2FF 0%, #A7F3D0 100%); display: flex; align-items: center; justify-content: center; padding: 40px 16px; }
.login-logo { position: absolute; top: 6%; left: 50%; transform: translateX(-50%); width: 180px; height: auto; z-index: 3; clip-path: inset(5px); }
.box { position: relative; width: 920px; height: 520px; background: #fff; border-radius: 18px; overflow: hidden; }

/* 内部 30% 信息区与 70% 表单区：通过 left 切换位置；光效仅在 30% 信息卡片内部 */
.info-pane { position: absolute; top: 0; left: 0; width: 30%; height: 100%; display: flex; flex-direction: column; background: #fff; border-radius: 16px; overflow: hidden; transition: left .8s cubic-bezier(0.22,1,0.36,1); will-change: left; }
.form-pane { position: absolute; top: 0; left: 30%; width: 70%; height: 100%; padding: 40px 36px; overflow: hidden; transition: left .8s cubic-bezier(0.22,1,0.36,1); will-change: left; display: flex; align-items: center; justify-content: center; }
.form-inner { width: 78%; max-width: 520px; }
.box.state-register .info-pane, .box.state-forgot .info-pane { left: 70%; }
.box.state-login .info-pane { left: 0; }
.box.state-register .form-pane, .box.state-forgot .form-pane { left: 0; }
.box.state-login .form-pane { left: 30%; }

/* 信息卡片内部弥散光（登录蓝/注册绿/忘记橙紫） */
.info-pane::before { content: ""; position: absolute; inset: 0; pointer-events: none; border-radius: inherit; box-shadow: inset 0 0 22px 6px var(--glowA), inset 0 0 36px 12px var(--glowB); transition: box-shadow .5s cubic-bezier(0.22,1,0.36,1); }
.box.state-login { --glowA: rgba(59,130,246,0.35); --glowB: rgba(59,130,246,0.18); }
.box.state-register { --glowA: rgba(16,185,129,0.35); --glowB: rgba(16,185,129,0.18); }
.box.state-forgot { --glowA: rgba(249,115,22,0.35); --glowB: rgba(147,51,234,0.25); }

/* 信息内容垂直水平居中 */
.info-content { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 16px; gap: 12px; }
.image { width: 80%; max-width: 220px; aspect-ratio: 1 / 1; background-size: contain; background-repeat: no-repeat; background-position: center; border-radius: 12px; box-shadow: none; transform-origin: center; transition: transform .28s ease; }
/* 锁定尺寸在内容节点上，避免父级状态切换时的跳变 */
.info-content.mode-login .image { transform: scale(0.9); }
.legend h3 { margin: 0; font-size: 18px; }
.legend p { margin: 6px 0 0; color: #555; font-size: 13px; line-height: 1.4; }

/* 淡入淡出切换信息内容 */
.fade-swap-enter-active, .fade-swap-leave-active { transition: opacity .3s ease; }
.fade-swap-enter-from, .fade-swap-leave-to { opacity: 0; }

/* 表单样式 */
h2 { margin: 0 0 16px; color: #111; }
.field { margin-bottom: 12px; }
.field input { width: 100%; height: 40px; border: 1px solid var(--color-divider); border-radius: 8px; padding: 0 12px; outline: none; }
.field.pass { position: relative; }
.field .toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); height: 28px; border: none; background: transparent; cursor: pointer; color: #2563eb; }
.field.code { display: flex; gap: 8px; }
.field.code input { flex: 1; }
.ghost { height: 40px; padding: 0 12px; border-radius: 8px; background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe; cursor: pointer; }
.primary { width: 100%; height: 42px; border-radius: 8px; border: none; color: #fff; font-weight: 700; cursor: pointer; background: linear-gradient(90deg, #60a5fa, #34d399); }
.actions { margin-top: 10px; display: flex; justify-content: space-between; }
.actions a { color: #2563eb; text-decoration: none; }
.actions a:hover { text-decoration: underline; }
</style>
