/// <reference path="../../src/geotiff/geotiff.d.ts" />
import { IMallaParams, Malla } from './Malla';
export interface IMallaEscalarParams extends IMallaParams {
    zs?: number[];
}
/**
 * Scalar Field
 */
export declare class MallaEscalar extends Malla<number> {
    static fromData(def: IMallaParams, datos: any, nomeVar?: string): MallaEscalar;
    /**
     * Creates a ScalarField from the content of an ASCIIGrid file
     * @param   {String}   asc
     * @returns {ScalarField}
     */
    static fromASCIIGrid(asc: string, scaleFactor?: number): MallaEscalar;
    /**
     * Creates a ScalarField from the content of a GeoTIFF file, as read by geotiff.js
     * @param   {ArrayBuffer}   data
     * @param   {Number}   bandIndex
     * @returns {ScalarField}
     */
    static fromGeoTIFF(data: any, bandIndex?: number): MallaEscalar;
    private static _checkIsValidASCIIGridHeader(lines);
    private _zs;
    constructor(params: any);
    readonly zs: number[];
    updateData(datos: any, nomeVar: string): void;
    /**
     * Builds a grid with a Number at each point, from an array
     * 'zs' following x-ascending & y-descending order
     * (same as in ASCIIGrid)
     * @private
     * @returns {Array.<Array.<Number>>} - grid[row][column]--> Number
     */
    protected _buildGrid(): any[][];
    /**
     * Calculate min & max values
     * @private
     * @returns {Array} - [min, max]
     */
    protected _calculateRange(): number[];
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
    protected _doInterpolation(x: number, y: number, g00: number, g10: number, g01: number, g11: number): number;
    private _arrayTo2d(array, nRows, nCols);
}
