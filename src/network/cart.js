import { request } from './requestConfig'

// 购物车 API（按 communicate.md 合约）

// 获取购物车 + 汇总（后端通过 Token 解析用户）
export function getCart() {
  return request({ url: '/shopping_cart/', method: 'GET' })
}

// 添加 / 增量 / 设定数量
// data: { product_id, quantity, mode?: 'add' | 'set' }
export function addToCart({ product_id, quantity = 1, mode = 'add' }) {
  return request({ url: '/shopping_cart/', method: 'POST', data: { product_id, quantity, mode } })
}

// 修改单条（数量/选中）
export function patchCartItem({ id, quantity, selected }) {
  const data = {}
  if (quantity != null) data.quantity = quantity
  if (selected != null) data.selected = selected
  return request({ url: `/shopping_cart/item/${id}/`, method: 'PATCH', data })
}

// 删除单条
export function deleteCartItem(id) {
  return request({ url: `/shopping_cart/item/${id}/`, method: 'DELETE' })
}

// 全选 / 取消全选
export function selectAll({ selected }) {
  return request({ url: '/shopping_cart/select_all', method: 'POST', data: { selected } })
}

// 清空（全部或仅选中）
export function clearCart({ only_selected }) {
  return request({ url: '/shopping_cart/clear', method: 'POST', data: { only_selected } })
}
