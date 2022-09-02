import { InorganicParticle } from "./inorganic";

export class WaterParticle extends InorganicParticle {
    constructor() {
        super();
        this.color = "#5080D0"; // idk, just put in some blue
        this.has_gravity = true;
        this.weight = 1;
    }
}