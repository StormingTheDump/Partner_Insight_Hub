# Partner Insight Hub — 渠道开放平台

Partner Insight Hub 是面向 Dida 渠道合作伙伴的自助服务门户。渠道客户登录后可查看业务指标、技术指标、渠道配置、订单、财务、联系方式和 Dida API 文档，并通过内置 AI 助手自助排查 API 集成问题。

> **评委说明**：仓库已包含预填充的 SQLite 数据库文件，clone 后无需运行任何数据初始化脚本，按下方 3 步启动即可看到完整 Demo 数据。

---

## 快速启动（3 个终端）

### 环境要求

| 工具 | 最低版本 |
|------|---------|
| Node.js | 18+ |
| Python | 3.10+ |
| npm | 9+ |

---

### 终端 1 — 前端

```bash
# 在项目根目录
npm install
npm run dev
```

访问：**http://localhost:5173/Partner_Insight_Hub/**

---

### 终端 2 — Python 后端（业务/技术指标、错误日志、渠道数据等）

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API 文档：http://localhost:8000/docs

---

### 终端 3 — Node.js 后端（订单管理、财务数据）

```bash
cd backend
npm install
node server.js
```

服务地址：http://localhost:3001

---

## 测试账号

登录地址：http://localhost:5173/Partner_Insight_Hub/login

| 邮箱 | 密码 | 角色 |
|------|------|------|
| partner_a@example.com | Pass1234! | 普通用户（Booking Agency A） |
| partner_b@example.com | Pass5678! | 普通用户（Travel Hub B） |
| partner_c@example.com | Pass9999! | 普通用户（Global Tours C） |
| test_user@example.com | Test0000! | 普通用户（Test Channel） |

> 管理员功能（账号管理）需要 admin 角色账号，当前演示版本未开放。

---

## 功能模块说明

| 分组 | 页面 | 功能描述 |
|------|------|---------|
| 业务指标 | 业务概览 | KPI 汇总、日均 TTV、订单量趋势图 |
| 业务指标 | 业绩表现 | 渠道对比、LT/星级/国家/酒店类型维度拆解 |
| 业务指标 | 业务报表 | 可下载的汇总报表，含渠道、时段、维度表格 |
| 运营指标 | 技术指标 | 验价准确率趋势、订单失败率、TTV 损失估算 |
| 运营指标 | 错误日志 | 验价报错 / 下单报错分页查询，支持渠道和错误类型筛选 |
| 运营指标 | 转化指标 | 搜索→验价→下单转化漏斗，按渠道拆解 |
| 渠道信息 | 渠道配置 | IP 白名单、货币、超时、QPS 等配置项查看 |
| 渠道信息 | 渠道匹配 | Dida Hotel ID ↔ 渠道 Hotel ID 映射表，支持 Excel 上传 |
| 渠道信息 | 渠道热销 | 渠道上传的热销酒店列表，支持 Excel 上传 |
| 渠道信息 | 财务状态 | 未结账单列表、信用额度、回款进度 |
| 渠道信息 | 订单日志 | 按订单号查询验价/下单/取消全链路 API 日志，支持下载 CSV |
| 渠道信息 | 订单管理 | 批量订单号查询与状态追踪 |
| Dida 营销 | 热销酒店推荐 | Dida 精选热销酒店列表，含评分和标签 |
| Dida 营销 | 直采推荐 | Dida 直采/预购/独家酒店推荐列表 |
| 支持与帮助 | 联系方式 | Dida 各部门联系人 + 我的自定义联系人（可增删改） |
| 支持与帮助 | Dida API 文档 | 接入流程、鉴权、状态码、错误码文档 + AI 问答助手 |
| 日志查询 | 日志查询 | 系统操作日志（Mock 数据演示） |

---

## 技术栈

- **前端**：React 19、TypeScript、Vite、Ant Design、ECharts、lucide-react
- **后端 A**：Python 3.10+、FastAPI、SQLite、JWT（python-jose）、bcrypt
- **后端 B**：Node.js 18+、Express、better-sqlite3
- **AI**：Dida API 页面内置 Claude 驱动的流式问答助手（依赖本地 Claude CLI）
- **数据**：SQLite 预填充数据，无需外部数据库

---

## 项目结构

```text
.
├── src/                    # React 前端
│   ├── dashboard/          # AppShell、导航、路由、全局状态
│   ├── features/           # 各业务页面模块
│   ├── shared/             # 通用组件、图表工具
│   └── lib/                # API client
├── backend/
│   ├── main.py             # FastAPI 应用（端口 8000）
│   ├── server.js           # Node/Express 应用（端口 3001）
│   ├── pih.db              # SQLite 主数据库（预填充）
│   ├── orders.db           # SQLite 订单财务数据库（预填充）
│   └── requirements.txt    # Python 依赖
├── docs/                   # PRD、项目说明、测试数据
├── data/                   # CSV / Excel 样例数据
└── demo/                   # 静态参考 demo
```

---

## 接口速查

| 服务 | 端口 | 主要路径 |
|------|------|---------|
| FastAPI | 8000 | `/api/metrics/*` `/api/errors/*` `/api/conversion/*` `/api/hot-sales/*` `/api/channel-mapping` `/api/order-logs/*` `/api/contacts/*` `/api/chat/dida-api` |
| Node.js | 3001 | `/api/orders` `/api/finance/*` |

Vite 开发服务器自动将 `/api/*` 代理到对应后端，前端无需配置。

---

## 常见问题

**Q: 启动后页面是空的 / 没有数据？**  
A: 确认三个服务都已启动（前端 5173、FastAPI 8000、Node 3001）。浏览器打开开发者工具 → Network，检查 API 请求是否返回 200。

**Q: Python 依赖安装失败？**  
A: 建议使用虚拟环境：`python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`

**Q: AI 助手没有回复？**  
A: AI 助手依赖本机 Claude CLI（`claude` 命令）。若未安装 Claude CLI，其他所有功能不受影响。

**Q: 端口冲突？**  
A: 检查 5173 / 8000 / 3001 端口是否被占用：`lsof -i :8000`

---

## 校验命令

```bash
# 前端构建验证
npm run build

# API 可用性检查
curl http://localhost:8000/api/metrics/overview
curl http://localhost:8000/api/integration/api-metrics
curl "http://localhost:3001/api/finance/unsettled-bills?client_id=all"
```

---

## 交付物

- 可演示 Demo：React + Vite 前端 + 双后端
- 预填充 SQLite 数据（1000+ 渠道映射、1000 热销酒店、180 条 API 日志、12 条财务账单等）
- 产品文档：`docs/PRD_渠道开放平台.md`
- 项目目标说明：`docs/项目目标说明.md`
