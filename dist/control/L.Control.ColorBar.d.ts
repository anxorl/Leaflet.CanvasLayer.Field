/// <reference types="chroma-js" />
/**
 *   Control for a simple legend with a colorbar
 *   References:
 *      - http://jsfiddle.net/ramnathv/g8stqcf6/
 *      - http://jsfiddle.net/vis4/cYLZH/
 */
import { Scale } from 'chroma-js';
import { Control, ControlOptions, Map } from 'leaflet';
export interface IColorBarOptions extends ControlOptions {
    background?: string;
    decimals?: number;
    height?: number;
    labelFontSize?: number;
    labels?: number[];
    labelTextPosition?: string;
    margin?: number;
    steps?: number;
    textColor?: string;
    title?: string;
    units?: string;
    width?: number;
}
export declare class ColorBar extends Control {
    options: IColorBarOptions;
    private _map;
    private _range;
    private _color;
    constructor(color: Scale, rang: number[], options?: IColorBarOptions);
    onAdd(map: Map): HTMLElement;
    private title();
    private palette();
    private _createSvgIn(d);
    private _appendColorBarTo(svg);
    private _appendLabelsTo(svg);
    private _getColorPerValue();
    private _getPositionPerLabelValue();
}
