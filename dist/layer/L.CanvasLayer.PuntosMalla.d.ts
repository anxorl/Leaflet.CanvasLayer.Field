/**
 *  Simple layer with lon-lat points
 *
 *  TODO rename to SimplePoint?
 */
import { LatLng, LatLngBounds, LayerOptions } from 'leaflet';
import { CanvasLayer } from 'leaflet-canvas-layer';
export declare class CanvasLayerPuntosMalla extends CanvasLayer {
    private points;
    private options;
    constructor(points: LatLng[], options?: LayerOptions);
    setData(): void;
    onDrawLayer(viewInfo: any): void;
    getBounds(): LatLngBounds;
    protected onLayerDidMount(): void;
    protected onLayerWillUnmount(): void;
}
