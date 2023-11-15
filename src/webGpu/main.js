$(document).ready(function()
{
	main();
});


var canvas;
var adapter;
var device;
var context;

const vertices = new Float32Array([
	-0.8, -0.8,
	0.8, -0.8,
	0.0,  0.8,
]);
var vertexBuffer;
var cellPipeline;

async function initer()
{
	canvas = document.querySelector("canvas");

	if (!navigator.gpu)
	{
		alert("WebGPU is not supported on this device.");
		return;
	}
	adapter = await navigator.gpu.requestAdapter();
	
	if (!adapter) {
	  throw new Error("No appropriate GPUAdapter found.");
	}

	device = await adapter.requestDevice();

	context = canvas.getContext("webgpu");
	const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
	context.configure({
		device: device,
		format: canvasFormat,
	});

	vertexBuffer = device.createBuffer({
		label: "Cell vertices",
		size: vertices.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(vertexBuffer, 0, vertices);

	const vertexBufferLayout = {
		arrayStride: 8,
		attributes: [{
			format: "float32x2",
			offset: 0,
			shaderLocation: 0, // Position, see vertex shader
		}],
	};

	const cellShaderModule = device.createShaderModule({
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

	cellPipeline = device.createRenderPipeline({
		label: "Cell pipeline",
		layout: "auto",
		vertex: {
			module: cellShaderModule,
			entryPoint: "vertexMain",
			buffers: [vertexBufferLayout]
		},
		fragment: {
			module: cellShaderModule,
			entryPoint: "fragmentMain",
			targets: [{
			format: canvasFormat
			}]
		}
	});
}

function render()
{
	const encoder = device.createCommandEncoder();
	const pass = encoder.beginRenderPass({
		colorAttachments: [{
			view: context.getCurrentTexture().createView(),
			loadOp: "clear",
			storeOp: "store",
		}]
	});

	pass.setPipeline(cellPipeline);
	pass.setVertexBuffer(0, vertexBuffer);
	pass.draw(vertices.length / 2); // 6 vertices

	pass.end();

	const commandBuffer = encoder.finish();
	device.queue.submit([commandBuffer]);
}

async function main()
{
	await initer();

	render();
}