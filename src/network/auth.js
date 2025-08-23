import { request } from './requestConfig'

export function apiLogin({ phone, password }) {
  return request({
    url: '/user/login/',
    method: 'POST',
    data: { phone, password }
  })
}

export function apiRegister({ phone, password, code, username, email, avatar_url, birthday }) {
  return request({
    url: '/user/register/',
    method: 'POST',
    data: { phone, password, code, username, email, avatar_url, birthday }
  })
}

export function apiSendCode({ phone, scene }) {
  return request({
    url: '/user/send_code/',
    method: 'POST',
    data: { phone, scene }
  })
}

export function apiResetPassword({ phone, code, new_password }) {
  return request({
    url: '/user/reset_password/',
    method: 'POST',
    data: { phone, code, new_password }
  })
}
