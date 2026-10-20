# 上传副本说明

本目录保留 code 后端与 hr-frontend 前端，未携带原 Git 历史、本地依赖、日志、简历和上传数据。

启动前：
1. 在 code 中将 .env.example 复制为 .env，填写自己的数据库密码、JWT 密钥、邮箱授权码和服务 API 密钥。
2. 初始化用户脚本使用 INITIAL_USER_PASSWORD；示例邮箱已替换为 example.com 地址。
3. 在 hr-frontend 中将 .env.example 复制为 .env.development，按部署情况修改 API 地址。
4. 自行安装项目依赖；后端沿用 main.py 中的启动方式：python -m uvicorn main:app --reload --env-file .env。

实际配置、依赖和业务数据被 .gitignore 排除。此目录尚未初始化 Git，也未上传 GitHub。
