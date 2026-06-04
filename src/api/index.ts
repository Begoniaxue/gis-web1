import axios from 'axios'
import type { PlotInfo, BuildingInfo, RoadNetwork, RouteResult, BufferAnalysisResult } from '@/types'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error)
)

export const api = {
  getPlots(): Promise<{ code: number; data: PlotInfo[]; message: string }> {
    return request.get('/plots')
  },

  getPlot(id: string): Promise<{ code: number; data: PlotInfo; message: string }> {
    return request.get(`/plot/${id}`)
  },

  getBuildings(): Promise<{ code: number; data: BuildingInfo[]; message: string }> {
    return request.get('/buildings')
  },

  getBuildingsBatch(page: number, pageSize: number): Promise<{
    code: number
    data: { list: BuildingInfo[]; total: number; page: number; pageSize: number }
    message: string
  }> {
    return request.post('/buildings/batch', { page, pageSize })
  },

  getRoads(): Promise<{ code: number; data: RoadNetwork[]; message: string }> {
    return request.get('/roads')
  },

  planRoute(start: { lng: number; lat: number }, end: { lng: number; lat: number }): Promise<{
    code: number
    data: RouteResult
    message: string
  }> {
    return request.post('/route', { start, end })
  },

  bufferAnalysis(center: { lng: number; lat: number }, radius: number): Promise<{
    code: number
    data: BufferAnalysisResult
    message: string
  }> {
    return request.post('/buffer', { center, radius })
  }
}
