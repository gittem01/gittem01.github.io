export class Shader
{
    constructor(gl, folderName)
    {
        var vertexFile = folderName + "/vertex.vert";
        var pixelFile = folderName + "/pixel.frag";

        this.gl = gl;
        this.program = gl.createProgram();

        var vertexShader = this.getShader(vertexFile, gl.VERTEX_SHADER);
        var pixelShader = this.getShader(pixelFile, gl.FRAGMENT_SHADER);

        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, pixelShader);
        gl.linkProgram(this.program);
    }

    getShader(url, type)
    {
        var shader = this.gl.createShader(type);
        var shaderText;
        $.ajax({
            url: url,
            dataType: 'text',
            async: false,
            success: function(shaderSource) {
                shaderText = shaderSource;
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error loading shader:', errorThrown);
            }
        });

        this.gl.shaderSource(shader, shaderText);
        this.gl.compileShader(shader);

        const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!success)
        {
            const error = this.gl.getShaderInfoLog(shader);
            console.error("Shader compilation error: " + error);
        }

        return shader;
    }

    setUniformFloat(name, val)
    {
        const location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniform1fv(location, val);
    }

    setUniformVec2(name, vec2)
    {
        const location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniform2fv(location, vec2);
    }

    setUniformVec3(name, vec3)
    {
        const location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniform3fv(location, vec3);
    }

    setUniformVec4(name, vec4)
    {
        const location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniform4fv(location, vec4);
    }

    setUniformMat4(name, mat4)
    {
        const location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniformMatrix4fv(location, false, mat4);
    }
}