import * as vec2 from "../../external/glm/vec2.js";
import * as mat4 from "../../external/glm/mat4.js";

export class Camera2D
{
    constructor(canvas, position=vec2.fromValues(0.0, 0.0), limits=vec2.fromValues(16.0, 9.0))
    {
        this.canvas = canvas;
        this.position = position;
        this.limits = limits;

        this.ortho = mat4.create();
    }

    updateOrtho()
    {
        mat4.ortho(this.ortho, 0, this.limits.x, 0, this.limits.y, -1, 1);
    }
}