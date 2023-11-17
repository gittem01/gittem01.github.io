import { Canvas } from "../base/Canvas.js";
import { Spline } from "../splines/Spline.js";


var canvas;
var spline;

$(document).ready(function()
{
	main();
});

function main()
{
	Canvas.initialRun();

	canvas = new Canvas(1);

	spline = new Spline(canvas, 500);

	canvas.renderObjects.push(spline);

	canvas.goGL();
}