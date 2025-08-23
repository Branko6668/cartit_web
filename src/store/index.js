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
  modules: { auth }
})
