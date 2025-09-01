#version 300 es
precision highp float;

uniform vec4 u_resolution;
uniform sampler2D u_matcapTexture;

in vec2 v_uv;
in vec3 v_cameraPosition;
out vec4 fragColor;

uniform mat4 u_invModel;
uniform mat4 u_invView;
uniform mat4 u_invProjection;

float PI = 3.1415926535897932384626433832795;

vec2 matcap(vec3 eye, vec3 normal) {
    vec3 reflected = reflect(eye, normal);
    float m = 2.8284271247461903 * sqrt(reflected.z+1.0);
    return reflected.xy / m + 0.5;
}

float signedDistanceSphere(vec3 p, float r) {
    return length(p) - r;
}

float signedDistanceBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// polynomial smooth min
float smoothMin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0 - h);
}

float map(vec3 p) {
    float sphereDist = signedDistanceSphere(p, 1.5);
    float boxDist = signedDistanceBox(p, vec3(1.0));
    return smoothMin(boxDist, sphereDist, 0.4);
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

    // convert to world space
    vec4 world = u_invView * view;
    world /= world.w;

    // the ray direction in view space is the view position - camera position (which is the origin in view space)
    vec3 rayDirection = normalize(world.xyz - v_cameraPosition);

    // raymarching
    float t = 0.0;
    float tMax = 10.0;
    bool hit = false;

    for (int i=0;i<256;++i) {

        vec3 p = v_cameraPosition + rayDirection * t;
        // transform world point into model space
        vec3 pModel = (u_invModel * vec4(p, 1.0)).xyz;
        float h = map(pModel);

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
        // transform world point into model space
        vec3 pModel = (u_invModel * vec4(p, 1.0)).xyz;
        vec3 normalModel = computeNormal(pModel);
        // transform normal back to world space using inverse transpose
        vec3 normal = normalize((transpose(u_invModel) * vec4(normalModel, 0.0)).xyz);
        // map the texture to the sphere using matcap
        vec2 matcapUV = matcap(rayDirection, normal);
        color = texture(u_matcapTexture, matcapUV).rgb;

    fragColor = vec4(color, 1.0);
}
