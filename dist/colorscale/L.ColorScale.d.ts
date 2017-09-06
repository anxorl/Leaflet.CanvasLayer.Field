/**
 * Based on:
 * http://github.com/santilland/plotty/blob/master/src/plotty.js and
 * http://geoexamples.com/d3-raster-tools-docs
 */
import { Class } from 'leaflet';
export declare class ColorScale extends Class {
    static buildFullDefinition(defTemp: string | string[]): {
        colors: string[];
        positions?: number[];
    };
    static scales(name: string): {
        colors: string[];
        positions?: number[];
    };
    static rgbToHex(r: number, g: number, b: number): string;
    static hexToRgb(hexWithPrefix: string): number[];
    private canvas;
    private csImageData;
    private definition;
    private options;
    constructor(definition: string | string[], options?: any);
    setDomain(d: number[]): this;
    colorFor(value: number): any[];
    flip(): ColorScale;
    private _prepareScale();
    private _createCanvas();
    private _createGradientIn(ctx);
}
