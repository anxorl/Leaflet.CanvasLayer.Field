import * as chroma from 'chroma-js'
import { Bounds, bounds, LatLng, Util } from 'leaflet'
import { ColorScale } from '../colorscale/L.ColorScale'
import { Cell } from '../grid/Cell'
import { ScalarGrid } from '../grid/ScalarGrid'
import { CanvasLayerGrid, ICanvasLayerGridOptions } from './L.CanvasLayer.Grid'
import Scale = chroma.Scale

export interface ICanvasLayerScalarGridOptions extends ICanvasLayerGridOptions {
    arrowColor?: string
    arrowDirection?: string,
    color?: Scale,
    domain?: number[],
    pixelStep?: number,
    type?: string,
    vectorSize?: number
}

/**
 * ScalarField on canvas (a 'Raster')
 */
export class CanvasLayerScalarGrid extends CanvasLayerGrid<number> {
    protected _grid: ScalarGrid
    protected _colorO: Scale

    protected options: ICanvasLayerScalarGridOptions = {
        arrowColor: 'grey',
        arrowDirection: 'from', // [from|towards]
        color: this._colorO,
        domain: this._grid.range,
        interpolate: true, // Change to use interpolation
        pixelStep: 2, // Draw pixelStep pixels at once with the same color
        type: 'colormap', // [colormap|vector]
        vectorSize: 20 // only used if 'vector'
    }

    constructor(grid: ScalarGrid, options?: ICanvasLayerScalarGridOptions) {
        super(grid, options)
        Util.setOptions(this, options)

        this.options.color = chroma
            .scale(ColorScale.getScale('troposfera').colors)
            .domain(this.options.domain)
    }

    /* eslint-disable no-unused-vars */
    public onDrawLayer() {
        if (!this.isVisible()) { return }
        this._updateOpacity()

        const r = this._getRendererMethod()
        // tslint:disable:no-console
        console.time('onDrawLayer')
        r()
        console.timeEnd('onDrawLayer')
    }
    /* eslint-enable no-unused-vars */
    public getColor(): Scale {
        return this.options.color
    }
    public setColor(f: Scale) {
        this.options.color = f
        this.needRedraw()
    }

    public setColorScale(nome: string, classes?: number | number[] | string[]) {
        this.options.color = chroma.scale(ColorScale.getScale(nome).colors).domain(this.options.domain)
        if (classes) {
            if (classes instanceof Array && typeof classes[0] === 'string') {
                this.options.color.classes(classes.length)
            } else {
                this.options.color.classes(classes as number | number[])
            }
        }
        this.needRedraw()
    }

    public setColorClasses(n: number) {
        this.options.color.classes(n)
        this.needRedraw()
    }

    public getEvents() {
        const events = super.getEvents()
        events.click = this._onClick
        events.mousemove = this._onMouseMove
        return events
    }

    public setDomain(rango: number[]) {
        this.options.domain = rango
        this.options.color.domain(this.options.domain)
        this.needRedraw()
    }

    protected _showCanvas() {
        super._showCanvas()
        this.needRedraw() // TODO check spurious redraw (e.g. hide/show without moving map)
    }

    private _defaultColorScale(): Scale {
        return chroma.scale(['white', 'black']).domain(this._grid.range)
    }

    private _getRendererMethod() {
        switch (this.options.type) {
            case 'colormap':
                return this._drawImage.bind(this)
            case 'vector':
                return this._drawArrows.bind(this)
            default:
                throw Error(`Unkwown renderer type: ${this.options.type}`)
        }
    }

    private _ensureColor() {
        if (this.options.color === null) {
            this.setColor(this._defaultColorScale())
        }
    }

    /**
     * Draws the field in an ImageData and applying it with putImageData.
     * Used as a reference: http://geoexamples.com/d3-raster-tools-docs/code_samples/raster-pixels-page.html
     */
    private _drawImage() {
        this._ensureColor()

        const ctx = this._getDrawingContext()
        const width = this._canvas.width
        const height = this._canvas.height

        const img = ctx.createImageData(width, height)
        const data = img.data

        this._prepareImageIn(data, width, height)
        ctx.putImageData(img, 0, 0)
    }

    /**
     * Prepares the image in data, as array with RGBAs
     * [R1, G1, B1, A1, R2, G2, B2, A2...]
     * @private
     * @param {[[Type]]} data   [[RGBA vector]]
     * @param {Number} width
     * @param {Number} height
     */
    private _prepareImageIn(data: Uint8ClampedArray, width: number, height: number) {
        const step = this.options.pixelStep
        const w4 = 4 * width
        const f = (this.options.interpolate ? this._grid.interpolatedValueAt : this._grid.valueAt).bind(this)
        let z = 0
        for (let j = 0; j < height; j += step) {
            for (let i = 0; i < width; i += step) {
                const pointCoords = this._map.containerPointToLatLng([i, j])

                const v: number = f(pointCoords.lng, pointCoords.lat) // 'valueAt' | 'interpolatedValueAt'

                if (v !== null) {
                    z++
                    const pos0 = 4 * (j * width + i)
                    const [R, G, B, A] = this.options.color(v).rgba() // this._getColorFor(v)
                    for (let sx = 0; sx < step && sx + i < width; sx++) {
                        const pos1 = pos0 + 4 * sx
                        for (let sy = 0; sy < step && j + sy < height; sy++) {
                            const pos = pos1 + w4 * sy
                            data[pos] = R
                            data[pos + 1] = G
                            data[pos + 2] = B
                            data[pos + 3] = Math.floor(A * 255) // not percent in alpha but hex 0-255
                        }
                    }
                }
                // pos = pos + 4
            }
        }
        console.log(z)
    }

    /**
     * Draws the field as a set of arrows. Direction from 0 to 360 is assumed.
     */
    private _drawArrows() {
        const pBounds = this._pixelBounds()
        const pixelSize = (pBounds.max.x - pBounds.min.x) / this._grid.nCols

        const stride = Math.max(
            1,
            Math.floor(1.2 * this.options.vectorSize / pixelSize)
        )

        const ctx = this._getDrawingContext()
        ctx.strokeStyle = this.options.arrowColor

        const currentBounds = this._map.getBounds()

        for (let y = 0; y < this._grid.height; y = y + stride) {
            for (let x = 0; x < this._grid.width; x = x + stride) {
                // let rasterIndex = y * this.raster.width + x; // TODO check
                const [lon, lat] = this._grid.lonLatAtIndexes(x, y)
                const v = this._grid.valueAt(lon, lat)
                const center = new LatLng(lat, lon)
                if (v !== null && currentBounds.contains(center)) {
                    const celda = new Cell(center, v, this._grid.cellSize)
                    this._drawArrow(celda, ctx)
                }
            }
        }
    }

    private _pixelBounds(): Bounds {
        const _bounds = this.getBounds()
        const northWest = this._map.latLngToContainerPoint(
            _bounds.getNorthWest()
        )
        const southEast = this._map.latLngToContainerPoint(
            _bounds.getSouthEast()
        )
        const pixelBounds = bounds(northWest, southEast)
        return pixelBounds
    }

    private _drawArrow(celda: Cell<number>, ctx: CanvasRenderingContext2D) {
        const projected = this._map.latLngToContainerPoint(celda.center)

        // colormap vs. simple color
        const color = this.options.color
        if (typeof color === 'function') {
            ctx.strokeStyle = color(celda.value).name()
        }

        const size = this.options.vectorSize
        ctx.save()

        ctx.translate(projected.x, projected.y)

        let rotationRads = (90 + celda.value) * Math.PI / 180 // from, by default
        if (this.options.arrowDirection === 'towards') {
            rotationRads = rotationRads + Math.PI
        }
        ctx.rotate(rotationRads)

        ctx.beginPath()
        ctx.moveTo(-size / 2, 0)
        ctx.lineTo(+size / 2, 0)
        ctx.moveTo(size * 0.25, -size * 0.25)
        ctx.lineTo(+size / 2, 0)
        ctx.lineTo(size * 0.25, size * 0.25)
        ctx.stroke()
        ctx.restore()
    }

    /**
     * Gets a chroma color for a pixel value, according to 'options.color'
     */
    /*     private _getColorFor(v: number) {
            const c = this.options.color // e.g. for a constant 'red'
            if (typeof c === 'function') {
                c = this.options.color(v)
            }
            const color = c(v) // to be more flexible, a chroma color object is always created || TODO improve efficiency
            return color
        } */
}