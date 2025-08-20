#version 300 es
precision highp float;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

in vec3 a_position;
in vec3 a_color;
in vec2 a_uv;

out vec3 v_color;
out vec2 v_uv;

void main() {
    v_color = a_color;
    v_uv = a_uv;
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
}
