import { LayerOptions } from 'leaflet';
import { MallaVectorial } from '../grid/MallaVectorial';
import { Vector } from '../grid/Vector';
import { CanvasLayerMalla } from './L.CanvasLayer.Malla';
export declare class CanvasLayerMallaVectorial extends CanvasLayerMalla<Vector> {
    protected _options: {
        color: string;
        duration: number;
        fade: number;
        maxAge: number;
        paths: number;
        velocityScale: number;
        width: number;
    };
    private timer;
    constructor(vectorField: MallaVectorial, options?: LayerOptions);
    onDrawLayer(viewInfo: any): void;
    protected onLayerWillUnmount(): void;
    protected _hideCanvas(): void;
    private _drawParticle(viewInfo, ctx, par);
    private _prepareParticlePaths();
    private _randomAge();
    /**
     * Builds the paths, adding 'particles' on each animation step, considering
     * their properties (age / position source > target)
     */
    private _moveParticles(paths);
    /**
     * Draws the paths on each step
     */
    private _drawParticles(ctx, paths, viewInfo);
    private _stopAnimation();
}
