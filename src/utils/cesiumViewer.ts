import * as Cesium from 'cesium'
import type { BaseMapType, PlotInfo, BuildingInfo, RouteResult } from '@/types'

class CesiumViewer {
  private viewer: Cesium.Viewer | null = null
  private plotEntities: Map<string, Cesium.Entity> = new Map()
  private buildingEntities: Map<string, Cesium.Entity> = new Map()
  private roadEntities: Map<string, Cesium.Entity> = new Map()
  private selectionHandler: Cesium.ScreenSpaceEventHandler | null = null
  private drawHandler: Cesium.ScreenSpaceEventHandler | null = null
  private currentDrawing: Cesium.Entity | null = null
  private drawingPositions: Cesium.Cartesian3[] = []
  private routeEntity: Cesium.Entity | null = null
  private bufferEntity: Cesium.Entity | null = null

  init(container: string) {
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc2ODksImlhdCI6MTYyMjE5NDE5MX0.wR5pWx3PnX9sZ8f7e6d5c4b3a2'

    this.viewer = new Cesium.Viewer(container, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider()
    })

    this.initBaseMap('tianditu_img')
    this.flyToBeijing()
    this.initPostEffects()
  }

  private flyToBeijing() {
    if (!this.viewer) return
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(116.3974, 39.9093, 5000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      },
      duration: 2
    })
  }

  private initPostEffects() {
    if (!this.viewer) return
    const scene = this.viewer.scene

    const bloom = new Cesium.BloomEffect({
      enabled: true,
      glowOnly: false,
      threshold: 0.4,
      intensity: 1.5,
      blurStepSize: 1.0
    })
    ;(scene as any).postProcessStages.add(bloom)

    const fog = scene.fog
    fog.enabled = true
    fog.density = 0.0002
  }

  initBaseMap(type: BaseMapType) {
    if (!this.viewer) return

    const imageryLayers = this.viewer.imageryLayers
    while (imageryLayers.length > 0) {
      imageryLayers.remove(imageryLayers.get(0))
    }

    let imageryProvider: Cesium.UrlTemplateImageryProvider

    switch (type) {
      case 'tianditu_img':
        imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=1d109683cd4ab25e8e85436849fa1d7c',
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          credit: new Cesium.Credit('天地图影像')
        })
        break
      case 'tianditu_vec':
        imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=1d109683cd4ab25e8e85436849fa1d7c',
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          credit: new Cesium.Credit('天地图矢量')
        })
        break
      case 'gaode_img':
        imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
          subdomains: ['1', '2', '3', '4'],
          credit: new Cesium.Credit('高德影像')
        })
        break
      case 'gaode_vec':
        imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          subdomains: ['1', '2', '3', '4'],
          credit: new Cesium.Credit('高德矢量')
        })
        break
      default:
        imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=1d109683cd4ab25e8e85436849fa1d7c',
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          credit: new Cesium.Credit('天地图影像')
        })
    }

    imageryLayers.addImageryProvider(imageryProvider)
  }

  enableTerrain(enabled: boolean) {
    if (!this.viewer) return

    if (enabled) {
      this.viewer.terrainProvider = Cesium.createWorldTerrain()
    } else {
      this.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider()
    }
  }

  addPlots(plots: PlotInfo[]) {
    if (!this.viewer) return

    plots.forEach(plot => {
      const hierarchy = Cesium.Cartesian3.fromDegreesArray(
        plot.coordinates.flat()
      )

      const colorMap: Record<string, string> = {
        '商业用地': '#FF6B6B',
        '住宅用地': '#4ECDC4',
        '工业用地': '#45B7D1',
        '公共设施用地': '#96CEB4',
        '绿化用地': '#88D8B0',
        '交通用地': '#FFEAA7'
      }

      const color = colorMap[plot.landUseType] || '#CCCCCC'

      const entity = this.viewer!.entities.add({
        id: plot.id,
        name: plot.name,
        polygon: {
          hierarchy,
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.6),
          outline: true,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          height: plot.elevation
        },
        properties: {
          type: 'plot',
          data: plot
        }
      })

      this.plotEntities.set(plot.id, entity)
    })
  }

  addBuildings(buildings: BuildingInfo[], batchSize: number = 50) {
    if (!this.viewer) return

    const totalPages = Math.ceil(buildings.length / batchSize)

    for (let page = 0; page < totalPages; page++) {
      const batch = buildings.slice(page * batchSize, (page + 1) * batchSize)

      setTimeout(() => {
        batch.forEach(building => {
          const position = Cesium.Cartesian3.fromDegrees(
            building.position.lng,
            building.position.lat,
            0
          )

          const entity = this.viewer!.entities.add({
            id: building.id,
            name: building.name,
            position,
            box: {
              dimensions: new Cesium.Cartesian3(30, 30, building.height),
              material: Cesium.Color.fromRandom({ alpha: 0.8 }),
              outline: true,
              outlineColor: Cesium.Color.WHITE
            },
            properties: {
              type: 'building',
              data: building
            }
          })

          this.buildingEntities.set(building.id, entity)
        })
      }, page * 100)
    }
  }

  setBuildingsVisible(visible: boolean) {
    this.buildingEntities.forEach(entity => {
      if (entity.show !== undefined) {
        entity.show = visible
      }
    })
  }

  setPlotsVisible(visible: boolean) {
    this.plotEntities.forEach(entity => {
      if (entity.show !== undefined) {
        entity.show = visible
      }
    })
  }

  setupPointSelection(callback: (entity: Cesium.Entity | undefined) => void) {
    this.clearSelectionHandler()

    if (!this.viewer) return

    this.selectionHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    this.selectionHandler.setInputAction((movement: any) => {
      const pickedFeature = this.viewer!.scene.pick(movement.position)
      if (Cesium.defined(pickedFeature) && pickedFeature.id) {
        callback(pickedFeature.id)
      } else {
        callback(undefined)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  setupRectangleSelection(callback: (entities: Cesium.Entity[]) => void) {
    this.clearSelectionHandler()
    this.clearDrawHandler()

    if (!this.viewer) return

    this.drawHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    let startPoint: Cesium.Cartesian2 | null = null

    this.drawHandler.setInputAction((movement: any) => {
      startPoint = movement.position
      this.drawingPositions = []
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

    this.drawHandler.setInputAction((movement: any) => {
      if (!startPoint || !this.viewer) return

      const endPoint = movement.endPosition
      const startCartographic = this.viewer.scene.globe.pick(
        this.viewer.camera.getPickRay(startPoint),
        this.viewer.scene
      )
      const endCartographic = this.viewer.scene.globe.pick(
        this.viewer.camera.getPickRay(endPoint),
        this.viewer.scene
      )

      if (startCartographic && endCartographic) {
        const start = Cesium.Cartographic.fromCartesian(startCartographic)
        const end = Cesium.Cartographic.fromCartesian(endCartographic)

        const west = Math.min(start.longitude, end.longitude)
        const east = Math.max(start.longitude, end.longitude)
        const south = Math.min(start.latitude, end.latitude)
        const north = Math.max(start.latitude, end.latitude)

        if (this.currentDrawing) {
          this.viewer.entities.remove(this.currentDrawing)
        }

        this.currentDrawing = this.viewer.entities.add({
          rectangle: {
            coordinates: Cesium.Rectangle.fromRadians(west, south, east, north),
            material: Cesium.Color.YELLOW.withAlpha(0.3),
            outline: true,
            outlineColor: Cesium.Color.YELLOW
          }
        })
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    this.drawHandler.setInputAction(() => {
      if (this.currentDrawing) {
        const selectedEntities: Cesium.Entity[] = []
        this.plotEntities.forEach(entity => {
          selectedEntities.push(entity)
        })
        this.buildingEntities.forEach(entity => {
          selectedEntities.push(entity)
        })
        callback(selectedEntities)

        this.viewer!.entities.remove(this.currentDrawing)
        this.currentDrawing = null
      }
      startPoint = null
    }, Cesium.ScreenSpaceEventType.LEFT_UP)
  }

  setupPolygonSelection(callback: (entities: Cesium.Entity[]) => void) {
    this.clearSelectionHandler()
    this.clearDrawHandler()

    if (!this.viewer) return

    this.drawHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)

    this.drawHandler.setInputAction((movement: any) => {
      const cartographic = this.viewer!.scene.globe.pick(
        this.viewer!.camera.getPickRay(movement.position),
        this.viewer!.scene
      )

      if (cartographic) {
        this.drawingPositions.push(cartographic)

        if (this.currentDrawing) {
          this.viewer!.entities.remove(this.currentDrawing)
        }

        if (this.drawingPositions.length >= 2) {
          this.currentDrawing = this.viewer!.entities.add({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy(this.drawingPositions),
              material: Cesium.Color.YELLOW.withAlpha(0.3),
              outline: true,
              outlineColor: Cesium.Color.YELLOW
            }
          })
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.drawHandler.setInputAction(() => {
      if (this.currentDrawing && this.drawingPositions.length >= 3) {
        const selectedEntities: Cesium.Entity[] = []
        this.plotEntities.forEach(entity => {
          selectedEntities.push(entity)
        })
        this.buildingEntities.forEach(entity => {
          selectedEntities.push(entity)
        })
        callback(selectedEntities)

        this.viewer!.entities.remove(this.currentDrawing)
        this.currentDrawing = null
        this.drawingPositions = []
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  private clearSelectionHandler() {
    if (this.selectionHandler) {
      this.selectionHandler.destroy()
      this.selectionHandler = null
    }
  }

  private clearDrawHandler() {
    if (this.drawHandler) {
      this.drawHandler.destroy()
      this.drawHandler = null
    }
    if (this.currentDrawing && this.viewer) {
      this.viewer.entities.remove(this.currentDrawing)
      this.currentDrawing = null
    }
    this.drawingPositions = []
  }

  clearSelection() {
    this.clearSelectionHandler()
    this.clearDrawHandler()
  }

  showRoute(route: RouteResult) {
    if (!this.viewer) return
    this.clearRoute()

    const positions = Cesium.Cartesian3.fromDegreesArray(
      route.path.flat()
    )

    this.routeEntity = this.viewer.entities.add({
      polyline: {
        positions,
        width: 8,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Cesium.Color.CYAN
        }),
        clampToGround: true
      }
    })

    route.points.forEach((point, index) => {
      this.viewer!.entities.add({
        id: `route_point_${index}`,
        position: Cesium.Cartesian3.fromDegrees(point.lng, point.lat, 50),
        point: {
          pixelSize: 15,
          color: index === 0 ? Cesium.Color.GREEN : index === route.points.length - 1 ? Cesium.Color.RED : Cesium.Color.YELLOW
        },
        label: {
          text: point.name,
          font: '14px sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20)
        }
      })
    })

    this.viewer.flyTo(this.routeEntity)
  }

  clearRoute() {
    if (!this.viewer) return
    if (this.routeEntity) {
      this.viewer.entities.remove(this.routeEntity)
      this.routeEntity = null
    }
    for (let i = 0; i < 10; i++) {
      const entity = this.viewer.entities.getById(`route_point_${i}`)
      if (entity) {
        this.viewer.entities.remove(entity)
      }
    }
  }

  showBuffer(center: { lng: number; lat: number }, radius: number) {
    if (!this.viewer) return
    this.clearBuffer()

    this.bufferEntity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(center.lng, center.lat),
      ellipse: {
        semiMinorAxis: radius,
        semiMajorAxis: radius,
        material: Cesium.Color.BLUE.withAlpha(0.2),
        outline: true,
        outlineColor: Cesium.Color.BLUE,
        outlineWidth: 3
      }
    })

    this.viewer.flyTo(this.bufferEntity)
  }

  clearBuffer() {
    if (!this.viewer) return
    if (this.bufferEntity) {
      this.viewer.entities.remove(this.bufferEntity)
      this.bufferEntity = null
    }
  }

  setPostEffect(effect: string, enabled: boolean) {
    if (!this.viewer) return
    const scene = this.viewer.scene

    switch (effect) {
      case 'bloom':
        scene.postProcessStages.bloom.enabled = enabled
        break
      case 'fog':
        scene.fog.enabled = enabled
        break
      case 'depthOfField':
        break
    }
  }

  getViewer() {
    return this.viewer
  }

  destroy() {
    this.clearSelection()
    this.clearRoute()
    this.clearBuffer()
    if (this.viewer) {
      this.viewer.destroy()
      this.viewer = null
    }
  }
}

export const cesiumViewer = new CesiumViewer()
