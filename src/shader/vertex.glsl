#version 300 es
precision highp float;
uniform vec3 u_cameraPosition;

in vec2 a_position; // position of quad vertices
out vec2 v_uv;
out vec3 v_cameraPosition;

void main() {
    v_uv = a_position; // stay in NDC space
    v_cameraPosition = u_cameraPosition;
    gl_Position = vec4(a_position, 0.0, 1.0); // position in clip space
}
