import { GasParticle } from "./gas";
import { WaterParticle } from "./water";

export class SteamParticle extends GasParticle {
    constructor(x, y) {
        super(x, y);
        this.base_color = "#DDDDDD";
        this.moveable = true;
        this.weight = 0;
        this.condensation_time = 600; // How many ticks until the steam turns into water

        // Initial values used to slow down horizontal movement based on time
        this.initial_condensation_time = this.condensation_time;
        this.initial_x_movement_probability = this.x_movement_probability;
    }

    update(environment) {
        if (this.last_tick == environment.tick) return;

        // Count down condensation time.
        this.condensation_time--;
        // Slow down horizontal movement when closer to condensation.
        this.x_movement_probability =
            (this.condensation_time / this.initial_condensation_time) *
            this.initial_x_movement_probability;

        // Turn steam into water.
        if (this.condensation_time <= 0) {
            environment.set(new WaterParticle(this.x, this.y));
            return;
        }

        // Rise steam as a gas particle.
        this.compute_rise(environment);

        this.last_tick = environment.tick;
    }
}
