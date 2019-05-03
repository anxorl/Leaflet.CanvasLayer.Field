import { max, min } from 'd3-array'
import { Cell } from './Cell'
import { Grid, IGridParams } from './Grid'
import { ScalarGrid } from './ScalarGrid'
import { Vector } from './Vector'

export interface IVectorialGrid extends IGridParams {
    us: number[],
    vs: number[]
}

/**
 *  A set of vectors assigned to a regular 2D-grid (lon-lat)
 *  (e.g. a raster representing winds for a region)
 */
export class VectorialGrid extends Grid<Vector> {

    /**
     * Creates a VectorField from the content of two ScalarField files
     * @param   {ScalarGrid} U - with u-component
     * @param   {ScalarGrid} V - with v-component
     * @returns {VectorField}
     */
    public static fromGrids(U: ScalarGrid, V: ScalarGrid, params?: IGridParams): VectorialGrid {
        const p = params ? { ...params, us: U.zs, vs: V.zs } : VectorialGrid._paramsFromScalarFields(U, V)
        return new VectorialGrid(p)
    }

    /**
     * Creates a VectorField from the content of two ASCIIGrid files
     * @param   {String} ascU - with u-component
     * @param   {String} ascV - with v-component
     * @returns {VectorField}
     */
    /* public static fromASCIIGrids(ascU: string, ascV: string, scaleFactor = 1): VectorialGrid {
        const u = ScalarGrid.fromASCIIGrid(ascU, scaleFactor)
        const v = ScalarGrid.fromASCIIGrid(ascV, scaleFactor)
        const p = VectorialGrid._paramsFromScalarFields(u, v)
        return new VectorialGrid(p)
    } */

    /**
     * Creates a VectorField from the content of two different Geotiff files
     * @param   {ArrayBuffer} gtU - geotiff data with u-component (band 0)
     * @param   {ArrayBuffer} gtV - geotiff data with v-component (band 0)
     * @returns {VectorField}
     */
    /* public static fromGeoTIFFs(gtU: ArrayBuffer, gtV: ArrayBuffer): VectorialGrid {
        const u = ScalarGrid.fromGeoTIFF(gtU)
        const v = ScalarGrid.fromGeoTIFF(gtV)
        const p = VectorialGrid._paramsFromScalarFields(u, v)

        return new VectorialGrid(p)
    } */

    /**
     * Creates a VectorField from the content of Multiband Geotiff
     * @param   {ArrayBuffer} geotiffData - multiband
     * @param   {Array} bandIndexesForUV
     * @returns {VectorField}
     */
    /* public static fromMultibandGeoTIFF(geotiffData: ArrayBuffer, bandIndexesForUV: number[] = [0, 1]): VectorialGrid {
        const u = ScalarGrid.fromGeoTIFF(geotiffData, bandIndexesForUV[0])
        const v = ScalarGrid.fromGeoTIFF(geotiffData, bandIndexesForUV[1])
        const p = VectorialGrid._paramsFromScalarFields(u, v)

        return new VectorialGrid(p)
    } */

    /**
     * Build parameters for VectorField, from 2 ScalarFields.
     * No validation at all (nor interpolation) is applied, so u and v
     * must be 'compatible' from the source
     * @param   {ScalarField} u
     * @param   {ScalarField} v
     * @returns {Object} - parameters to build VectorField
     */
    public static _paramsFromScalarFields(u: ScalarGrid, v: ScalarGrid): IVectorialGrid {
        return {
            cellSize: u.cellSize,
            nCols: u.nCols,
            nRows: u.nRows,
            us: u.zs,
            vs: v.zs,
            xllCorner: u.xllCorner,
            yllCorner: u.yllCorner
        }
    }

    protected grid: Vector[][]
    protected _range: number[]
    protected defGrid: IGridParams

    private vs: number[]
    private us: number[]

    constructor(params: IVectorialGrid) {
        super(params)

        this.us = params.us
        this.vs = params.vs
        this.grid = this._buildGrid()
        this._range = this._calculateRange()
    }

    /**
     * Get a derived field, from a computation on
     * the VectorField
     * @param   {String} type ['magnitude' | 'directionTo' | 'directionFrom']
     * @returns {ScalarField}
     */
    public getScalarField(type: string) {
        const f = this._getFunctionFor(type)
        const p = {
            ...this.defGrid,
            // zs: this._applyOnField(f)
            zs: this.us.map((x, idx) => f(x, this.vs[idx]))
        }
        return new ScalarGrid(p)
    }

    /**
     * Builds a grid with a Vector at each point, from two arrays
     * 'us' and 'vs' following x-ascending & y-descending order
     * (same as in ASCIIGrid)
     * @returns {Array.<Array.<Vector>>} - grid[row][column]--> Vector
     */
    protected _buildGrid(): Vector[][] {
        const grid = this._arraysTo2d(this.us, this.vs, this.nRows, this.nCols, false, true)
        return grid
    }

    /**
     * Calculate min & max values (magnitude)
     * @private
     * @returns {Array}
     */
    protected _calculateRange(): number[] {
        // TODO make a clearer method for getting these vectors...
        let vectors = (this.getCells() as Array<Cell<Vector>>)
            .map<Vector>((pt) => pt.value)
            .filter((v: Vector) => v !== null)

        if (this._inFilter) {
            vectors = vectors.filter(this._inFilter)
        }

        // TODO check memory crash with high num of vectors!
        const magnitudes: number[] = vectors.map<number>((v: Vector) => v.magnitude())
        const _min = min(magnitudes)
        const _max = max(magnitudes)

        return [_min, _max]
    }

    /**
     * Bilinear interpolation for Vector
     * https://en.wikipedia.org/wiki/Bilinear_interpolation
     * @param   {Number} x
     * @param   {Number} y
     * @param   {Number[]} g00
     * @param   {Number[]} g10
     * @param   {Number[]} g01
     * @param   {Number[]} g11
     * @returns {Vector}
     */
    protected _doInterpolation(x: number, y: number, g00: Vector, g10: Vector, g01: Vector, g11: Vector): Vector {
        const rx = 1 - x
        const ry = 1 - y
        const a = rx * ry
        const b = x * ry
        const c = rx * y
        const d = x * y
        const u = g00.u * a + g10.u * b + g01.u * c + g11.u * d
        const v = g00.v * a + g10.v * b + g01.v * c + g11.v * d
        return new Vector(u, v)
    }

    private _getFunctionFor(type: string) {
        return (u: number, v: number) => {
            const uv = new Vector(u, v)
            const fn: { [x: string]: () => number } = {
                directionFrom: uv.directionFrom,
                directionTo: uv.directionTo,
                magnitude: uv.magnitude
            }
            return fn[type].bind(uv)() // magnitude, directionTo, directionFrom
        }
    }

    /* private _applyOnField(func: (u: number, v: number) => number) {
        const zs = []
        const n = this.numCells()
        for (let i = 0; i < n; i++) {
            const u = this.us[i]
            const v = this.vs[i]
            if (this._isValid(u) && this._isValid(v)) {
                zs.push(func(u, v))
            } else {
                zs.push(null)
            }
        }
        return zs
    } */

    // us and vs must to be same x y shape. TO DO: make this not dimension dependant or use ScalarGrid
    private _arraysTo2d(us: number[], vs: number[], nRows: number, nCols: number, reverseX?: boolean, reverseY?: boolean) {
        const grid = []
        let jIndex: number
        let p = 0

        for (let j = 0; j < nRows; j++) {
            const row = []
            for (let i = 0; i < nCols; i++) {
                const u = us[p]
                const v = vs[p]
                const valid = this._isValid(u) && this._isValid(v)
                row[i] = valid ? new Vector(u, v) : null // <<<
                p++
            }
            jIndex = reverseY ? (nRows - 1) - j : j
            grid[jIndex] = reverseX ? row.reverse() : row
        }
        return grid
    }
}