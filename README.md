# Partner Insight Hub — 渠道开放平台

Partner Insight Hub 是面向 Dida 渠道合作伙伴的自助服务门户。渠道客户登录后，可以查看业务指标、技术指标、渠道配置、订单、财务、联系方式和 Dida API 文档，并通过内置 AI 助手自助排查 API 集成问题。

当前仓库已经包含可演示前端、FastAPI 后端、Node/SQLite 订单与财务接口、样例数据和 PRD 文档，适合用于 Hackathon/MVP 演示和下一阶段产品评审。

## 当前交付物

- 可演示 Demo：React + Vite 前端，入口为 `/Partner_Insight_Hub/login`。
- 样例数据：`data/`、`data-lea/`、`docs/*.xlsx` 和 SQLite 数据库文件。
- 后端接口：FastAPI 指标/登录/AI/联系人/渠道接口，Node Express 订单/财务接口。
- 产品文档：`docs/PRD_渠道开放平台.md`。
- 项目目标说明：`docs/项目目标说明.md`。
- 静态参考 Demo：`demo/index.html`。

## 功能模块

| 分组 | 页面 |
|------|------|
| 业务指标 | 业务概览、业绩表现、业务报表 |
| 运营指标 | 技术指标、错误日志、转化指标 |
| 渠道信息 | 渠道配置、渠道匹配、渠道热销、财务信息、订单日志、订单管理 |
| Dida 营销 | 热销酒店推荐、直采推荐 |
| 支持与帮助 | 联系方式、Dida API |

## 技术栈

- 前端：React 19、TypeScript、Vite、React Router、Ant Design、ECharts、lucide-react
- 后端 A：Python、FastAPI、SQLite、JWT、bcrypt、openpyxl
- 后端 B：Node.js、Express、better-sqlite3
- 数据：CSV、Excel、SQLite mock data
- AI：Dida API 页面内置 Claude 驱动的流式问答助手
- 部署：Vite base path `/Partner_Insight_Hub/`，支持 GitHub Pages

## 本地运行

### 1. 安装前端依赖

```bash
npm install
```

### 2. 初始化 FastAPI 数据库

```bash
cd backend
pip install -r requirements.txt
python init_db.py
python seed_integration.py
python seed_errors.py
cd ..
```

### 3. 启动 FastAPI 后端

```bash
cd backend
uvicorn main:app --reload --port 8000
```

FastAPI 文档地址：

```text
http://localhost:8000/docs
```

### 4. 启动 Node 订单/财务后端

```bash
cd backend
npm install
npm run seed
npm start
```

Node 服务默认地址：

```text
http://localhost:3001
```

### 5. 启动前端

```bash
npm run dev
```

访问：

```text
http://localhost:5173/Partner_Insight_Hub/
```

## 测试账号

| 邮箱 | 密码 | 渠道名称 | 状态 |
|------|------|---------|------|
| partner_a@example.com | Pass1234! | Booking Agency A | 正常 |
| partner_b@example.com | Pass5678! | Travel Hub B | 正常 |
| partner_c@example.com | Pass9999! | Global Tours C | 正常 |
| test_user@example.com | Test0000! | Test Channel | 正常 |
| disabled@example.com | Dis1111! | Disabled Channel | 禁用 |

## 样例输入输出

### 登录

请求：

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "partner_a@example.com",
  "password": "Pass1234!"
}
```

成功响应示例：

```json
{
  "token": "<jwt-token>",
  "user": {
    "id": 1,
    "email": "partner_a@example.com",
    "channelName": "Booking Agency A",
    "contactName": "<contact-name>",
    "status": "active",
    "role": "user"
  }
}
```

异常响应示例：

```json
{
  "detail": "密码错误，请重新输入"
}
```

### 订单查询

请求：

```http
GET /api/orders?page=1&pageSize=50&client_id=Agoda&refs=Agoda-123456
```

响应示例：

```json
{
  "data": [
    {
      "client_ref": "Agoda-123456",
      "dida_ref": "12345678",
      "channel_status": "Confirmed",
      "client_id": "Agoda",
      "dida_hotel_name": "Sample Hotel",
      "price": "$128.50"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

### Dida API AI 助手

请求：

```http
POST /api/chat/dida-api
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Booking Search 里哪些状态是最终状态？"
    }
  ]
}
```

响应：流式文本，示例内容如下。

```text
Booking Search 中 Status 2 Confirmed、Status 3 Canceled、Status 4 Failed 是最终状态。
Status 5 Pending 和 Status 6 OnRequest 仍处于处理中，不能作为最终结果，需要继续轮询。
```

## 最小业务流程

1. 渠道客户打开 `/Partner_Insight_Hub/login`。
2. 使用测试账号登录，前端调用 `/api/auth/login`。
3. 登录成功后进入 Dashboard，默认查看业务概览。
4. 用户通过顶部渠道和日期筛选器查看业务、技术、转化、订单、财务等数据。
5. 用户进入订单管理，批量输入订单号，查询并导出结果。
6. 用户进入订单日志，搜索订单号，查看验价、下单、取消日志详情并下载 CSV。
7. 用户进入 Dida API，阅读接入文档，并向 AI 助手询问接口流程、状态码和错误码。

## AI 的具体处理步骤

1. 前端 `ApiChatBot` 收集用户输入和历史消息。
2. 前端向 `/api/chat/dida-api` 发送 `messages`。
3. FastAPI 将用户问题与内置 Dida API 知识提示词组合。
4. 后端通过 Claude CLI 子进程调用 `claude-sonnet-4-6`。
5. Claude 根据 Dida API 流程、鉴权、状态码、错误码和最佳实践生成回答。
6. 后端以 `StreamingResponse` 流式返回文本。
7. 前端逐段读取 stream 并更新聊天气泡。
8. 请求失败时，前端显示「抱歉，请求失败，请稍后重试」。

## 项目结构

```text
.
├── src/                         # React 前端
│   ├── dashboard/               # AppShell、导航、路由、全局状态
│   ├── features/                # 业务页面模块
│   ├── shared/                  # 通用组件、图表、hooks、types
│   └── lib/                     # API client
├── backend/                     # FastAPI + Node/Express 后端
├── data/                        # CSV、Excel、SQLite 样例数据
├── data-lea/                    # 财务和维度数据生成脚本
├── docs/                        # PRD、原始需求、测试数据
├── public/docs/                 # 可公开访问的文档资源
└── demo/                        # 静态参考 demo
```

## 校验命令

```bash
npm run build
npm run lint
```

后端接口可用性检查：

```bash
curl http://localhost:8000/api/metrics/overview
curl http://localhost:3001/api/orders?page=1&pageSize=5
```

## 当前未解决的问题

- 生产数据尚未接入，当前主要依赖 mock/seed 数据。
- 前端登录状态存储在浏览器 localStorage/sessionStorage，生产环境需要更完整的安全策略。
- FastAPI 和 Node 后端并存，后续需要统一服务边界或明确拆分部署方式。
- AI 助手依赖本机或服务器上的 Claude CLI，尚未抽象为稳定云端模型服务。
- GitHub Pages 只能托管前端，接口仍需要独立后端环境。
- 自定义报表还处于初版报告/导出形态，尚未形成完整配置化报表中心。

## 是否值得继续推进

值得继续推进。当前版本已经覆盖「登录 → 数据看板 → 订单查询 → 日志排障 → 财务查看 → API 文档与 AI 问答」的完整演示链路，能够支撑渠道客户自助服务门户的核心价值验证。下一步重点不应继续扩页面，而应收敛到真实数据接入、后端合并、权限隔离、AI 服务稳定化和部署验收。
