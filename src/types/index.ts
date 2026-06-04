export interface PlotInfo {
  id: string
  name: string
  owner: string
  landUseType: string
  area: number
  coordinates: number[][]
  elevation: number
  level: string
  description: string
  createTime: string
}

export interface BuildingInfo {
  id: string
  name: string
  address: string
  floors: number
  height: number
  area: number
  buildYear: number
  type: string
  position: {
    lng: number
    lat: number
    height: number
  }
}

export interface RoadNetwork {
  id: string
  name: string
  type: string
  lanes: number
  speedLimit: number
  coordinates: number[][]
}

export interface RoutePoint {
  lng: number
  lat: number
  name: string
  order: number
}

export interface RouteResult {
  distance: number
  duration: number
  points: RoutePoint[]
  path: number[][]
}

export interface BufferAnalysisResult {
  center: { lng: number; lat: number }
  radius: number
  plots: PlotInfo[]
  buildings: BuildingInfo[]
  roads: RoadNetwork[]
}

export type BaseMapType = 'tianditu_img' | 'tianditu_vec' | 'gaode_img' | 'gaode_vec'

export interface MapState {
  currentBaseMap: BaseMapType
  terrainEnabled: boolean
  buildingsVisible: boolean
  plotsVisible: boolean
  postEffects: {
    bloom: boolean
    fog: boolean
    depthOfField: boolean
  }
}
