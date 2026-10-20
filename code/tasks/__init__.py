from fastapi_mail import FastMail, MessageSchema
from aiosmtplib import SMTPResponseException
from loguru import logger
from core.mail import create_mail_instance
from models import AsyncSessionFactory, AsyncSession
from repository.candidate_repo import ResumeRepo, ResumeModel
import os

from schemas.position_schema import PositionSchema
from schemas.user_schema import UserSchema
from settings import settings
from core.resume_text import extract_resume_text, review_warnings
from pathlib import Path
import asyncio
from settings import BASE_DIR
from dependences import get_cache_instance, HRCache
from core.cache import TaskInfoSchema
from agents.resume import extract_candidate_info
from schemas.agent_schema import AgentCandidateSchema
from schemas.candidate_schema import CandidateSchema
from agents.candidate import CandidateProcessAgent


async def send_email_task(message: MessageSchema):
    # 发送邮件
    mail: FastMail = create_mail_instance()
    try:
        await mail.send_message(message)
    except SMTPResponseException as e:
        if e.code == -1 and b'\\x00\\x00\\x00' in str(e).encode():
            logger.info("⚠️ 忽略 QQ 邮箱 SMTP 关闭阶段的非标准响应（邮件已成功发送）", enqueue=True)
        else:
            logger.error(f"邮件发送失败！{e}")

async def send_invite_email_task(
    email: str,
    invite_code: str
):
    # 发送邮件
    message = MessageSchema(
        subject="【知了有限公司】注册邀请",
        recipients=[email],
        body=f"您好，您的邮箱是：{email}，验证码是：{invite_code}，一天内有效。",
        subtype="plain"
    )
    await send_email_task(message)

async def ocr_parse_resume_task(
    resume_id: str,
    task_id: str
):
    async with AsyncSessionFactory() as session:
        async with session.begin():
            resume_repo = ResumeRepo(session=session)
            resume: ResumeModel = await resume_repo.get_by_id(resume_id)
    file_path = os.path.join(settings.RESUME_DIR, resume.file_path)
    # 1. 设置当前的状态为pending，任务的执行状态和过程中的数据可以存储在redis中
    cache: HRCache = get_cache_instance()
    await cache.set_task_info(TaskInfoSchema(task_id=task_id, status="pending"))
    content, warnings = "", []
    try:
        content, warnings = await extract_resume_text(file_path)
        # 保存在独立目录，避免通过 /media 直接访问；先保存，字段整理失败也可排查。
        text_dir = Path(BASE_DIR) / ".resume_text"
        text_dir.mkdir(exist_ok=True)
        await asyncio.to_thread((text_dir / f"{task_id}.txt").write_text, content, encoding="utf-8")
        await cache.set_task_info(TaskInfoSchema(task_id=task_id, status="pending", content=content, warnings=warnings))
        print("\n========== OCR中间输出开始 ==========", flush=True)
        print(content, flush=True)
        print("========== OCR中间输出结束 ==========\n", flush=True)

        candidate_info: AgentCandidateSchema = await extract_candidate_info(content)

        print("\n========== 最终字段结果 ==========", flush=True)
        print(candidate_info.model_dump_json(indent=2), flush=True)
        # 2. 设置当前状态为done
        warnings.extend(review_warnings(content, candidate_info))
        await cache.set_task_info(TaskInfoSchema(task_id=task_id, status="done", result=candidate_info, content=content, warnings=warnings))
    except Exception as e:
        # 3. 如果出现了异常，就把状态设置failed
        logger.error(e)
        await cache.set_task_info(TaskInfoSchema(task_id=task_id, status="failed", error=str(e), content=content, warnings=warnings))


async def run_candidate_agent(
    candidate: CandidateSchema,
    position: PositionSchema,
    interviewer: UserSchema
):
    async with CandidateProcessAgent(
        candidate=candidate,
        position=position,
        interviewer=interviewer
    ) as agent:
        response = await agent.ainvoke(
            messages = [{
                "role": "user",
                "content": f"候选人信息：{candidate.model_dump_json()}，职位信息：{position.model_dump_json()}"
            }],
            thread_id=candidate.email,
            score_only=True,
        )
        print(response)
        return response