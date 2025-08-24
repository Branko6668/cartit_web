一、已新增 / 调整的接口
用户资料（基于 Token） GET /user/profile/
直接返回当前登录用户信息（无需再传 username / phone / email）。
未登录返回 code=4101。
创建地址自动绑定当前用户 POST /user/address/
若请求体缺少 user 字段，后端自动从 Token 填充。
未登录返回 4101。
仍兼容显式传 user（但前端可以省略）。
地址列表分页 & 默认优先 GET /user/address/list/?user=<id></id>
结果按 is_default DESC, update_time DESC 排序。
返回分页结构： { results: [...], count, page, page_size }
可加 page&page_size（分页器参数）。
设置默认地址 POST /user/address/<pk>/default/</pk>
将该地址设为默认，并取消该用户其他默认。
未登录或地址不属于当前用户 → 404/4101。
返回 {id, is_default:true}。
二、未改动但可继续用的接口
/user/me/?username= / ?email= / ?phone=（查询式）仍保留；前端主页优先用 /user/profile/。
地址详情 /user/address/<pk>/ GET</pk>
地址更新 /user/address/<pk>/ PUT</pk>
地址删除（软删） /user/address/<pk>/ DELETE</pk>
三、前端推荐使用路径
加载主页（个人中心）时：
GET /user/profile/ 获取基础资料
GET /user/address/list/?user=<currentuserid> 获取地址列表（可通过 profile 中的 id）</currentuserid>
新增地址：
直接 POST /user/address/，不传 user 字段
成功后刷新列表；如需设默认，紧接 POST /user/address/<id>/default/</id>
修改地址：
PUT /user/address/<id>/</id>
删除地址：
DELETE /user/address/<id>/ → 刷新列表</id>
设置默认地址：
POST /user/address/<id>/default/</id>
四、返回数据 & 分页示例 GET /user/address/list/ 响应: { "code": 4000, "msg": "获取地址列表成功", "data": { "results": [ { "id": 12, "user": 9, "recipient_name": "...", "recipient_phone": "...", "province": "...", "city": "...", "district": "...", "detail_address": "...", "postal_code": "200000", "is_default": true, "create_time": "...", "update_time": "..." } ], "count": 3, "page": 1, "page_size": 10 } }
五、错误码一览（与本次相关） 

| code | 场景 | |------|------| | 4000 | 用户或地址操作成功 | | 4101 | 未登录（Token 缺失/无效） | | 4400 | 参数不合法 | | 4404 | 用户不存在 | | 4500~4505 | 验证码/重置密码相关 |
 （默认地址设置成功仍用 4000）
六、前端调用顺序建议（用户中心）
进入页面：并行请求 /user/profile/ 与 /user/address/list/
编辑资料：调用 /user/update/（需要携带 id）
新增地址：POST -> 如果勾选“设为默认”再调用 /default/
删除地址：DELETE -> 更新列表；若默认被删，前端自行选择第一条或提示“请设置默认地址”
七、前端数据模型建议 UserProfile { id, username, phone, email, avatar_url, gender, birthday, name } UserAddress { id, recipient_name, recipient_phone, province, city, district, detail_address, postal_code, is_default }
八、后续可选（未实现）
地址查询仅用 Token 自动过滤（可去掉 ?user 参数）
限制用户地址数量上限（如 20）
地址软删后恢复功能
profile 更新接口 /user/profile/ PUT（当前沿用 /user/update/）
九、对接 Checklist
<input></input>全局请求加 Token 头
<input></input>code==4101 统一跳登录
<input></input>新增地址无需传 user
<input></input>列表分页参数 page&page_size 默认支持
<input></input>设置默认地址使用独立 POST /default/