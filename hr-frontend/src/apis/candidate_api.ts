import httpRequest from './request'
import { type Position } from './position_api'
import type { User } from '@/stores/user'

// Enums based on API documentation
export enum CandidateStatusEnum {
  APPLICATION = '已投递',
  AI_FILTER_FAILED = 'AI筛选失败',
  AI_FILTER_PASSED = 'AI筛选成功',
  WAITING_FOR_INTERVIEW = '待面试',
  REFUSED_INTERVIEW = '拒绝面试',
  INTERVIEW_PASSED = '面试通过',
  INTERVIEW_REJECTED = '面试未通过',
  HIRED = '已入职',
  REJECTED = '已拒绝',
}

export enum EducationEnum {
  JUNIOR_COLLEGE = '大专',
  BACHELOR = '本科',
  MASTER = '硕士',
  DOCTOR = '博士',
  UNKNOWN = '未知',
}

export interface Resume {
  id: string
  file_path: string
  uploader: User
}

export interface ResumeUploadResponse {
  resume: Resume | null
}

export interface ResumeParseTaskResponse {
  task_id: string
}

export interface ResumeOCRResult {
  name?: string | null
  gender?: string | null
  birthday?: string | null
  email?: string | null
  phone_number?: string | null
  work_experience?: string | null
  project_experience?: string | null
  education_experience?: string | null
  self_evaluation?: string | null
  other_information?: string | null
  skills?: string | null
}

export interface ResumeParseTaskInfoResponse {
  task_id: string
  status: 'pending' | 'done' | 'failed'
  result?: ResumeOCRResult | null
  error?: string | null
  content?: string | null
  warnings?: string[]
}

export interface Candidate {
  id: string
  interview_invitation_sent?: boolean
  name: string
  email: string
  gender?: string | null
  birthday?: string | null
  phone_number?: string | null
  work_experience?: string | null
  project_experience?: string | null
  education_experience?: string | null
  self_evaluation?: string | null
  other_information?: string | null
  skills?: string | null
  status?: CandidateStatusEnum | string | null
  creator: User
  position: Position
  resume: Resume
}

export interface CandidateListResponse {
  candidates: Candidate[]
}

export interface CandidateCreateData {
  name: string
  email: string
  gender?: string | null
  birthday?: string | null
  phone_number?: string | null
  work_experience?: string | null
  project_experience?: string | null
  education_experience?: string | null
  self_evaluation?: string | null
  other_information?: string | null
  skills?: string | null
  position_id: string
  resume_id: string
}

export interface CandidateStatusUpdateData {
  status: CandidateStatusEnum
  interview_time?: string | null
  rejection_reason?: string | null
}

export interface GetCandidatesParams {
  page?: number
  size?: number
  position_id?: string
  status?: CandidateStatusEnum
}

export interface CandidateAIScore {
  id: string
  work_experience_score: number
  technical_skills_score: number
  soft_skills_score: number
  educational_background_score: number
  project_experience_score: number
  overall_score: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  candidate_id: string
}

export interface CandidateAIScoreResponse {
  ai_score: CandidateAIScore
}

export const uploadResume = (file: File): Promise<ResumeUploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  return httpRequest.upload<ResumeUploadResponse>('/candidate/resume/upload', formData)
}

export const parseResume = (resumeId: string): Promise<ResumeParseTaskResponse> => {
  return httpRequest.post<ResumeParseTaskResponse>('/candidate/resume/parse', {
    resume_id: resumeId,
  })
}

export const getResumeParseTaskStatus = (taskId: string): Promise<ResumeParseTaskInfoResponse> => {
  return httpRequest.get<ResumeParseTaskInfoResponse>(`/candidate/resume/parse/${taskId}`)
}

export const createCandidate = (data: CandidateCreateData) => {
  return httpRequest.post('/candidate/create', data)
}

export const getCandidates = (params: GetCandidatesParams) => {
  return httpRequest.get<CandidateListResponse>('/candidate/list', { params })
}

export const updateCandidateStatus = (candidateId: string, data: CandidateStatusUpdateData) => {
  return httpRequest.patch(`/candidate/${candidateId}/status`, data)
}

export const getCandidateAiScore = (candidateId: string) => {
  return httpRequest.get<CandidateAIScoreResponse>(`/candidate/ai-score/${candidateId}`)
}

export const approveCandidateInterview = (candidateId: string) => {
  return httpRequest.post(`/candidate/${candidateId}/approve-interview`)
}
