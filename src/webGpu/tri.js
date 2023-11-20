import * as glm from "../../external/glm/index.js";
import { lookAtMatrix } from "../base/mxm.js";

const vertices = new Float32Array([
	-0.5, -0.5, 1.0, 1.0, 0.0,
	+0.5, -0.5, 0.0, 1.0, 1.0,
	-0.5, +0.5, 1.0, 0.0, 1.0,
    -0.5, +0.5, 1.0, 0.0, 1.0,
	+0.5, +0.5, 0.0, 1.0, 0.0,
	+0.5, -0.5, 0.0, 1.0, 1.0,
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
            arrayStride: 20, // sizeof(vec2f)
            attributes: [
            {
                format: "float32x2",
                offset: 0,
                shaderLocation: 0,
            },
            {
                format: "float32x3",
                offset: 8,
                shaderLocation: 1,
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
            size: 4 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        canvas.device.queue.writeBuffer(this.uniformBuffer2, 0, new Float32Array([0, 0, 0, 0]));

        const shaderModule = canvas.device.createShaderModule({
            label: 'Shader',
            code: `
                struct VertexInput {
                    @builtin(instance_index) instance: u32,
                    @location(0) pos: vec2f,
                    @location(1) colour: vec3f,
                };
              
                struct VertexOutput {
                    @builtin(position) pos: vec4f,
                    @location(0) outColour: vec3f,
                };

                @group(0) @binding(0) var<uniform> view: mat4x4<f32>;
                @group(0) @binding(1) var<uniform> data: vec4<f32>;
                @vertex
                fn vertexMain(input: VertexInput) -> VertexOutput {
                    var p = vec4f(input.pos + data.xy, 0, 1);
                    p.x += f32(input.instance) * 2 - 1;
                    var cp = view * p;
                    cp = vec4f(4 * (cp.zy / cp.x), cp.x / 100.0, 1.0f);
                    cp.y *= data.z;
                    
                    var out: VertexOutput;

                    out.pos = cp;
                    out.outColour = input.colour;
                    return out;
                }
                
                struct FragInput {
                    @location(0) colour: vec3f,
                };
                
                @fragment
                fn fragmentMain(input: FragInput) -> @location(0) vec4f {
                    return vec4f(input.colour, 1);
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
        const m = lookAtMatrix([Math.cos(elpTime / 500) * 20, 10, Math.sin(elpTime / 500, 10) * 20], [0, 0, 0]);
        this.canvas.device.queue.writeBuffer(this.uniformBuffer, 0, m);
        
        pass.setPipeline(this.pipeline);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, this.bindGroup);

        this.canvas.device.queue.writeBuffer(this.uniformBuffer2, 0,
            new Float32Array([0, 0, this.canvas.canvasWidth / this.canvas.canvasHeight, 0]));
        pass.draw(vertices.length / 5, 2);	
    }
};