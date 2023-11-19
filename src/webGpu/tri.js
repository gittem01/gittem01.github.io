import * as glm from "../../external/glm/index.js";

const vertices = new Float32Array([
	-0.5, -0.5,
	0.5, -0.5,
	-0.5,  0.5,
    -0.5, 0.5,
	0.5, 0.5,
	0.5,  -0.5,
]);

const GRID_SIZE = 4;

export class Tri
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.vertexBuffer = canvas.device.createBuffer({
            label: "Vertices",
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        canvas.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);

        const vertexBufferLayout = {
            arrayStride: 8,
            attributes: [{
                format: "float32x2",
                offset: 0,
                shaderLocation: 0,
            }],
        };
        
        var camMatrix = glm.mat4.create();
        const width = canvas.body.getAttribute("width");
        const height = canvas.body.getAttribute("height");

        camMatrix = canvas.camera.ortho;

        this.uniformBuffer = canvas.device.createBuffer({
            label: "Cam matrix",
            size: camMatrix.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        canvas.device.queue.writeBuffer(this.uniformBuffer, 0, camMatrix.buffer);

        var pos = new Float32Array([0, 0]);
        this.uniformBuffer2 = canvas.device.createBuffer({
            label: "square mover",
            size: pos.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        canvas.device.queue.writeBuffer(this.uniformBuffer2, 0, pos.buffer);

        const shaderModule = canvas.device.createShaderModule({
            label: 'Cell shader',
            code: `
                @group(0) @binding(0) var<uniform> ortho: mat4x4<f32>;
                @group(0) @binding(1) var<uniform> posOffset: vec2<f32>;
                @vertex
                fn vertexMain(@location(0) pos: vec2f) ->
                @builtin(position) vec4f {
                    var m = ortho;
                    return ortho * vec4f(pos + posOffset, 0, 1);
                }
            
                @fragment
                fn fragmentMain() -> @location(0) vec4f {
                    return vec4f(1, 0, 0, 1);
                }
            `
        });

        this.pipeline = canvas.device.createRenderPipeline({
            label: "Cell pipeline",
            layout: "auto",
            vertex: {
                module: shaderModule,
                entryPoint: "vertexMain",
                buffers: [vertexBufferLayout]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fragmentMain",
                targets: [{ format: canvas.canvasFormat }]
            }
        });

        this.bindGroup = canvas.device.createBindGroup({
            label: "Cell renderer bind group",
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [{
              binding: 0,
              resource: { buffer: this.uniformBuffer }
            },
            {
                binding: 1,
                resource: { buffer: this.uniformBuffer2 }
            }],
          });          
    }

    draw(elpTime, pass)
    {
        this.canvas.device.queue.writeBuffer(this.uniformBuffer, 0, this.canvas.camera.ortho);

        var pos = new Float32Array([this.canvas.mousePos[0], -this.canvas.mousePos[1]]);
        pos[0] -= this.canvas.canvasWidth / 2; pos[1] += this.canvas.canvasHeight / 2;
        pos[0] *= 0.01; pos[1] *= 0.01;
        this.canvas.device.queue.writeBuffer(this.uniformBuffer2, 0, pos);

        pass.setPipeline(this.pipeline);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(vertices.length / 2);	
    }
};