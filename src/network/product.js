import { request } from './requestConfig.js'

export function getProductById(id) {
  return request({ url: `/product/query/${id}/`, method: 'get' })
}

export function getReviewsByProduct(productId, page = 1, page_size = 10) {
  return request({ url: `/review/product/${productId}/`, method: 'get', params: { page, page_size } })
}
