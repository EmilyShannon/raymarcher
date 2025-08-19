precision highp float;
varying vec2 v_uv;

void main() {
    //test: colorful gradient
    gl_FragColor = vec4(v_uv, 0.5 + 0.5 * sin(v_uv.x * 10.0), 1.0);
    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // bright red
}