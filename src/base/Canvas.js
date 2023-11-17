import { Camera2D } from "../base/Camera2D.js";

var pausePath = "M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z";
var resumePath = "m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z";

var fullscreenPath = "M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707z";
var minimizePath = "M.172 15.828a.5.5 0 0 0 .707 0l4.096-4.096V14.5a.5.5 0 1 0 1 0v-3.975a.5.5 0 0 0-.5-.5H1.5a.5.5 0 0 0 0 1h2.768L.172 15.121a.5.5 0 0 0 0 .707zM15.828.172a.5.5 0 0 0-.707 0l-4.096 4.096V1.5a.5.5 0 1 0-1 0v3.975a.5.5 0 0 0 .5.5H14.5a.5.5 0 0 0 0-1h-2.768L15.828.879a.5.5 0 0 0 0-.707z"

var prPaths = [pausePath, resumePath]
var fmPaths = [fullscreenPath, minimizePath]

export class Canvas
{
    static fullClickedCanvas = null;

    constructor(id, initWGPU = false)
    {
        this.wGPU = initWGPU;
        this.id = id;
        this.container = document.getElementById("canvasContainer" + id);
        this.body = document.getElementById("myCanvas" + id);

        if (!initWGPU)
	        this.gl = this.body.getContext("webgl", { antialias: true });

        this.camera = new Camera2D(this);

        this.prCurrentPath = 0;
        this.prButton = document.getElementById("resumePauseButton" + id);
        this.prPath = document.getElementById("resumePausePath" + id);

        this.fmCurrentPath = 0;
        this.fmButton = document.getElementById("canvasSizeToggle" + id);
        this.fmPath = document.getElementById("canvasSizePath" + id);

        this.mousePos = new Array(2);

        this.currentTime = new Date();
        this.renderObjects = [];

        this.elapsedTime = 0.0;
        this.lastTime = this.currentTime.getTime();

        this.setSize();

        this.initialCanvasSizes = [this.body.getAttribute("width"), this.body.getAttribute("height")];
        
        if (!initWGPU)
            this.gl.viewport(0, 0, this.body.getAttribute("width"), this.body.getAttribute("height"));

        this.prButton.addEventListener("click", () => 
        {
            this.prCurrentPath ^= 1;
            this.prPath.setAttribute('d', prPaths[this.prCurrentPath]);
        });

        this.body.addEventListener("mousemove", (event) => 
        {
            const rect = this.body.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.mousePos[0] = x * window.devicePixelRatio;
            this.mousePos[1] = y * window.devicePixelRatio;
        });

        this.fmButton.addEventListener("click", () => 
        {
            if (this.fmCurrentPath == 0)
            {
                this.container.requestFullscreen();
                Canvas.fullClickedCanvas = this;
            }
            else
            {
                document.exitFullscreen();
                Canvas.fullClickedCanvas = this;
            }

            this.fmCurrentPath ^= 1;
            this.fmPath.setAttribute('d', fmPaths[this.fmCurrentPath]);
        });
    }

    async initWebGPU()
    {
        if (!navigator.gpu)
        {
            alert("WebGPU is not supported on this device.");
            return;
        }
        this.adapter = await navigator.gpu.requestAdapter();
        
        if (!this.adapter)
        {
            alert("No appropriate GPUAdapter found.");
            return;
        }

        this.device = await this.adapter.requestDevice();

        if (!this.device)
        {
            alert("Device request error.");
            return;
        }

        this.context = this.body.getContext("webgpu");
        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: this.canvasFormat,
        });
    }
    
    waitLoop()
    {
        this.lastTime = this.currentTime.getTime();

        this.currentTime = new Date();

        if (this.prCurrentPath != 1)
        {
            if (this.wGPU)
                requestAnimationFrame(() => this.goGPU());
            else
                requestAnimationFrame(() => this.goGL());
        }
        else
        {
            requestAnimationFrame(() => this.waitLoop());
        }
    }

    goGPU()
    {
        if (this.prCurrentPath == 1)
        {
            this.lastTime = this.currentTime.getTime();
            requestAnimationFrame(() => this.waitLoop());
            return;
        }

        this.elapsedTime += this.currentTime.getTime() - this.lastTime;
        this.lastTime = this.currentTime.getTime();

        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                loadOp: "clear",
                storeOp: "store",
            }]
        });
        
        this.currentTime = new Date();

        this.renderObjects.forEach(obj =>
        {
            obj.draw(this.elapsedTime, pass);
        });

        pass.end();
        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);

        requestAnimationFrame(() => this.goGPU());
    }

    goGL()
    {
        if (this.prCurrentPath == 1)
        {
            this.lastTime = this.currentTime.getTime();
            requestAnimationFrame(() => this.waitLoop());
            return;
        }

        this.elapsedTime += this.currentTime.getTime() - this.lastTime;
        this.lastTime = this.currentTime.getTime();

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.currentTime = new Date();

        this.renderObjects.forEach(obj =>
        {
            obj.draw(this.elapsedTime);
        });

        requestAnimationFrame(() => this.goGL());
    }

    setSize()
    {
        const rect = this.container.getBoundingClientRect();

        const screenWidth = rect.width;

        this.body.setAttribute('width', screenWidth * window.devicePixelRatio * 0.8);
        this.body.setAttribute('height', screenWidth * window.devicePixelRatio * 0.5);
    }

    static initialRun()
    {
        document.addEventListener('fullscreenchange', (event) =>
        {
            if (Canvas.fullClickedCanvas == null)
            {
                return;
            }

            if (document.fullscreenElement)
            {
                Canvas.fullClickedCanvas.body.setAttribute('width', window.screen.width * window.devicePixelRatio);
                Canvas.fullClickedCanvas.body.setAttribute('height', window.screen.height * window.devicePixelRatio);
                Canvas.fullClickedCanvas.body.width = window.screen.width * window.devicePixelRatio;
                Canvas.fullClickedCanvas.body.height = window.screen.height * window.devicePixelRatio;
                if (!Canvas.fullClickedCanvas.wGPU)
                    Canvas.fullClickedCanvas.gl.viewport(0, 0, window.screen.width * window.devicePixelRatio, window.screen.height * window.devicePixelRatio);
                Canvas.fullClickedCanvas.container.style.width = "100%";
                Canvas.fullClickedCanvas.body.style.width = "100%";
                Canvas.fullClickedCanvas.prButton.style.right = "1%";
                Canvas.fullClickedCanvas.fmButton.style.right = "1%";

                Canvas.fullClickedCanvas.fmCurrentPath = 1;
            }
            else
            {
                Canvas.fullClickedCanvas.setSize();
                
                Canvas.fullClickedCanvas.body.style.width = "80%";
                Canvas.fullClickedCanvas.prButton.style.right = "11%";
                Canvas.fullClickedCanvas.fmButton.style.right = "11%";

                Canvas.fullClickedCanvas.body.width = Canvas.fullClickedCanvas.initialCanvasSizes[0];
                Canvas.fullClickedCanvas.body.height = Canvas.fullClickedCanvas.initialCanvasSizes[1];
                if (!Canvas.fullClickedCanvas.wGPU)
                    Canvas.fullClickedCanvas.gl.viewport(0, 0, Canvas.fullClickedCanvas.initialCanvasSizes[0], Canvas.fullClickedCanvas.initialCanvasSizes[1]);

                Canvas.fullClickedCanvas.fmCurrentPath = 0;
            }

            Canvas.fullClickedCanvas.fmPath.setAttribute('d', fmPaths[Canvas.fullClickedCanvas.fmCurrentPath]);

            if (!document.fullscreenElement)
            {
                Canvas.fullClickedCanvas = null;
            }
        });
    }
}