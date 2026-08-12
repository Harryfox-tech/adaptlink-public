# AdaptLink · 智能人才发展与就业服务平台

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

面向 **学生 / 企业 / 高校** 三端的人才培养与就业协同平台。支持成长/求职剧情模拟、LangGraph ReAct Agent、简历优化、岗位建模与招聘分析。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 15 · TypeScript · Tailwind · Framer Motion |
| 后端 | FastAPI · Python · LangGraph · PostgreSQL |
| AI | OpenAI 兼容 API（DeepSeek 等）· 多 Agent 评估 |
| 部署 | Docker · GitHub Actions · Sealos（可选） |

## 仓库结构

```
apps/web/     Next.js 前端（学生/企业/高校三端）
apps/api/     FastAPI 后端与 Agent 服务
scripts/      本地开发与部署脚本
```

## 快速开始

### 1. 克隆与依赖

```bash
git clone https://github.com/Harryfox-tech/adaptlink-public.git
cd adaptlink-public
npm install
```

### 2. 环境变量

```bash
# Windows
copy .env.example .env
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env

# Linux / macOS
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

按需填写 `DATABASE_URL`、`OPENAI_API_KEY` 等。**切勿将 `.env` 提交到 Git。**

### 3. 启动

```bash
# 前端
npm run dev:web

# 后端（另开终端）
cd apps/api
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
cd ../..
npm run dev:api
```

- Web: http://localhost:3000  
- API 文档: http://localhost:8000/docs  

### 4. Docker 本地验证（可选）

```bash
copy .env.sealos.example .env
docker compose up --build
```

## 核心功能

- **学生端**：成长/求职模拟、简历分析与 AI 优化、岗位推荐、投递工作台
- **企业端**：岗位能力建模、人才池筛选、招聘漏斗、数据洞察
- **高校端**：学生画像、课程能力映射、培养诊断
- **Agent**：LangGraph ReAct 剧情模拟、简历优化 auto-run 实时 SSE 进度

## 文档

| 文件 | 说明 |
|------|------|
| [SIMULATION.md](./SIMULATION.md) | 模拟器模块说明（评审/合作方阅读） |
| [DEPLOYMENT_SEALOS.md](./DEPLOYMENT_SEALOS.md) | Sealos 部署指南 |
| [SEALOS_操作清单.md](./SEALOS_操作清单.md) | Sealos 逐步操作清单 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel + Render 等替代部署 |

## 开源与贡献

- **协议**：[MIT License](./LICENSE)
- **安全**：[SECURITY.md](./SECURITY.md)
- 欢迎提交 Issue / Pull Request
- 参与前请先 `fork` 仓库，确保本地 `.env` 不在提交范围内

## 许可证

本项目采用 [MIT License](./LICENSE) 开源。
