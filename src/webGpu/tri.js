import * as glm from "../../external/glm/index.js";
import { lookAtMatrix } from "../base/mxm.js";

const vertices = new Float32Array([
	-0.5, -0.5,
	+0.5, -0.5,
	-0.5, +0.5,
    -0.5, +0.5,
	+0.5, +0.5,
	+0.5, -0.5,
]);

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
            arrayStride: 8, // sizeof(vec2f)
            attributes: [{
                format: "float32x2",
                offset: 0,
                shaderLocation: 0,
            }],
        };
        
        var camMatrix = glm.mat4.create();

        camMatrix = canvas.camera.ortho;

        this.uniformBuffer = canvas.device.createBuffer({
            label: "Cam matrix",
            size: camMatrix.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        canvas.device.queue.writeBuffer(this.uniformBuffer, 0, camMatrix.buffer);

        this.uniformBuffer2 = canvas.device.createBuffer({
            label: "Screen ratio",
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        canvas.device.queue.writeBuffer(this.uniformBuffer2, 0, new Float32Array([4]));

        const shaderModule = canvas.device.createShaderModule({
            label: 'Shader',
            code: `
                @group(0) @binding(0) var<uniform> view: mat4x4<f32>;
                @group(0) @binding(1) var<uniform> screenRatio: f32;
                @vertex
                fn vertexMain(@location(0) pos: vec2f) ->
                @builtin(position) vec4f {
                    var cp = view * vec4f(pos, 0, 1);
                    cp = vec4f(2 * (cp.yz / cp.x), cp.x / 100.0, 1.0f);
                    cp.y *= screenRatio;
                    return cp;
                }

                @fragment
                fn fragmentMain() -> @location(0) vec4f {
                    return vec4f(0, 1, 1, 1);
                }
            `
        });

        this.pipeline = canvas.device.createRenderPipeline({
            label: "Pipeline",
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
            label: "Renderer bind group",
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
            {
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
        const m = lookAtMatrix([Math.cos(elpTime / 1000) * 10, Math.cos(elpTime / 1000) * 10, Math.sin(elpTime / 1000) * 10], [0, 0, 0]);
        this.canvas.device.queue.writeBuffer(this.uniformBuffer, 0, m);
        
        this.canvas.device.queue.writeBuffer(this.uniformBuffer2, 0, new Float32Array([this.canvas.canvasWidth / this.canvas.canvasHeight]));

        pass.setPipeline(this.pipeline);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(vertices.length / 2);	
    }
};