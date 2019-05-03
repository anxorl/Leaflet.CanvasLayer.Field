/**
 * Abstract class for a Field layer on canvas, aka 'a Raster layer'
 * (ScalarField or a VectorField)
 */
import { DomUtil, LatLng, LatLngBounds, LayerOptions, LeafletEventHandlerFn, LeafletMouseEvent, Util } from 'leaflet'
import { CanvasLayer, IViewInfo } from 'leaflet-canvas-layer'
import { Grid } from '../grid/Grid'
import { Vector } from '../grid/Vector'

export interface ICanvasLayerGridOptions extends LayerOptions {
    inFilter?: (e: number | Vector) => boolean
    interpolate?: boolean
    mouseMoveCursor?: { [x: string]: string }
    onClick?: LeafletEventHandlerFn
    onMouseMove?: LeafletEventHandlerFn
    opacity?: number
}

export abstract class CanvasLayerGrid<T extends number | Vector> extends CanvasLayer {

    protected _inFilterO: (e: T) => boolean

    protected options: ICanvasLayerGridOptions = {
        inFilter: this._inFilterO,
        mouseMoveCursor: {
            noValue: 'default',
            value: 'pointer'
        },
        onClick: this._onClick,
        onMouseMove: this._onMouseMove,
        opacity: 1
    }

    protected _grid: Grid<T>
    protected _visible: boolean

    constructor(grid: Grid<T>, options?: LayerOptions) {
        super(options)
        Util.setOptions(this, options)
        this._visible = true
        this.setData(grid)
    }

    /* eslint-disable no-unused-vars */
    public abstract onDrawLayer(viewInfo: IViewInfo): void
    /* eslint-enable no-unused-vars */

    public getEvents(): { [x: string]: LeafletEventHandlerFn } {
        const events = super.getEvents()
        return events
    }

    public onLayerDidMount() {
        // this._enableIdentify()
        this._ensureCanvasAlignment()
    }

    public isVisible() {
        return this._visible
    }

    public setData(grid: Grid<T>) {
        grid.setFilter(this.options.inFilter)
        this._grid = grid
        this.needRedraw()
        this.fire('load')
    }

    public setFilter(f: (e: T) => boolean) {
        this.options.inFilter = f
        this._grid.setFilter(f)
        this.needRedraw()
    }

    public needRedraw() {
        if (this._map && this._grid) {
            super.needRedraw()
        }
        return this
    }

    public setOpacity(opacity: number) {
        this.options.opacity = opacity

        if (this._canvas) {
            this._updateOpacity()
        }
        return this
    }

    public getBounds(): LatLngBounds {
        const bb = this._grid.extent()

        const southWest = new LatLng(bb[1], bb[0])
        const northEast = new LatLng(bb[3], bb[2])
        const bounds = new LatLngBounds(southWest, northEast)
        return bounds
    }

    public getLatLngBounds(): LatLngBounds {
        const bb = this._grid.llextent()
        const southWest = new LatLng(bb[1], bb[0])
        const northEast = new LatLng(bb[3], bb[2])
        const bounds = new LatLngBounds(southWest, northEast)
        return bounds
    }

    protected show() {
        this._visible = true
        this._showCanvas()
        // this._enableIdentify()
    }

    protected hide() {
        this._visible = false
        this._hideCanvas()
        // this._disableIdentify()
    }

    protected _updateOpacity() {
        DomUtil.setOpacity(this._canvas, this.options.opacity)
    }

    protected _showCanvas() {
        if (this._canvas && this._visible) {
            this._canvas.style.visibility = 'visible'
        }
    }

    protected _getDrawingContext(): CanvasRenderingContext2D {
        const g = this._canvas.getContext('2d')
        g.clearRect(0, 0, this._canvas.width, this._canvas.height)
        return g
    }

    protected _onClick(e: LeafletMouseEvent) {
        const v = this._queryValue(e.latlng)
        this.fire('click', v)
    }

    protected _onMouseMove(e: LeafletMouseEvent) {
        const v = this._queryValue(e.latlng)
        this._changeCursorOn(v)
        this.fire('mousemove', v)
    }

    protected onLayerWillUnmount() {
        // this._disableIdentify()
    }

    protected _hideCanvas() {
        if (this._canvas) {
            this._canvas.style.visibility = 'hidden'
        }
    }

    private _ensureCanvasAlignment() {
        const topLeft = this._map.containerPointToLayerPoint([0, 0])
        DomUtil.setPosition(this._canvas, topLeft)
    }

    private _changeCursorOn(v: { latlng: LatLng, value: T }) {
        if (!this.options.mouseMoveCursor) { return }

        const { value, noValue } = this.options.mouseMoveCursor
        const style = this._map.getContainer().style
        style.cursor = v.value !== null ? value : noValue
    }

    private _queryValue(ll: LatLng): { latlng: LatLng, value: T } {
        const v = this._grid
            ? (this.options.interpolate
                ? this._grid.interpolatedValueAt(ll.lng, ll.lat)
                : this._grid.valueAt(ll.lng, ll.lat))
            : null
        const result = {
            latlng: ll,
            value: v
        }
        return result
    }
}