import { IMallaParams, Malla } from './Malla';
import { MallaEscalar } from './MallaEscalar';
import { Vector } from './Vector';
export interface IMallaVectorialParams extends IMallaParams {
    us: number[];
    vs: number[];
}
/**
 *  A set of vectors assigned to a regular 2D-grid (lon-lat)
 *  (e.g. a raster representing winds for a region)
 */
export declare class MallaVectorial extends Malla<Vector> {
    static fromMallas(U: MallaEscalar, V: MallaEscalar): MallaVectorial;
    /**
     * Creates a VectorField from the content of two ASCIIGrid files
     * @param   {String} ascU - with u-component
     * @param   {String} ascV - with v-component
     * @returns {VectorField}
     */
    static fromASCIIGrids(ascU: string, ascV: string, scaleFactor?: number): MallaVectorial;
    /**
     * Creates a VectorField from the content of two different Geotiff files
     * @param   {ArrayBuffer} gtU - geotiff data with u-component (band 0)
     * @param   {ArrayBuffer} gtV - geotiff data with v-component (band 0)
     * @returns {VectorField}
     */
    static fromGeoTIFFs(gtU: ArrayBuffer, gtV: ArrayBuffer): MallaVectorial;
    /**
     * Creates a VectorField from the content of Multiband Geotiff
     * @param   {ArrayBuffer} geotiffData - multiband
     * @param   {Array} bandIndexesForUV
     * @returns {VectorField}
     */
    static fromMultibandGeoTIFF(geotiffData: ArrayBuffer, bandIndexesForUV?: number[]): MallaVectorial;
    /**
     * Build parameters for VectorField, from 2 ScalarFields.
     * No validation at all (nor interpolation) is applied, so u and v
     * must be 'compatible' from the source
     * @param   {ScalarField} u
     * @param   {ScalarField} v
     * @returns {Object} - parameters to build VectorField
     */
    static _paramsFromScalarFields(u: MallaEscalar, v: MallaEscalar): IMallaVectorialParams;
    protected grid: any[][];
    protected _range: number[];
    protected defMalla: any;
    private vs;
    private us;
    constructor(params: any);
    /**
     * Get a derived field, from a computation on
     * the VectorField
     * @param   {String} type ['magnitude' | 'directionTo' | 'directionFrom']
     * @returns {ScalarField}
     */
    getScalarField(type: string): MallaEscalar;
    /**
     * Builds a grid with a Vector at each point, from two arrays
     * 'us' and 'vs' following x-ascending & y-descending order
     * (same as in ASCIIGrid)
     * @returns {Array.<Array.<Vector>>} - grid[row][column]--> Vector
     */
    protected _buildGrid(): Vector[][];
    /**
     * Calculate min & max values (magnitude)
     * @private
     * @returns {Array}
     */
    protected _calculateRange(): number[];
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
    protected _doInterpolation(x: number, y: number, g00: Vector, g10: Vector, g01: Vector, g11: Vector): Vector;
    private _getFunctionFor(type);
    private _applyOnField(func);
    private _arraysTo2d(us, vs, nRows, nCols);
}
