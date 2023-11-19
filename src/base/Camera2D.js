import * as vec2 from "../../external/glm/vec2.js";
import * as mat4 from "../../external/glm/mat4.js";

export class Camera2D
{
    constructor(canvas, position=vec2.fromValues(0.0, 0.0), sizeMultiplier=0.01)
    {
        this.canvas = canvas;
        this.position = position;
        this.sizeMultiplier = sizeMultiplier;

        this.ortho = mat4.create();
        this.updateOrtho();
    }

    updateOrtho()
    {
        mat4.ortho(
            this.ortho,
            -this.sizeMultiplier * this.canvas.canvasWidth * 0.5, this.sizeMultiplier * this.canvas.canvasWidth * 0.5,
            -this.sizeMultiplier * this.canvas.canvasHeight * 0.5, this.sizeMultiplier * this.canvas.canvasHeight * 0.5,
            -1, 1);
    }
}