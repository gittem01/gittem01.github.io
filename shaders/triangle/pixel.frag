precision mediump float;

varying float stress;

void main()
{
    gl_FragColor = vec4(1.0 - stress, 0.0, stress, 1.0);
}