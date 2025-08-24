已满足“订单列表查询 + 订单详情展示”这两个基础需求
可用接口：
订单列表（含明细 items） GET /order/list/?status=<可选>&page=<页码>&page_size=<每页大小>
支持按 status 过滤（pending_payment / paid / shipped / delivered / completed / cancelled / refunded）
支持分页参数 page、page_size
返回 data.results 为订单数组，每个元素内含 items（明细列表）
订单详情 GET /order/<id>/</id>
返回单个订单全部字段 + items 明细
认证： 请求头携带 Token: <jwt> （或用 ?token= 作为查询参数，也已支持）</jwt>
主要返回字段（订单）： id, order_no, total_amount, discount_amount, freight_amount, actual_amount, status, payment_method, payment_time, ship_time, deliver_time, recipient_name, recipient_phone, recipient_address, remark, create_time, update_time, items[...]
订单明细 items 字段： id, product_id, product_name, product_image(已补全完整URL), price, quantity, total_amount
响应结构示例（列表）： { "code": 0, "msg": "获取订单列表成功", "data": { "results": [ { "id": 12, "order_no": "...", "status": "pending_payment", "...": "...", "items": [ { "id": 101, "product_id": 5, "product_name": "示例商品", "product_image": "http://localhost:8000/static/product_images/xxx.png", "price": "88.00", "quantity": 2, "total_amount": "176.00" } ] } ], "count": 1, "page": 1, "page_size": 20 } }
前端最小实现建议：
列表页：加载 /order/list/，按需添加 status=paid 等筛选；展示订单号、状态、金额、首件商品缩略图（items[0].product_image）
详情页：调用 /order/<id>/，循环 items 展示商品行</id>
状态文案自行做映射（例如 pending_payment=待支付 等）
金额字段用 actual_amount 展示“实付”，total_amount 展示“商品总额”
常见边界：
未登录：code=4101
空列表：results=[], count=0
非本人订单或不存在：详情接口 404（内部使用 get_object_or_404