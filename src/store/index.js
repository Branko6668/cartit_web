import { createStore } from 'vuex'

const auth = {
  namespaced: true,
  state: () => ({
    token: '',
    user: null,
    inited: false,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    username: (s) => s.user?.username || s.user?.phone || '',
  },
  mutations: {
    setAuth(state, { token, user }) {
      state.token = token || ''
      state.user = user || null
      try {
        if (state.token) localStorage.setItem('token', state.token)
        else localStorage.removeItem('token')
        if (state.user) localStorage.setItem('user', JSON.stringify(state.user))
        else localStorage.removeItem('user')
      } catch {}
    },
    clearAuth(state) {
      state.token = ''
      state.user = null
      try { localStorage.removeItem('token'); localStorage.removeItem('user') } catch {}
    },
    setInited(state, v) { state.inited = !!v },
  },
  actions: {
    init({ commit }) {
      try {
        const token = localStorage.getItem('token') || ''
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        commit('setAuth', { token, user })
      } catch { commit('setAuth', { token: '', user: null }) }
      commit('setInited', true)
    },
    loginSuccess({ commit }, { token, user }) {
      commit('setAuth', { token, user })
    },
    logout({ commit }) {
      commit('clearAuth')
    }
  }
}

export default createStore({
  modules: {
    auth,
    order: {
      namespaced: true,
      state: () => ({ lastOrders: [] }),
      getters: { lastOrders: s => s.lastOrders },
      mutations: {
        setLastOrders(s, arr){
          s.lastOrders = Array.isArray(arr) ? arr : []
          try { localStorage.setItem('lastOrders', JSON.stringify(s.lastOrders)) } catch {}
        }
      },
      actions: {
        loadFromStorage({ commit }){
          try { const arr = JSON.parse(localStorage.getItem('lastOrders')||'[]'); commit('setLastOrders', arr) } catch { commit('setLastOrders', []) }
        }
      }
    },
    cart: {
      namespaced: true,
      state: () => ({ count: 0 }),
      getters: { count: s => s.count },
      mutations: { setCount(s, n){ s.count = Number(n||0) } },
      actions: {
        async refresh({ commit, rootGetters }){
          // 未登录则不请求受保护的购物车接口，避免控制台出现 401 报错
          try {
            const isAuthed = rootGetters && rootGetters['auth/isLoggedIn']
            if (!isAuthed) { commit('setCount', 0); return }
          } catch { /* ignore */ }
          try {
            const { getCart } = await import('@/network/cart')
            const r = await getCart()
            const total = r?.data?.summary?.total_count
            if (typeof total !== 'undefined') commit('setCount', total)
            else commit('setCount', Array.isArray(r?.data?.items)? r.data.items.length : 0)
          } catch { /* ignore */ }
        }
      }
    }
  }
})
