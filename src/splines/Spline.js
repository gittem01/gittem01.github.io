import { Shader } from "../base/Shader.js";


export class Spline
{
    static vertexBuffer;
    static numVertices;

    constructor(canvas, numSquares=1)
    {
        var start = 0.0;
        var vertices = new Array(12 * numSquares);

        for (var i = 0; i < numSquares - 1; i++)
        {
            const nextStart = (i + 1) / numSquares;

            vertices.push(
                nextStart, +0.5,
                start, -0.5,
                nextStart, -0.5,

                nextStart, +0.5,
                start, +0.5,
                start, -0.5,
            );

            start = nextStart;
        }

        vertices.push(
            +1.0, +0.5,
            start, -0.5,
            +1.0, -0.5,

            +1.0, +0.5,
            start, +0.5,
            start, -0.5,
        );

        this.canvas = canvas;
        Spline.numVertices = 12 * numSquares;
    
        this.shader = new Shader(canvas.gl, "../../shaders/triangle");

        Spline.vertexBuffer = canvas.gl.createBuffer();
        canvas.gl.bindBuffer(canvas.gl.ARRAY_BUFFER, Spline.vertexBuffer);
        canvas.gl.bufferData(canvas.gl.ARRAY_BUFFER, new Float32Array(vertices), canvas.gl.STATIC_DRAW);
    
        const positionAttributeLocation = canvas.gl.getAttribLocation(this.shader.program, 'aPosition');
        canvas.gl.enableVertexAttribArray(positionAttributeLocation);
        canvas.gl.bindBuffer(canvas.gl.ARRAY_BUFFER, Spline.vertexBuffer);
        canvas.gl.vertexAttribPointer(positionAttributeLocation, 2, canvas.gl.FLOAT, false, 0, 0);

        this.canvas.gl.useProgram(this.shader.program);
        this.shader.setUniformFloat("thick", [0.02]);
        this.shader.setUniformVec2("p0", [-0.4 + Math.sin(0.0) * 0.1, Math.cos(0.0 * 2.41) * 0.1]);
        this.shader.setUniformVec2("n0", [Math.sin(0.0 * 2.1245) * 3.5323, Math.cos(0.0 * 4.0341) * 2.415]);
        this.shader.setUniformVec2("p1", [0.5, 0.0]);
        this.shader.setUniformVec2("n1", [Math.sin(0.0) * 3.0, Math.cos(0.0) * 3.76543]);
    }

    draw(time)
    {
        this.canvas.gl.useProgram(this.shader.program);
        
        this.shader.setUniformFloat("thick", [0.02]);
        this.shader.setUniformVec2("p0", [-0.5, 0.0]);
        this.shader.setUniformVec2("n0", [Math.sin(time * 0.005), 2.0]);
        this.shader.setUniformVec2("p1", [0.5, 0.0]);
        this.shader.setUniformVec2("n1", [Math.sin(time * 0.003) * 3.0, Math.cos(time * 0.003) * 2.0]);
        
        this.canvas.gl.drawArrays(this.canvas.gl.TRIANGLES, 0, Spline.numVertices);
    }
}