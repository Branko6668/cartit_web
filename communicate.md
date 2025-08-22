**商品搜索**
`GET /product/search/`

支持按关键词 + 排序 + 分页检索商品核心信息。

**查询参数：**

| 参数 | 必填 | 说明 | 默认 | 取值/格式 |
|------|------|------|------|-----------|
| q | 是 | 搜索关键词（对 name / subtitle / description 模糊匹配） | - | 非空字符串 |
| page | 否 | 页码 (>=1) | 1 | 正整数 |
| page_size | 否 | 每页条数 (1~100) | 20 | 正整数 |
| sort | 否 | 排序方式 | 0 | 0/1/2/3/4 |

**sort 排序映射：**

| 值 | 含义 | 实际排序 |
|----|------|----------|
| 0 | 默认 | id DESC （最新优先） |
| 1 | 价格升序 | price ASC, id DESC |
| 2 | 价格降序 | price DESC, id DESC |
| 3 | 评论数升序 | review_count ASC, id DESC |
| 4 | 评论数降序 | review_count DESC, id DESC |

**返回字段(data)：**

| 字段 | 说明 |
|------|------|
| q | 原始查询关键词 |
| sort | 排序方式（同入参） |
| page | 当前页码 |
| page_size | 当前页大小 |
| total | 总记录数 |
| total_pages | 总页数 |
| has_next | 是否有下一页 |
| has_prev | 是否有上一页 |
| current_count | 本页返回条数 (=results 长度) |
| results | 商品数组 |

`results[i]` 字段：`id, name, price (字符串), thumbnail, review_count, store_id, store_name`

**成功业务码：** `2002 (PRODUCT_SEARCH_OK)`

**示例请求：**
```
GET /product/search/?q=蓝&page=1&page_size=10&sort=4
```

**示例响应(截断)：**
```json
{
  "code": 2002,
  "msg": "搜索成功",
  "data": {
    "q": "蓝",
    "sort": 4,
    "page": 1,
    "page_size": 10,
    "total": 37,
    "total_pages": 4,
    "has_next": true,
    "has_prev": false,
    "current_count": 10,
    "results": [
      {
        "id": 1001,
        "name": "蓝色T恤",
        "price": "99.00",
        "thumbnail": "/static/product_images/blue.png",
        "review_count": 12,
        "store_id": 5,
        "store_name": "旗舰店"
      }
    ]
  }
}
```
