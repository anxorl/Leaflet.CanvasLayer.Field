/**
 *  Simple regular cell in a raster
 */
import { LatLng, latLng, latLngBounds, LatLngBounds } from 'leaflet'
import { Vector } from './Vector'

export interface ISizeCell {
    x: number,
    y: number
}

export class Cell<T extends number | Vector> {

    private _center: LatLng
    private _size: ISizeCell
    private _value: T

    /**
     * A simple cell with value and size
     * @param {L.LatLng} center
     * @param {Number} value
     * @param {Number} size
     */
    constructor(center: LatLng, value: T, size: ISizeCell) {
        this._center = center
        this._value = value
        this._size = size
    }

    public get center(): LatLng { return this._center }
    public set center(center: LatLng) { this._center = center }
    public get value(): T { return this._value }
    public set value(value: T) { this._value = value }

    public equals(anotherCell: Cell<T>) {
        return (this.center.equals(anotherCell.center) &&
            this._equalValues(this.value, anotherCell.value) &&
            this._size === anotherCell._size
        )
    }

    /**
     * Bounds for the cell
     * @returns {LatLngBounds}
     */
    public getBounds(): LatLngBounds {
        const [halfx, halfy] = [this._size.x / 2.0, this._size.y / 2.0]
        const cLat = this.center.lat
        const cLng = this.center.lng
        const ul = new LatLng(cLat + halfy, cLng - halfx)
        const lr = new LatLng(cLat - halfy, cLng + halfx)

        return latLngBounds(latLng(lr.lat, ul.lng), latLng(ul.lat, lr.lng))
    }

    private _equalValues(value: T, anotherValue: T): boolean {
        const type: string = (value.constructor.name)
        const answerFor: { [x: string]: boolean } = {
            number: (value === anotherValue),
            Vector: ((value as Vector).u === (anotherValue as Vector).u &&
                (value as Vector).v === (anotherValue as Vector).v)
        }
        return answerFor[type]
    }
}