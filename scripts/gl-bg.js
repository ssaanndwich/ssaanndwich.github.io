import * as THREE from 'three';

const CELL_SIZE = 7;                  // px - grid spacing
const ATLAS_SCALE = 4;                // render atlas at 3x for crisp glyphs
const size = CELL_SIZE * ATLAS_SCALE; // tight grid
const ASCII_CHARS = ' .:-+*#%@';      // 9 chars, space → dense

class ASCIIBackground {
  constructor(text) {
    this.text   = text;
    this.width  = window.innerWidth;
    this.height = window.innerHeight;
    this.mouse  = new THREE.Vector2(-999, -999); // off-screen until first move
    this.setup();
    this.createAsciiAtlas();
    this.createTextMask();
    this.createScene();
    this.addEventListeners();
    this.animate();
  }

  setup() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:fixed;inset:0;z-index:2;pointer-events:none;';
    document.body.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;
    this.scene  = new THREE.Scene();
  }

  createAsciiAtlas() {
    const chars = ASCII_CHARS;
    const c     = document.createElement('canvas');
    c.width     = size * chars.length;
    c.height    = size;
    const ctx   = c.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle    = 'white';
    ctx.font         = `${size}px monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'center';
    chars.split('').forEach((ch, i) => ctx.fillText(ch, (i + 0.5) * size, size / 2));
    this.asciiTexture = new THREE.CanvasTexture(c);
    this.asciiTexture.minFilter = THREE.NearestFilter;
    this.asciiTexture.magFilter = THREE.NearestFilter;
  }

  // Reads --ascii-wscale / --ascii-hscale from blocked.css so breakpoint
  // overrides there drive both canvas scale and content spacing together.
  getFontSize() {
    const s  = getComputedStyle(document.documentElement);
    const ws = parseFloat(s.getPropertyValue('--ascii-wscale')) || 0.38;
    const hs = parseFloat(s.getPropertyValue('--ascii-hscale')) || 0.68;
    return Math.min(this.width * ws, this.height * hs);
  }

  createTextMask() {
    const s  = getComputedStyle(document.documentElement);
    const y  = parseFloat(s.getPropertyValue('--ascii-y')) || 0.5;
    const c   = document.createElement('canvas');
    c.width   = this.width;
    c.height  = this.height;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, c.width, c.height);

    const fontSize = this.getFontSize();
    ctx.fillStyle    = 'white';
    ctx.font         = `bold ${fontSize}px monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, c.width / 2, c.height * y);

    if (this.textMask) this.textMask.dispose();
    this.textMask = new THREE.CanvasTexture(c);
    this.textMask.minFilter = THREE.LinearFilter;
    this.textMask.magFilter = THREE.LinearFilter;
  }

  createScene() {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Vector3(1, 1, 1) },
        uTime:       { value: 0 },
        uResolution: { value: new THREE.Vector2(this.width, this.height) },
        uCellSize:   { value: CELL_SIZE },
        uAsciiTex:   { value: this.asciiTexture },
        uCharCount:  { value: ASCII_CHARS.length },
        uTextMask:   { value: this.textMask },
        uMouse:      { value: this.mouse },
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec3      uColor;
        uniform float     uTime;
        uniform vec2      uResolution;
        uniform float     uCellSize;
        uniform sampler2D uAsciiTex;
        uniform float     uCharCount;
        uniform sampler2D uTextMask;
        uniform vec2      uMouse;
        varying vec2      vUv;

        float rand(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 pixel     = vUv * uResolution;
          vec2 cellCoord = floor(pixel / uCellSize);
          vec2 cellUV    = fract(pixel / uCellSize);

          // ── Confine to text shape ──────────────────────────────────────
          vec2  maskUV    = (cellCoord + 0.5) * uCellSize / uResolution;
          float textMask  = texture2D(uTextMask, maskUV).r;
          if (textMask < 0.08) discard;

          // ── Per-cell life cycle (artefakt wipe) ───────────────────────
          // Each cell has a random phase offset so they flicker independently
          float seed   = rand(cellCoord);
          float life   = fract(uTime * 0.22 + seed * 8.73);

          float appear = smoothstep(0.0,  0.2,  life);
          float vanish = 1.0 - smoothstep(0.72, 1.0, life);
          // Left-to-right wipe reveal within the cell
          float wipe   = step(cellUV.x, life);
          float cycle  = appear * vanish * wipe;

          // ── Mouse spotlight ───────────────────────────────────────────
          // Flip Y: browser y=0 is top, shader y=0 is bottom
          vec2  mp      = vec2(uMouse.x, 1.0 - uMouse.y) * uResolution;
          float glow    = 1.0 - smoothstep(0.0, 160.0, length(pixel - mp));

          // Glow overrides the cycle; cycle runs normally elsewhere
          float visible = max(cycle, glow * 0.97);

          // ── ASCII char selection ──────────────────────────────────────
          // Fast random tick per cell so chars change while visible
          float tick    = floor(uTime * 5.5 + seed * 9.0);
          float charIdx = floor(rand(cellCoord + tick) * uCharCount);
          vec2  atlasUV = vec2((charIdx + cellUV.x) / uCharCount, cellUV.y);
          float glyph   = texture2D(uAsciiTex, atlasUV).r;

          // Soft edges from text anti-alias bleed; full alpha inside
          float opacity = glyph * visible * textMask;
          gl_FragColor = vec4(uColor, opacity);
        }
      `,
      transparent: true,
      depthTest: false,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.mesh.material.uniforms.uTime.value = performance.now() / 1000;
    this.renderer.render(this.scene, this.camera);
  }

  addEventListeners() {
    new MutationObserver(() => {
      const light = document.body.classList.contains('light');
      this.mesh.material.uniforms.uColor.value.setScalar(light ? 0.10 : 1.0);
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('mousemove', e => {
      this.mouse.set(e.clientX / this.width, e.clientY / this.height);
    });

    // Clear spotlight when cursor leaves window
    window.addEventListener('mouseleave', () => {
      this.mouse.set(-999, -999);
    });

    window.addEventListener('resize', () => {
      this.width  = window.innerWidth;
      this.height = window.innerHeight;
      this.renderer.setSize(this.width, this.height);
      const u = this.mesh.material.uniforms;
      u.uResolution.value.set(this.width, this.height);
      this.createTextMask();
      u.uTextMask.value = this.textMask;
    });
    
  }
}

// edges.js sets body.dataset.scenario synchronously before this module runs
const scenario = document.body.dataset.scenario || 'notfound';
const codeMap   = { notfound: '404', scraper: '403', bot: '403', rate: '429' };
new ASCIIBackground(codeMap[scenario] || '404');
