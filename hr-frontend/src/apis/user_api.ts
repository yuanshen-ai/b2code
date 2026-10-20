import request from '@/apis/request'
import { type User, type Department } from '@/stores/user'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  invite_code: string
  username: string
  realname: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}

export interface ResponseSchema {
  result: 'success' | 'fail'
}

export interface UserInviteSchema {
  email: string
  department_id: string | null
}

export interface GetUserListParams {
  page: number
  size: number
  department_id?: string | null
}

export interface UserListResponse {
  users: User[] | null
  total: number
}

export interface DepartmentListResponse {
  departments: Department[] | null
}

export interface AssignDepartmentsSchema {
  hr_id: string
  department_ids: string[]
}

export interface HrListResponse {
  hrs: User[] | null
}

export function login(data: LoginData) {
  return request.post<LoginResponse>('/user/login', data)
}

export function register(data: RegisterData) {
  return request.post<ResponseSchema>('/user/register', data)
}

export const inviteUser = (data: UserInviteSchema) => {
  return request.post('/user/invite', data)
}

export const getUserList = (params: GetUserListParams) => {
  return request.get<UserListResponse>('/user/list', params)
}

export const getAllDepartments = () => {
  return request.get<DepartmentListResponse>('/user/department/list')
}

export const getDingtalkAuthorizeUrl = () => {
  return request.get<{ authorize_url: string }>('/user/dingtalk/authorize')
}

export const getDingtalkStatus = () => {
  return request.get<{
    dingding_user: null | {
      nick: string
      union_id: string
    }
  }>('/user/dingtalk/account')
}

export const assignDepartments = (data: AssignDepartmentsSchema) => {
  return request.post('/user/assign/department', data)
}

export const getHRList = () => {
  return request.get<HrListResponse>('/user/hr/list')
}
