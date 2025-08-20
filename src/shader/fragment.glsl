#version 300 es
precision highp float;

uniform float time;
uniform float progress;
uniform sampler2D u_texture;
uniform vec4 u_resolution;

in vec2 v_uv;
out vec4 fragColor;

float PI = 3.1415926535897932384626433832795;

float signedDistanceSphere(vec3 p, float r) {
    return length(p) - r;
}

float map(vec3 p) {
    return signedDistanceSphere(p, 1.0);
}

void main() {
    vec2 newUV = (v_uv - vec2(0.5)) * u_resolution.zw + vec2(0.5); // correct for aspect ratio
    fragColor = vec4(newUV, 0.0, 1.0);
}
