# 智能人才发展与就业服务平台（Monorepo 骨架）

## 目录
- `apps/web`: Next.js + TypeScript + Tailwind + Vercel AI SDK 前端
- `apps/api`: FastAPI 后端（多智能体评估工作流占位）

## 国内部署（Sealos + GitHub Actions）

**按这个做即可：** **[SEALOS_操作清单.md](./SEALOS_操作清单.md)**（你要做的步骤清单）。

- 代码在 GitHub → Actions 自动构建镜像到 `ghcr.io` → Sealos 填镜像名运行  
- 详细说明：[DEPLOYMENT_SEALOS.md](./DEPLOYMENT_SEALOS.md)

本地可先：`copy .env.sealos.example .env` → `docker compose up --build`。

## 快速启动
1. 前端
```bash
npm install
npm run dev:web
```

2. 后端
```bash
cd apps/api
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
cd ../..
npm run dev:api
```

3. 访问
- Web: http://localhost:3000
- API: http://localhost:8000/docs

后端连库：
- 在 `apps/api/.env` 中配置 `DATABASE_URL`
- `POST /api/v1/simulations/run` 会自动写入 PostgreSQL（若未配置则自动回退 mock）

学生端模拟器双回退：
- 第1层：后端真实模型评估（`AI_PROVIDER=openai` 且配置 `OPENAI_API_KEY`）
- 第2层：后端 mock 多智能体评估（真实模型失败时自动启用）
- 第3层：前端本地 mock 数据（后端不可用时自动启用）

## Prisma（可选）
在 `apps/web` 下执行：
```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

## 一键开发脚本
```bash
powershell -ExecutionPolicy Bypass -File scripts/dev-start.ps1
powershell -ExecutionPolicy Bypass -File scripts/dev-status.ps1
powershell -ExecutionPolicy Bypass -File scripts/dev-stop.ps1
```
