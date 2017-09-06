/**
 *  2D Vector
 */
export declare class Vector {
    private _u;
    private _v;
    constructor(u: number, v: number);
    readonly u: number;
    readonly v: number;
    /**
     * Magnitude
     * @returns {Number}
     */
    magnitude(): number;
    /**
     * Angle in degrees (0 to 360º) --> Towards
     * N is 0º and E is 90º
     * @returns {Number}
     */
    directionTo(): number;
    /**
     * Angle in degrees (0 to 360º) From x-->
     * N is 0º and E is 90º
     * @returns {Number}
     */
    directionFrom(): number;
}
