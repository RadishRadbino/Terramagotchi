import { ShootSystemParticle } from "./shoot_system";

import {
    AirParticle,
    SoilParticle,
    GrassParticle,
} from "..";

import {
    Environment,
    NUTRIENT_ENERGY_RATIO,
    WATER_ENERGY_RATIO,
} from "../../environment";

import { PlantFamilyParticle } from "./plant";
import { RootParticle } from "./root";

export class BarkParticle extends ShootSystemParticle {
    /**
     * @param {Number}  x           (Integer) x-coordinate of particle to be constructed
     * @param {Number}  y           (Integer) y-coordinate of particle to be constructed
     * @param {DNANode} plant_dna   The DNA-node object for this plant particle. Represents a node in a tree graph.
     */
    constructor(x, y, plant_dna=null) {
        super(x, y, plant_dna);
        this.activation_level = 0

        this.is_active = true
        this.__child_directions = null
        this.__try_populate_roots = (this.dna == this.dna.get_root())
    }

    /**
     * Handles update function for the bark particle
     * @param {Environment} environment     The current game environment
     */
    update(environment) {
        this.health_update(environment)
        if (this.dead) {
            this.die(environment)
            return;
        }
        this.health = this.max_health // Keep bark alive

        // Uncomment to grow roots below all particles
        //this.populate_roots(environment)

        if (this.dead || !this.is_active)
            return;
        
        // this.absorb_nutrients(environment)
        // this.absorb_water(environment)

        if (this.__current_length < this.__thickness && this.energy >= this.activation_level)
            this.grow(environment)
    }

    /**
     * Creates new root systems in soil if underneath, only if current bark is part from the root trunk.
     * Will only attempt to add roots once; if soil is added underneath bark after the function is run once,
     * no roots will be spawned underneath
     * @param {Environment} environment     The current environment of the application
     */
    populate_roots(environment) {
        if (!this.__try_populate_roots)
            return
        
        let target_particle = environment.get(this.x, this.y - 1)
        if (target_particle instanceof SoilParticle) {
            let new_root_particle = new RootParticle(this.x, this.y - 1, this.dna)
            new_root_particle.parent_root_particle = [this.x, this.y]
            new_root_particle.is_node = true;
            new_root_particle.is_first_particle = true;
            environment.set(new_root_particle)
        }
        this.__try_populate_roots = false
    }

    /**
     * Handles growing of bark particles from one another.
     * Will try to grow into 3 neighbouring cells which are closest to the current growth_angle.
     * Will become inactive at any point where all 3 cells that the bark particle is checking become BarkParticles
     * @param {Environment} environment Current application game environment
     */
    grow(environment) {
        if (this.__child_directions == null) {
            let [base_x, base_y] = this.convert_angle_to_offset(this.growth_angle)
            this.__child_directions = [[base_x, base_y]]
            this.__child_directions.push(this.get_rotated_offset(base_x, base_y, -1))
            this.__child_directions.push(this.get_rotated_offset(base_x, base_y, 1))
        }

        // Condition to "turn off" bark
        if (this.__child_directions.length == 0) {
            this.is_active = false
            return
        }

        let [offset_x, offset_y] = this.__child_directions.shift()
        let target_particle = environment.get(this.x+offset_x, this.y+offset_y)

        if (target_particle instanceof AirParticle || target_particle instanceof GrassParticle) {
            let new_bark_particle = new BarkParticle(this.x+offset_x, this.y+offset_y, this.dna)
            new_bark_particle.__current_length = this.__current_length + 1
            new_bark_particle.__thickness = this.__thickness
            new_bark_particle.growth_angle = this.growth_angle
            new_bark_particle.absorb_tier = -(this.__current_length + 1)

            if (PlantFamilyParticle.IS_NET_ZERO) {
                new_bark_particle.nutrient_level += this.activation_level * NUTRIENT_ENERGY_RATIO
                new_bark_particle.water_level += this.activation_level * WATER_ENERGY_RATIO
            }

            environment.set(new_bark_particle)
            this.energy -= this.activation_level
        }

        if (!(target_particle instanceof PlantFamilyParticle))
            this.__child_directions.push([offset_x, offset_y])
    }
}