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

float sdRoundBox(vec3 p, vec3 b, float r){
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

vec2 opU(vec2 a, vec2 b){
  return a.x < b.x ? a : b;
}

vec3 scenePoint(vec3 p){
  vec3 q = p / uFit;
  q.xz = rot2(uOrbit + uPointer.x * 0.34) * q.xz;
  q.yz = rot2(-0.08 + uPointer.y * 0.16 + uScroll * 0.12) * q.yz;
  q.y += uScroll * 0.03;
  return q;
}

vec3 bookPoint(vec3 p){
  vec3 q = p - vec3(0.66, -0.30, 0.42);
  q.xz = rot2(-0.36) * q.xz;
  q.yz = rot2(-0.18 + 0.012 * sin(uTime * 0.55)) * q.yz;
  return q;
}

vec2 mapObject(vec3 p){
  float bob = 0.004 * sin(uTime * 0.42);

  vec3 qa = p - vec3(-0.40, -0.40 + bob, 0.02);
  qa.xz = rot2(0.12 + 0.006 * sin(uTime * 0.35)) * qa.xz;
  float boxA = sdRoundBox(qa, vec3(0.34, 0.18, 0.29), 0.035);

  vec3 qb = p - vec3(0.05, -0.06 + bob * 0.8, 0.02);
  qb.xz = rot2(-0.10) * qb.xz;
  float boxB = sdRoundBox(qb, vec3(0.29, 0.16, 0.25), 0.030);

  vec3 qc = p - vec3(-0.14, 0.23 + bob * 0.6, 0.06);
  qc.xz = rot2(0.14) * qc.xz;
  float boxC = sdRoundBox(qc, vec3(0.24, 0.13, 0.21), 0.025);

  vec3 ql = p - vec3(0.07, -0.03 + bob * 0.8, 0.272);
  ql.xz = rot2(-0.10) * ql.xz;
  float label = sdRoundBox(ql, vec3(0.13, 0.07, 0.0025), 0.002);

  vec3 qt = p - vec3(-0.14, 0.36 + bob * 0.6, 0.06);
  qt.xz = rot2(0.14) * qt.xz;
  float tape = sdRoundBox(qt, vec3(0.035, 0.003, 0.20), 0.002);

  vec3 bp = bookPoint(p);
  float cover = sdRoundBox(bp - vec3(0.0, 0.0, -0.006), vec3(0.35, 0.27, 0.020), 0.012);
  float pageL = sdRoundBox(bp - vec3(-0.17, 0.0, 0.022), vec3(0.16, 0.24, 0.006), 0.004);
  float pageR = sdRoundBox(bp - vec3(0.17, 0.0, 0.022), vec3(0.16, 0.24, 0.006), 0.004);
  float ribbon = sdRoundBox(bp - vec3(0.14, -0.21, 0.033), vec3(0.018, 0.060, 0.003), 0.002);

  float table = sdRoundBox(p - vec3(0.0, -0.66, 0.0), vec3(2.2, 0.07, 1.5), 0.04);

  vec2 res = vec2(table, 0.0);
  res = opU(res, vec2(boxA, 1.0));
  res = opU(res, vec2(boxB, 1.0));
  res = opU(res, vec2(boxC, 1.0));
  res = opU(res, vec2(label, 4.0));
  res = opU(res, vec2(tape, 5.0));
  res = opU(res, vec2(cover, 2.0));
  res = opU(res, vec2(pageL, 3.0));
  res = opU(res, vec2(pageR, 3.0));
  res = opU(res, vec2(ribbon, 6.0));
  return res;
}

vec2 map(vec3 p){
  vec3 q = scenePoint(p);
  vec2 res = mapObject(q);
  return vec2(res.x * uFit, res.y);
}

vec3 normalAt(vec3 p){
  const float e = 0.0016;
  vec2 k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * map(p + k.xyy * e).x +
    k.yyx * map(p + k.yyx * e).x +
    k.yxy * map(p + k.yxy * e).x +
    k.xxx * map(p + k.xxx * e).x
  );
}

float calcAO(vec3 p, vec3 n){
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++){
    float h = 0.015 + 0.05 * float(i);
    float d = map(p + n * h).x;
    occ += (h - d) * sca;
    sca *= 0.86;
  }
  return clamp(1.0 - 1.8 * occ, 0.0, 1.0);
}

vec3 backdrop(vec2 p){
  vec3 c = vec3(0.953, 0.949, 0.941);
  float ember = exp(-length(p * vec2(0.92, 1.12) - vec2(0.06, 0.04)) * 2.6);
  c += vec3(0.604, 0.373, 0.149) * ember * 0.045;
  vec2 warmPos = p - vec2(0.34, -0.26);
  c += vec3(0.902, 0.659, 0.408) * exp(-length(warmPos) * 4.0) * 0.10;
  vec2 olivePos = p - vec2(-0.42, 0.30);
  c += vec3(0.259, 0.263, 0.110) * exp(-length(olivePos) * 4.2) * 0.040;
  return c;
}

vec3 shade(vec3 p, vec3 n, vec3 rd, float mat){
  vec3 sp = scenePoint(p);
  vec3 bp = bookPoint(sp);
  vec3 base = vec3(0.5);

  if (mat == 0.0){
    base = vec3(0.82, 0.78, 0.70);
    base *= 0.94 + 0.05 * hash(floor(sp.xz * 70.0));
    float c1 = exp(-length((sp.xz - vec2(-0.12, 0.18)) / vec2(0.62, 0.40)));
    float c2 = exp(-length((sp.xz - vec2(0.62, 0.35)) / vec2(0.42, 0.34)));
    base *= 1.0 - clamp(c1 + c2, 0.0, 1.0) * 0.36;
  } else if (mat == 1.0){
    base = vec3(0.60, 0.42, 0.25);
    base *= 0.93 + 0.07 * hash(floor(sp.xz * 120.0 + sp.y * 36.0));
    base += vec3(0.045, 0.028, 0.012) * smoothstep(0.10, 0.38, sp.y);
  } else if (mat == 2.0){
    base = vec3(0.15, 0.085, 0.045);
    float edge = smoothstep(0.31, 0.35, abs(bp.x)) + smoothstep(0.23, 0.27, abs(bp.y));
    base = mix(base, vec3(0.55, 0.37, 0.15), clamp(edge, 0.0, 1.0) * 0.18);
  } else if (mat == 3.0){
    base = vec3(0.94, 0.91, 0.82);
    float row = 1.0 - smoothstep(0.0, 0.014, abs(fract((bp.y + 0.24) * 13.0) - 0.5));
    float col = 1.0 - smoothstep(0.0, 0.012, abs(abs(bp.x) - 0.14));
    float head = smoothstep(0.155, 0.170, bp.y) * (1.0 - smoothstep(0.200, 0.210, bp.y));
    base = mix(base, vec3(0.48, 0.27, 0.12), max(row * 0.42, col * 0.32));
    base = mix(base, vec3(0.72, 0.48, 0.26), head * 0.18);
    vec2 su = bp.xy - vec2(0.18, -0.10);
    float ring = 1.0 - smoothstep(0.0, 0.006, abs(length(su) - 0.038));
    float bar = (1.0 - smoothstep(0.0, 0.009, abs(su.x))) * (1.0 - smoothstep(0.0, 0.012, abs(su.y)));
    float stamp = max(ring, bar);
    base = mix(base, vec3(0.46, 0.10, 0.06), stamp * 0.85);
  } else if (mat == 4.0){
    base = vec3(0.87, 0.80, 0.66);
    float bar = 1.0 - smoothstep(0.0, 0.012, abs(sp.y + 0.030));
    base = mix(base, vec3(0.30, 0.20, 0.11), bar * 0.38);
  } else if (mat == 5.0){
    base = vec3(0.80, 0.69, 0.50);
    base *= 0.94 + 0.06 * hash(floor(sp.xz * 90.0));
  } else {
    base = vec3(0.46, 0.14, 0.06);
  }

  float ao = calcAO(p, n);
  vec3 L = normalize(vec3(-0.62 + 0.08 * sin(uTime * 0.35), 0.94, 0.52));
  float diff = max(dot(n, L), 0.0);
  float fill = max(dot(n, normalize(vec3(0.70, 0.18, 0.45))), 0.0);
  vec3 col = base * (0.30 + 0.18 * n.y + diff * 0.76 * ao + fill * 0.16 * ao);

  vec3 v = -rd;
  vec3 h = normalize(L + v);
  float spec = pow(max(dot(n, h), 0.0), 48.0);
  col += vec3(0.98, 0.92, 0.82) * spec * (mat == 3.0 ? 0.10 : 0.26) * ao;

  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);
  col += vec3(0.90, 0.78, 0.60) * fres * 0.10 * ao;
  col += vec3(0.32, 0.16, 0.06) * max(dot(n, normalize(vec3(-0.35, -0.90, -0.15))), 0.0) * 0.12;
  return col;
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = vec3(-uCamX, 0.13 + 0.004 * sin(uTime * 0.32), 4.15 + uScroll * 0.50);
  vec3 rd = normalize(vec3(p, -1.55));
  float t = 0.0;
  float d = 0.0;
  bool hit = false;
  vec2 res = vec2(0.0);

  for (int i = 0; i < 120; i++){
    vec3 pos = ro + rd * t;
    res = map(pos);
    d = res.x;
    if (d < 0.0012){
      hit = true;
      break;
    }
    t += max(d * 0.86, 0.0025);
    if (t > 11.0) break;
  }

  vec3 col = backdrop(p);
  if (hit){
    vec3 pos = ro + rd * t;
    vec3 n = normalAt(pos);
    vec3 shaded = shade(pos, n, rd, res.y);
    float fade = 1.0 - smoothstep(8.0, 11.0, t);
    col = mix(col, shaded, 0.06 + 0.94 * fade);
  }

  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.012;
  float vig = 1.0 - smoothstep(0.35, 1.45, length(p * vec2(0.92, 1.06)));
  col *= 0.94 + 0.06 * vig;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
