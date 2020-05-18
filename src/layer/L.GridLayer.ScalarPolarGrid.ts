
import { Coords, Point } from 'leaflet'
import { ScalarPolarGrid } from '../grid/ScalarPolarGrid'
import { ITropGridLayerOptions, TropGridLayer } from './L.GridLayer.ScalarGrid'

export class TropPolarGridLayer extends TropGridLayer {

  protected _grid: ScalarPolarGrid

  constructor(datos: ScalarPolarGrid, ops?: ITropGridLayerOptions) {
    super(datos, ops)
    this._grid = datos
  }

  /**
   * Prepares the image in data, as array with RGBAs
   * [R1, G1, B1, A1, R2, G2, B2, A2...]
   * private
   * param {[[Type]]} data   [[RGBA vector]]
   * param {Number} width
   * param {Number} height
   */
  protected _prepareImageIn(data: Uint8ClampedArray, coords: Coords, size: Point, overstep?: number) {
    if (!this._map) { return }
    const scaledCoords = coords.scaleBy(this.getTileSize())
    const i0 = scaledCoords.x
    const j0 = scaledCoords.y
    const step = overstep || this.options.pixelStep
    const w4 = 4 * size.x
    const interpFunc = (this.options.interpolate ? this._grid.interpolatedValueAt : this._grid.valueAt).bind(this._grid)

    for (let j = 0; j < size.y; j += step) {
      const pj = j + j0
      for (let i = 0; i < size.x; i += step) {
        const pi = i + i0

        const pointCoords = this._map.unproject([pi, pj], coords.z)
        const xp = pointCoords.lng
        const yp = pointCoords.lat
        // const r = Math.sqrt((xp - xp0) * (xp - xp0) + (yp - yp0) * (yp - yp0))
        // const lambda = Math.atan2((yp - yp0), (xp - xp0)) * 180 / Math.PI

        const v: number = interpFunc(xp, yp) // 'valueAt' | 'interpolatedValueAt'
        this.doRGB(data, v, step, i, j, size, w4)

      }
    }
  }

  private doRGB(
    data: Uint8ClampedArray,
    v: number,
    step: number,
    i: number,
    j: number,
    size: any,
    w4: number) {
    if (v !== null && (this.options.pintarMinimos || v >= this.options.domain[0])) {
      const pos0 = 4 * (j * size.x + i)
      const [R, G, B, A] = this.options.color(v).rgba() // this._getColorFor(v)
      for (let sx = 0; sx < step && sx + i < size.x; sx++) {
        const pos1 = pos0 + 4 * sx
        for (let sy = 0; sy < step && j + sy < size.y; sy++) {
          const pos = pos1 + w4 * sy
          data[pos] = R
          data[pos + 1] = G
          data[pos + 2] = B
          data[pos + 3] = Math.floor(A * 255) // not percent in alpha but hex 0-255
        }
      }
    }
  }
}
