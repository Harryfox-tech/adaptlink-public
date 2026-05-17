## 部署总览（Vercel + Python 后端）

本仓库是 monorepo：
- `apps/web`：Next.js（部署到 Vercel）
- `apps/api`：FastAPI（部署到 Render / Railway / Fly.io / 自建服务器）

Vercel **不支持**直接托管 Python FastAPI（除非你把后端改成 Vercel Functions/Edge），因此需要前后端分开部署。

---

## A. 部署后端（FastAPI）

### 方式 1：Render（推荐给非运维）

1) 新建 **Web Service**，连接仓库
2) Root Directory 选择：`apps/api`
3) Environment 选择：Docker
4) Render 会自动使用 `apps/api/Dockerfile`

#### 必配环境变量（Render -> Environment）
- `DATABASE_URL`（可选但建议生产必须）
- `AI_PROVIDER`：`openai` 或 `mock`
- `OPENAI_API_KEY`：你的 key
- `OPENAI_BASE_URL`：例如 `https://api.deepseek.com/v1`（用 OpenAI 官方可不填）
- `OPENAI_MODEL`：例如 `deepseek-chat` 或 `gpt-4.1-mini`
- `LLM_TIMEOUT_SECONDS`：例如 `30`

#### Health Check
- 路径：`/health`

部署完成后拿到 API 域名，例如：`https://your-api.onrender.com`

---

## B. 部署前端（Vercel）

仓库根已提供 `vercel.json`，默认把 Root Directory 指向 `apps/web`。

1) Vercel 新建 Project，选择仓库
2) Environment Variables 配置：
- `NEXT_PUBLIC_API_BASE_URL`：你的后端公网地址 + `/api/v1`
  - 例：`https://your-api.onrender.com/api/v1`

（可选）如果你使用 Next 的 `/api/chat` 路由直连模型：
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

---

## C. 常见坑

### 1) 403 / 企业端无 company_id
- 企业端现在要求注册/登录时提供 `company_id`
- 先访问：`/register/company` 注册公司获取 company id
- 再企业端注册/登录时填写 company id

### 2) CORS
后端当前 `allow_origins=["*"]`，可用；上线后建议改成只允许 Vercel 域名（安全更好）。

### 3) 前端请求 API_BASE
确保 `NEXT_PUBLIC_API_BASE_URL` 指向后端的 `/api/v1`。

