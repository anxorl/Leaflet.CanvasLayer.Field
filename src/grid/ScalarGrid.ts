import { max, min } from 'd3-array'
import { Grid, IGridParams } from './Grid'

export interface IScalarGrid extends IGridParams {
    reverseX?: boolean
    reverseY?: boolean
    zs?: number[]
}

/**
 * Scalar Field
 */
export class ScalarGrid extends Grid<number> {

    public static fromData(def: IScalarGrid, datos: Array<{ [x: string]: number }>, nomeVar: string = 'c'): ScalarGrid {
        const values: number[] = datos.map((it: { [x: string]: number }) => it[nomeVar])
        return new ScalarGrid({ ...def, zs: values })
    }

    public static fromArray(def: IScalarGrid, values: number[]): ScalarGrid {
        return new ScalarGrid({ ...def, zs: values })
    }

    private reverseX: boolean
    private reverseY: boolean
    private _zs: number[]

    constructor(params: IScalarGrid) {
        super(params)
        this.reverseX = params.reverseX
        this.reverseY = params.reverseY
        this._zs = params.zs

        this.grid = this._buildGrid()
        this._updateRange()
    }

    public get zs() { return this._zs }

    public updateData(datos: Array<{ [x: string]: number }>, nomeVar: string = 'c') {
        const values: number[] = datos.map((it: { [x: string]: number }) => it[nomeVar])
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
        return this._arrayTo2d(this.zs, this.nRows, this.nCols, this.reverseX, this.reverseY)
    }

    /**
     * Calculate min & max values
     * @private
     * @returns {Array} - [min, max]
     */
    protected _calculateRange(): number[] {
        const data = this._inFilter ? this.zs.filter(this._inFilter) : this.zs
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

    private _arrayTo2d(array: number[], nRows: number, nCols: number, reverseX?: boolean, reverseY?: boolean) {
        const grid = []
        let jIndex: number
        let p = 0
        for (let j = 0; j < nRows; j++) {
            const row = []
            for (let i = 0; i < nCols; i++) {
                const z = array[p]
                row[i] = this._isValid(z) ? z : null // <<<
                p++
            }
            jIndex = reverseY ? (nRows - 1) - j : j
            grid[jIndex] = reverseX ? row.reverse() : row
        }
        return grid
    }
}