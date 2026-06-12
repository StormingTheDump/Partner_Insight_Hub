# Partner Insight Hub — 渠道开放平台

渠道合作伙伴自助服务门户，提供指标查看、订单搜索、匹配管理、财务信息等功能。

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Ant Design 5
- **后端**：Python + FastAPI
- **数据库**：SQLite（本地文件，无需安装数据库服务）
- **鉴权**：JWT（bcrypt 密码加密）
- **部署**：GitHub Pages（前端）

## 本地运行（前后端分开启动）

### 第一次使用：初始化数据库

```bash
cd backend
pip install -r requirements.txt
python3 init_db.py   # 建表 + 导入测试用户数据
```

### 启动后端

```bash
cd backend
uvicorn main:app --reload --port 8000
# 后端运行于 http://localhost:8000
# API 文档：http://localhost:8000/docs
```

### 启动前端

```bash
npm install
npm run dev
# 访问 http://localhost:5173/Partner_Insight_Hub/
```

# 访问
http://localhost:5173/Partner_Insight_Hub/
```

## 测试账号

| 邮箱 | 密码 | 渠道名称 | 状态 |
|------|------|---------|------|
| partner_a@example.com | Pass1234! | Booking Agency A | 正常 |
| partner_b@example.com | Pass5678! | Travel Hub B | 正常 |
| partner_c@example.com | Pass9999! | Global Tours C | 正常 |
| test_user@example.com | Test0000! | Test Channel | 正常 |
| disabled@example.com  | Dis1111!  | Disabled Channel | 禁用 |

## 登录错误场景测试

| 测试场景 | 操作 | 预期提示 |
|---------|------|---------|
| 账号不存在 | 输入不存在的邮箱 | 账号不存在，请检查邮箱地址 |
| 密码错误 | 账号正确但密码错 | 密码错误，请重新输入 |
| 账号禁用 | 使用 disabled@example.com | 该账号已被禁用，请联系客户经理 |

## 功能模块（M1 阶段）

| 模块 | 状态 |
|------|------|
| 登录 / 鉴权 | 已完成 |
| 指标界面 | 占位（待开发） |
| 订单搜索下载 | 占位（待开发） |
| 渠道匹配关系管理 | 占位（待开发） |
| 财务信息 | 占位（待开发） |
| 联系方式 | 占位（待开发） |
| AI 智能助手（悬浮） | UI 占位（待开发） |

## 构建 & 部署到 GitHub Pages

```bash
# 构建
npm run build

# 部署（需先安装 gh-pages）
npm install -D gh-pages
npx gh-pages -d dist
```

仓库需在 GitHub Settings → Pages 中选择 `gh-pages` 分支作为发布源。

## 项目结构

```
src/
├── data/
│   └── users.ts            # Mock 用户数据 & 登录验证逻辑
├── pages/
│   ├── Login.tsx            # 登录页面
│   └── Placeholders.tsx     # 各模块占位页面
├── components/
│   └── DashboardLayout.tsx  # 登录后主框架（侧边栏 + Header）
└── App.tsx                  # 路由配置
```

## 代码托管

代码托管于阿里云 Codeup：
`git@codeup.aliyun.com:6a2a9ef0b705b20224b4ca05/Partner_Insight_Hub.git`
