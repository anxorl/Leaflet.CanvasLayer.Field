import Scale = chroma.Scale
import * as chroma from 'chroma-js'
import { Coords, DomUtil, DoneCallback, GridLayer, GridLayerOptions, LatLng, LatLngBounds, Point, Util } from 'leaflet'
import { ColorScale } from '../colorscale/L.ColorScale'
import { ScalarGrid } from '../grid/ScalarGrid'

export interface IScalarParameter {
    nome: string
    unidade: string
}

export interface ITropGridLayerOptions extends GridLayerOptions {
    color?: Scale
    domain?: number[]
    interpolate?: boolean
    parametro?: IScalarParameter
    pixelStep?: number
    type?: string
}

export class TropGridLayer extends GridLayer {

    protected options: ITropGridLayerOptions
    private _grid: ScalarGrid

    constructor(datos: ScalarGrid, ops?: ITropGridLayerOptions) {
        super(ops)
        this._grid = datos
        Util.setOptions(this, ops)
        this.options.bounds = this.getBounds()
        this.options.color = ops.color || chroma.scale(ColorScale.getScale('troposfera').colors)
        this.options.color.domain(this._grid.range)
        this.options.domain = this._grid.range
        this.options.interpolate = ops.interpolate || true
        this.options.parametro = ops.parametro
        this.options.pixelStep = ops.pixelStep || 2
        this.options.type = ops.type || 'colormap'
    }

    public get dominio(): number[] { return this.options.domain }
    public set dominio(rango: number[]) {
        this.options.domain = rango
        this.options.color.domain(this.options.domain)
        this.redraw()
    }

    public get parametro(): IScalarParameter { return this.options.parametro }
    public set parametro(p: IScalarParameter) { this.options.parametro = p }

    public getBounds(): LatLngBounds {
        const bb = this._grid.extent()

        const southWest = new LatLng(bb[1], bb[0])
        const northEast = new LatLng(bb[3], bb[2])
        const bounds = new LatLngBounds(southWest, northEast)
        return bounds
    }

    public getColor(): Scale { return this.options.color }
    public setColorScale(nome: string, classes?: number | number[] | string[]) {
        this.options.color = chroma.scale(ColorScale.getScale(nome).colors).domain(this.options.domain)
        if (classes) {
            if (classes instanceof Array && typeof classes[0] === 'string') {
                this.options.color.classes(classes.length)
            } else {
                this.options.color.classes(classes as number | number[])
            }
        }
        this.redraw()
    }

    public createTile(coords: Coords, done: DoneCallback): HTMLElement {
        const tile = DomUtil.create('canvas', 'leaflet-tile leaflet-tile-loaded') as HTMLCanvasElement
        const ctx = tile.getContext('2d')
        const size = this.getTileSize()
        tile.width = size.x
        tile.height = size.y

        setTimeout(() => {
            // console.log(coords)
            const img = ctx.createImageData(tile.width, tile.height)
            this._prepareImageIn(img.data, coords, size)
            ctx.putImageData(img, 0, 0)
            // tile.style.outline = '1px solid red'
            done(new Error(''), tile)
        }, 0)
        return tile
    }

    /**
     * Prepares the image in data, as array with RGBAs
     * [R1, G1, B1, A1, R2, G2, B2, A2...]
     * private
     * param {[[Type]]} data   [[RGBA vector]]
     * param {Number} width
     * param {Number} height
     */
    private _prepareImageIn(data: Uint8ClampedArray, coords: Coords, size: Point, overstep?: number) {
        const scaledCoords = coords.scaleBy(this.getTileSize())
        const i0 = scaledCoords.x
        const j0 = scaledCoords.y
        const step = overstep || this.options.pixelStep
        const w4 = 4 * size.x
        const f = (this.options.interpolate ? this._grid.interpolatedValueAt : this._grid.valueAt).bind(this._grid)
        for (let j = 0; j < size.y; j += step) {
            const pj = j + j0
            for (let i = 0; i < size.x; i += step) {
                const pi = i + i0
                // const pointCoords = this._map.containerPointToLatLng([i, j])
                const pointCoords = this._map.unproject([pi, pj], coords.z)
                const v: number = f(pointCoords.lng, pointCoords.lat) // 'valueAt' | 'interpolatedValueAt'

                if (v && v >= this.options.domain[0]) {
                    const pos0 = 4 * (j * size.x + i)
                    const [R, G, B, A] = this.options.color(v).rgba() // this._getColorFor(v)
                    for (let sx = 0; sx < step && sx + i < size.x; sx++) {
                        const pos1 = pos0 + 4 * sx
                        for (let sy = 0; sy < step && j + sy < size.y; sy++) {
                            const pos = pos1 + w4 * sy
                            data[pos] = R
                            data[pos + 1] = G
                            data[pos + 2] = B
                            data[pos + 3] = Math.floor(A * 255) // not percent in alpha but hex 0-255
                        }
                    }
                }
            }
        }
    }
}
