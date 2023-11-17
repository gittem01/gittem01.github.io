const vertices = new Float32Array([
	-0.8, -0.8,
	0.8, -0.8,
	0.0,  0.8,
]);

export class Tri
{
    constructor(canvas)
    {
        this.canvas = canvas;
        console.log(canvas);
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

        const shaderModule = canvas.device.createShaderModule({
            label: 'Cell shader',
            code: `
                @vertex
                fn vertexMain(@location(0) pos: vec2f) ->
                @builtin(position) vec4f {
                return vec4f(pos, 0, 1);
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
    }

    draw(elpTime, pass)
    {
        pass.setPipeline(this.pipeline);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(vertices.length / 2);	
    }
};