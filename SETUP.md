# Partner Insight Hub — Order Details Setup

## 项目结构

```
Partner_Insight_Hub/
├── backend/
│   ├── package.json        # Node.js 依赖
│   ├── server.js           # Express 后端，提供 /api/orders 接口
│   ├── seed.js             # SQLite 数据库初始化及 1000 条模拟数据生成
│   └── orders.db           # SQLite 数据库（执行 seed 后自动生成）
└── demo/
    └── index.html          # 前端单页应用（含 Order Details 页面）
```

---

## 1. 安装依赖

```bash
cd Partner_Insight_Hub/backend
npm install
```

---

## 2. 生成 SQLite 数据

```bash
cd Partner_Insight_Hub/backend
node seed.js
```

输出示例：
```
Seeded 1000 rows into orders table.
Status distribution:
  Confirmed: 810
  Canceled: 149
  Failed: 41
Database: /path/to/backend/orders.db
```

> 可重复执行，每次会先清空旧数据再重新生成 1000 条。

---

## 3. 启动后端

```bash
cd Partner_Insight_Hub/backend
node server.js
```

后端默认监听 `http://localhost:3001`。

验证接口是否正常：
```bash
curl http://localhost:3001/api/orders | python3 -m json.tool | head -40
```

---

## 4. 启动前端

前端是纯静态 HTML，直接用浏览器打开即可（**无需任何构建或 HTTP server**）：

```bash
# 方式一：直接在文件管理器中双击
Partner_Insight_Hub/demo/index.html

# 方式二：命令行打开（Linux）
xdg-open Partner_Insight_Hub/demo/index.html

# 方式三：用 Python 起一个本地 HTTP server（推荐，避免浏览器 file:// CORS 限制）
cd Partner_Insight_Hub/demo
python3 -m http.server 8080
# 然后访问 http://localhost:8080
```

> 注意：若直接用 `file://` 协议打开，现代浏览器可能限制 fetch 请求。
> 推荐用 `python3 -m http.server 8080` 起本地服务。

---

## 5. 访问订单明细页面

打开前端后，点击左侧侧边栏 **MARKETPLACE → Order Details**（图标为表格），页面会自动请求 `http://localhost:3001/api/orders` 并渲染订单明细表。

---

## 6. 验证前后端联动成功

1. 点击侧边栏 **Order Details**，页面显示 "Loading order details…"。
2. 加载完成后出现包含 1000 行数据的表格，列顺序：
   `Client Reference | Dida No. | Channel Status | Dida Hotel ID | Client Hotel ID | Dida Hotel Name | Price | Client ID | Channel Create Time | CheckIn Date | CheckOut Date`
3. `Channel Status` 列出现绿色 Confirmed、黄色 Canceled、红色 Failed 标签。
4. 点击 **Refresh** 按钮可重新拉取数据。
5. 如果后端未启动，页面显示蓝色错误提示框和错误原因。

---

## 一键验收脚本

```bash
# 从 Partner_Insight_Hub/backend 目录执行
node -e "
const db = require('better-sqlite3')('orders.db');
const total = db.prepare('SELECT COUNT(*) as n FROM orders').get().n;
const dist = db.prepare('SELECT channel_status, COUNT(*) as n FROM orders GROUP BY channel_status').all();
const dupRef = db.prepare('SELECT COUNT(*)-COUNT(DISTINCT client_ref) as d FROM orders').get().d;
const dupDida = db.prepare('SELECT COUNT(*)-COUNT(DISTINCT dida_ref) as d FROM orders').get().d;
const dateViol = db.prepare(\"SELECT COUNT(*) as n FROM orders WHERE checkin_date < date(channel_create_time)\").get().n;
const coViol = db.prepare('SELECT COUNT(*) as n FROM orders WHERE checkout_date < checkin_date').get().n;
console.log('Total rows:', total);
dist.forEach(r => console.log(r.channel_status + ':', r.n));
console.log('Duplicate client_ref:', dupRef);
console.log('Duplicate dida_ref:', dupDida);
console.log('checkin < create_time violations:', dateViol);
console.log('checkout < checkin violations:', coViol);
db.close();
"
```

期望输出：所有违规数为 0，总行数为 1000。
