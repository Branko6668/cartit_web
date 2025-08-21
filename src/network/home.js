import { request } from "./requestConfig.js";

export function getMainMenu() {
  return request({
    url: "/product/main_menu/",
    method: "get",
  });
}
