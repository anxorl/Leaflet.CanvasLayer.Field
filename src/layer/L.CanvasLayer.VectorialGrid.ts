
/**
 * Animated VectorField on canvas
 */
import { interval, Timer } from 'd3-timer'
import { LatLng, Util } from 'leaflet'
import { IViewInfo } from 'leaflet-canvas-layer'
import { Vector } from '../grid/Vector'
import { VectorialGrid } from '../grid/VectorialGrid'
import { CanvasLayerGrid, ICanvasLayerGridOptions } from './L.CanvasLayer.Grid'

export interface ICanvasLayerVectorialGridOptions extends ICanvasLayerGridOptions {
    color?: string | CanvasGradient
    duration?: number
    fade?: number
    maxAge?: number
    paths?: number
    velocityScale?: number
    width?: number
}

export class CanvasLayerVectorialGrid extends CanvasLayerGrid<Vector> {

    protected options: ICanvasLayerVectorialGridOptions = {
        color: 'grey', // html-color | function colorFor(value) [e.g. chromajs.scale]
        duration: 40, // milliseconds per 'frame'
        fade: .97, // 0 to 1
        maxAge: 200, // number of maximum frames per path
        paths: 1000,
        velocityScale: 0.0025,
        width: 1.2, // number | function widthFor(value)
    }

    private timer: Timer

    constructor(vectorField: VectorialGrid, options?: ICanvasLayerVectorialGridOptions) {
        super(vectorField, options)
        Util.setOptions(this, options)
        this.timer = null
    }

    public onDrawLayer(viewInfo: IViewInfo) {
        if (!this._grid || !this.isVisible()) { return }

        this._updateOpacity()

        const ctx = this._getDrawingContext()
        const paths = this._prepareParticlePaths()

        this.timer = interval(() => {
            this._moveParticles(paths)
            this._drawParticles(ctx, paths, viewInfo)
        }, this.options.duration)
    }

    // De momento non se fai nada aquí
    // onLayerDidMount() { super.onLayerDidMount(); }

    protected onLayerWillUnmount() {
        this._stopAnimation()
        super.onLayerWillUnmount()
    }

    protected _hideCanvas() {
        this._stopAnimation()
        super._hideCanvas()
    }

    private _drawParticle(viewInfo: IViewInfo, ctx: CanvasRenderingContext2D, par: {
        x: number, y: number, [z: string]: number
    }) {
        const source = new LatLng(par.y, par.x)
        const target = new LatLng(par.yt, par.xt)

        if (
            this._map != null &&
            viewInfo.bounds.contains(source) &&
            par.age <= this.options.maxAge
        ) {
            const pA = this._map.latLngToContainerPoint(source)
            const pB = this._map.latLngToContainerPoint(target)

            ctx.beginPath()
            ctx.moveTo(pA.x, pA.y)
            ctx.lineTo(pB.x, pB.y)

            // next-step movement
            par.x = par.xt
            par.y = par.yt

            // colormap vs. simple color
            const color = this.options.color
            ctx.strokeStyle = color
            /* if (color instanceof CanvasGradient) {
                ctx.strokeStyle = color(par.m)
            } */

            const width = this.options.width
            ctx.lineWidth = width
            /* if (typeof width === 'function') {
                ctx.lineWidth = width(par.m)
            } */

            ctx.stroke()
        }
    }

    private _prepareParticlePaths() {
        const paths = []

        for (let i = 0; i < this.options.paths; i++) {
            const p: {
                x: number, y: number, [z: string]: number
            } = this._grid.randomPosition()
            p.age = this._randomAge()
            paths.push(p)
        }
        return paths
    }

    private _randomAge() {
        return Math.floor(Math.random() * this.options.maxAge)
    }

    /**
     * Builds the paths, adding 'particles' on each animation step, considering
     * their properties (age / position source > target)
     */
    private _moveParticles(paths: Array<{ x: number, y: number, [x: string]: number }>) {
        // const screenFactor = 1 / this._map.getZoom() // consider using a 'screenFactor' to ponderate velocityScale
        paths.forEach((par) => {
            if (par.age > this.options.maxAge) {
                // restart, on a random x,y
                par.age = 0
                this._grid.randomPosition(par)
            }

            const vector = this._grid.valueAt(par.x, par.y)
            if (vector === null) {
                par.age = this.options.maxAge
            } else {
                // the next point will be...
                const xt = par.x + vector.u * this.options.velocityScale // * screenFactor
                const yt = par.y + vector.v * this.options.velocityScale // * screenFactor

                if (this._grid.hasValueAt(xt, yt)) {
                    par.xt = xt
                    par.yt = yt
                    par.m = vector.magnitude()
                } else {
                    // not visible anymore...
                    par.age = this.options.maxAge
                }
            }
            par.age += 1
        })
    }

    /**
     * Draws the paths on each step
     */
    private _drawParticles(ctx: CanvasRenderingContext2D, paths: Array<{ x: number, y: number, [z: string]: number }>, viewInfo: IViewInfo) {
        // Previous paths...
        const prev = ctx.globalCompositeOperation
        ctx.globalCompositeOperation = 'destination-in'
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        // ctx.globalCompositeOperation = 'source-over'
        ctx.globalCompositeOperation = prev

        // fading paths...
        ctx.fillStyle = `rgba(0, 0, 0, ${this.options.fade})`
        ctx.lineWidth = this.options.width
        ctx.strokeStyle = this.options.color

        // New paths
        paths.forEach((par) => {
            if (par.age < this.options.maxAge) { this._drawParticle(viewInfo, ctx, par) }
        })
    }

    private _stopAnimation() {
        if (this.timer) {
            this.timer.stop()
        }
    }
}