<template>
  <div class="mb-4">
    <div class="mb-3">
      <el-button link class="back-link" @click="goBackToCandidates">
        <el-icon><ArrowLeft /></el-icon>
        <span class="ml-1">返回列表</span>
      </el-button>
    </div>
    <h1 class="text-2xl font-bold">添加候选人</h1>
  </div>
  <div>
    <div class="content-area">
      <div class="pdf-viewer">
        <el-upload
          v-if="!resumeUrl"
          name="resume_file"
          class="upload-demo"
          drag
          :http-request="handleUploadResume"
          :show-file-list="false"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">支持 pdf/doc/docx/png/jpg/jpeg 格式</div>
          </template>
        </el-upload>
        <embed v-else :src="resumeUrl" type="application/pdf" width="100%" height="100%" />
      </div>
      <div class="ocr-form">
        <el-alert v-if="rawContent" title="提交前请对照原件核对邮箱、手机号、出生日期、教育经历和项目经历。" type="info" :closable="false" class="mb-3" />
        <el-alert v-for="warning in parseWarnings" :key="warning" :title="warning" type="warning" :closable="false" class="mb-3" />
        <details v-if="rawContent" class="mb-3">
          <summary>查看提取原文</summary>
          <pre style="white-space: pre-wrap; overflow-wrap: anywhere; max-height: 300px; overflow: auto;">{{ rawContent }}</pre>
        </details>
        <el-form :model="ocrResult" label-width="120px">
          <el-form-item label="职位">
            <el-select v-model="selectedPosition">
              <el-option
                v-for="position in positions"
                :key="position.id"
                :label="position.title"
                :value="position.id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="ocrResult.name"></el-input>
          </el-form-item>
          <el-form-item label="性别">
            <el-input v-model="ocrResult.gender"></el-input>
          </el-form-item>
          <el-form-item label="出生日期">
            <el-input v-model="ocrResult.birthday"></el-input>
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="ocrResult.phone_number"></el-input>
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="ocrResult.email"></el-input>
          </el-form-item>
          <el-form-item label="最高学历">
            <el-input v-model="ocrResult.highest_education"></el-input>
          </el-form-item>
          <el-form-item label="教育经历">
            <el-input type="textarea" v-model="ocrResult.education_experience" :rows="3"></el-input>
          </el-form-item>
          <el-form-item label="工作经历">
            <el-input type="textarea" v-model="ocrResult.work_experience" :rows="4"></el-input>
          </el-form-item>
          <el-form-item label="项目经历">
            <el-input type="textarea" v-model="ocrResult.project_experience" :rows="8"></el-input>
          </el-form-item>
          <el-form-item label="技能">
            <el-input type="textarea" v-model="ocrResult.skills" :rows="3"></el-input>
          </el-form-item>
          <el-form-item label="自我评价">
            <el-input type="textarea" v-model="ocrResult.self_evaluation" :rows="3"></el-input>
          </el-form-item>
          <el-form-item label="其他信息">
            <el-input type="textarea" v-model="ocrResult.other_information" :rows="3"></el-input>
          </el-form-item>
          <el-form-item>
            <div class="text-right">
              <el-button type="primary" @click="createCandidateFunc">确定</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import { ArrowLeft, UploadFilled } from '@element-plus/icons-vue'
import fullLoading from '@/utils/fullLoading'
import http from '@/apis/request'

import {
  createCandidate,
  uploadResume,
  parseResume,
  getResumeParseTaskStatus,
  type CandidateCreateData,
  type ResumeOCRResult,
} from '@/apis/candidate_api'
import { getPositionList } from '@/apis/position_api'

interface Position {
  id: string
  title: string
}

interface OcrResult {
  name: string
  gender: string
  birthday: string
  phone_number: string
  email: string
  highest_education: string
  education_experience: string
  work_experience: string
  project_experience: string
  skills: string
  self_evaluation: string
  other_information: string
}

const POLL_INTERVAL_MS = 3000
const POLL_MAX_TIMES = 200 // 多页简历逐页 OCR 需要更长等待时间

const selectedPosition = ref<string>('')
const positions = ref<Position[]>([])
const resumeId = ref<string | null>(null)
const resumeUrl = ref<string | null>(null)
const ocrResult = ref<Partial<OcrResult>>({})
const rawContent = ref('')
const parseWarnings = ref<string[]>([])
const router = useRouter()

const goBackToCandidates = (): void => {
  router.push({ name: 'candidates' })
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const normalizeOcrResult = (ocrResp: ResumeOCRResult | null | undefined): Partial<OcrResult> => {
  if (!ocrResp) {
    return {}
  }

  const processedOcrResult: Partial<OcrResult> = {}
  for (const key in ocrResp) {
    if (Object.prototype.hasOwnProperty.call(ocrResp, key)) {
      const value = ocrResp[key as keyof ResumeOCRResult]
      if (typeof value === 'string') {
        processedOcrResult[key as keyof OcrResult] = value.replace(/\\n/g, '\n')
      } else if (value === null) {
        processedOcrResult[key as keyof OcrResult] = ''
      }
    }
  }

  return processedOcrResult
}

const fetchPositions = async (): Promise<void> => {
  try {
    const resp = await getPositionList({ page: 1, size: 999 })
    positions.value = resp.positions
  } catch {
    ElMessage.error('获取职位列表失败')
  }
}

onMounted(() => {
  fetchPositions()
})

const handleUploadResume = async (options: UploadRequestOptions): Promise<void> => {
  rawContent.value = ''
  parseWarnings.value = []
  fullLoading.show('简历上传中...')
  try {
    const uploadResp = await uploadResume(options.file)
    if (!uploadResp.resume) {
      throw new Error('简历上传失败，未返回简历信息')
    }

    resumeId.value = uploadResp.resume.id
    resumeUrl.value = `${http.baseURL}/media/${uploadResp.resume.file_path}`

    fullLoading.updateText('简历解析任务创建中...')
    const parseResp = await parseResume(resumeId.value)

    fullLoading.updateText('简历识别中，请稍候...')
    for (let i = 0; i < POLL_MAX_TIMES; i += 1) {
      const taskInfo = await getResumeParseTaskStatus(parseResp.task_id)

      rawContent.value = taskInfo.content || ''
      parseWarnings.value = taskInfo.warnings || []

      if (taskInfo.status === 'done') {
        ocrResult.value = normalizeOcrResult(taskInfo.result)
        ElMessage.success('简历解析完成，请核对后提交')
        return
      }

      if (taskInfo.status === 'failed') {
        throw new Error(taskInfo.error || '简历解析失败')
      }

      if (i < POLL_MAX_TIMES - 1) {
        await sleep(POLL_INTERVAL_MS)
      }
    }

    throw new Error('简历解析超时，请稍后重试')
  } catch (error) {
    console.error('An error occurred during resume processing:', error)
    ElMessage.error(error instanceof Error ? error.message : '简历处理失败，请稍后重试')
  } finally {
    fullLoading.hide()
  }
}

const createCandidateFunc = async (): Promise<void> => {
  if (!selectedPosition.value) {
    ElMessage.warning('请选择职位')
    return
  }

  if (!resumeId.value) {
    ElMessage.warning('请先上传简历')
    return
  }

  const candidateData = {
    ...ocrResult.value,
    position_id: selectedPosition.value,
    resume_id: resumeId.value,
  }

  fullLoading.show('候选人创建中...')
  try {
    await createCandidate(candidateData as CandidateCreateData)
    ElMessage.success('候选人创建成功')
    router.push({ name: 'candidates' })
  } catch (error) {
    console.log(error)
    ElMessage.error('候选人创建失败')
  } finally {
    fullLoading.hide()
  }
}
</script>

<style scoped>
.top-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.content-area {
  display: flex;
  gap: 16px;
}

.pdf-viewer {
  flex: 1;
  border: 1px solid #ccc;
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pdf-viewer .upload-demo {
  width: 100%;
  height: 100%;
}

.pdf-viewer .el-upload {
  width: 100%;
  height: 100%;
}

.pdf-viewer .el-upload-dragger {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ocr-form {
  flex: 1;
}

.back-link {
  color: #909399;
}

.back-link:hover {
  color: #606266;
}

.back-link {
  color: #909399;
}

.back-link:hover {
  color: #606266;
}

.back-link {
  color: #909399;
}

.back-link:hover {
  color: #606266;
}
</style>
