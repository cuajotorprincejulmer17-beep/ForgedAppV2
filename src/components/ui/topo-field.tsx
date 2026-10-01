"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";

/**
 * TopoField — an isolated, full-bleed animated WebGL background: a faint 48px grid plus
 * ultra-thin contour ("topographic") lines drawn from 2D simplex noise, drifting slowly over
 * time. Ships as a sandboxed iframe so the shader's own script/canvas loop stays self-contained
 * and never touches the host page's DOM or React tree.
 */

const topoFieldSource = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>html,body{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden;}
canvas{position:fixed;inset:0;width:100%;height:100%;display:block;}</style>
</head><body>
<canvas id="topo-canvas"></canvas>
<script>
const canvas = document.getElementById('topo-canvas');
const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
if (gl) {
  const vsSource = \`
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  \`;
  const fsSource = \`
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_dpr;
    uniform float u_noiseScale;
    uniform float u_numBands;
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
    void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x *= u_resolution.x / u_resolution.y;
        float gridSize = 48.0 * u_dpr;
        vec2 gridSt = gl_FragCoord.xy / gridSize;
        vec2 gridFract = fract(gridSt);
        float lineThickness = 1.0 / gridSize;
        float gridLines = step(1.0 - lineThickness, gridFract.x) + step(1.0 - lineThickness, gridFract.y);
        gridLines = clamp(gridLines, 0.0, 1.0) * 0.12;
        vec2 noisePos = st * u_noiseScale + vec2(u_time * 0.015, u_time * 0.025);
        float n = snoise(noisePos) * 0.5 + 0.5;
        float bandVal = n * u_numBands;
        float triangleWave = abs(fract(bandVal) - 0.5) * 2.0;
        float topoLines = smoothstep(0.02, 0.00, triangleWave) * 0.45;
        vec3 color = vec3(0.0);
        color += vec3(1.0) * gridLines;
        color += vec3(1.0) * topoLines;
        gl_FragColor = vec4(color, 1.0);
    }
  \`;
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const positionLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const timeLocation = gl.getUniformLocation(program, "u_time");
  const dprLocation = gl.getUniformLocation(program, "u_dpr");
  const noiseScaleLocation = gl.getUniformLocation(program, "u_noiseScale");
  const numBandsLocation = gl.getUniformLocation(program, "u_numBands");

  let speed = 1, noiseScale = 1.4, numBands = 10.0;
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'topo-controls') return;
    const c = event.data.controls || {};
    if (typeof c.speed === 'number') speed = c.speed;
    if (typeof c.length === 'number') noiseScale = 1.4 * c.length;
    if (typeof c.density === 'number') numBands = 10.0 * c.density;
  });

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(dprLocation, dpr);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let startTime = performance.now();
  let virtualTime = 0;
  let lastReal = startTime;
  function render(time) {
    virtualTime += (time - lastReal) * speed;
    lastReal = time;
    gl.uniform1f(timeLocation, virtualTime * 0.001);
    gl.uniform1f(noiseScaleLocation, noiseScale);
    gl.uniform1f(numBandsLocation, numBands);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
</script>
</body></html>`;

export type TopoFieldProps = {
  /** Animation speed multiplier. */
  speed?: number;
  /** Stretches/compresses the noise field driving the contour bands. */
  length?: number;
  /** Multiplies the number of contour bands (visual density of lines). */
  density?: number;
  opacity?: number;
  className?: string;
  style?: CSSProperties;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export default function TopoField({
  speed = 1,
  length = 1,
  density = 1,
  opacity = 1,
  className,
  style,
}: TopoFieldProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const safeSpeed = clamp(speed, 0, 3);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);
  const safeOpacity = clamp(opacity, 0.05, 1);

  const source = useMemo(() => topoFieldSource, []);

  useEffect(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(
      {
        type: "topo-controls",
        controls: { speed: safeSpeed, length: safeLength, density: safeDensity },
      },
      "*",
    );
  }, [safeSpeed, safeLength, safeDensity]);

  return (
    <iframe
      ref={iframeRef}
      className={className}
      title="Topo Field"
      srcDoc={source}
      sandbox="allow-scripts"
      loading="eager"
      aria-hidden="true"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        border: 0,
        background: "#000",
        opacity: safeOpacity,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
