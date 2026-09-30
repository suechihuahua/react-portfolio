// Raw WebGL CRT composite: takes the Canvas 2D screen as a texture and runs it
// through curvature, an aperture-grille mask, scanlines, a rolling bar,
// chromatic aberration, noise and a vignette. No libraries.

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uScreen;
uniform vec2  uResolution;
uniform float uTime;
uniform float uCurve;
uniform float uScanline;
uniform float uMask;
uniform float uAberration;
uniform float uNoise;
uniform float uVignette;
uniform float uMono;
uniform vec3  uInk;
uniform float uSpeed;
uniform float uMotion;
uniform float uHue;
uniform float uSaturation;
uniform float uBrightness;
uniform float uOpacity;

// Barrel distortion: pushes the corners out so the panel reads as glass.
vec2 curve(vec2 uv, float amount) {
  uv = uv * 2.0 - 1.0;
  vec2 offset = abs(uv.yx) / vec2(6.0, 4.0);
  uv += uv * offset * offset * amount * 4.0;
  return uv * 0.5 + 0.5;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 hueRotate(vec3 color, float degrees) {
  float a = radians(degrees);
  float c = cos(a);
  float s = sin(a);
  // YIQ rotation -- cheaper than a full HSV round trip.
  mat3 toYiq = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  mat3 toRgb = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 yiq = toYiq * color;
  float i = yiq.y * c - yiq.z * s;
  float q = yiq.y * s + yiq.z * c;
  return toRgb * vec3(yiq.x, i, q);
}

void main() {
  vec2 uv = curve(vUv, uCurve);

  // Outside the tube is bezel, not screen.
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float t = uTime * uSpeed;

  // A soft bright band rolling down the tube, plus a little horizontal jitter.
  float roll = fract(uv.y + t * 0.09);
  float band = smoothstep(0.0, 0.06, roll) * (1.0 - smoothstep(0.06, 0.22, roll));
  float jitter = (hash(vec2(floor(t * 24.0), floor(uv.y * 90.0))) - 0.5) * 0.0016 * uMotion;
  uv.x += jitter;

  // Chromatic aberration grows toward the edges, like a real lens.
  float edge = distance(uv, vec2(0.5)) * 0.008 * uAberration;
  vec3 color = vec3(
    texture2D(uScreen, vec2(uv.x + edge, uv.y)).r,
    texture2D(uScreen, uv).g,
    texture2D(uScreen, vec2(uv.x - edge, uv.y)).b
  );

  // Monochrome phosphors tint one luminance signal.
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(color, uInk * luma, uMono);

  // Scanlines follow the physical pixel grid, not the texture.
  float lines = sin(vUv.y * uResolution.y * 1.35 - t * 2.0);
  color *= 1.0 - uScanline * 0.5 * (0.5 + 0.5 * lines);

  // Aperture grille: each column leans toward one phosphor.
  float column = mod(gl_FragCoord.x, 3.0);
  vec3 grille = vec3(1.0);
  if (column < 1.0) grille = vec3(1.25, 0.75, 0.9);
  else if (column < 2.0) grille = vec3(0.9, 1.25, 0.75);
  else grille = vec3(0.75, 0.9, 1.25);
  color *= mix(vec3(1.0), grille, uMask);

  color += band * 0.06 * uMotion;
  color += (hash(vUv + fract(uTime)) - 0.5) * uNoise;

  color = hueRotate(color, uHue);
  color = mix(vec3(dot(color, vec3(0.299, 0.587, 0.114))), color, uSaturation);
  color *= uBrightness;

  float v = distance(vUv, vec2(0.5));
  color *= 1.0 - uVignette * smoothstep(0.35, 0.95, v);

  gl_FragColor = vec4(max(color, 0.0), uOpacity);
}`

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`CRT shader failed to compile: ${log}`)
  }
  return shader
}

const UNIFORMS = [
  'uScreen', 'uResolution', 'uTime', 'uCurve', 'uScanline', 'uMask',
  'uAberration', 'uNoise', 'uVignette', 'uMono', 'uInk', 'uSpeed',
  'uMotion', 'uHue', 'uSaturation', 'uBrightness', 'uOpacity',
]

// Returns a renderer, or null when WebGL is unavailable -- the caller then
// shows the plain 2D canvas instead.
export function createCrtRenderer(canvas, source) {
  const gl =
    canvas.getContext('webgl', { antialias: false, alpha: false, depth: false }) ??
    canvas.getContext('experimental-webgl')
  if (!gl) return null

  let program
  try {
    program = gl.createProgram()
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? 'link failed')
    }
  } catch {
    return null
  }
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const loc = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)]))

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  // NEAREST is the whole point: the low-res panel stays chunky when scaled up.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.uniform1i(loc.uScreen, 0)

  return {
    resize(width, height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
      gl.uniform2f(loc.uResolution, width, height)
    },
    render(timeSeconds, config, ink) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
      gl.uniform1f(loc.uTime, timeSeconds)
      gl.uniform1f(loc.uCurve, config.curve)
      gl.uniform1f(loc.uScanline, config.scanline)
      gl.uniform1f(loc.uMask, config.mask)
      gl.uniform1f(loc.uAberration, config.aberration)
      gl.uniform1f(loc.uNoise, config.noise)
      gl.uniform1f(loc.uVignette, config.vignette)
      gl.uniform1f(loc.uMono, config.mono)
      gl.uniform3f(loc.uInk, ink[0], ink[1], ink[2])
      gl.uniform1f(loc.uSpeed, config.speed)
      gl.uniform1f(loc.uMotion, config.motion)
      gl.uniform1f(loc.uHue, config.hue)
      gl.uniform1f(loc.uSaturation, config.saturation)
      gl.uniform1f(loc.uBrightness, config.brightness)
      gl.uniform1f(loc.uOpacity, config.opacity)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    },
  }
}
