import axios from 'axios';

export function request(config) {
  const instance = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    timeout: 5000,
  });

  instance.interceptors.request.use(
    (config) => {
      // Attach Token header if present
      try {
        const token = localStorage.getItem('token')
        const url = (config.url || '').toString()
        const method = (config.method || 'get').toLowerCase()
        // 前端规避预检：以下公共接口不附带 Token，防止触发 CORS 预检导致 GET 被拦
        const isPublic = url.startsWith('/product/') || url.startsWith('/review/product/')
        // 登录/注册/发送验证码/重置密码也无需 Token
        const isAuthNoToken = url.startsWith('/user/login/') || url.startsWith('/user/register/') || url.startsWith('/user/send_code/') || url.startsWith('/user/reset_password/')

        if (token && !isPublic && !isAuthNoToken) {
          config.headers = config.headers || {}
          config.headers['Token'] = token
          // 兼容部分接口使用标准 Authorization Bearer
          if (!config.headers['Authorization']) config.headers['Authorization'] = `Bearer ${token}`
        }
      } catch {}
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      // Handle response data
      return response.data;
    },
    (error) => {
      // Normalize backend error message for consistent UI feedback
      let msg = '请求失败';
      const data = error?.response?.data;
      if (data) {
        if (typeof data === 'string') {
          // Strip HTML if any and trim
          try {
            msg = data.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || msg;
          } catch { msg = data; }
        } else if (typeof data === 'object') {
          const listMsg = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(', ') : '';
          msg = data.msg || data.message || data.detail || listMsg || msg;
        }
      } else if (error?.message) {
        msg = error.message;
      }
      // Cap overly long messages
      if (typeof msg === 'string' && msg.length > 200) msg = msg.slice(0, 200) + '…';
      error.normalizedMessage = msg;
      return Promise.reject(error);
    }
  );

  return instance(config);
}