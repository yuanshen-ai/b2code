import os
from langchain_openai import ChatOpenAI

api_key = os.getenv("DASHSCOPE_API_KEY")

qwen_llm = ChatOpenAI(
    model="qwen-plus",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    api_key=api_key
)

deepseek_llm = ChatOpenAI(
    model="deepseek-v4-pro",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    api_key=api_key
)