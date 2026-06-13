# PRD — Partner Insight Hub 渠道开放平台

**文档版本**：v3.0
**最后更新**：2026-06-13
**项目背景**：AI 编程马拉松 / 渠道客户自助服务门户 MVP
**当前状态**：可演示 Demo 已具备，真实生产数据接入待推进

---

## 1. 产品概述

Partner Insight Hub 是面向 Dida 渠道合作伙伴的自助服务门户。渠道客户使用邮箱和密码登录后，可以查看专属业务指标、运营指标、渠道配置、订单、财务、联系方式和 Dida API 文档，并通过内置 AI 助手自助解决 API 接入问题。

产品希望解决三类问题：

- 渠道客户反复向 OP 查询指标、订单、日志和财务状态，人工支持成本高。
- 海外渠道存在时差，非工作时间无法及时排查 API 或订单问题。
- Dida 的 API 文档、订单日志、财务和渠道数据分散，客户缺少统一入口。

当前仓库已经实现一个可运行 MVP：React 前端、FastAPI 后端、Node/SQLite 订单与财务接口、样例数据、Dida API AI 问答和多模块看板。

---

## 2. 产品目标

| # | 目标 | 衡量方式 |
|---|------|----------|
| 1 | 数据自助化 | 客户能自行查看业务、运营、渠道、财务和订单数据 |
| 2 | 日志自助化 | 客户能按订单号查看验价、下单、取消日志并下载 |
| 3 | API 支持自助化 | 客户能在 Dida API 页面通过 AI 助手查询流程、状态码、错误码 |
| 4 | 演示闭环完整 | 能用测试账号完成登录、筛选、查询、导出、问答流程 |
| 5 | 后续可产品化 | 架构可继续接入真实数据、权限隔离和生产部署 |

---

## 3. 用户角色

| 角色 | 需求 |
|------|------|
| 渠道客户 | 登录后查看自身业务数据、订单、日志、财务信息和 API 文档 |
| 技术对接人 | 查询 Dida API 流程、状态码、错误码，排查接入问题 |
| 运营 OP | 减少重复数据查询，聚焦异常跟进和策略支持 |
| 财务运营 | 查看授信、账单、未结算金额和账期风险 |
| 管理员 | 管理测试用户、渠道账号状态和客户访问权限 |

---

## 4. MVP 范围

### 4.1 已包含

- 登录 / 鉴权：邮箱、密码、禁用账号提示、JWT。
- App Shell：左侧分组导航、顶部渠道筛选、日期范围、上一周期对比、用户信息、退出登录。
- 业务指标：业务概览、业绩表现、业务报表。
- 运营指标：技术指标、错误日志、转化指标。
- 渠道信息：渠道配置、渠道匹配、渠道热销、财务信息、订单日志、订单管理。
- Dida 营销：热销酒店推荐、直采推荐。
- 支持与帮助：联系方式、Dida API 文档、AI 问答助手。
- 数据：CSV、Excel、SQLite seed/mock 数据。
- 导出：订单、日志、报表等局部导出能力。

### 4.2 暂不包含

- 生产环境真实数据接入。
- 完整管理后台和操作审计。
- 企业级权限模型、细粒度角色和多租户隔离。
- 生产级 AI 网关、模型监控和知识库更新管道。
- 完整自定义报表配置中心。
- 前后端一体化部署流水线。

---

## 5. 信息架构

```text
业务指标
  - 业务概览
  - 业绩表现
  - 业务报表

运营指标
  - 技术指标
  - 错误日志
  - 转化指标

渠道信息
  - 渠道配置
  - 渠道匹配
  - 渠道热销
  - 财务信息
  - 订单日志
  - 订单管理

Dida 营销
  - 热销酒店推荐
  - 直采推荐

支持与帮助
  - 联系方式
  - Dida API
```

全局筛选：

- 渠道：全部渠道、Agoda、AgodaEBK、AgodaUK、Lvzan、DidaOpaq、Barli2b。
- 日期范围：默认近 30 天。
- 上一周期对比：用于部分图表叠加对比。

---

## 6. 核心业务流程

### 6.1 最小业务流程

1. 渠道客户访问 `/Partner_Insight_Hub/login`。
2. 输入邮箱和密码，前端调用 `/api/auth/login`。
3. 登录成功后进入 Dashboard。
4. 客户通过顶部筛选选择渠道和日期。
5. 客户查看业务概览、技术指标、错误日志和转化漏斗。
6. 客户进入订单管理，输入一个或多个订单号，查询订单并导出 CSV。
7. 客户进入订单日志，按订单号查看验价、下单、取消 API 请求与响应。
8. 客户进入 Dida API 页面，通过 AI 助手询问 API 接入问题。
9. 客户进入联系方式页面查看 Dida 联系方式或维护我方对接人。

### 6.2 样例输入输出

登录输入：

```json
{
  "email": "partner_a@example.com",
  "password": "Pass1234!"
}
```

登录输出：

```json
{
  "token": "<jwt-token>",
  "user": {
    "email": "partner_a@example.com",
    "channelName": "Booking Agency A",
    "status": "active",
    "role": "user"
  }
}
```

订单查询输入：

```http
GET /api/orders?page=1&pageSize=50&client_id=Agoda&refs=Agoda-123456
```

订单查询输出：

```json
{
  "data": [
    {
      "client_ref": "Agoda-123456",
      "dida_ref": "12345678",
      "channel_status": "Confirmed",
      "client_id": "Agoda",
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

AI 问答输入：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Booking Search 里哪些状态是最终状态？"
    }
  ]
}
```

AI 问答输出示例：

```text
Status 2 Confirmed、Status 3 Canceled、Status 4 Failed 是最终状态。
Pending 和 OnRequest 不是最终状态，需要继续轮询 Booking Search。
```

---

## 7. 功能需求

### 7.1 登录 / 鉴权

- 用户输入邮箱和密码登录。
- 后端校验账号是否存在、密码是否正确、账号是否禁用。
- 登录成功返回 JWT 和用户信息。
- 前端根据 Remember Me 写入 localStorage 或 sessionStorage。
- 未登录访问 Dashboard 时重定向到登录页。

异常提示：

| 场景 | 提示 |
|------|------|
| 账号不存在 | 账号不存在，请检查邮箱地址 |
| 密码错误 | 密码错误，请重新输入 |
| 账号禁用 | 该账号已被禁用，请联系客户经理 |
| 后端不可用 | 无法连接到服务器，请确认后端已启动 |

### 7.2 业务概览

- 展示总订单、TTV、平均订单价值、间夜数、错误率、响应时长等摘要。
- 展示近 30 天趋势。
- 支持渠道、日期和上一周期对比。

### 7.3 业绩表现

- 展示各 Client ID 的订单量、TTV、均价、间夜数和 Win Rate。
- 展示按时间维度的堆叠图或趋势图。
- 支持全局筛选联动。

### 7.4 业务报表

- 自动聚合 Overview、Performance、Funnel、Dimensions 数据。
- 生成 Agoda 渠道月度分析报告。
- 提供 PDF/打印导出入口。
- 输出执行摘要、核心指标、转化漏斗、渠道表现、订单结构、运营效率和优化建议。

### 7.5 技术指标

- 展示预订前错误率、预订错误率、总预订前次数、总预订数。
- 展示技术质量趋势和接口响应情况。
- 数据来源：`/api/integration/api-metrics` 和相关指标接口。

### 7.6 错误日志

- 分 Prebook 和 Book 两类错误。
- 支持错误类型、供应商消息、酒店、日期等维度查看。
- 展示错误频次和影响。

### 7.7 转化指标

- 展示查价数、有价数、验价数、准确验价数、下单数。
- 展示有价率、验价准确率、验价到下单转化率。
- 支持日期筛选。

### 7.8 渠道配置

- 展示各渠道配置。
- 支持按 Client ID 查看配置。
- 后端接口：`/api/channel-config`。

### 7.9 渠道匹配

- 展示渠道酒店匹配关系。
- 支持 Excel 上传。
- 后端接口：`GET /api/channel-mapping`、`POST /api/channel-mapping/upload`。

### 7.10 渠道热销

- 展示渠道热销酒店和统计信息。
- 支持 Excel 上传。
- 后端接口：`/api/hot-sales`、`/api/hot-sales/stats`、`/api/hot-sales/upload`。

### 7.11 财务信息

- 展示授信、可用额度、已用额度、到期日。
- 展示账单进度、未结账单和账单详情。
- Node 接口：`/api/finance/summary`、`/api/finance/unsettled-bills`。

### 7.12 订单日志

- 支持按订单号、订单状态、渠道筛选。
- 表格展示订单号、状态、日志类型、客户 ID、更新时间。
- 点击详细日志后展示 Price Confirm、Booking Confirm、Cancel 的 request/response。
- 支持下载单个订单日志 CSV。
- 后端接口：`/api/order-logs`、`/api/order-logs/{order_no}/detail`。

### 7.13 订单管理

- 支持分页查询订单。
- 支持渠道、日期、批量订单号筛选。
- 支持导出当前页 CSV。
- Node 接口：`/api/orders`。

### 7.14 联系方式

- Dida 官方联系方式只读。
- 我方对接人可新增、编辑、删除。
- 后端接口：`/api/contacts/dida`、`/api/contacts/my`。

### 7.15 Dida API 文档与 AI 助手

- 页面内嵌 Dida API v2.0 接入说明。
- 包含鉴权、价格搜索、价格确认、创建预订、订单查询、取消订单、状态码、错误码和 Go-Live 清单。
- 右下角提供 AI 聊天助手。

AI 的具体处理步骤：

1. 前端收集用户输入和历史消息。
2. 前端请求 `POST /api/chat/dida-api`。
3. 后端将用户问题与 Dida API system prompt 合并。
4. 后端通过 Claude CLI 调用 `claude-sonnet-4-6`。
5. 模型基于内置 API 文档生成答案。
6. 后端使用 `StreamingResponse` 返回流式文本。
7. 前端逐块渲染回答。
8. 异常时显示失败提示。

### 7.16 管理员能力

- 管理员可查看用户列表。
- 管理员可创建用户、启停账号、删除用户。
- 后端接口：`/api/admin/users`。

---

## 8. 技术架构

```text
Browser
  ↓
React + TypeScript + Vite
  ↓ Vite proxy
FastAPI backend :8000
  - login / metrics / conversion / errors / contacts / channel / AI
  ↓
SQLite + Excel/CSV seed data

Node Express backend :3001
  - orders / finance
  ↓
SQLite orders.db

AI chat
  ↓
FastAPI subprocess
  ↓
Claude CLI / claude-sonnet-4-6
```

主要前端路径：

- `src/dashboard/`：AppShell、导航、路由、全局状态。
- `src/features/`：各业务页面。
- `src/shared/`：通用组件、图表、hooks。
- `src/lib/metricsApi.ts`：指标 API client。

主要后端路径：

- `backend/main.py`：FastAPI 主服务。
- `backend/database.py`：SQLite 连接与表结构。
- `backend/auth.py`：登录、密码哈希、JWT。
- `backend/server.js`：Node 订单与财务接口。
- `backend/seed*.py`、`backend/seed*.js`：样例数据初始化。

---

## 9. 非功能需求

| 类别 | 要求 |
|------|------|
| 可演示性 | 本地能启动前端、FastAPI、Node 后端并完成核心流程 |
| 安全性 | 登录使用 bcrypt + JWT；生产环境需加强 token 生命周期和多租户隔离 |
| 性能 | 普通看板 3 秒内完成首屏；大表格分页查询 |
| 可用性 | 页面需要清晰 loading、empty、error 状态 |
| 可维护性 | 功能页面独立，通用表格、图表、卡片组件复用 |
| 可访问性 | 按钮、输入、图标按钮需要语义和 aria 信息 |
| 部署 | GitHub Pages 仅承载前端，后端需独立服务 |

---

## 10. Demo 验收标准

- 能打开登录页并用测试账号登录。
- 登录后能进入 Dashboard。
- 左侧 16 个页面入口可切换。
- 业务概览、业绩表现、业务报表、技术指标、错误日志、转化指标能显示数据或报告。
- 订单管理能按渠道、日期、订单号查询并导出 CSV。
- 订单日志能打开详情并下载日志 CSV。
- 财务信息能展示授信、账单和未结金额。
- 联系方式能读取 Dida 联系方式并维护我方对接人。
- Dida API 页面能展示文档，并打开 AI 助手。
- `npm run build` 通过。

---

## 11. 当前未解决的问题

- 生产数据尚未接入，当前主要依赖 mock/seed 数据。
- FastAPI 与 Node 后端职责重叠，后续需要合并或明确服务边界。
- AI 助手依赖 Claude CLI，本地/服务器环境需要单独配置，尚未形成稳定模型服务层。
- GitHub Pages 无法承载后端，需要额外部署 FastAPI/Node。
- 权限隔离目前仍是 MVP 粒度，生产版本需要完善租户级数据隔离。
- 自定义报表仍偏静态报告，尚未形成完整可配置报表中心。
- PRD PDF 不是本次准版本，后续如需对外分发应从 Markdown 重新导出。

---

## 12. 是否值得继续推进

判断：值得继续推进。

理由：

- 已经具备一个能讲清价值的端到端 Demo。
- 最小业务流程覆盖渠道客户最常见的自助场景：登录、看指标、查订单、看日志、导出、问 API。
- AI 助手场景具体，围绕 Dida API 文档和错误排查，不是泛泛聊天。
- 数据样例、后端接口和页面模块已经足够支撑下一轮真实数据接入评审。
- 当前风险主要是工程产品化问题，而不是需求价值不成立。

下一步建议：

1. 收敛后端架构，统一 FastAPI/Node 的服务边界。
2. 选 2-3 个真实渠道接入真实数据，验证数据口径。
3. 强化权限隔离和 token 安全策略。
4. 将 AI 助手从 Claude CLI 封装为稳定服务。
5. 完成部署方案：前端 Pages + 后端 ECS/容器 + 数据库。
6. 补自动化验收：登录、核心页面、订单查询、AI 问答 smoke test。

---

## 13. 里程碑

| 阶段 | 内容 | 状态 |
|------|------|------|
| M1 | 登录、App Shell、基础看板 | 已完成 |
| M2 | 业务指标、运营指标、转化指标 | 已完成 |
| M3 | 渠道配置、渠道匹配、渠道热销 | 已完成 |
| M4 | 订单管理、订单日志、财务信息 | 已完成 |
| M5 | 联系方式、Dida API 文档、AI 助手 | 已完成 |
| M6 | 可配置报表中心 | 待推进 |
| M7 | 真实数据接入和生产部署 | 待推进 |

---

## 14. 代码托管与部署

GitHub 仓库：

```text
https://github.com/StormingTheDump/Partner_Insight_Hub
```

构建：

```bash
npm run build
```

部署到 GitHub Pages：

```bash
npm run deploy
```
