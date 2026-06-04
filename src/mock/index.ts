import Mock from 'mockjs'
import type { PlotInfo, BuildingInfo, RoadNetwork, RouteResult, BufferAnalysisResult } from '@/types'

const centerLng = 116.3974
const centerLat = 39.9093

function generatePlotData(): PlotInfo[] {
  const plots: PlotInfo[] = []
  const landUseTypes = ['商业用地', '住宅用地', '工业用地', '公共设施用地', '绿化用地', '交通用地']
  const levels = ['一级', '二级', '三级', '四级']
  const owners = ['国土局', '城投集团', '开发区管委会', '私人企业', '国有企业']

  for (let i = 0; i < 50; i++) {
    const baseLng = centerLng + (Math.random() - 0.5) * 0.1
    const baseLat = centerLat + (Math.random() - 0.5) * 0.1
    const size = 0.002 + Math.random() * 0.005

    plots.push({
      id: `plot_${i + 1}`,
      name: `地块${i + 1}`,
      owner: owners[Math.floor(Math.random() * owners.length)],
      landUseType: landUseTypes[Math.floor(Math.random() * landUseTypes.length)],
      area: Math.floor(5000 + Math.random() * 50000),
      coordinates: [
        [baseLng, baseLat],
        [baseLng + size, baseLat],
        [baseLng + size, baseLat + size * 0.8],
        [baseLng, baseLat + size * 0.8],
        [baseLng, baseLat]
      ],
      elevation: Math.floor(20 + Math.random() * 80),
      level: levels[Math.floor(Math.random() * levels.length)],
      description: "地块位于城市中心区域",
      createTime: Mock.Random.date('yyyy-MM-dd')
    })
  }
  return plots
}

function generateBuildingData(): BuildingInfo[] {
  const buildings: BuildingInfo[] = []
  const types = ['办公楼', '商业楼', '住宅楼', '综合体', '医院', '学校']

  for (let i = 0; i < 100; i++) {
    const baseLng = centerLng + (Math.random() - 0.5) * 0.1
    const baseLat = centerLat + (Math.random() - 0.5) * 0.1
    const floors = Math.floor(5 + Math.random() * 50)

    buildings.push({
      id: `building_${i + 1}`,
      name: `${['国贸', '金融', '科技', '商务', '世纪', '万达'][Math.floor(Math.random() * 6)]}${['大厦', '中心', '广场', '楼'][Math.floor(Math.random() * 4)]}`,
      address: Mock.Random.province() + Mock.Random.city() + Mock.Random.county() + `${['长安', '建国', '和平', '人民', '中山'][Math.floor(Math.random() * 5)]}街${Math.floor(Math.random() * 100)}号`,
      floors,
      height: floors * 3.5,
      area: Math.floor(1000 + Math.random() * 50000),
      buildYear: Math.floor(1990 + Math.random() * 34),
      type: types[Math.floor(Math.random() * types.length)],
      position: {
        lng: baseLng,
        lat: baseLat,
        height: 0
      }
    })
  }
  return buildings
}

function generateRoadData(): RoadNetwork[] {
  const roads: RoadNetwork[] = []
  const types = ['主干道', '次干道', '支路', '快速路']

  for (let i = 0; i < 30; i++) {
    const baseLng = centerLng + (Math.random() - 0.5) * 0.1
    const baseLat = centerLat + (Math.random() - 0.5) * 0.1
    const coordinates: number[][] = []
    const points = 5 + Math.floor(Math.random() * 10)

    for (let j = 0; j < points; j++) {
      coordinates.push([
        baseLng + j * 0.002 + (Math.random() - 0.5) * 0.001,
        baseLat + (Math.random() - 0.5) * 0.002
      ])
    }

    roads.push({
      id: `road_${i + 1}`,
      name: `${['长安', '建国', '和平', '人民', '中山', '新华'][Math.floor(Math.random() * 6)]}${['大街', '路', '街', '大道'][Math.floor(Math.random() * 4)]}`,
      type: types[Math.floor(Math.random() * types.length)],
      lanes: Math.floor(2 + Math.random() * 6),
      speedLimit: [40, 50, 60, 80][Math.floor(Math.random() * 4)],
      coordinates
    })
  }
  return roads
}

const mockPlots = generatePlotData()
const mockBuildings = generateBuildingData()
const mockRoads = generateRoadData()

Mock.mock('/api/plots', 'get', () => {
  return {
    code: 200,
    data: mockPlots,
    message: 'success'
  }
})

Mock.mock(/\/api\/plot\/.+/, 'get', (options) => {
  const id = options.url.split('/').pop()
  const plot = mockPlots.find(p => p.id === id)
  return {
    code: 200,
    data: plot,
    message: 'success'
  }
})

Mock.mock('/api/buildings', 'get', () => {
  return {
    code: 200,
    data: mockBuildings,
    message: 'success'
  }
})

Mock.mock('/api/roads', 'get', () => {
  return {
    code: 200,
    data: mockRoads,
    message: 'success'
  }
})

Mock.mock('/api/route', 'post', (options) => {
  const body = JSON.parse(options.body)
  const { start, end } = body

  const path: number[][] = []
  const points = 10 + Math.floor(Math.random() * 10)
  for (let i = 0; i <= points; i++) {
    const t = i / points
    path.push([
      start.lng + (end.lng - start.lng) * t + (Math.random() - 0.5) * 0.002,
      start.lat + (end.lat - start.lat) * t + (Math.random() - 0.5) * 0.002
    ])
  }

  const routePoints = [
    { lng: start.lng, lat: start.lat, name: '起点', order: 0 },
    { lng: path[Math.floor(points / 2)][0], lat: path[Math.floor(points / 2)][1], name: '途经点', order: 1 },
    { lng: end.lng, lat: end.lat, name: '终点', order: 2 }
  ]

  const result: RouteResult = {
    distance: Math.floor(5000 + Math.random() * 15000),
    duration: Math.floor(600 + Math.random() * 1800),
    points: routePoints,
    path
  }

  return {
    code: 200,
    data: result,
    message: 'success'
  }
})

Mock.mock('/api/buffer', 'post', (options) => {
  const body = JSON.parse(options.body)
  const { center, radius } = body

  const result: BufferAnalysisResult = {
    center,
    radius,
    plots: mockPlots.filter(p => {
      const [lng, lat] = p.coordinates[0]
      const dist = Math.sqrt(Math.pow(lng - center.lng, 2) + Math.pow(lat - center.lat, 2))
      return dist < radius / 100000
    }),
    buildings: mockBuildings.filter(b => {
      const dist = Math.sqrt(Math.pow(b.position.lng - center.lng, 2) + Math.pow(b.position.lat - center.lat, 2))
      return dist < radius / 100000
    }),
    roads: mockRoads.filter(r => {
      const [lng, lat] = r.coordinates[0]
      const dist = Math.sqrt(Math.pow(lng - center.lng, 2) + Math.pow(lat - center.lat, 2))
      return dist < radius / 100000
    })
  }

  return {
    code: 200,
    data: result,
    message: 'success'
  }
})

Mock.mock('/api/buildings/batch', 'post', (options) => {
  const body = JSON.parse(options.body)
  const { page, pageSize } = body
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    code: 200,
    data: {
      list: mockBuildings.slice(start, end),
      total: mockBuildings.length,
      page,
      pageSize
    },
    message: 'success'
  }
})

export default Mock
