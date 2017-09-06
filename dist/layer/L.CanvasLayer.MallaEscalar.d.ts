/// <reference types="chroma-js" />
import * as chroma from 'chroma-js';
import { LayerOptions } from 'leaflet';
import { MallaEscalar } from '../grid/MallaEscalar';
import { CanvasLayerMalla } from './L.CanvasLayer.Malla';
import Scale = chroma.Scale;
export interface ICanvasLayerMallaEscalarOptions extends LayerOptions {
    arrowDirection?: string;
    color?: string | Scale;
    interpolate?: boolean;
    type?: string;
    vectorSize?: number;
}
/**
 * ScalarField on canvas (a 'Raster')
 */
export declare class CanvasLayerMallaEscalar extends CanvasLayerMalla<number> {
    protected _malla: MallaEscalar;
    protected _colorO: Scale;
    protected _options: {
        [x: string]: any;
    };
    constructor(mallaEscalar: MallaEscalar, options?: ICanvasLayerMallaEscalarOptions);
    onDrawLayer(): void;
    getColor(): Scale;
    setColor(f: Scale): void;
    getEvents(): any;
    protected _showCanvas(): void;
    private _defaultColorScale();
    private _getRendererMethod();
    private _ensureColor();
    /**
     * Draws the field in an ImageData and applying it with putImageData.
     * Used as a reference: http://geoexamples.com/d3-raster-tools-docs/code_samples/raster-pixels-page.html
     */
    private _drawImage();
    /**
     * Prepares the image in data, as array with RGBAs
     * [R1, G1, B1, A1, R2, G2, B2, A2...]
     * @private
     * @param {[[Type]]} data   [[Description]]
     * @param {Numver} width
     * @param {Number} height
     */
    private _prepareImageIn(data, width, height);
    /**
     * Draws the field as a set of arrows. Direction from 0 to 360 is assumed.
     */
    private _drawArrows();
    private _pixelBounds();
    private _drawArrow(celda, ctx);
    /**
     * Gets a chroma color for a pixel value, according to 'options.color'
     */
    private _getColorFor(v);
}
