import type { BuildingInfo, PlotInfo } from '@/types'

class RTreeNode {
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
  children: RTreeNode[]
  data: BuildingInfo | PlotInfo | null
  isLeaf: boolean

  constructor(data?: BuildingInfo | PlotInfo) {
    this.bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    this.children = []
    this.data = data || null
    this.isLeaf = !!data
  }

  updateBounds() {
    if (this.isLeaf && this.data) {
      if ('position' in this.data) {
        this.bounds.minX = this.data.position.lng
        this.bounds.minY = this.data.position.lat
        this.bounds.maxX = this.data.position.lng
        this.bounds.maxY = this.data.position.lat
      } else if ('coordinates' in this.data) {
        const coords = this.data.coordinates
        this.bounds.minX = Math.min(...coords.map(c => c[0]))
        this.bounds.minY = Math.min(...coords.map(c => c[1]))
        this.bounds.maxX = Math.max(...coords.map(c => c[0]))
        this.bounds.maxY = Math.max(...coords.map(c => c[1]))
      }
    } else {
      this.bounds = this.children.reduce(
        (acc, child) => ({
          minX: Math.min(acc.minX, child.bounds.minX),
          minY: Math.min(acc.minY, child.bounds.minY),
          maxX: Math.max(acc.maxX, child.bounds.maxX),
          maxY: Math.max(acc.maxY, child.bounds.maxY)
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      )
    }
  }
}

export class SpatialIndex {
  private root: RTreeNode | null = null
  private maxChildren: number = 4

  build(buildings: BuildingInfo[], plots: PlotInfo[]) {
    const allData: (BuildingInfo | PlotInfo)[] = [...buildings, ...plots]
    const leaves = allData.map(data => new RTreeNode(data))
    leaves.forEach(leaf => leaf.updateBounds())
    this.root = this.buildTree(leaves)
  }

  private buildTree(nodes: RTreeNode[]): RTreeNode {
    if (nodes.length <= this.maxChildren) {
      const parent = new RTreeNode()
      parent.children = nodes
      parent.updateBounds()
      return parent
    }

    nodes.sort((a, b) => {
      const aCenterX = (a.bounds.minX + a.bounds.maxX) / 2
      const bCenterX = (b.bounds.minX + b.bounds.maxX) / 2
      return aCenterX - bCenterX
    })

    const mid = Math.ceil(nodes.length / 2)
    const left = this.buildTree(nodes.slice(0, mid))
    const right = this.buildTree(nodes.slice(mid))

    const parent = new RTreeNode()
    parent.children = [left, right]
    parent.updateBounds()
    return parent
  }

  query(rect: { minX: number; minY: number; maxX: number; maxY: number }): (BuildingInfo | PlotInfo)[] {
    const results: (BuildingInfo | PlotInfo)[] = []
    this.queryRecursive(this.root, rect, results)
    return results
  }

  private queryRecursive(
    node: RTreeNode | null,
    rect: { minX: number; minY: number; maxX: number; maxY: number },
    results: (BuildingInfo | PlotInfo)[]
  ) {
    if (!node) return

    if (!this.intersects(node.bounds, rect)) return

    if (node.isLeaf && node.data) {
      results.push(node.data)
      return
    }

    for (const child of node.children) {
      this.queryRecursive(child, rect, results)
    }
  }

  private intersects(
    a: { minX: number; minY: number; maxX: number; maxY: number },
    b: { minX: number; minY: number; maxX: number; maxY: number }
  ): boolean {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
  }

  bufferQuery(center: { lng: number; lat: number }, radius: number): (BuildingInfo | PlotInfo)[] {
    const radiusDeg = radius / 100000
    const rect = {
      minX: center.lng - radiusDeg,
      minY: center.lat - radiusDeg,
      maxX: center.lng + radiusDeg,
      maxY: center.lat + radiusDeg
    }

    const candidates = this.query(rect)
    return candidates.filter(item => {
      let lng: number, lat: number
      if ('position' in item) {
        lng = item.position.lng
        lat = item.position.lat
      } else {
        lng = item.coordinates[0][0]
        lat = item.coordinates[0][1]
      }
      const dist = Math.sqrt(Math.pow(lng - center.lng, 2) + Math.pow(lat - center.lat, 2))
      return dist <= radiusDeg
    })
  }
}

export const spatialIndex = new SpatialIndex()

export class LODManager {
  private lodLevels: Map<number, number> = new Map()
  private currentLevel: number = 0

  constructor() {
    this.lodLevels.set(0, 100000)
    this.lodLevels.set(1, 50000)
    this.lodLevels.set(2, 20000)
    this.lodLevels.set(3, 10000)
    this.lodLevels.set(4, 5000)
  }

  getLODLevel(height: number): number {
    let level = 0
    this.lodLevels.forEach((threshold, l) => {
      if (height < threshold) {
        level = l
      }
    })
    return level
  }

  shouldRender(height: number, distance: number): boolean {
    const level = this.getLODLevel(height)
    const thresholds = [Infinity, 5000, 3000, 1500, 500]
    return distance < thresholds[level]
  }

  getDetailLevel(height: number): 'low' | 'medium' | 'high' | 'ultra' {
    const level = this.getLODLevel(height)
    const details: ('low' | 'medium' | 'high' | 'ultra')[] = ['low', 'low', 'medium', 'high', 'ultra']
    return details[Math.min(level, details.length - 1)]
  }
}

export const lodManager = new LODManager()
