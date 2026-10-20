import asyncio
import re
import tempfile
import unicodedata
from pathlib import Path

import pymupdf
from loguru import logger
from core.ocr import PaddleOcr, QwenOcr


def usable_text(text: str) -> bool:
    """保守判断文字层；这只能发现明显异常，不能保证识别完整。"""
    chars = [c for c in text if not c.isspace()]
    if len(chars) < 60:
        return False
    bad = sum(c == "\ufffd" or unicodedata.category(c).startswith("C") for c in chars)
    return bad / len(chars) < 0.02 and sum(c.isalnum() for c in chars) / len(chars) > 0.6


async def ocr_image(path: str) -> tuple[str, str]:
    try:
        paddle = PaddleOcr()
        async def run():
            job_id = await paddle.create_job(path)
            url = await paddle.poll_for_state(job_id)
            return "\n\n".join(await paddle.fetch_parsed_contents(url))
        text = await asyncio.wait_for(run(), timeout=90)
        if not text.strip():
            raise ValueError("PaddleOCR 返回空文字")
        return text, "PaddleOCR"
    except Exception as exc:
        logger.warning("PaddleOCR 失败，使用备用 OCR：{}", exc)
        text = await asyncio.wait_for(QwenOcr().extract_info_from_resume(path), timeout=90)
        return text, "Qwen OCR"


async def extract_resume_text(file_path: str) -> tuple[str, list[str]]:
    warnings = []
    if Path(file_path).suffix.lower() != ".pdf":
        text, source = await ocr_image(file_path)
        if not text.strip():
            raise ValueError("未提取到简历文字，请检查文件")
        if not usable_text(text):
            warnings.append("提取文字较少或含异常字符，请对照原件核对。")
        logger.info("简历文字来源：{}", source)
        return text, warnings

    pages = []
    with pymupdf.open(file_path) as doc, tempfile.TemporaryDirectory(prefix="resume-ocr-") as tmp:
        for index, page in enumerate(doc):
            text = page.get_text("text", sort=True)
            # 有大幅图片时也走 OCR，防止只有页眉文字、正文却是扫描图片。
            image_area = sum(pymupdf.Rect(item["bbox"]).get_area() for item in page.get_image_info())
            if usable_text(text) and image_area < page.rect.get_area() * 0.5:
                source = "PDF 文字层"
            else:
                image_path = str(Path(tmp) / f"page-{index + 1}.png")
                page.get_pixmap(dpi=200).save(image_path)
                text, source = await ocr_image(image_path)
                if not usable_text(text):
                    warnings.append(f"第 {index + 1} 页提取文字较少或含异常字符，请核对原件。")
            logger.info("简历第 {} 页文字来源：{}，字符数：{}", index + 1, source, len(text))
            pages.append(text.strip())
    if not any(pages):
        raise ValueError("未提取到简历文字，请检查文件")
    return "\n\n".join(f"--- 第 {i + 1} 页 ---\n{text}" for i, text in enumerate(pages)), warnings


def review_warnings(content: str, candidate) -> list[str]:
    warnings = []
    for field, label in [("email", "邮箱"), ("phone_number", "手机号"),
                         ("birthday", "出生日期"), ("education_experience", "教育经历"),
                         ("project_experience", "项目经历"), ("skills", "技能")]:
        value = getattr(candidate, field, None)
        if not value or not str(value).strip():
            warnings.append(f"{label}未提取到，请核对原件并按实际情况补充。")
    compact = re.sub(r"\s+", "", content)
    for field, label in [("email", "邮箱"), ("phone_number", "手机号")]:
        value = getattr(candidate, field, None)
        if value and re.sub(r"[\s-]+", "", str(value)).lower() not in compact.replace("-", "").lower():
            warnings.append(f"{label}与提取原文可能不一致，请核对。")
    birthday = getattr(candidate, "birthday", None)
    if birthday and str(birthday)[:4] not in content:
        warnings.append("出生年份未在提取原文中找到，请核对出生日期。")
    return warnings
