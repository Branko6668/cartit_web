import { request } from './requestConfig'

// 生成支付宝支付链接
export function createAlipayPayment(order_id) {
  return request({ url: '/payment/alipay/create/', method: 'POST', data: { order_id } })
}

// 查询支付状态（可用 payment_no 或 order_id）
export function getPaymentStatus(params = {}) {
  const sp = new URLSearchParams()
  if (params.payment_no) sp.set('payment_no', params.payment_no)
  if (params.order_id) sp.set('order_id', String(params.order_id))
  const q = sp.toString()
  return request({ url: `/payment/status/${q ? `?${q}` : ''}`, method: 'GET' })
}
