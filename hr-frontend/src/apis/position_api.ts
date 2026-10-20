import httpRequest from './request'
import type { Department, User } from '@/stores/user'

export enum EducationEnum {
  DaZhuan = '大专',
  BenKe = '本科',
  ShuoShi = '硕士',
  BoShi = '博士',
  WeiZhi = '未知',
}

export interface Position {
  id: string
  title: string
  description: string | null
  requirements: string | null
  min_salary: number | null
  max_salary: number | null
  deadline: string | null
  recruitment_count: number
  education: EducationEnum
  work_year: number
  is_open: boolean
  department: Department
  creator: User
  created_at: string
  updated_at: string
}

export interface PositionCreateData {
  title: string
  description: string | null
  requirements: string | null
  min_salary: number | null
  max_salary: number | null
  deadline?: string | null
  recruitment_count?: number
  education?: EducationEnum
  work_year?: number
  is_open?: boolean
}

export interface GetPositionListParams {
  page?: number
  size?: number
  department_id?: string
}

export interface PositionCreateResponse {
  position: Position
}

export interface PositionListResponse {
  positions: Position[]
}

/**
 * 创建职位
 * @param data
 * @returns
 */
export const createPosition = (data: PositionCreateData) => {
  return httpRequest.post<PositionCreateResponse>('/position/create', data)
}

/**
 * 获取职位列表
 * @param params
 * @returns
 */
export const getPositionList = (params: GetPositionListParams) => {
  return httpRequest.get<PositionListResponse>('/position/list', { params })
}

/**
 * 删除职位
 * @param position_id
 * @returns
 */
export const deletePosition = (position_id: string) => {
  return httpRequest.delete(`/position/delete/${position_id}`)
}
