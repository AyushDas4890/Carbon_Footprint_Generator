/**
 * Procedural artwork for the capability cards, rendered once per style with a
 * single shared WebGL context and handed out as blob URLs. Generating the art
 * at runtime keeps binary image files out of the repo (HF Spaces rejects them
 * in plain git pushes) and ships ~4 KB of GLSL instead of ~500 KB of WebP.
 */
export type ArtKind = 'liquid' | 'blades' | 'pigment' | 'bloom' | 'ribbons' | 'marble';

const KINDS: ArtKind[] = ['liquid', 'blades', 'pigment', 'bloom', 'ribbons', 'marble'];
const SIZE = 720;

const VERT = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `
precision highp float;
varying vec2 uv;
uniform int kind;
uniform float seed;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + seed) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = m * p; a *= .5; }
  return v;
}
vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d){ return a + b * cos(6.28318 * (c * t + d)); }

vec3 liquid(vec2 p){
  p *= 2.2;
  vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(p + 4. * q + vec2(1.7, 9.2)), fbm(p + 4. * q + vec2(8.3, 2.8)));
  float f = fbm(p + 4. * r);
  vec3 col = mix(vec3(.95, .08, .12), vec3(1., .35, .75), clamp(f * f * 2.2, 0., 1.));
  col = mix(col, vec3(.1, .85, .45), clamp(length(q) * .55 - .25, 0., 1.));
  col = mix(col, vec3(1., .85, .15), clamp(r.x * r.x * 1.4 - .2, 0., 1.));
  col = mix(col, vec3(.15, .9, .95), smoothstep(.72, .9, r.y));
  return col * (.75 + .5 * f);
}

vec3 blades(vec2 p){
  vec2 c = p - vec2(.52, .42);
  float a = atan(c.y, c.x), r = length(c);
  float n = fbm(vec2(a * 3., r * 2.));
  float band = pow(abs(sin(a * 18. + n * 4.)), 6.);
  float rays = pow(abs(sin(a * 7. - n * 2.)), 3.);
  vec3 violet = vec3(.55, .2, .95), green = vec3(.2, .95, .3), white = vec3(.95);
  vec3 col = mix(violet, green, smoothstep(-.6, .9, sin(a) + c.y * 1.4));
  col = col * (.25 + band * 1.1 + rays * .4) + white * band * smoothstep(.45, .0, r) * .6;
  return col * smoothstep(1.1, .02, r) + vec3(.02, .01, .04);
}

vec2 cell(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float d1 = 8., d2 = 8.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(hash(i + g), hash(i + g + 19.7));
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return vec2(d1, d2);
}
vec3 pigment(vec2 p){
  vec2 w = p * 3. + 1.4 * vec2(fbm(p * 3.), fbm(p * 3. + 7.));
  float veins = fbm(w * 1.4 + vec2(p.x * 3.));
  vec2 c = cell(w * 2.2);
  vec3 col = vec3(1., .86, .1);
  col = mix(col, vec3(.08, .2, .5), smoothstep(.48, .62, veins));
  col = mix(col, vec3(.25, .45, .85), smoothstep(.62, .7, veins) * .7);
  float rim = smoothstep(.05, .0, c.y - c.x);
  col = mix(col, vec3(.05, .05, .12), rim * smoothstep(.45, .6, veins));
  col = mix(col, vec3(.45, .2, .55), smoothstep(.25, .1, c.x) * smoothstep(.5, .65, veins));
  col = mix(col, vec3(.95), smoothstep(.3, .22, veins) * .55);
  return col;
}

vec3 bloom(vec2 p){
  vec2 c = p - vec2(-.05, -.1);
  float a = atan(c.y, c.x), r = length(c);
  float petals = abs(sin(a * 5. + r * 2.5));
  float edge = smoothstep(.0, .25, petals) * smoothstep(1.6, .2, r);
  vec3 col = pal(r * .9 + petals * .25, vec3(.85, .3, .35), vec3(.25, .35, .3), vec3(1., .8, .6), vec3(.0, .1, .2));
  col = mix(vec3(.98, .08, .3), col, edge);
  col += vec3(1., .85, .3) * pow(1. - petals, 8.) * smoothstep(1.4, .3, r);
  return clamp(col, 0., 1.);
}

vec3 ribbons(vec2 p){
  vec3 col = vec3(.02, .02, .05);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 q = p - .5;
    float ang = .6 + fi * .18;
    q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * q;
    float y = sin(q.x * (3. + fi * .7) + fi * 1.7 + seed) * (.12 + .03 * fi) + (fi - 2.5) * .08;
    float d = abs(q.y - y);
    vec3 tint = mod(fi, 2.) < 1. ? vec3(1., .45, .1) : vec3(.1, .5, 1.);
    col += tint * (.0025 / (d * d + .0018)) * .06 + tint * smoothstep(.04, .0, d) * .55;
  }
  return 1. - exp(-col * 1.4);
}

vec3 marble(vec2 p){
  float n = fbm(p * 2.5 + vec2(fbm(p * 4.), fbm(p * 4. + 3.)) * 1.8);
  float s = sin((p.x * 2. + p.y * 5.) + n * 9.);
  vec3 col = mix(vec3(.25, .18, .1), vec3(.55, .45, .3), smoothstep(-1., 1., s));
  col = mix(col, vec3(.15, .55, .95), smoothstep(.55, .8, s) * smoothstep(.35, .6, n));
  col = mix(col, vec3(.9, .3, .25), smoothstep(.85, .95, abs(sin(n * 14.))) * .6);
  col = mix(col, vec3(.95, .9, .8), smoothstep(.95, 1., s) * .8);
  return col;
}

void main(){
  vec2 p = uv;
  vec3 col;
  if (kind == 0) col = liquid(p);
  else if (kind == 1) col = blades(p);
  else if (kind == 2) col = pigment(p);
  else if (kind == 3) col = bloom(p);
  else if (kind == 4) col = ribbons(p);
  else col = marble(p);
  gl_FragColor = vec4(pow(clamp(col, 0., 1.), vec3(.95)), 1.);
}`;

let rendered: Promise<Record<ArtKind, string>> | null = null;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader compile failed');
  return s;
}

async function renderAll(): Promise<Record<ArtKind, string>> {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL unavailable');
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link failed');
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const out = {} as Record<ArtKind, string>;
  for (const [i, kind] of KINDS.entries()) {
    gl.uniform1i(gl.getUniformLocation(prog, 'kind'), i);
    gl.uniform1f(gl.getUniformLocation(prog, 'seed'), 3.1 + i * 1.37);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.9));
    if (!blob) throw new Error('canvas.toBlob returned null');
    out[kind] = URL.createObjectURL(blob);
  }
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return out;
}

/** Resolves to a blob URL per artwork style; rendered once and cached. */
export function getShaderArt() {
  rendered ??= renderAll();
  return rendered;
}

/** CSS fallback when WebGL is unavailable. */
export const ART_FALLBACK: Record<ArtKind, string> = {
  liquid: 'linear-gradient(135deg,#ff1f3d,#ff6ad5 45%,#22e07a)',
  blades: 'conic-gradient(from 200deg at 52% 58%,#8c33f2,#33f24d,#e6e6e6,#8c33f2)',
  pigment: 'radial-gradient(circle at 30% 40%,#ffd91a,#2a4d99 70%)',
  bloom: 'radial-gradient(circle at 0% 100%,#ffd24d,#ff1450 55%,#ff5aa8)',
  ribbons: 'linear-gradient(135deg,#05050d,#ff7319 40%,#1a80ff 70%,#05050d)',
  marble: 'linear-gradient(120deg,#40301a,#8c7350 40%,#2690f2 60%,#40301a)',
};
