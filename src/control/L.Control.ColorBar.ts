/**
 *   Control for a simple legend with a colorbar
 *   References:
 *      - http://jsfiddle.net/ramnathv/g8stqcf6/
 *      - http://jsfiddle.net/vis4/cYLZH/
 */
import { Scale } from 'chroma-js'
import { range } from 'd3-array'
import { scaleLinear } from 'd3-scale'
import { EnterElement, select, Selection } from 'd3-selection'
import { Control, ControlOptions, DomEvent, DomUtil, Util } from 'leaflet'

export interface IColorBarOptions extends ControlOptions {
    background?: string,
    decimals?: number,
    height?: number,
    labelFontSize?: number,
    labelMargin?: number,
    labels?: Array<number | string>,
    labelTextPosition?: string,
    margin?: number,
    steps?: number,
    textColor?: string,
    title?: string,
    units?: string,
    width?: number
}

export class ColorBar extends Control {

    public options: IColorBarOptions = {
        background: '#fff',
        decimals: 2,
        height: 20,
        labelFontSize: 12,
        labelMargin: 4,
        labels: [], // empty for no labels
        labelTextPosition: 'middle', // start | middle | end
        margin: 15,
        position: 'bottomright',
        steps: 100,
        textColor: 'black',
        title: 'Legend', // ej: Ocean Currents
        units: 'uds', // ej: m/s
        width: 300, // for colorbar itself (control is wider)
    }

    // private _map: Map
    private _range: number[]
    private _color: Scale

    constructor(color: Scale, rang: number[], options?: IColorBarOptions) {
        super()
        this._color = color // 'chromajs' scale function
        this._range = rang // [min, max]
        Util.setOptions(this, options)
    }

    public onAdd(/* map: Map */) {
        // this._map = map
        const div = DomUtil.create(
            'div',
            'leaflet-control-colorBar leaflet-bar leaflet-control'
        )
        div.style.padding = '10px'

        DomEvent
            .addListener(div, 'click', DomEvent.stopPropagation)
            .addListener(div, 'click', DomEvent.preventDefault)
        div.style.backgroundColor = this.options.background
        div.style.cursor = 'pointer'
        div.innerHTML = this.title() + this.palette()
        return div
    }

    private title() {
        const d = document.createElement('div')
        select(d)
            .append('span')
            .style('color', this.options.textColor)
            .style('display', 'block')
            .style('margin-bottom', '5px')
            .style('font-size', '15px')
            .style('font-weight', 'bold')
            .attr('class', 'leaflet-control-colorBar-title')
            .text(this.options.title + ' (' + this.options.units + ')')
        return d.innerHTML
    }

    private palette() {
        const d = document.createElement('div')
        const svg = this._createSvgIn(d)

        this._appendColorBarTo(svg)

        if (this.options.labels) {
            this._appendLabelsTo(svg)
        }

        return d.innerHTML
    }

    private _createSvgIn(d: HTMLElement) {
        const spaceForLabels = this.options.labels ? this.options.labelFontSize + this.options.labelMargin : 0
        const svg = select(d)
            .append('svg')
            .attr('width', this.options.width + this.options.margin * 2)
            .attr('height', this.options.height + spaceForLabels)
        return svg
    }

    private _appendColorBarTo(svg: Selection<Element | EnterElement | Window | Document, {}, null, undefined>) {
        const colorPerValue = this._getColorPerValue()
        const w = this.options.width / colorPerValue.length

        const groupBars = svg.append('g').attr('id', 'colorBar-buckets')
        const buckets = groupBars
            .selectAll('rect')
            .data(colorPerValue)
            .enter()
            .append('rect')
        buckets
            .attr('x', (_d, i) => i * w + this.options.margin)
            .attr('y', () => 0)
            .attr('height', () => this.options.height /*w * 4*/)
            .attr('width', () => w)
            .attr('stroke-width', 2)
            .attr('stroke-linecap', 'butt')
            .attr('stroke', (d) => d.color.hex())
            .attr('fill', (d) => d.color.hex())
        buckets
            .append('title')
            .text(
            (d) =>
                `${d.value.toFixed(this.options.decimals)} ${this.options
                    .units}`
            )
    }

    private _appendLabelsTo(svg: Selection<Element | EnterElement | Window | Document, {}, null, undefined>) {
        const positionPerLabelValue = this._getPositionPerLabelValue()
        // const w = this.options.width / colorPerValue.length
        const groupLabels = svg.append('g').attr('id', 'colorBar-labels')
        const labels = groupLabels
            .selectAll('text')
            .data(positionPerLabelValue)
            .enter()
            .append('text')

        labels
            .attr('x', (d) => d.position + this.options.margin)
            .attr('y', this.options.height + this.options.labelMargin)
            .attr('dominant-baseline', 'hanging')
            .attr('font-size', `${this.options.labelFontSize}px`)
            .attr('text-anchor', this.options.labelTextPosition)
            .attr('fill', this.options.textColor)
            .attr('class', 'leaflet-control-colorBar-label')
            .text((d) => typeof d.value === 'number' ? `${d.value.toFixed(this.options.decimals)}` : d.value)
    }

    private _getColorPerValue() {
        const [min, max] = this._range
        const delta = (max - min) / this.options.steps
        const data = range(min, max + delta, delta)
        const colorPerValue = data.map((d) => {
            return {
                color: this._color(d),
                value: d
            }
        })
        return colorPerValue
    }

    private _getPositionPerLabelValue(): Array<{ value: number | string, position: number }> {
        const xPositionFor = scaleLinear()
            .range([0, this.options.width])
            .domain(this._range)
        const data = this.options.labels
        const positionPerLabel = data.map((d: number | string, i: number) => {
            return {
                position: xPositionFor(typeof d === 'number' ? d : i + 1),
                value: d
            }
        })
        return positionPerLabel
    }
}