import { request } from './requestConfig'

// 订单相关 API（按 communicate.md 合约）

// 购物车创建订单（可能按店铺拆单，返回数组）
export function createOrder({ recipient, remark = '' }) {
  return request({ url: '/order/create/', method: 'POST', data: { recipient, remark } })
}

// 直接购买创建订单（返回单个订单对象）
export function directOrder({ product_id, quantity = 1, recipient, remark = '' }) {
  return request({ url: '/order/direct/', method: 'POST', data: { product_id, quantity, recipient, remark } })
}

// 订单列表
export function listOrders({ status, page = 1, page_size = 10 } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (page) params.set('page', String(page))
  if (page_size) params.set('page_size', String(page_size))
  const query = params.toString()
  return request({ url: `/order/list/${query ? `?${query}` : ''}`, method: 'GET' })
}

// 订单详情
export function getOrderDetail(id) {
  return request({ url: `/order/${id}/`, method: 'GET' })
}
