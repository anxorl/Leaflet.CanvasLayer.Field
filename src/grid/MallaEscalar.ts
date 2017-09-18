// tslint:disable-next-line:no-reference
// <reference path='../geotiff/geotiff.d.ts'/>

import { max, min } from 'd3-array'
import { IMallaParams, Malla } from './Malla'

// tslint:disable-next-line:no-var-requires
const GeoTIFF = require('geotiff')

export interface IMallaEscalar extends IMallaParams {
    reverseX?: boolean
    reverseY?: boolean
    zs?: number[]
}

/**
 * Scalar Field
 */
export class MallaEscalar extends Malla<number> {

    public static fromData(def: IMallaParams, datos: any, nomeVar: string = 'c'): MallaEscalar {

        const values: number[] = datos.map((it: any) => it[nomeVar])

        const p: IMallaEscalar = def
        p.reverseY = true
        p.zs = values
        return new MallaEscalar(p)

    }
    /**
     * Creates a ScalarField from the content of an ASCIIGrid file
     * @param   {String}   asc
     * @returns {ScalarField}
     */
    public static fromASCIIGrid(asc: string, scaleFactor = 1) {
        // console.time('ScalarField from ASC')

        const lines = asc.split('\n')

        // Header
        MallaEscalar._checkIsValidASCIIGridHeader(lines)

        const n = /-?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/ // any number
        const p: IMallaEscalar = {
            cellSize: { x: parseFloat(lines[4].match(n).toString()), y: parseFloat(lines[4].match(n).toString()) },
            nCols: parseInt(lines[0].match(n).toString(), 10),
            nRows: parseInt(lines[1].match(n).toString(), 10),
            xllCorner: parseFloat(lines[2].match(n).toString()),
            yllCorner: parseFloat(lines[3].match(n).toString()),
        }
        const noDataValue = lines[5]
            .toUpperCase()
            .replace('NODATA_VALUE', '')
            .trim()

        // Data (left-right and top-down)
        const zs: number[] = [] // TODO Consider using TypedArray (& manage NO_DATA)
        for (let i = 6; i < lines.length; i++) {
            const line = lines[i].trim()
            if (line === '') { break }

            const items = line.split(' ')
            const values = items.map((it) => {
                return it !== noDataValue ? parseFloat(it) * scaleFactor : null
            })
            zs.push(...values)
        }
        p.zs = zs

        // console.timeEnd('ScalarField from ASC')
        return new MallaEscalar(p)
    }

    /**
     * Creates a ScalarField from the content of a GeoTIFF file, as read by geotiff.js
     * @param   {ArrayBuffer}   data
     * @param   {Number}   bandIndex
     * @returns {ScalarField}
     */
    public static fromGeoTIFF(data: any, bandIndex = 0) {
        // console.time('ScalarField from GeoTIFF')

        const tiff = GeoTIFF.parse(data) // geotiff.js
        const image = tiff.getImage()
        const rasters = image.readRasters()
        const tiepoint = image.getTiePoints()[0]
        const fileDirectory = image.getFileDirectory()
        const pixelScale = fileDirectory.ModelPixelScale

        // Check "Not supported raster"
        const [xScale, yScale] = pixelScale
        if (xScale !== yScale) {
            throw new Error(`GeoTIFF with different scale in x: ${xScale} y: ${yScale} is not currently supported
            \nMake sure the difference is just a floating precission issue`)
        }

        let _zs = rasters[bandIndex] // left-right and top-down order

        if (fileDirectory.GDAL_NODATA) {
            const noData = parseFloat(fileDirectory.GDAL_NODATA)
            // console.log(noData)
            const simpleZS = Array.from(_zs) // to simple array, so null is allowed | TODO efficiency??
            _zs = simpleZS.map((z) => {
                return z === noData ? null : z
            })
        }

        const p = {
            cellSize: pixelScale[0],
            nCols: image.getWidth(),
            nRows: image.getHeight(),
            xllCorner: tiepoint.x,
            yllCorner: tiepoint.y - image.getHeight() * pixelScale[0],
            zs: _zs
        }

        // console.timeEnd('ScalarField from GeoTIFF')
        return new MallaEscalar(p)
    }

    private static _checkIsValidASCIIGridHeader(lines: string[]) {
        const upperCasesLines = lines.map((lin) => lin.toUpperCase())

        const parameters = [
            'NCOLS',
            'NROWS',
            'XLLCORNER',
            'YLLCORNER',
            'CELLSIZE',
            'NODATA_VALUE'
        ]

        let i = 0
        for (const expected of parameters) {
            const line = upperCasesLines[i]
            const found = line.indexOf(expected) !== -1
            if (!found) {
                throw new Error(`Not valid ASCIIGrid: expected '${expected}' at line '${line}' [lin. nº ${i}]`)
            }
            i++
        }
    }

    private reverseX: boolean
    private reverseY: boolean
    private _zs: number[]

    constructor(params: any) {
        super(params)
        this.reverseX = params.reverseX
        this.reverseY = params.reverseY
        this._zs = params.zs

        this.grid = this._buildGrid()
        this._updateRange()
        // console.log(`ScalarField created (${this.nCols} x ${this.nRows})`)
    }

    public get zs() { return this._zs }

    public updateData(datos: any, nomeVar: string) {
        const values: number[] = datos.map((it: any) => it[nomeVar])
        this._zs = values
        this.grid = this._buildGrid()
        this._updateRange()
    }

    /**
     * Builds a grid with a Number at each point, from an array
     * 'zs' following x-ascending & y-descending order
     * (same as in ASCIIGrid)
     * @private
     * @returns {Array.<Array.<Number>>} - grid[row][column]--> Number
     */
    protected _buildGrid() {
        const grid = this._arrayTo2d(this.zs, this.nRows, this.nCols, this.reverseX, this.reverseY)
        return grid
    }

    /**
     * Calculate min & max values
     * @private
     * @returns {Array} - [min, max]
     */
    protected _calculateRange(): number[] {
        let data: number[] = this.zs
        if (this._inFilter) {
            data = data.filter(this._inFilter)
        }
        return [min(data), max(data)]
    }

    /**
     * Bilinear interpolation for Number
     * https://en.wikipedia.org/wiki/Bilinear_interpolation
     * @param   {Number} x
     * @param   {Number} y
     * @param   {Number} g00
     * @param   {Number} g10
     * @param   {Number} g01
     * @param   {Number} g11
     * @returns {Number}
     */
    protected _doInterpolation(x: number, y: number, g00: number, g10: number, g01: number, g11: number): number {
        const rx = 1 - x
        const ry = 1 - y
        return g00 * rx * ry + g10 * x * ry + g01 * rx * y + g11 * x * y
    }

    private _arrayTo2d(array: any, nRows: number, nCols: number, reverseX?: boolean, reverseY?: boolean) {
        const grid = []
        let jIndex: number
        let p = 0
        for (let j = 0; j < nRows; j++) {
            const row = []
            for (let i = 0; i < nCols; i++ , p++) {
                const z = array[p]
                row[i] = this._isValid(z) ? z : null // <<<
            }
            jIndex = reverseY ? nRows - j : j
            grid[jIndex] = reverseX ? row.reverse() : row
        }
        return grid
    }
}