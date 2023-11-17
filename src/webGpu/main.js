import { Canvas } from "../base/Canvas.js";
import { Tri } from "../webGpu/tri.js";

var canvas;
var tri;

$(document).ready(function()
{
	main();
});

async function main()
{
	Canvas.initialRun();

	canvas = await new Canvas(1, true);
	await canvas.initWebGPU();

	tri = new Tri(canvas);

	canvas.renderObjects.push(tri);

	canvas.goGPU();
}