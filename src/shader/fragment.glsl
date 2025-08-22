#version 300 es
precision highp float;

uniform vec4 u_resolution;

in vec2 v_uv;
in vec3 v_cameraPosition;
out vec4 fragColor;

uniform mat4 u_invModel;
uniform mat4 u_invView;
uniform mat4 u_invProjection;
uniform vec3 u_cameraPosition;

float PI = 3.1415926535897932384626433832795;

float signedDistanceSphere(vec3 p, float r) {
    return length(p) - r;
}

float map(vec3 p) {
    return signedDistanceSphere(p, 2.0);
}

vec3 computeNormal(vec3 p) {
    float eps = 0.001;
    vec3 n;
    n.x = map(p + vec3(eps, 0.0, 0.0)) - map(p - vec3(eps, 0.0, 0.0));
    n.y = map(p + vec3(0.0, eps, 0.0)) - map(p - vec3(0.0, eps, 0.0));
    n.z = map(p + vec3(0.0, 0.0, eps)) - map(p - vec3(0.0, 0.0, eps));
    return normalize(n); 
}

void main() {
    // start by going backwards from device coords to world coords

    // first, adjust for aspect ratio
    vec2 adjustedUV = (v_uv - vec2(0.5))* u_resolution.zw + vec2(0.5);

    // convert normalized device coords to clip space
    vec4 clip = vec4(v_uv, -1.0, 1.0);

    // convert clip space to view space and scale to homogeneous coordinates
    vec4 view = u_invProjection * clip;
    view /= view.w; 

    // convert to world coords 
    vec3 rayDirection = normalize((u_invView * vec4(view.xyz, 0.0)).xyz);

    // raymarching
    float t = 0.0;
    float tMax = 10.0;
    bool hit = false;

    for (int i=0;i<256;++i) {

        vec3 p = v_cameraPosition + rayDirection * t;
        float h = map(p);

        // hit the surface
        if (h < 0.001) {
            hit = true;
            break; 
        }

        t+=h;
        
        if (t > tMax) {
            break; 
        }
    } 

    vec3 color = vec3(0.0);

    // compute the normal and color for the hit point
    if (t < tMax) {
        vec3 p = v_cameraPosition + rayDirection * t;
        vec3 normal = computeNormal(p);

        vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0));
        float diffuse = max(dot(normal, lightDir), 0.0);
        
        // simple Lambertian color
        color = vec3(diffuse);
    }

    fragColor = vec4(color, 1.0);
}
