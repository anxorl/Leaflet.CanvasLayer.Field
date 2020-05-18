import { LatLng, LatLngBounds } from 'leaflet'
import * as proj4_ from 'proj4'
// tslint:disable-next-line: no-string-literal
const proj4 = 'default' in proj4_ ? proj4_['default'] : proj4_
import { Cell, ISizeCell } from './Cell'
import { Vector } from './Vector'

export interface IPolarParams {
  cellSize: ISizeCell
  x0: number
  y0: number
  r0: number
  dr: number
  lambda0: number
  dlambda: number
  nRBins: number
  nAngles: number
  projection?: string
  rlength?: number
}

/**
 *  Abstract class for a set of values (Vector | Scalar)
 *  assigned to a regular 2D-grid (lon-lat), aka 'a Raster source'
 */
export abstract class Polar<T extends number | Vector> {
  // export abstract class Grid<T extends number | Vector> extends Array<Array<Cell<T>>> {

  public get cellSize() { return this.defGrid.cellSize }
  public get nCols() { return this.defGrid.nRBins }
  public get nRows() { return this.defGrid.nAngles }

  public get centerLL() { return [this.defGrid.x0, this.defGrid.y0] }
  public get center() { return this.projection.forward([this.defGrid.x0, this.defGrid.y0]) }

  // Esquinas en ll (Usar as de params.def para obter as proxectadas)
  public get xllCornerLL() {
    const rLength = this.defGrid.r0 + this.defGrid.dr * this.defGrid.nRBins
    return this.projection.inverse([
      this.center[0] - rLength,
      this.center[1] - rLength])[0]
  }
  public get yllCornerLL() {
    const rLength = this.defGrid.r0 + this.defGrid.dr * this.defGrid.nRBins
    return this.projection.inverse([
      this.center[0] - rLength,
      this.center[1] - rLength])[1]
  }

  // corresponding corners in ll
  public get xurCornerLL() {
    const rLength = this.defGrid.r0 + this.defGrid.dr * this.defGrid.nRBins
    return this.projection.inverse([
      this.center[0] + rLength,
      this.center[1] + rLength])[0]
  }
  public get yurCornerLL() {
    const rLength = this.defGrid.r0 + this.defGrid.dr * this.defGrid.nRBins
    return this.projection.inverse([
      this.center[0] + rLength,
      this.center[1] + rLength])[1]
  }

  public get range() { return this._range }

  // alias
  public get height() { return this.nRows }
  public get width() { return this.nCols }
  public isContinuous: boolean
  public _inFilter: (e: T) => boolean

  protected grid: T[][]
  protected defGrid: IPolarParams
  protected _range: number[]

  protected projection: proj4.Converter

  constructor(params: IPolarParams) {
    this.defGrid = params
    this.defGrid.rlength = this.defGrid.rlength
      || this.defGrid.r0 + this.defGrid.dr * this.defGrid.nRBins

    this.projection = proj4('+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees',
      this.defGrid.projection
        ? this.defGrid.projection
        : '+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees')

    this.grid = null // to be defined by subclasses

    this._inFilter = null

    // this.defGrid.lambda0 = (450 - this.defGrid.lambda0) % 360
  }

  /**
   * Number of cells in the grid (rows * cols)
   * @returns {Number}
   */
  public numCells(): number { return this.defGrid.nRBins * this.defGrid.nAngles }

  /**
   * Grid bounds in Latitude - Longitude
   * @returns {LatLngBounds}
   */
  public getBounds(): LatLngBounds {
    return new LatLngBounds([
      [this.yllCornerLL, this.xllCornerLL],
      [this.yurCornerLL, this.xurCornerLL]
    ])
  }

  /**
   * A list with every cell
   * @returns {Array<Cell>} - cells (x-ascending & y-descending order)
   */
  public getCells(stride = 1): Array<Cell<T>> {
    const cells: Array<Cell<T>> = []
    for (let j = 0; j < this.defGrid.nAngles; j = j + stride) {
      for (let i = 0; i < this.defGrid.nRBins; i = i + stride) {
        const [lon, lat] = this.lonLatAtIndexes(i, j)
        const center = new LatLng(lat, lon)
        const value = this._valueAtIndexes(i, j)
        const c = new Cell<T>(center, value, this.defGrid.cellSize)
        cells.push(c) // <<
      }
    }
    return cells
  }

  /**
   * Apply a filter function to field values
   * @param   {Function} f - boolean function
   */
  public setFilter(f: (e: T) => boolean): void {
    this._inFilter = f
    this._updateRange()
  }

  /**
   * Grid extent in projected coordinates
   * @returns {Number[]} [xmin, ymin, xmax, ymax]
   */
  public extent(): number[] {
    const rLength = this.defGrid.r0 + this.defGrid.dr * this.defGrid.nRBins
    const [xmin, xmax] = [this.defGrid.x0 - rLength, this.center[0] + rLength]
    const [ymin, ymax] = [this.defGrid.y0 - rLength, this.center[1] + rLength]
    return [xmin, ymin, xmax, ymax]
  }

  /**
   * Grid extent in geographic coordinates
   * @returns {Number[]} [lonmin, latmin, lonmax, latmax]
   */
  public llextent(): number[] {
    const ext = this.extent()
    const sw = this.projection.inverse([ext[0], ext[1]])
    const ne = this.projection.inverse([ext[2], ext[3]])
    return [...sw, ...ne]
  }

  /**
   * Returns whether or not the grid contains the point
   * @param   {Number} lon - longitude
   * @param   {Number} lat - latitude
   * @returns {Boolean}
   */
  public contains(lo: number, la: number): boolean {

    const distance = this._getDistance(lo, la)
    const angle = this._getAngle(lo, la)

    return distance >= this.defGrid.r0 && distance <= this.defGrid.rlength
      && angle - this.defGrid.lambda0 + 360 >= 0
      && (angle - this.defGrid.lambda0 + 360) % 360 <= this.defGrid.nAngles * this.defGrid.dlambda
  }

  /**
   * Nearest value at lon-lat coordinates
   * @param   {Number} longitude
   * @param   {Number} latitude
   * @returns {Vector|Number}
   */
  public valueAt(lon: number, lat: number): T {
    if (!this.contains(lon, lat)) { return null }

    const [i, j] = this._getDecimalIndexes(lon, lat)
    const ii = Math.floor(i)
    const jj = Math.floor(j)

    const value = this._valueAtIndexes(ii, jj)
    if (this._inFilter) {
      if (!this._inFilter(value)) { return null }
    }
    return value
  }

  /**
   * Returns if the grid doesn't contain the point
   * @param   {Number} lon - longitude
   * @param   {Number} lat - latitude
   * @returns {Boolean}
   */
  /* public notContains(lon: number, lat: number): boolean {
      return !this.contains(lon, lat)
  } */

  /**
   * Interpolated value at lon-lat coordinates (bilinear method)
   * @param   {Number} longitude
   * @param   {Number} latitude
   * @returns {Vector|Number} [u, v, magnitude]
   * Source: https://github.com/cambecc/earth > product.js
   */
  public interpolatedValueAt(lon: number, lat: number): T {
    if (!this.contains(lon, lat)) { return null }

    const [i, j] = this._getDecimalIndexes(lon, lat)
    return this.interpolatedValueAtIndexes(i, j)
  }

  /**
   * Interpolated value at i-j indexes (bilinear method)
   * @param   {Number} i
   * @param   {Number} j
   * @returns {Vector|Number} [u, v, magnitude]
   *
   * Source: https://github.com/cambecc/earth > product.js
   */
  public interpolatedValueAtIndexes(i: number, j: number): T {
    //         1      2           After converting λ and φ to fractional grid indexes i and j, we find the
    //        fi  i   ci          four points 'G' that enclose point (i, j). These points are at the four
    //         | =1.4 |           corners specified by the floor and ceiling of i and j. For example, given
    //      ---G--|---G--- fj 8   i = 1.4 and j = 8.3, the four surrounding grid points are (1, 8), (2, 8),
    //    j ___|_ .   |           (1, 9) and (2, 9).
    //  =8.3   |      |
    //      ---G------G--- cj 9   Note that for wrapped grids, the first column is duplicated as the last
    //         |      |           column, so the index ci can be used without taking a modulo.

    const indexes = this._getFourSurroundingIndexes(i, j)
    const [fi, ci, fj, cj] = indexes
    const values = this._getFourSurroundingValues(fi, ci, fj, cj)
    if (values) {
      const [g00, g10, g01, g11] = values
      return this._doInterpolation(i - fi, j - fj, g00, g10, g01, g11)
    }
    return null
  }

  /**
   * Returns whether or not the field has a value at the point
   * @param   {Number} lon - longitude
   * @param   {Number} lat - latitude
   * @returns {Boolean}
   */
  public hasValueAt(lon: number, lat: number): boolean {
    const value = this.valueAt(lon, lat)
    const hasValue = value !== null

    let included = true
    if (this._inFilter) {
      included = this._inFilter(value)
    }
    return hasValue && included
  }

  /**
   * Gives a random position to 'o' inside the grid
   * @param {Object} [o] - an object (eg. a particle)
   * @returns {{x: Number, y: Number}} - object with x, y (lon, lat)
   */
  public randomPosition(o?: { x: number, y: number }): { x: number, y: number } {
    const i = (Math.random() * this.defGrid.nAngles) || 0
    const j = (Math.random() * this.defGrid.nRBins) || 0
    const res: { x: number, y: number } = { x: 0, y: 0 }
    const [x, y] = this.lonLatAtIndexes(i, j)
    res.x = x
    res.y = y

    if (o) {
      o.x = res.x
      o.y = res.y
    }
    return res
  }
  /**
   * Gives a random position to 'o' inside the grid
   * @param {Object} [o] - an object (eg. a particle)
   * @returns {{x: Number, y: Number}} - object with x, y (lon, lat)
   */
  public randomLLPosition(o?: { x: number, y: number }): { x: number, y: number } {
    const res = this.randomPosition(o)
    const ll = this.projection.inverse(res)
    if (o) {
      o.x = ll.x
      o.y = ll.y
    }
    return ll
  }

  /**
   * Lon-Lat for grid indexes
   * @param   {Number} i - column index (integer)
   * @param   {Number} j - row index (integer)
   * @returns {Number[]} [lon, lat]
   */
  public lonLatAtIndexes(i: number, j: number): number[] {
    const lon = this.center[0] + j * Math.sin(i)
    const lat = this.center[1] + j * Math.cos(i)

    return this.projection.inverse([lon, lat])
  }

  /**
   * Builds a grid with a value at each point (either Vector or Number)
   * Original params must include the required input values, following
   * x-ascending & y-descending order (same as in ASCIIGrid)
   * @abstract
   * @private
   * @returns {Array.<Array.<Vector|Number>>} - grid[row][column]--> Vector|Number
   */
  protected abstract _buildGrid(): T[][]
  protected abstract _calculateRange(): number[]
  /**
   * Apply the interpolation
   * @abstract
   * @private
   */
  protected abstract _doInterpolation(x: number, y: number, g00: T, g10: T, g01: T, g11: T): T

  protected _updateRange(): void {
    this._range = this._calculateRange()
  }

  /**
   * Is valid (not 'null' nor 'undefined')
   * @private
   * @param   {Object} x object
   * @returns {Boolean}
   */
  protected _isValid(x: any): boolean {
    return x !== null && x !== undefined
  }

  /**
   * Return the meteorologicar 'to' angle between
   * [lo,la] and the center of the polar grid.
   *
   * @param lo  {number} Longitude in degrees
   * @param la  {number} Latitude in degrees
   * @returns {number}
   */
  protected _getAngle(lo: number, la: number) {

    const [lon, lat] = this.projection.forward([lo, la])
    const [dx, dy] = [lon - this.center[0], lat - this.center[1]]

    const angle = Math.atan2(dx, dy) * 180 / Math.PI

    const UTMCenterMeridian = this.projection.inverse([500000, 0])[0]
    const angleCorrection = Math.atan(Math.tan(
      this.defGrid.x0 - (UTMCenterMeridian)) * Math.sin(this.defGrid.y0))

    return angle - angleCorrection
  }

  /**
   * Distance from [lo, la] to teh center of the polar grid
   *
   * @param lo  {number} Longitude in degrees
   * @param la  {number} Latitude in degrees
   * @returns {number}
   */
  protected _getDistance(lo: number, la: number) {
    const [lon, lat] = this.projection.forward([lo, la])
    const [dx, dy] = [lon - this.center[0], lat - this.center[1]]

    return Math.sqrt(dx * dx + dy * dy)

  }

  /**
   * Get decimal indexes, clampling on borders
   * @private
   * @param {Number} lon
   * @param {Number} lat
   * @returns {Array}    [[Description]]
   */
  private _getDecimalIndexes(lon: number, lat: number): number[] {
    const punto = this.projection.forward([lon, lat])

    const distanceX = punto[0] - this.center[0]
    const distanceY = punto[1] - this.center[1]
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)

    let angle = Math.atan2(distanceX, distanceY) * 180 / Math.PI
    angle = angle - Math.atan(Math.tan(this.defGrid.x0 - (-3)) * Math.sin(this.defGrid.y0))

    const ii = (distance - this.defGrid.r0) / this.defGrid.dr
    const i = this._clampRowIndex(ii)

    const jj = angle + 360 - this.defGrid.lambda0 / this.defGrid.dlambda
    const j = this._clampColumnIndex(jj)

    return [i, j]
  }

  /**
   * Get surrounding indexes (integer), clampling on borders
   * @private
   * @param   {Number} i - decimal index
   * @param   {Number} j - decimal index
   * @returns {Array} [fi, ci, fj, cj]
   */
  private _getFourSurroundingIndexes(i: number, j: number): number[] {
    const fi = this._clampColumnIndex(Math.floor(i))
    const ci = this._clampColumnIndex(fi + 1)
    const fj = this._clampRowIndex(Math.floor(j))
    const cj = this._clampRowIndex(fj + 1)
    return [fi, ci, fj, cj]
  }

  /**
   * Get four surrounding values or null if not available,
   * from 4 integer indexes
   * @private
   * @param   {Number} fi
   * @param   {Number} ci
   * @param   {Number} fj
   * @param   {Number} cj
   * @returns {Array}
   */
  private _getFourSurroundingValues(fi: number, ci: number, fj: number, cj: number): T[] {
    let row = this.grid[fj]
    if (row) {
      // upper row ^^
      const g00 = row[fi] // << left
      const g10 = row[ci] // right >>
      row = this.grid[cj]
      if (
        this._isValid(g00) &&
        this._isValid(g10) &&
        row
      ) {
        // lower row vv
        const g01 = row[fi] // << left
        const g11 = row[ci] // right >>
        if (this._isValid(g01) && this._isValid(g11)) {
          return [g00, g10, g01, g11] // 4 values found!
        }
      }
    }
    return null
  }

  /**
   * Value for grid indexes
   * @param   {Number} i - column index (integer)
   * @param   {Number} j - row index (integer)
   * @returns {Vector|Number}
   */
  private _valueAtIndexes(i: number, j: number): T {
    return this.grid[j][i] // <-- j,i !!
  }

  /**
   * Longitude for grid-index
   * @param   {Number} i - column index (integer)
   * @returns {Number} longitude at the center of the cell
   */
  /* private _longitudeAtX(i: number): number {
    const halfPixel = this.defGrid.cellSize.x / 2.0
    let lon = this.defGrid.xllCorner + halfPixel + i * this.defGrid.cellSize.x
    // if (this.longitudeNeedsToBeWrapped) {
    lon = lon > 180 ? lon - 360 : lon
    // }
    return lon
  } */

  /**
   * Latitude for grid-index
   * @param   {Number} j - row index (integer)
   * @returns {Number} latitude at the center of the cell
   */
  /* private _latitudeAtY(j: number): number {
    const halfPixel = this.defGrid.cellSize.y / 2.0
    return this.defGrid.yurCorner - halfPixel - j * this.defGrid.cellSize.y
  } */

  /**
   * Check the column index is inside the field,
   * adjusting to min or max when needed
   * @private
   * @param   {Number} ii - index
   * @returns {Number} i - inside the allowed indexes
   */
  private _clampColumnIndex(ii: number): number {
    let i = ii
    if (ii < 0) {
      i = 0
    }
    const maxCol = this.defGrid.nAngles - 1
    if (ii > maxCol) {
      i = this.isContinuous ? 0 : maxCol // duplicate first column when raster is continuous
    }
    return i
  }

  /**
   * Check the row index is inside the field,
   * adjusting to min or max when needed
   * @private
   * @param   {Number} jj index
   * @returns {Number} j - inside the allowed indexes
   */
  private _clampRowIndex(jj: number): number {
    let j = jj
    if (jj < 0) {
      j = 0
    }
    const maxRow = this.defGrid.nRBins - 1
    if (jj > maxRow) {
      j = maxRow
    }
    return j
  }
}