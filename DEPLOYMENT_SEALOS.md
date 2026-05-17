# Sealos 部署完整教程（前后端国内访问）

本教程将 **AdaptLink** 从 Vercel + Railway 迁移到 **[Sealos 公有云](https://cloud.sealos.io)**：前后端各一个容器，国内访问稳定，新用户通常有免费配额（以控制台为准）。

---

## 一、部署架构

```text
浏览器（国内）
    │
    ├─► adaptlink-web（Next.js :3000）  ← Sealos 公网域名 A
    │         │
    │         └─► NEXT_PUBLIC_API_BASE_URL
    │
    └─► adaptlink-api（FastAPI :8080）  ← Sealos 公网域名 B
              │
              └─► DATABASE_URL（Neon / 腾讯云 PostgreSQL 等）
```

| 服务 | Dockerfile | 端口 | 健康检查 |
|------|------------|------|----------|
| `adaptlink-api` | `apps/api/Dockerfile` | **8080** | `GET /health` |
| `adaptlink-web` | `apps/web/Dockerfile` | **3000** | 能打开登录页即可 |

> **顺序很重要**：先部署并拿到 **API 公网 HTTPS 地址**，再部署 Web（构建时要写入 `NEXT_PUBLIC_API_BASE_URL`）。

---

## 二、仓库里已为你准备好的文件

| 文件 | 作用 |
|------|------|
| `apps/api/Dockerfile` | 后端镜像（原有） |
| `apps/web/Dockerfile` | 前端 Next.js standalone 镜像（新增） |
| `apps/web/next.config.js` | 已开启 `output: 'standalone'` |
| `docker-compose.yml` | 本地一键起双容器 |
| `.env.sealos.example` | 环境变量清单模板 |
| `.dockerignore` | 加速镜像构建 |

---

## 三、部署前准备

### 1. 代码在 GitHub

仓库：`https://github.com/Harryfox-tech/adaptlink.git`  
分支：`main`（含 Sealos 相关 Dockerfile）

### 2. 数据库连接串

任选其一（试用可先 **Neon 免费档**）：

- [Neon](https://neon.tech) 创建 PostgreSQL → 复制 `DATABASE_URL`
- 或腾讯云 / 其他兼容 PostgreSQL 的连接串

### 3. 本地可选验证（推荐）

在仓库**根目录**：

```powershell
copy .env.sealos.example .env
# 编辑 .env，填入 DATABASE_URL

docker compose up --build
```

- 前端：http://localhost:3000  
- 后端：http://localhost:8080/health  
- 文档：http://localhost:8080/docs  

验证通过后再上 Sealos，可少踩坑。

---

## 四、Sealos 控制台部署（逐步操作）

### 步骤 0：注册并进入

1. 打开 https://cloud.sealos.io 注册 / 登录  
2. 进入控制台，确认账户有可用**余额/免费额度**  
3. 左侧找到 **「应用管理」** 或 **「App Launchpad」**（名称可能随版本略有不同）

以下在 **同一命名空间（Namespace）** 里创建 **两个应用**。

---

### 步骤 1：部署后端 `adaptlink-api`

1. 点击 **「新建应用」** / **「Create App」**  
2. **应用名称**：`adaptlink-api`  
3. **部署方式**：选择 **从 Git 仓库构建**（或 GitHub 源码部署）  
4. 授权并选择仓库：
   - 仓库：`Harryfox-tech/adaptlink`
   - 分支：`main`
5. **构建配置**（务必与下表一致）：

   | 项 | 值 |
   |---|-----|
   | 构建上下文 / Root | `.`（仓库根目录） |
   | Dockerfile 路径 | `apps/api/Dockerfile` |
   | 容器端口 | `8080` |

6. **资源**（试用建议）：
   - CPU：0.5～1 核  
   - 内存：512MB～1GB  
   - 副本数：1  

7. **环境变量**（Environment）：

   | 变量名 | 示例值 | 必填 |
   |--------|--------|------|
   | `DATABASE_URL` | `postgresql://...` | 是（生产） |
   | `AI_PROVIDER` | `mock` | 建议先 mock |
   | `TRIAL_DEVELOPER_KEY` | `psq12345` | 是（高校/企业门禁） |
   | `OPENAI_API_KEY` | （空） | 否 |
   | `OPENAI_BASE_URL` | `https://api.deepseek.com/v1` | 否 |
   | `OPENAI_MODEL` | `deepseek-chat` | 否 |

8. **网络**：
   - 开启 **公网访问** / **Ingress**  
   - 记下系统自动分配的域名，例如：  
     `https://adaptlink-api-xxxx.cloud.sealos.io`

9. **健康检查**（若有配置项）：
   - 路径：`/health`  
   - 端口：`8080`  

10. 保存并等待构建、运行变为 **Running**

11. 浏览器访问：`https://你的-api-域名/health`  
    应返回：`{"status":"ok",...}`

**记下 API 根地址**（不要漏 `/api/v1` 后缀）：

```text
NEXT_PUBLIC_API_BASE_URL = https://你的-api-域名/api/v1
```

---

### 步骤 2：部署前端 `adaptlink-web`

1. 再次 **新建应用**  
2. **应用名称**：`adaptlink-web`  
3. 同一 Git 仓库、分支 `main`  
4. **构建配置**：

   | 项 | 值 |
   |---|-----|
   | 构建上下文 | `.` |
   | Dockerfile 路径 | `apps/web/Dockerfile` |
   | 容器端口 | `3000` |

5. **构建参数（Build Args）** — 关键：

   | 构建参数名 | 值 |
   |------------|-----|
   | `NEXT_PUBLIC_API_BASE_URL` | `https://你的-api-域名/api/v1`（步骤 1 中的地址） |

   > Next.js 在**构建时**把该变量打进前端包，API 域名变更后需 **重新构建 Web 应用**。

6. **运行时环境变量**（可选，供 `/api/chat` 等）：

   | 变量名 | 说明 |
   |--------|------|
   | `OPENAI_API_KEY` | 学生端 AI 助手 |
   | `OPENAI_BASE_URL` | 如 DeepSeek |
   | `OPENAI_MODEL` | 如 `deepseek-chat` |

7. **资源**：CPU 1 核、内存 1GB 起（Next 构建较吃内存；若构建失败可调大）  
8. 开启 **公网访问**，得到 Web 域名，例如：  
   `https://adaptlink-web-xxxx.cloud.sealos.io`

9. 等待 Running 后，浏览器打开 Web 域名 → 应看到登录页

---

### 步骤 3：线上验收清单

| 步骤 | 操作 | 预期 |
|------|------|------|
| 1 | 打开 Web 域名 `/health` 不适用；开 `/login` | 登录页正常 |
| 2 | 学生端注册 / 登录 | 成功进入 `/student/dashboard` |
| 3 | 企业端登录，开发者密钥填 `psq12345` | 可登录；错误密钥被拒绝 |
| 4 | 高校端同上 | 同上 |
| 5 | 注册公司 → 企业注册 → 发岗位 → 学生投递 | 企业收件箱可见 |
| 6 | API `/docs` | Swagger 可打开 |

---

## 五、命令行构建镜像（可选）

若 Sealos 使用「自定义镜像」而非 Git 构建，可在本机构建后推送到镜像仓库：

```powershell
# 仓库根目录
cd adaptlink-master

# 后端
docker build -f apps/api/Dockerfile -t adaptlink-api:latest .

# 前端（API 地址换成你的）
docker build -f apps/web/Dockerfile `
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://你的-api-域名/api/v1 `
  -t adaptlink-web:latest .
```

---

## 六、更新代码后如何重新部署

1. `git push` 到 `main`  
2. Sealos 应用详情 → **重新部署** / **Rebuild**（或开启 Git 自动部署）  
3. 若 **API 域名变了**，必须同步修改 Web 的构建参数 `NEXT_PUBLIC_API_BASE_URL` 并 **重新构建 Web**

---

## 七、常见问题

### 1. Web 能开，但登录/接口全失败

- 检查构建参数 `NEXT_PUBLIC_API_BASE_URL` 是否为 **HTTPS + `/api/v1`**  
- 浏览器 F12 → Network 看请求是否打到正确 API 域名  

### 2. API 报数据库连接 127.0.0.1

- `DATABASE_URL` 未配置或配错 → 在 `adaptlink-api` 环境变量中修正  

### 3. 企业/高校端无法登录

- 须填开发者密钥：`psq12345`（与后端 `TRIAL_DEVELOPER_KEY` 一致）  

### 4. 构建前端 OOM / 超时

- Sealos 调大构建内存，或本地 `docker build` 后推镜像  

### 5. CORS

- 后端当前 `allow_origins=["*"]`，一般无需改；上线可改为只允许 Web 域名  

### 6. 免费额度用尽

- 控制台查看用量；可缩容、关机或升级套餐  

---

## 八、与旧部署方式对比

| 项目 | 旧方案 | Sealos 方案 |
|------|--------|-------------|
| 前端 | Vercel | `adaptlink-web` 容器 |
| 后端 | Railway | `adaptlink-api` 容器 |
| 国内访问 | 不稳定 | 同一云平台，延迟低 |
| 环境变量 | Vercel / Railway 控制台 | 各应用 Environment + Web Build Args |

---

## 九、需要帮助时提供的信息

若部署失败，请截图或复制：

1. Sealos 构建日志最后 50 行  
2. `adaptlink-api` 环境变量是否含 `DATABASE_URL`（可打码密码）  
3. Web 的 `NEXT_PUBLIC_API_BASE_URL` 构建参数  
4. `https://你的-api-域名/health` 的返回内容  

---

**完成以上步骤后，你就拥有一套前后端都在国内、可公网访问的 AdaptLink 试用环境。**
