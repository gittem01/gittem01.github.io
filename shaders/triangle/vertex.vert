attribute vec2 aPosition;

varying float stress;

uniform vec2 p0;
uniform vec2 p1;
uniform vec2 n0;
uniform vec2 n1;
uniform float thick;

float H00(float t) { return (2.0 * t * t * t) - (3.0 * t * t) + 1.0; }
float H10(float t) { return t * t * t - 2.0 * t * t + t; }
float H01(float t) { return -2.0 * t * t * t + 3.0 * t * t; }
float H11(float t) { return t * t * t - t * t; }

float der00(float t) {return 6.0 * t * t - 6.0 * t; }
float der10(float t) {return 3.0 * t * t - 4.0 * t + 1.0; }
float der01(float t) {return -6.0 * t * t + 6.0 * t; }
float der11(float t) {return 3.0 * t * t - 2.0 * t; }

// Define the spline function
vec2 spline(float t) {
    vec2 p = vec2(  
                    H00(t) * p0[0] + H10(t) * n0[0] + H01(t) * p1[0] + H11(t) * n1[0],
                    H00(t) * p0[1] + H10(t) * n0[1] + H01(t) * p1[1] + H11(t) * n1[1]
    );

    return p;
}

vec2 splineDer(float t)
{
    vec2 p = vec2(  
                    der00(t) * p0[0] + der10(t) * n0[0] + der01(t) * p1[0] + der11(t) * n1[0],
                    der00(t) * p0[1] + der10(t) * n0[1] + der01(t) * p1[1] + der11(t) * n1[1]
    );

    return p;
}

vec2 rot90(vec2 vec)
{
    return vec2(-vec.y, vec.x);
}

void main()
{
    float inter01 = aPosition.x;
    vec2 sPos = spline(inter01);
    vec2 derivative = splineDer(inter01);
    stress = length(derivative);
    derivative /= stress;
    stress = pow(stress * 0.25, 1.0);
    derivative = rot90(derivative);
    gl_Position = vec4(sPos + derivative * thick * aPosition.y, 0.0, 1.0);
}