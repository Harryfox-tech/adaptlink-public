# Sealos 部署完整教程（前后端国内访问）

本教程将 **AdaptLink** 从 Vercel + Railway 迁移到 **[Sealos 公有云](https://cloud.sealos.io)**：前后端各一个容器，国内访问稳定，新用户通常有免费配额（以控制台为准）。

> **快速上手**：直接看 **[SEALOS_操作清单.md](./SEALOS_操作清单.md)**（只列你要点的步骤）。  
> **推荐流程**：GitHub 继续存代码 → **GitHub Actions** 自动 `docker build` 推到 **ghcr.io** → Sealos「应用部署」里填镜像名（不是选 GitHub）。

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
| `.github/workflows/docker-publish.yml` | push `main` 自动构建并推送 ghcr.io |
| `scripts/sealos-build-push.ps1` | 本机手动构建推送（可选） |
| `SEALOS_操作清单.md` | **你要做的步骤清单** |

---

## 三-B、推荐：GitHub Actions 自动构建（不用本机 Docker）

1. 把本仓库 **push 到 GitHub** `main` 分支  
2. 打开仓库 **Actions** → 工作流 **Publish Docker images (Sealos)** 跑绿  
3. GitHub 用户名旁 **Packages** 里把 `adaptlink-api`、`adaptlink-web` 设为 **Public**  
4. Sealos 镜像名填：
   - `ghcr.io/你的用户名小写/adaptlink-api:latest`
   - `ghcr.io/你的用户名小写/adaptlink-web:latest`  

前端 API 地址：在 GitHub **Settings → Secrets and variables → Actions → Variables** 添加  
`NEXT_PUBLIC_API_BASE_URL`（部署完 API 后填写），再 **重新运行** workflow。

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

> **重要：和你截图一致**  
> Sealos「应用部署 / 应用管理」页面只有 **镜像名（Image Name）** 输入框（默认 `nginx`），**没有「选 GitHub 仓库」**。  
> 需要先在本地（或 CI）把代码 **build 成 Docker 镜像并推到镜像仓库**，再在 Sealos 里填镜像名。下面按这个真实流程写。

### 步骤 0：注册并进入

1. 打开 https://cloud.sealos.io 注册 / 登录  
2. 进入控制台 → **应用管理**（你截图里的「应用部署」页面）  
3. 确认账户有可用**余额/免费额度**

### 步骤 0.5：本地构建并推送镜像（必做）

在仓库根目录 `adaptlink-master` 打开终端（已安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)）。

**0）登录镜像仓库（任选其一）**

- [Docker Hub](https://hub.docker.com/)（免费，国际）  
- 或 [阿里云容器镜像服务 ACR](https://cr.console.aliyun.com/)（国内推镜像更快）

下面用 Docker Hub 举例，用户名替换为你的：`你的用户名`

```powershell
docker login
```

**1）构建并推送后端**

```powershell
cd "你的路径\adaptlink-master"
docker build -f apps/api/Dockerfile -t 你的用户名/adaptlink-api:latest .
docker push 你的用户名/adaptlink-api:latest
```

**2）构建并推送前端**

先把 API 地址想好。若 API 尚未部署，可先用占位，部署完 API 后再改地址 **重新 build + push 一次 web**：

```powershell
docker build -f apps/web/Dockerfile `
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://你的-api-域名/api/v1 `
  -t 你的用户名/adaptlink-web:latest .
docker push 你的用户名/adaptlink-web:latest
```

---

### 步骤 1：在 Sealos 部署后端 `adaptlink-api`（对应你的截图）

1. **应用管理** → **新建应用**  
2. 按你截图中的表单项填写：

   | 表单项 | 填什么 |
   |--------|--------|
   | **名称 Name** | `adaptlink-api` |
   | **镜像名 Image Name** | `你的用户名/adaptlink-api:latest`（Public 保持开启） |
   | **部署模式** | 固定，副本 **1** |
   | **CPU / 内存** | 建议 CPU **0.5**、内存 **512M～1G**（256M 可能偏紧） |
   | **容器端口** | **8080** |
   | **开启外网访问** | **打开**（你截图里是关的，必须开才有公网域名） |

3. 展开 **高级配置** → **环境变量**：

   | 变量名 | 值 |
   |--------|-----|
   | `DATABASE_URL` | 你的 PostgreSQL 连接串 |
   | `AI_PROVIDER` | `mock` |
   | `TRIAL_DEVELOPER_KEY` | `psq12345` |

4. 右上角 **部署 Deploy**  
5. 等状态 **running** → 打开 **公网地址** → 访问 `/health` 应返回 ok  
6. 记下 API 域名，例如：`https://adaptlink-api-xxxx.cloud.sealos.io`

---

### 步骤 2：在 Sealos 部署前端 `adaptlink-web`

若步骤 0.5 里前端构建时 API 地址还是占位，请用真实 API 地址 **重新 build + push web 镜像**，再在 Sealos 里 **更新镜像** 或删应用重建。

1. 再 **新建应用**  
2. 填写：

   | 表单项 | 填什么 |
   |--------|--------|
   | **名称** | `adaptlink-web` |
   | **镜像名** | `你的用户名/adaptlink-web:latest` |
   | **容器端口** | **3000** |
   | **开启外网访问** | **打开** |
   | **CPU / 内存** | 建议 CPU **1**、内存 **1G** |

3. （可选）环境变量：`OPENAI_API_KEY` 等（供 `/api/chat`）  
4. **部署** → 打开 Web 公网地址 → 应看到登录页  

**API 地址（给前端构建用）**：

```text
NEXT_PUBLIC_API_BASE_URL = https://你的-api-域名/api/v1
```

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
