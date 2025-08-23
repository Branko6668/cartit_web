########## 购物车 ##########

### 获取某用户的购物车
GET {{base_url}}/shopping_cart/?user_id=1
Token: {{token}}

示例：
GET http://localhost:8000/shopping_cart/?user_id=1

HTTP/1.1 200 OK
Date: Sat, 23 Aug 2025 06:44:55 GMT
Server: WSGIServer/0.2 CPython/3.11.9
Content-Type: application/json
Allow: GET, POST, HEAD, OPTIONS
X-Frame-Options: DENY
Content-Length: 219
Vary: origin
X-Content-Type-Options: nosniff
Referrer-Policy: same-origin
Cross-Origin-Opener-Policy: same-origin

{
  "code": 3000,
  "msg": "获取购物车信息成功",
  "data": [
    {
      "id": 18,
      "create_time": "2025-08-19 08:27:41",
      "update_time": "2025-08-19 08:27:41",
      "quantity": 3,
      "selected": true,
      "user": 1,
      "product": 21,
      "product_name": "商品3848"
    }
  ]
}
Response file saved.
> 2025-08-23T144455.200.json

Response code: 200 (OK); Time: 24ms (24 ms); Content length: 197 bytes (197 B)



### 添加多个商品
POST {{base_url}}/shopping_cart/
Content-Type: application/json
Token: {{token}}

{
  "user_id": 9,
  "product_id": 1001,
  "quantity": 2
}

### Shopping Cart - Negative quantity error
POST {{base_url}}/shopping_cart/
Content-Type: application/json
Token: {{token}}

{
  "user_id": 9,
  "product_id": 1001,
  "quantity": -999
}