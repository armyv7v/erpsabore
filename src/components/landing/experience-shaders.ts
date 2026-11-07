export const VERTEX_SHADER = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform float uScroll;
uniform float uOrbit;
uniform float uFit;
uniform float uCamX;

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

mat2 rot2(float a){
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float sdTorus(vec3 p, float R, float r){
  vec2 q = vec2(length(p.xz) - R, p.y);
  return length(q) - r;
}

float smin(float a, float b, float k){
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float shape(vec3 p){
  float ang = atan(p.z, p.x);
  float ripple = sin(ang * 3.0 + uTime * 0.32) * 0.05;
  float core = length(p) - 0.44;
  float ringA = sdTorus(p, 0.92, 0.30 + ripple);
  vec3 q = p;
  q.xz = rot2(1.12) * q.xz;
  q.yz = rot2(-0.86) * q.yz;
  q.y -= 0.16;
  float ringB = sdTorus(q, 0.60, 0.19);
  return smin(smin(core, ringA, 0.28), ringB, 0.22);
}

float map(vec3 p){
  vec3 q = p / uFit;
  q.xz = rot2(uOrbit + uPointer.x * 0.38) * q.xz;
  q.yz = rot2(-0.16 + uPointer.y * 0.26 + uScroll * 0.35) * q.yz;
  q.y += uScroll * 0.1;
  return shape(q) * uFit;
}

vec3 normalAt(vec3 p){
  const float e = 0.0016;
  vec2 k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * map(p + k.xyy * e) +
    k.yyx * map(p + k.yyx * e) +
    k.yxy * map(p + k.yxy * e) +
    k.xxx * map(p + k.xxx * e)
  );
}

vec3 backdrop(vec2 p){
  vec3 c = vec3(0.953, 0.949, 0.941);
  float ember = exp(-length(p * vec2(1.0, 1.15) - vec2(0.0, 0.02)) * 2.8);
  c += vec3(0.604, 0.373, 0.149) * ember * 0.040;
  vec2 warmPos = p - vec2(0.34, -0.26);
  c += vec3(0.902, 0.659, 0.408) * exp(-length(warmPos) * 4.0) * 0.10;
  vec2 olivePos = p - vec2(-0.42, 0.30);
  c += vec3(0.259, 0.263, 0.110) * exp(-length(olivePos) * 4.2) * 0.045;
  return c;
}

vec3 shade(vec3 p, vec3 n, vec3 rd){
  vec3 v = -rd;
  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);
  vec3 r = reflect(rd, n);
  float sky = clamp(r.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 env = mix(vec3(0.114, 0.075, 0.055), vec3(0.973, 0.965, 0.957), pow(sky, 1.35));
  float horizon = exp(-pow((r.y + 0.06) * 4.0, 2.0));
  env += vec3(0.604, 0.373, 0.149) * horizon * 0.5;
  env += vec3(0.902, 0.659, 0.408) * pow(max(r.y, 0.0), 18.0) * 0.55;
  vec3 base = vec3(0.240, 0.145, 0.075);
  vec3 col = mix(base, env, 0.52 + 0.48 * fres);
  col += vec3(0.973, 0.965, 0.957) * fres * 0.14;
  vec3 L = normalize(vec3(-0.55, 0.9, 0.6));
  float spec = pow(max(dot(n, normalize(L + v)), 0.0), 110.0);
  col += vec3(1.0, 0.95, 0.88) * spec * 0.75;
  float bounce = pow(max(dot(n, normalize(vec3(-0.4, -0.8, -0.2) + v)), 0.0), 20.0);
  col += vec3(0.420, 0.220, 0.080) * bounce * 0.20;
  col *= 1.0 - clamp(-n.y, 0.0, 1.0) * 0.16;
  return col;
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = vec3(-uCamX, -0.14, 3.55 + uScroll * 0.85);
  vec3 rd = normalize(vec3(p, -1.55));
  float t = 0.0;
  float d = 0.0;
  bool hit = false;
  for (int i = 0; i < 108; i++){
    vec3 pos = ro + rd * t;
    d = map(pos);
    if (d < 0.0012){ hit = true; break; }
    t += max(d * 0.86, 0.0025);
    if (t > 12.0) break;
  }
  vec3 col = backdrop(p);
  if (hit){
    vec3 pos = ro + rd * t;
    vec3 n = normalAt(pos);
    vec3 shaded = shade(pos, n, rd);
    float depthFade = 1.0 - smoothstep(8.5, 11.0, t);
    col = mix(col, shaded, 0.06 + 0.94 * depthFade);
  }
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.012;
  float vig = 1.0 - smoothstep(0.35, 1.45, length(p * vec2(0.92, 1.06)));
  col *= 0.94 + 0.06 * vig;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
