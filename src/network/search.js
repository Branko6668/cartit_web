import { request } from "./requestConfig.js";

export function searchProducts({ q, page = 1, page_size = 20, sort = 0 }) {
  return request({
    url: "/product/search/",
    method: "get",
    params: { q, page, page_size, sort },
  });
}
