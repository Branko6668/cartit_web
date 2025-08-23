============================== 购物车模块前端对接说明 ==============================
一、整体设计目标
Token 鉴权，后端通过 Token 解析 user_id（不再使用 user_id 参数）。
所有接口统一返回 CustomResponse：{code,msg,data,...}。
列表接口同时返回 summary，减少前端自行聚合。
支持增量添加(add)与绝对设定(set)两种模式。
条目含商品与店铺关键冗余字段，避免额外请求。
预留后续扩展（优惠、校验、订单预览、批量操作）。
二、数据模型（Cart Item 统一字段） 
| 字段 | 类型 | 说明 | |------|------|------| | id | int | 购物车条目 ID | | user | int | 用户 ID（后端用，不必展示） | | product | int | 商品 ID | | quantity | int | 数量 | | selected | bool | 是否勾选 | | create_time/update_time | string | 时间戳（格式：YYYY-MM-DD HH:MM:SS） | | product_name | string | 商品名称 | | product_image | string | 商品缩略图（已补全绝对 URL） | | unit_price | string | 当前单价（字符串表示，单位：元） | | original_price | string/null | 原价（无则 null） | | stock | int | 当前库存 | | is_off_shelf | bool | 是否下架或缺货状态（off_sale/out_of_stock） | | store_id | int | 店铺 ID | | store_name | string/null | 店铺名称 | | amount | string | 行小计 = unit_price * quantity（字符串） |
说明：
暂未启用 SKU；后续若加入，可扩展 sku_id / sku_text。
金额全部为“元”字符串，前端直接显示或再格式化。
amount 与 summary 中金额均为不含优惠的基础小计；discount 预留。
三、汇总结构 summary | 字段 | 说明 | |------|------| | total_count | 所有条目数 | | selected_count | 勾选条目数 | | total_amount | 所有条目总额 | | selected_amount | 勾选条目总额 | | discount_amount | 全局优惠占位（当前固定 0.00） | | payable_amount | 应付金额（当前 = selected_amount） | | stores | 按店铺聚合选中金额 [{store_id,store_name,selected_subtotal}] |
四、接口列表（均需 Header: Token: <jwt>）</jwt>
获取购物车 + 汇总
GET /shopping_cart/
响应 data = { items:[CartItem], summary }
添加 / 增量 / 设定数量
POST /shopping_cart/
请求：{ product_id, quantity, mode?: 'add'|'set' } (默认 add)
add：存在则 quantity += 传入值
set：直接覆盖为该数量
返回：{ item: CartItem, summary, created: bool }
修改单条（数量/选中）
PATCH /shopping_cart/item/{id}/
请求：{ quantity?, selected? }（至少一项）
返回：{ item, summary }
删除单条
DELETE /shopping_cart/item/{id}/
返回：{ summary }
全选 / 取消全选
POST /shopping_cart/select_all
请求：{ selected: true|false }
返回：{ items, summary }
清空（全部或仅选中）
POST /shopping_cart/clear
请求：{ only_selected: true|false }
返回：{ deleted: <删除条目数>, summary }
预留（未实现，可后续）：
批量更新： POST /shopping_cart/batch_update {items:[{id,quantity?,selected?}]}
预校验： POST /shopping_cart/validate {ids:[...]}
订单预览： POST /order/preview_from_cart {cart_item_ids:[...]}
五、典型前端调用流程
进入页面：GET /shopping_cart/ → 渲染 items + summary。
数量加减：本地暂存新值 → PATCH /shopping_cart/item/{id}/ → 用返回覆盖。
勾选/取消：PATCH /shopping_cart/item/{id}/ {selected:true/false}。
全选：POST /shopping_cart/select_all {selected:true}。
删除单项：DELETE /shopping_cart/item/{id}/。
清空选中：POST /shopping_cart/clear {only_selected:true}。
去结算：收集所有 selected 的 id（或后续直接调用 preview_from_cart）。
加入购物车按钮（商品列表/详情）：POST /shopping_cart/ {product_id,quantity:1,mode:'add'}。
六、交互 & 校验准则 | 场景 | 规则 / 建议反馈 | |------|----------------| | 数量下限 | 最小 1（若后端传 0 → 返回错误 code=3400） | | 数量上限 | 不超过 stock；超出返回 code=3402 库存不足 | | 下架 | selected/quantity 操作返回 3404 提示“已下架或缺货” | | 乐观更新 | 可本地先改 UI，再用返回的 item/summary 校正 | | 未登录 | code=4101 → 清 token + 跳转登录（带 next） | | 批量删除选中 | 当前需循环 DELETE 或使用 clear only_selected=true | | 金额显示 | 使用字符串直接渲染；如需千分位前端自行格式化 | | 汇总刷新策略 | 使用每次接口返回的 summary，不再自行聚合 |
七、错误码（与购物车直接相关） | code | 说明 | |------|------| | 3000 | 列表成功 | | 3001 | 增量添加 / 更新成功 | | 3002 | 条目删除成功 | | 3003 | 设定数量成功 | | 3004 | 清空成功 | | 3400 | 参数缺失 / 格式错误 | | 3402 | 库存不足 | | 3404 | 商品已下架或缺货 | | 4101 | 未登录（Token 缺失/无效） |
（其余公共错误码：见全局码表）
八、请求与响应示例
GET /shopping_cart/
响应示例（截断）：
{ "code":3000, "msg":"获取购物车成功", "data":{ "items":[ { "id":12,"product":1001,"quantity":2,"selected":true, "product_name":"蓝色T恤","product_image":"http://localhost:8000/static/product_images/blue.png", "unit_price":"99.00","original_price":"129.00","stock":57,"is_off_shelf":false, "store_id":5,"store_name":"旗舰店","amount":"198.00","create_time":"2025-08-23 11:20:01" } ], "summary":{ "total_count":3,"selected_count":3,"total_amount":"356.00", "selected_amount":"356.00","discount_amount":"0.00","payable_amount":"356.00", "stores":[{"store_id":5,"store_name":"旗舰店","selected_subtotal":"356.00"}] } } }
POST /shopping_cart/ {product_id:1001,quantity:1,mode:'add'}
返回 item（若新建 created=true）+ summary。
PATCH /shopping_cart/item/12/ {quantity:5}
返回更新后的条目及 summary；超库存返回 {code:3402,msg:'库存不足'}。
POST /shopping_cart/select_all {selected:false}
返回全量 items + summary（全取消）。
POST /shopping_cart/clear {only_selected:true}
返回删除数量 deleted 和最新空/部分剩余 summary。
九、前端状态与缓存建议
本地维护 cartMap keyed by id，接口返回的 items 做全量替换或覆盖策略。
summary 始终信任后端，不再自行统计（减少浮点误差）。
若未来加入价格浮动，可在 validate 或 preview 接口比较 unit_price -> 弹提示“价格更新”。
推荐统一封装 fetchCart / mutateCart 函数，处理 code=4101 重定向。
十、可选优化（后续迭代） | 方向 | 说明 | |------|------| | 批量更新 | 降低多次 PATCH 频率 | | 订单预览 | 下单前统一校验库存/价格/优惠 | | SKU 支持 | 引入 sku_id & sku_text | | 优惠券 | summary 增加 coupon, discount_details | | 分页 | 条目数超大时 GET /shopping_cart/?page=1&page_size=50 | | 局部推送 | WebSocket 通知库存/价格变化 |
十一、前端快速集成要点 Checklist
<input></input>全局 axios / fetch 拦截器：注入 Token 头
<input></input>401/4101 统一处理
<input></input>加减数量：PATCH 封装（节流或防抖）
<input></input>全选按钮状态：selected_count == total_count
<input></input>去结算按钮禁用：selected_count == 0
<input></input>金额组件：使用 summary.payable_amount
<input></input>删除所选：POST /shopping_cart/clear {only_selected:true}
<input></input>单项结算：后续改用 preview_from_cart；当前直接走选中→下单
十二、当前未实现但前端可能问到
batch_update、validate、preview_from_cart：暂未落地，调用前请判断是否存在；若需马上支持，可追加需求。
十三、假设说明
暂无 SKU / 限购字段 max_per_order（可后端返回固定值或后续补列）。
金额均以“元”为单位，不返分。
优惠/运费/税费暂未计算，后端已预留 discount_amount 字段。