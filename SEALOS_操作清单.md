# Sealos 部署：你要做的事（GitHub + ghcr.io）

代码继续放 **GitHub**；**构建镜像**由 GitHub Actions 完成；**运行**在 Sealos 填镜像名。按顺序打勾即可。

---

## 我已帮你在仓库里准备好的内容

| 文件 | 作用 |
|------|------|
| `apps/api/Dockerfile` | 后端镜像 |
| `apps/web/Dockerfile` | 前端镜像（Next standalone） |
| `.github/workflows/docker-publish.yml` | push `main` 自动构建并推到 **ghcr.io** |
| `scripts/sealos-build-push.ps1` | 可选：本机手动 build/push |
| `docker-compose.yml` | 可选：本机先验证 |
| `DEPLOYMENT_SEALOS.md` | 详细说明与排错 |

---

## 第一步：把代码推到 GitHub

在你本机仓库根目录（`adaptlink-master` 内层）：

```powershell
git add .
git commit -m "你的说明"
git push origin main
```

推送后打开 GitHub → **Actions** → 看 **Publish Docker images (Sealos)** 是否绿色成功。

> 若仓库是私有的，见文末「私有仓库」说明。

---

## 第二步：把 ghcr 镜像设为公开（必做，否则 Sealos 拉不下来）

1. 打开 `https://github.com/Harryfox-tech?tab=packages`（把用户名换成你的）  
2. 找到 **`adaptlink-api`**、**`adaptlink-web`** 两个包  
3. 每个包 → **Package settings** → **Change visibility** → **Public**

镜像地址格式（用户名小写）：

```text
ghcr.io/harryfox-tech/adaptlink-api:latest
ghcr.io/harryfox-tech/adaptlink-web:latest
```

---

## 第三步：在 Sealos 部署后端 API

1. 登录 https://cloud.sealos.io → **应用管理** → **新建应用**  
2. 填写：

| 项 | 值 |
|----|-----|
| 名称 | `adaptlink-api` |
| 镜像名 | `ghcr.io/harryfox-tech/adaptlink-api:latest` |
| 容器端口 | `8080` |
| **开启外网访问** | **开** |
| CPU / 内存 | 建议 0.5 核 + 512M～1G |

3. **高级配置 → 环境变量**：

| 变量 | 值 |
|------|-----|
| `DATABASE_URL` | 你的 Neon / PostgreSQL 连接串 |
| `AI_PROVIDER` | `mock` |
| `TRIAL_DEVELOPER_KEY` | `psq12345` |

4. 点 **部署**，等 **running**  
5. 打开 **公网地址**，浏览器访问：`https://你的域名/health` → 应看到 `{"status":"ok",...}`  
6. **复制 API 根地址**（含 `/api/v1`），例如：  
   `https://adaptlink-api-xxxxx.cloud.sealos.io/api/v1`

---

## 第四步：配置 GitHub 变量并重新构建前端

前端要把 API 地址写进镜像，需要 GitHub **Repository variable**：

1. GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** → **Variables**  
2. **New repository variable**  
   - Name：`NEXT_PUBLIC_API_BASE_URL`  
   - Value：第三步复制的地址（必须 `https://.../api/v1`）  
3. **Actions** → **Publish Docker images (Sealos)** → **Run workflow**（手动再跑一遍）  
4. 等 `adaptlink-web` 构建完成  

---

## 第五步：在 Sealos 部署前端 Web

1. **新建应用**  
2. 填写：

| 项 | 值 |
|----|-----|
| 名称 | `adaptlink-web` |
| 镜像名 | `ghcr.io/harryfox-tech/adaptlink-web:latest` |
| 容器端口 | `3000` |
| **开启外网访问** | **开** |
| CPU / 内存 | 建议 1 核 + 1G |

3. （可选）环境变量：`OPENAI_API_KEY` 等（学生端 `/api/chat` 用）  
4. 部署 → 打开公网地址 → 应看到 **登录页**  

---

## 第六步：验收

- [ ] 学生端：注册 / 登录  
- [ ] 企业 / 高校端：开发者密钥 `psq12345` 可登录  
- [ ] 企业注册公司 → 发岗位 → 学生投递 → 企业收件箱可见  

---

## 以后更新代码

1. `git push` 到 `main`  
2. GitHub Actions 自动重建镜像  
3. Sealos 应用详情里 **更新** / **重启**（或改镜像 tag 为最新 `latest`）  

若改了 API 域名，记得改 GitHub Variable `NEXT_PUBLIC_API_BASE_URL` 并 **重新跑 workflow** 再更新 Web 应用。

---

## 私有仓库

- ghcr 包需设为 Public，**或**在 Sealos 配置镜像拉取密钥（较麻烦）  
- 试用建议：仓库或包设为 **Public**

---

## 不想用 Actions、只想本机构建

```powershell
# 先登录：GitHub → Settings → Developer settings → PAT (write:packages)
docker login ghcr.io -u 你的GitHub用户名

cd adaptlink-master
.\scripts\sealos-build-push.ps1 -Owner harryfox-tech -ApiBaseUrl "https://你的-api域名/api/v1"
```

然后在 Sealos 填同样的 `ghcr.io/...` 镜像名。

---

## 常见问题

| 现象 | 处理 |
|------|------|
| Sealos 一直 ImagePullBackOff | ghcr 包是否 Public；镜像名是否小写 |
| Web 能开但登录失败 | 检查 `NEXT_PUBLIC_API_BASE_URL` 是否 HTTPS + `/api/v1`；是否重新构建了 web 镜像 |
| API 连不上数据库 | 检查 `DATABASE_URL` |
| Actions 失败 | 打开失败 job 日志；多为 Dockerfile 或内存不足 |

更细说明见 [DEPLOYMENT_SEALOS.md](./DEPLOYMENT_SEALOS.md)。
