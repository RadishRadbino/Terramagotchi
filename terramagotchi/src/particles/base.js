export class BaseParticle {
    constructor() {
        this.base_color = "#000000";
        this.color_variance = 0.05;

        this.last_frame = -1
        /* Moveable: Describes whether a particle can be displaced due to any process
            Includes gravity and erosion 
            Protects plants/leaves from have heavy particles fall through */
        this.moveable = false;
        this.weight = 0;
        this.color = this.base_color;
        this.brightness_offset = 0; // Purely for organic particles wetness visual currently
        this.flow_direction = 0; // Purely for flowing particles to change direction (move to water class?)
        this.update_color = false;
    }

    update(x, y, grid, frame) {
        this.last_frame = frame;
    }

    compute_gravity(x, y, grid) {
        /**
         * Gravity update function. Moves particles down if
         *      The particle below is moveable, and
         *      The particle below has a lower weight
         * Sets moveable flag to false for both after move so particles cannot move
         * twice in one update
         */
        this.moveable = true;
        let particle_below = grid.get(x, y-1)
        if (particle_below.moveable && this.weight > particle_below.weight) {
            particle_below.moveable = false;
            this.moveable = false;
            grid.swap(x, y, x, y-1);
        }
    }

    compute_erosion(x, y, grid) {
        /**
         * Prevents single-cell hills from forming through artificial erosion
         */
        if (grid.get(x-1,y+1).weight < this.weight && grid.get(x,y+1).weight < this.weight && grid.get(x+1,y+1).weight < this.weight) {
            let free_neighbours = [0]
            if (grid.get(x-1, y).moveable && grid.get(x-1, y).weight < this.weight && grid.get(x-1, y-1).weight < this.weight)
                free_neighbours.push(-1)
            if (grid.get(x+1, y).moveable && grid.get(x+1, y).weight < this.weight && grid.get(x+1, y-1).weight < this.weight)
                free_neighbours.push(+1)
            if (free_neighbours.length > 1) {
                let offset = free_neighbours[Math.floor(Math.random()*free_neighbours.length)];
                if (offset != 0)
                    grid.swap(x, y, x+offset, y)
            }
        }
    }

    computer_flow(x,y,grid) {
        let particle_infront = grid.get(x+this.flow_direction,y);
        let particle_behind = grid.get(x-this.flow_direction,y);

        let can_move_infront = particle_infront.moveable && particle_infront.weight < this.weight
        let can_move_behind = particle_behind.moveable && particle_behind.weight < this.weight

        // Particle ahead cannot be moved
        if (!can_move_infront && can_move_behind) {
            // Swap direction
            this.flow_direction *= -1;

            let temp1 = particle_infront;
            particle_infront = particle_behind;
            particle_behind = temp1;

            let temp2 = can_move_infront;
            can_move_infront = can_move_behind;
            can_move_behind = temp2;
        }

        // Has space to move infront
        if (can_move_infront) {
            // Move ahead
            grid.swap(x,y,x+this.flow_direction,y);
            // Reattempt gravity after flowing
            if (this.moveable)
                this.compute_gravity(x+this.flow_direction, y, grid);
        }
    }

    // Function to initalise random colour variation and update colour when needed
    get_color(s) {
        // If color is uninitialised, randomise it based on color_variance
        if (this.color === "#000000") {
            let c = s.color(this.base_color);
            let min = 1 - this.color_variance;
            let max = 1 + this.color_variance;
            this.brightness_offset = Math.random() * (max - min) + min

            c = s.color(
                s.hue(c),
                s.saturation(c) * (Math.random() * (max - min) + min),
                s.brightness(c) * this.brightness_offset
            );
            this.color = c;
        }
        return this.color;
    }
}