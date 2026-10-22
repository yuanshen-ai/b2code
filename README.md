# 智能招聘管理系统 · 招聘 Agent

面向 HR 与用人部门的招聘管理应用，覆盖职位管理、简历解析、岗位匹配评分、面试邀约与候选人状态跟进。人工批准邀约后，Agent 通过邮件与候选人协商时间，并联动钉钉日历完成面试安排。

后端使用 **FastAPI + LangChain / LangGraph**，前端使用 **Vue 3 + TypeScript**，业务数据与 Agent 检查点存储于 **PostgreSQL**，缓存与邮件处理游标由 **Redis** 管理。

## 核心功能

| 功能 | 实现内容 |
| --- | --- |
| 招聘业务管理 | 职位、候选人、员工与数据看板，结合用户和部门管理数据访问 |
| 简历解析 | 提取 PDF 文本；扫描件调用 PaddleOCR，提供视觉模型 OCR 回退路径；结构化提取候选人信息 |
| AI 岗位评分 | 结合简历与职位要求输出评分和分析，Pydantic 校验结构，事务保存评分及初筛状态 |
| 邮件协商 | 定时轮询回信，识别确认、重新协商或拒绝意图，通过工具推进后续流程 |
| 钉钉日程 | OAuth 授权与 Token 刷新，查询空闲时段、确认前复查冲突并创建面试日程 |
| 会话持久化 | PostgreSQL 保存 Agent 检查点，按 Token 阈值压缩对话历史，支持跨时段接续处理 |
| 重复操作防护 | 邀约前检查人工批准与发送状态，配合 Redis 锁和已有预约检查 |

## 技术栈

- **服务端**：Python、FastAPI、SQLAlchemy、Alembic、Pydantic。
- **Agent**：LangChain、LangGraph、模型回退、摘要中间件、PostgreSQL Checkpointer。
- **数据与任务**：PostgreSQL、Redis、APScheduler、IMAP / SMTP。
- **外部集成**：通义千问兼容接口、PaddleOCR、钉钉开放平台。
- **前端**：Vue 3、TypeScript、Vite、Pinia、Element Plus、ECharts。

模型名称与调用配置见 [模型初始化](code/agents/llms.py) 和 [OCR 集成](code/core/ocr.py)，可按自己的服务权限调整。

## 目录结构

```text
b2code/
├── code/                       # Python 后端
│   ├── agents/                 # 简历解析、评分与候选人协商 Agent
│   ├── routers/                # 业务 API
│   ├── core/                   # OCR、邮件、鉴权、缓存与钉钉集成
│   ├── models/                 # 数据模型
│   ├── repository/             # 数据访问
│   ├── schemas/                # 输入输出及 Agent 结构
│   ├── scheduler/              # 邮件轮询任务
│   ├── alembic/                # 数据库迁移
│   ├── settings/               # 环境配置
│   └── main.py                 # FastAPI 入口
└── hr-frontend/                # Vue 前端
    └── src/                    # 页面、组件、路由与 API 客户端
```

## 本地运行

以下命令使用 PowerShell。需要先安装 Git、uv，以及符合 [前端要求](hr-frontend/package.json) 的 Node.js；后端项目声明 Python 3.11 及以上。

### 1. 获取项目与配置后端

```powershell
git clone https://github.com/yuanshen-ai/b2code.git
cd b2code/code
Copy-Item .env.example .env
uv sync
```

编辑 `.env`，填写自己的数据库密码、随机 JWT 密钥、邮箱授权码、模型 API Key、钉钉应用凭据和 OCR Token。字段说明见 [.env.example](code/.env.example)。

提前准备 PostgreSQL 和 Redis。按 `.env` 创建业务数据库 `hr_system` 与 Agent 检查点数据库 `hr_system_agent`，确保 Redis 地址及端口与配置一致。邮件轮询随应用启动，因此邮箱配置也需要有效。

### 2. 初始化数据库与启动后端

在 `code` 目录执行：

```powershell
uv run --env-file .env alembic upgrade head
uv run --env-file .env python "init data.py"
uv run --env-file .env python -m uvicorn main:app --reload
```

`init data.py` 用于新数据库的演示部门和用户初始化，初始密码读取 `INITIAL_USER_PASSWORD`。它会插入数据，请仅在需要初始化时执行；示例邮箱使用 `example.com`，实际邮件测试需使用自己的测试邮箱。

### 3. 启动前端

另开终端，在仓库的 `hr-frontend` 目录执行：

```powershell
Copy-Item .env.example .env.development
npm ci
npm run dev
```

`VITE_API_BASE_URL` 应指向后端服务，例如 `http://localhost:8000`。前端访问地址以 Vite 终端输出为准。

使用钉钉授权时，还需在开放平台配置与实际部署匹配的权限、回调地址及 `BACKEND_BASE_URL`。

## 关键实现入口

- [候选人 Agent 与业务工具](code/agents/candidate.py)
- [简历信息提取](code/agents/resume.py)
- [PDF 与 OCR 处理](code/core/ocr.py)
- [钉钉接口封装](code/core/dingtalk.py)
- [邮件轮询](code/scheduler/__init__.py)
- [候选人业务接口](code/routers/candidate_router.py)

## 配置与数据

仓库提供源码与配置示例。真实密钥、数据库、候选人简历、上传文件、本地日志和虚拟环境不随仓库分发。运行时请使用自己的测试数据和服务凭据；邮件与日历操作会产生真实业务动作，演示时应连接测试账号。
