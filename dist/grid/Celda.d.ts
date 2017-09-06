/**
 *  Simple regular cell in a raster
 */
import { LatLng, LatLngBounds } from 'leaflet';
import { Vector } from './Vector';
export interface ISizeCelda {
    x: number;
    y: number;
}
export declare class Celda<T extends number | Vector> {
    private _center;
    private _size;
    private _value;
    /**
     * A simple cell with value and size
     * @param {L.LatLng} center
     * @param {Number} value
     * @param {Number} size
     */
    constructor(center: LatLng, value: T, size: ISizeCelda);
    center: LatLng;
    value: T;
    equals(anotherCell: Celda<T>): boolean;
    /**
     * Bounds for the cell
     * @returns {LatLngBounds}
     */
    getBounds(): LatLngBounds;
    private _equalValues(value, anotherValue);
}
