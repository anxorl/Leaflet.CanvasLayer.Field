/**
 * Abstract class for a Field layer on canvas, aka 'a Raster layer'
 * (ScalarField or a VectorField)
 */
import { LatLngBounds, LayerOptions, LeafletEventHandlerFn, LeafletMouseEvent } from 'leaflet';
import { CanvasLayer } from 'leaflet-canvas-layer';
import { Malla } from '../grid/Malla';
import { Vector } from '../grid/Vector';
export declare abstract class CanvasLayerMalla<T extends number | Vector> extends CanvasLayer {
    protected _onClickO: LeafletEventHandlerFn;
    protected _inFilterO: any;
    protected _onMouseMoveO: LeafletEventHandlerFn;
    protected _options: {
        [x: string]: any;
    };
    protected _malla: Malla<T>;
    protected _visible: boolean;
    constructor(malla: Malla<T>, options?: LayerOptions);
    abstract onDrawLayer(viewInfo: any): any;
    protected options: {
        [x: string]: any;
    };
    getEvents(): any;
    onLayerDidMount(): void;
    isVisible(): boolean;
    setData(malla: Malla<T>): void;
    setFilter(f: any): void;
    needRedraw(): this;
    setOpacity(opacity: number): this;
    getBounds(): LatLngBounds;
    protected show(): void;
    protected hide(): void;
    protected _updateOpacity(): void;
    protected _showCanvas(): void;
    protected _getDrawingContext(): CanvasRenderingContext2D;
    protected _onClick(e: LeafletMouseEvent): void;
    protected _onMouseMove(e: LeafletMouseEvent): void;
    protected onLayerWillUnmount(): void;
    protected _hideCanvas(): void;
    private _ensureCanvasAlignment();
    private _changeCursorOn(v);
    private _queryValue(e);
}
