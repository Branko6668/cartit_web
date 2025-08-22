import { request } from "./requestConfig.js";

export function getMainMenu() {
  return request({
    url: "/product/main_menu/",
    method: "get",
  });
}

export function getSubMenu(main_menu_id) {
  return request({
    url: "/product/sub_menu/",
    method: "get",
    params: { main_menu_id }
  });
}

export function getSubSubMenu(sub_menu_id) {
  return request({
    url: "/product/sub_sub_menu/",
    method: "get",
    params: { sub_menu_id }
  });
}


// 按标签获取商品（例如：tag=1 为新品推荐）
export function getProductsByTag(product_tag_id = 1, page = 1) {
  return request({
    url: `/product/tag/${product_tag_id}/${page}/`,
    method: "get",
  });
}
