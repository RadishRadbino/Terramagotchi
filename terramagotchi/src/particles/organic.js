import { FastRandom } from "../fast-random";
import { AirParticle } from "./air";
import { BaseParticle } from "./base";
import { SteamParticle } from "./steam";

export class OrganicParticle extends BaseParticle {
    constructor(x, y) {
        super(x, y);
        
        this.moveable = true;
        this.weight = 2;

        this.__nutrient_level = 0;
        this.nutrient_capacity = 100;
        this.__nutrient_render_step = 100;
        this.__last_rendered_nutrient_level = 0;

        this.__water_level = 0;
        this.water_capacity = 100;
        this.__water_render_step = FastRandom.int_min_max(10, 20);
        this.__last_rendered_water_level = 0;

        this.__water_transferred = false;
        this.__nutrient_transferred = false;

        // Per-tick chance for transpiration (evaporate water_level into steam)
        this.transpiration_chance = 0.00001;
    }

    set water_level(level) {
        if (Math.abs(this.water_level - this.__last_rendered_water_level) >= this.__water_render_step) {
            this.rerender = true;
            this.__last_rendered_water_level = this.water_level;
        }

        this.__water_level = level;
    }

    set nutrient_level(level) {
        //if (Math.abs(this.nutrient_level - this.__last_rendered_nutrient_level) >= this.__nutrient_render_step) {
        //    this.rerender = true;
        //    this.__last_rendered_nutrient_level = this.nutrient_level;
        //}

        this.__nutrient_level = level;
    }

    get water_level() {
        return this.__water_level;
    }

    get nutrient_level() {
        return this.__nutrient_level;
    }

    refresh() {
        super.refresh();
        this.__water_transferred = false;
        this.__nutrient_transferred = false;
    }

    absorb_water(environment, potential_neighbours, valid_neighbour_types) {
        // Choose random neighbour
        let [offset_x, offset_y] = FastRandom.choice(potential_neighbours)
        let random_neighbour = environment.get(
            this.x + offset_x,
            this.y + offset_y
        );

        // Check if random neighbour is a valid type (feel free to rewrite implementation)
        let neighbour_valid_type = false;
        for (const valid_type of valid_neighbour_types) {
            if (random_neighbour instanceof valid_type) {
                neighbour_valid_type = true;
                break;
            }
        }

        // Method 1
        //let transfer_amount = 5;
        // Method 2
        let transfer_amount = FastRandom.int_max(10);
        // Method 3
        //let transfer_amount = Math.floor((random_neighbour.water_level - this.water_level) / (1.5 + FastRandom.random()));

        // Attempt to absorb water from random neighbour
        if (
            neighbour_valid_type &&
            this.water_level + transfer_amount <= this.water_capacity &&
            random_neighbour.water_level >= transfer_amount &&
            this.water_level + transfer_amount < random_neighbour.water_level &&
            !random_neighbour.__water_transferred &&
            !this.__water_transferred
        ) {
            // Transfer water
            this.water_level += Math.max(transfer_amount, 1);
            random_neighbour.water_level -= Math.max(transfer_amount, 1);

            // Ensure water is not transfered again this tick
            this.__water_transferred = true;
            random_neighbour.__water_transferred = true;
        }
    }

    absorb_nutrients(environment, potential_neighbours, valid_neighbour_types) {
        // Choose random neighbour
        let [offset_x, offset_y] = FastRandom.choice(potential_neighbours);
        let random_neighbour = environment.get(
            this.x + offset_x,
            this.y + offset_y
        );

        // Check if random neighbour is a valid type (feel free to rewrite implementation)
        let neighbour_valid_type = false;
        for (const valid_type of valid_neighbour_types) {
            if (random_neighbour instanceof valid_type) {
                neighbour_valid_type = true;
                break;
            }
        }

        // Method 1
        //let transfer_amount = 5;
        // Method 2
        //let transfer_amount = FastRandom.int_max(1);
        // Method 3
        let transfer_amount = Math.floor(
            (random_neighbour.nutrient_level - this.nutrient_level) /
                (1.5 + FastRandom.random())
        );

        // Attempt to absorb nutrient from random neighbour
        if (
            neighbour_valid_type &&
            this.nutrient_level + transfer_amount <= this.nutrient_capacity &&
            random_neighbour.nutrient_level >= transfer_amount &&
            this.nutrient_level + transfer_amount <
                random_neighbour.nutrient_level &&
            !random_neighbour.__nutrient_transferred &&
            !this.__nutrient_transferred
        ) {
            // Transfer nutrient
            this.nutrient_level += Math.max(transfer_amount, 1);
            random_neighbour.nutrient_level -= Math.max(transfer_amount, 1);

            // Ensure nutrient is not transfered again this tick
            this.__nutrient_transferred = true;
            random_neighbour.__nutrient_transferred = true;
        }
    }

    compute_transpiration(environment) {
        // Evaporate water_level into steam in correct conditions
        if (FastRandom.random() < this.transpiration_chance &&
            environment.get(this.x, this.y + 1) instanceof AirParticle &&
            !environment.is_raining &&
            this.water_level > 0 && 
            environment.light_level == 100) {

            // Create new steam particle
            environment.set(new SteamParticle(this.x, this.y + 1, this.water_level))
            // Remove water_level
            this.water_level = 0
        }
    }

    get_color(s) {
        // if (this.nutrient_capacity != 0) {
        //    s.push()
        //    s.colorMode(s.RGB)
        //    //this.color = s.color((this.water_level - 30) * 10)
        //    this.color = s.color((this.water_level - 30) * 10)
        //    s.pop()
        //    return this.color
        // }

        // Initialise colour if needed
        if (this.color === "#FF00FF") {
            super.get_color(s);
        }

        this.color = s.color(
            s.hue(this.color),
            s.saturation(this.base_color) * this.saturation_offset,
            s.brightness(this.base_color) * this.brightness_offset -
                this.water_level / 4
        );
        return this.color;
    }
}
