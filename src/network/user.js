import { request } from './requestConfig'

// 用户资料（基于 Token）
export function getUserProfile() {
  return request({ url: '/user/profile/', method: 'GET' })
}

// 地址列表（分页 & 默认优先）
export function listAddresses({ user, page = 1, page_size = 10 }) {
  const params = new URLSearchParams()
  if (user) params.set('user', String(user))
  if (page) params.set('page', String(page))
  if (page_size) params.set('page_size', String(page_size))
  const q = params.toString()
  return request({ url: `/user/address/list/${q ? `?${q}` : ''}`, method: 'GET' })
}

// 创建地址（后端自动绑定当前用户）
export function createAddress(body) {
  // body 不必传 user 字段
  return request({ url: '/user/address/', method: 'POST', data: body })
}

// 设置默认地址
export function setDefaultAddress(id) {
  return request({ url: `/user/address/${id}/default/`, method: 'POST' })
}

// 地址详情
export function getAddress(id) {
  return request({ url: `/user/address/${id}/`, method: 'GET' })
}

// 更新地址
export function updateAddress(id, body) {
  return request({ url: `/user/address/${id}/`, method: 'PUT', data: body })
}

// 删除地址（软删）
export function deleteAddress(id) {
  return request({ url: `/user/address/${id}/`, method: 'DELETE' })
}

// 更新当前用户资料
export function updateUserProfile(body) {
  return request({ url: '/user/update/', method: 'PUT', data: body })
}

// 上传并覆盖当前用户头像（multipart/form-data）
export function uploadAvatar(file) {
  const form = new FormData()
  form.append('avatar', file)
  return request({ url: '/user/avatar/', method: 'POST', data: form, headers: { 'Content-Type': 'multipart/form-data' } })
}
