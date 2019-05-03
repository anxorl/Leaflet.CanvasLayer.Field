
/**
 * Animated VectorField on canvas
 */
import { Scale } from 'chroma-js'
import { interval, Timer } from 'd3-timer'
import { LatLng, Util } from 'leaflet'
import { Vector } from '../grid/Vector'
import { VectorialGrid } from '../grid/VectorialGrid'
import { CanvasLayerGrid, ICanvasLayerGridOptions } from './L.CanvasLayer.Grid'

export interface ICanvasLayerVectorialGridOptions extends ICanvasLayerGridOptions {
  color?: string | Scale
  domain?: number[]
  duration?: number
  fade?: number
  interpolate?: boolean
  maxAge?: number
  paths?: number
  velocityScale?: number
  width?: number | ((x: number) => number)
}

export class CanvasLayerVectorialGrid extends CanvasLayerGrid<Vector> {

  protected options: ICanvasLayerVectorialGridOptions = {
    color: 'grey',      // html-color | function colorFor(value) [e.g. chromajs.scale]
    domain: [0, 1],     // number[]: colormap domain
    duration: 40,       // number: milliseconds per 'frame'
    fade: .97,          // number: 0 to 1
    interpolate: true,  // boolean: interpolate magnitude
    maxAge: 200,        // number: number of maximum frames per path
    paths: 1000,        // number: number of particles in the domain
    velocityScale: 1,   // number: velocity modifier
    width: 1.2,         // number | function widthFor(value): particle width
  }

  private timer: Timer

  constructor(vectorField: VectorialGrid, options?: ICanvasLayerVectorialGridOptions) {
    super(vectorField, options)
    Util.setOptions(this, options)
    this.timer = null
  }

  public onDrawLayer() {
    if (!this._grid || !this.isVisible()) { return }
    this._updateOpacity()
    this.startAnimation()
  }

  public onLayerDidMount() {
    super.onLayerDidMount()
    this._map.on('movestart', () => { this.stopAnimation() })
    this._map.on('moveend', () => { this.startAnimation() })
  }

  protected startAnimation() {
    const ctx = this._getDrawingContext()
    const paths = this._prepareParticlePaths()

    if (this.timer) {
      this.timer.restart(() => {
        this._moveParticles(paths)
        this._drawParticles(ctx, paths)
      }, this.options.duration)
    } else {
      this.timer = interval(() => {
        this._moveParticles(paths)
        this._drawParticles(ctx, paths)
      }, this.options.duration)
    }
  }

  protected onLayerWillUnmount() {
    this.stopAnimation()
    super.onLayerWillUnmount()
  }

  protected _hideCanvas() {
    this.stopAnimation()
    super._hideCanvas()
  }

  private _drawParticle(ctx: CanvasRenderingContext2D, par: {
    x: number, y: number, [z: string]: number
  }) {
    const source = new LatLng(par.y, par.x)
    const target = new LatLng(par.yt, par.xt)

    if (
      this._map != null &&
      this._map.getBounds().contains(source) &&
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

      // simple color vs. magnitude dependant colormap
      ctx.strokeStyle = (typeof this.options.color === 'function') ?
        `rgba(${this.options.color.domain(this.options.domain)(par.m).rgba().join(',')})` :
        this.options.color

      // Magnitude dependant linewidth
      ctx.lineWidth = (typeof this.options.width === 'function') ? this.options.width(par.m) : this.options.width

      ctx.stroke()
    }
  }

  private _prepareParticlePaths() {
    const paths = []

    for (let i = 0; i < this.options.paths; i++) {
      const p: {
        x: number, y: number, [z: string]: number
      } = this._grid.randomLLPosition()
      p.age = this._randomAge()
      paths.push(p)
    }
    return paths
  }

  private _randomAge() { return Math.floor(Math.random() * this.options.maxAge) }

  /**
   * Builds the paths, adding 'particles' on each animation step, considering
   * their properties (age / position source > target)
   */
  private _moveParticles(paths: Array<{ x: number, y: number, [x: string]: number }>) {

    const escalaX = (this._grid.xurCorner - this._grid.xllCorner) / this.map.distance(
      new LatLng(this._grid.xllCorner, this._grid.yllCorner),
      new LatLng(this._grid.xurCorner, this._grid.yllCorner))
    const escalaY = (this._grid.yurCorner - this._grid.yllCorner) / this.map.distance(
      new LatLng(this._grid.xllCorner, this._grid.yllCorner),
      new LatLng(this._grid.xllCorner, this._grid.yurCorner))

    paths.forEach((par) => {
      if (par.age > this.options.maxAge) {
        // restart, on a random x,y
        par.age = 0
        this._grid.randomLLPosition(par)
      }

      const zoomScales = [
        500000, 250000, 15000, 7000, 35000, 15000, 10000,
        4000, 2000, 1000, 500, 250, 150, 70, 35, 15, 8, 4, 2, 1
      ]

      const interpFunc = (
        this.options.interpolate ? this._grid.interpolatedValueAt : this._grid.valueAt).bind(this._grid)

      const vector = interpFunc(par.x, par.y)
      if (vector === null) {
        par.age = this.options.maxAge
      } else {
        // the next point will be...
        const xt = par.x + vector.u * escalaX * zoomScales[this.map.getZoom()] * this.options.velocityScale
        const yt = par.y + vector.v * escalaY * zoomScales[this.map.getZoom()] * this.options.velocityScale

        if (this._grid.hasValueAt(xt, yt)) {
          [par.xt, par.yt, par.m] = [xt, yt, vector.magnitude()]
        } else {
          par.age = this.options.maxAge
        }
      }
      par.age += 1
    })
  }

  /**
   * Draws the paths on each step
   */
  private _drawParticles(ctx: CanvasRenderingContext2D, paths: Array<{ x: number, y: number, [z: string]: number }>) {
    // Previous paths...
    const prev = ctx.globalCompositeOperation
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // ctx.globalCompositeOperation = 'source-over'
    ctx.globalCompositeOperation = prev

    // fading paths...
    ctx.fillStyle = `rgba(0, 0, 0, ${this.options.fade})`

    // New paths
    paths.forEach((par) => {
      if (par.age < this.options.maxAge) { this._drawParticle(ctx, par) }
    })
  }

  private stopAnimation() { if (this.timer) { this.timer.stop() } }
}