import request from '@/apis/request'

export interface Latest7DaysCandidatesResponse {
  day: string
  count: number
}

export function getLatest7DaysCandidates() {
  return request.get<Array<Latest7DaysCandidatesResponse>>('/dashboard/candidate/7d')
}
