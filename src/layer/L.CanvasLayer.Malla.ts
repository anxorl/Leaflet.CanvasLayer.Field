/**
 * Abstract class for a Field layer on canvas, aka 'a Raster layer'
 * (ScalarField or a VectorField)
 */
import { DomUtil, LatLng, LatLngBounds, LayerOptions, LeafletEventHandlerFn, LeafletMouseEvent, Util } from 'leaflet'
import { CanvasLayer } from 'leaflet-canvas-layer'
import { Malla } from '../grid/Malla'
import { Vector } from '../grid/Vector'

export abstract class CanvasLayerMalla<T extends number | Vector> extends CanvasLayer {
    protected _onClickO: LeafletEventHandlerFn
    protected _inFilterO: any
    protected _onMouseMoveO: LeafletEventHandlerFn

    protected _options: { [x: string]: any } = {
        inFilter: this._inFilterO,
        mouseMoveCursor: {
            noValue: 'default',
            value: 'pointer'
        },
        onClick: this._onClick,
        onMouseMove: this._onMouseMoveO,
        opacity: 1
    }

    protected _malla: Malla<T>
    protected _visible: boolean

    constructor(malla: Malla<T>, options?: LayerOptions) {
        super(options)
        Util.setOptions(this, options)
        this._visible = true
        this.setData(malla)
    }

    /* eslint-disable no-unused-vars */
    public abstract onDrawLayer(viewInfo: any): any
    /* eslint-enable no-unused-vars */

    protected get options() { return this._options }
    protected set options(options) { this._options = options }

    public getEvents(): any {
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

    public setData(malla: Malla<T>) {
        malla.setFilter(this.options.inFilter)
        this._malla = malla
        this.needRedraw()
        this.fire('load')
    }

    public setFilter(f: any) {
        this.options.inFilter = f
        this._malla.setFilter(f)
        this.needRedraw()
    }

    public needRedraw() {
        if (this._map && this._malla) {
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
        const bb = this._malla.extent()

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
        const v = this._queryValue(e)
        this.fire('click', v)
    }

    protected _onMouseMove(e: LeafletMouseEvent) {
        const v = this._queryValue(e)
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

    /*     _enableIdentify() {
            //this._map.on('click', this._onClick, this)
            //this._map.on('mousemove', this._onMouseMove, this)

            this.options.onClick && this.on('click', this.options.onClick, this)
            this.options.onMouseMove &&
                this.on('mousemove', this.options.onMouseMove, this)
        } */

    /*     _disableIdentify() {
        this._map.off('click', this._onClick, this)
        this._map.off('mousemove', this._onMouseMove, this)

        this.options.onClick && this.off('click', this.options.onClick, this)
        this.options.onMouseMove &&
            this.off('mousemove', this.options.onMouseMove, this)
    } */

    private _changeCursorOn(v: { latlng: LatLng, value: number | Vector }) {
        if (!this.options.mouseMoveCursor) { return }

        const { value, noValue } = this.options.mouseMoveCursor
        const style = this._map.getContainer().style
        style.cursor = v.value !== null ? value : noValue
    }

    private _queryValue(e: any): { latlng: LatLng, value: number | Vector } {
        const v = this._malla
            ? this._malla.valueAt(e.latlng.lng, e.latlng.lat)
            : null
        const result = {
            latlng: e.latlng,
            value: v
        }
        return result
    }

}