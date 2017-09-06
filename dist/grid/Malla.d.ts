import { LatLngBounds } from 'leaflet';
import { Celda, ISizeCelda } from './Celda';
import { Vector } from './Vector';
export interface IMallaParams {
    cellSize: ISizeCelda;
    nCols: number;
    nRows: number;
    xllCorner: number;
    yllCorner: number;
}
/**
 *  Abstract class for a set of values (Vector | Scalar)
 *  assigned to a regular 2D-grid (lon-lat), aka 'a Raster source'
 */
export declare abstract class Malla<T extends number | Vector> {
    isContinuous: boolean;
    longitudeNeedsToBeWrapped: any;
    _inFilter: any;
    protected grid: T[][];
    protected defMalla: IMallaParams;
    protected _range: any;
    constructor(params: IMallaParams);
    readonly cellSize: ISizeCelda;
    readonly nCols: number;
    readonly nRows: number;
    readonly xllCorner: number;
    readonly yllCorner: number;
    readonly range: any;
    readonly height: number;
    readonly width: number;
    readonly xurCorner: number;
    readonly yurCorner: number;
    /**
     * Number of cells in the grid (rows * cols)
     * @returns {Number}
     */
    numCells(): number;
    getBounds(): LatLngBounds;
    /**
     * A list with every cell
     * @returns {Array<Cell>} - cells (x-ascending & y-descending order)
     */
    getCells(stride?: number): Array<Celda<number | Vector>>;
    /**
     * Apply a filter function to field values
     * @param   {Function} f - boolean function
     */
    setFilter(f: any): void;
    /**
     * Grid extent
     * @returns {Number[]} [xmin, ymin, xmax, ymax]
     */
    extent(): number[];
    /**
     * Returns whether or not the grid contains the point
     * @param   {Number} lon - longitude
     * @param   {Number} lat - latitude
     * @returns {Boolean}
     */
    contains(lon: number, lat: number): boolean;
    /**
     * Nearest value at lon-lat coordinates
     * @param   {Number} longitude
     * @param   {Number} latitude
     * @returns {Vector|Number}
     */
    valueAt(lon: number, lat: number): T;
    /**
     * Returns if the grid doesn't contain the point
     * @param   {Number} lon - longitude
     * @param   {Number} lat - latitude
     * @returns {Boolean}
     */
    notContains(lon: number, lat: number): boolean;
    /**
     * Interpolated value at lon-lat coordinates (bilinear method)
     * @param   {Number} longitude
     * @param   {Number} latitude
     * @returns {Vector|Number} [u, v, magnitude]
     * Source: https://github.com/cambecc/earth > product.js
     */
    interpolatedValueAt(lon: number, lat: number): T;
    /**
     * Interpolated value at i-j indexes (bilinear method)
     * @param   {Number} i
     * @param   {Number} j
     * @returns {Vector|Number} [u, v, magnitude]
     *
     * Source: https://github.com/cambecc/earth > product.js
     */
    interpolatedValueAtIndexes(i: number, j: number): T;
    /**
     * Returns whether or not the field has a value at the point
     * @param   {Number} lon - longitude
     * @param   {Number} lat - latitude
     * @returns {Boolean}
     */
    hasValueAt(lon: number, lat: number): boolean;
    /**
     * Gives a random position to 'o' inside the grid
     * @param {Object} [o] - an object (eg. a particle)
     * @returns {{x: Number, y: Number}} - object with x, y (lon, lat)
     */
    randomPosition(o?: any): {
        x: number;
        y: number;
    };
    /**
     * Lon-Lat for grid indexes
     * @param   {Number} i - column index (integer)
     * @param   {Number} j - row index (integer)
     * @returns {Number[]} [lon, lat]
     */
    lonLatAtIndexes(i: number, j: number): number[];
    /**
     * Builds a grid with a value at each point (either Vector or Number)
     * Original params must include the required input values, following
     * x-ascending & y-descending order (same as in ASCIIGrid)
     * @abstract
     * @private
     * @returns {Array.<Array.<Vector|Number>>} - grid[row][column]--> Vector|Number
     */
    protected abstract _buildGrid(): T[][];
    protected abstract _calculateRange(): number[];
    /**
     * Apply the interpolation
     * @abstract
     * @private
     */
    protected abstract _doInterpolation(x: number, y: number, g00: T, g10: T, g01: T, g11: T): T;
    protected _updateRange(): void;
    /**
     * Is valid (not 'null' nor 'undefined')
     * @private
     * @param   {Object} x object
     * @returns {Boolean}
     */
    protected _isValid(x: any): boolean;
    /**
     * [xmin, xmax] in [-180, 180] range
     */
    private _getWrappedLongitudes();
    /**
     * Get decimal indexes, clampling on borders
     * @private
     * @param {Number} lon
     * @param {Number} lat
     * @returns {Array}    [[Description]]
     */
    private _getDecimalIndexes(lon, lat);
    /**
     * Get surrounding indexes (integer), clampling on borders
     * @private
     * @param   {Number} i - decimal index
     * @param   {Number} j - decimal index
     * @returns {Array} [fi, ci, fj, cj]
     */
    private _getFourSurroundingIndexes(i, j);
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
    private _getFourSurroundingValues(fi, ci, fj, cj);
    /**
     * Value for grid indexes
     * @param   {Number} i - column index (integer)
     * @param   {Number} j - row index (integer)
     * @returns {Vector|Number}
     */
    private _valueAtIndexes(i, j);
    /**
     * Longitude for grid-index
     * @param   {Number} i - column index (integer)
     * @returns {Number} longitude at the center of the cell
     */
    private _longitudeAtX(i);
    /**
     * Latitude for grid-index
     * @param   {Number} j - row index (integer)
     * @returns {Number} latitude at the center of the cell
     */
    private _latitudeAtY(j);
    /**
     * Check the column index is inside the field,
     * adjusting to min or max when needed
     * @private
     * @param   {Number} ii - index
     * @returns {Number} i - inside the allowed indexes
     */
    private _clampColumnIndex(ii);
    /**
     * Check the row index is inside the field,
     * adjusting to min or max when needed
     * @private
     * @param   {Number} jj index
     * @returns {Number} j - inside the allowed indexes
     */
    private _clampRowIndex(jj);
}
