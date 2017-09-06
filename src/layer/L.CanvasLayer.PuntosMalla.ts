/**
 *  Simple layer with lon-lat points
 *
 *  TODO rename to SimplePoint?
 */
import { LatLng, LatLngBounds, LayerOptions } from 'leaflet'
import { CanvasLayer } from 'leaflet-canvas-layer'

export class CanvasLayerPuntosMalla extends CanvasLayer {
    private points: any
    private options = {
        color: 'gray'
    }

    constructor(points: LatLng[], options?: LayerOptions) {
        super(options)
        this.points = points
    }

    public setData() {
        this.needRedraw() // -- call to drawLayer
    }

    public onDrawLayer(viewInfo: any) {
        // canvas preparation
        const g = viewInfo.canvas.getContext('2d')
        g.clearRect(0, 0, viewInfo.canvas.width, viewInfo.canvas.height)
        g.fillStyle = this.options.color

        for (const point of this.points) {
            const p = viewInfo.layer._map.latLngToContainerPoint(point)
            g.beginPath()
            // g.arc(p.x, p.y, 1, 0, Math.PI * 2); // circle | TODO style 'function' as parameter?
            g.fillRect(p.x, p.y, 2, 2) // simple point
            g.fill()
            g.closePath()
            g.stroke()
        }
    }

    public getBounds(): LatLngBounds {
        // TODO: bounding with points...
        const xs = this.points.map((pt: LatLng) => pt.lng)
        const ys = this.points.map((pt: LatLng) => pt.lat)

        const xmin = Math.min(...xs)
        const ymin = Math.min(...ys)
        const xmax = Math.max(...xs)
        const ymax = Math.max(...ys)

        const southWest = new LatLng(ymin, xmin)
        const northEast = new LatLng(ymax, xmax)
        const bounds = new LatLngBounds(southWest, northEast) // TODO FIX ERROR ? half-pixel?
        return bounds
    }

    protected onLayerDidMount() {
        // -- prepare custom drawing
    }

    protected onLayerWillUnmount() {
        // -- custom cleanup
    }
}