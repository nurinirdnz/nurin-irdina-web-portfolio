/* Navigation is available independently of the portfolio API. */
(() => {
  "use strict";
  const header = document.querySelector(".header");
  const nav = document.querySelector("#main-nav");
  const menuToggle = document.querySelector("#menu-toggle");
  if (!nav || !menuToggle) return;
  function closeNav(restoreFocus = false) {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    if (restoreFocus) menuToggle.focus();
  }
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    if (open) nav.querySelector("a")?.focus();
  });
  nav.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link) return;
    closeNav();
    const target = document.querySelector(link.getAttribute("href"));
    if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav.classList.contains("open")) closeNav(true);
  });
  for (const type of ["click", "focusin"]) document.addEventListener(type, event => {
    if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeNav();
  });
  matchMedia("(max-width: 900px)").addEventListener("change", () => closeNav());
  if ("IntersectionObserver" in window) {
    const links = [...nav.querySelectorAll('a[href^="#"]')].map(link => ({
      link, section: document.querySelector(link.getAttribute("href")),
    })).filter(entry => entry.section);
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const match = links.find(item => item.section === entry.target);
        if (!match) return;
        links.forEach(item => item.link.removeAttribute("aria-current"));
        match.link.setAttribute("aria-current", "location");
      });
    }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    links.forEach(entry => spy.observe(entry.section));
  }
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();

/* Framework-free WebGL version of the purple Plasma background. */
(() => {
  "use strict";
  const canvas = document.querySelector(".plasma-canvas");
  if (!canvas?.getContext) return;

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
  });
  if (!gl) return;

  const vertexSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;
  const fragmentSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_dark;

    float random(vec2 point) {
      return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 point) {
      vec2 cell = floor(point);
      vec2 local = fract(point);
      local = local * local * (3.0 - 2.0 * local);
      return mix(
        mix(random(cell), random(cell + vec2(1.0, 0.0)), local.x),
        mix(random(cell + vec2(0.0, 1.0)), random(cell + vec2(1.0)), local.x),
        local.y
      );
    }

    float fbm(vec2 point) {
      float value = 0.0;
      float amplitude = 0.52;
      mat2 rotation = mat2(0.86, 0.50, -0.50, 0.86);
      for (int octave = 0; octave < 5; octave++) {
        value += amplitude * noise(point);
        point = rotation * point * 2.03 + 17.3;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 point = (2.0 * gl_FragCoord.xy - u_resolution.xy)
        / min(u_resolution.x, u_resolution.y);
      float time = u_time * 0.16;

      vec2 warpA = vec2(
        fbm(point * 1.15 + vec2(time, -time * 0.72)),
        fbm(point * 1.08 + vec2(4.8 - time * 0.55, 1.4 + time * 0.48))
      );
      vec2 warpB = vec2(
        fbm(point + 2.7 * warpA + vec2(1.7, 8.2) + time * 0.28),
        fbm(point + 2.4 * warpA + vec2(8.3, 2.8) - time * 0.24)
      );
      float field = fbm(point * 0.86 + 2.8 * warpB);
      field += 0.09 * sin(point.x * 1.7 - point.y * 1.2 + time * 2.2);

      float plasma = smoothstep(0.49, 0.72, field);
      float core = smoothstep(0.68, 0.88, field);

      vec3 darkBase = vec3(0.008, 0.004, 0.014);
      vec3 darkPurple = vec3(0.25, 0.055, 0.47);
      vec3 darkGlow = vec3(0.52, 0.20, 0.78);
      vec3 darkColor = mix(darkBase, darkPurple, plasma);
      darkColor = mix(darkColor, darkGlow, core * 0.72);

      vec3 lightBase = vec3(0.980, 0.969, 0.992);
      vec3 lightPurple = vec3(0.86, 0.78, 0.92);
      vec3 lightGlow = vec3(0.69, 0.48, 0.83);
      vec3 lightColor = mix(lightBase, lightPurple, plasma * 0.72);
      lightColor = mix(lightColor, lightGlow, core * 0.32);

      gl_FragColor = vec4(mix(lightColor, darkColor, u_dark), 1.0);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const resolution = gl.getUniformLocation(program, "u_resolution");
  const time = gl.getUniformLocation(program, "u_time");
  const dark = gl.getUniformLocation(program, "u_dark");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let animationFrame = 0;
  let lastFrame = 0;
  let elapsed = 0;

  function resize() {
    const pixelRatio = Math.min(devicePixelRatio || 1, 1.25);
    const width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
    const height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }

  function draw() {
    resize();
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(time, 18 + (reducedMotion.matches ? 0 : elapsed));
    gl.uniform1f(
      dark,
      document.documentElement.getAttribute("data-theme") === "dark" ? 1 : 0,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate(timestamp) {
    if (!lastFrame || timestamp - lastFrame >= 32) {
      elapsed += lastFrame ? (timestamp - lastFrame) / 1000 : 0;
      draw();
      lastFrame = timestamp;
    }
    animationFrame = requestAnimationFrame(animate);
  }

  function syncMotion() {
    cancelAnimationFrame(animationFrame);
    lastFrame = 0;
    draw();
    // Keep the requested animation running throughout the visible portfolio.
    if (!reducedMotion.matches && !document.hidden) {
      animationFrame = requestAnimationFrame(animate);
    }
  }

  addEventListener("resize", draw, { passive: true });
  new MutationObserver(draw).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ["data-theme"] },
  );
  reducedMotion.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", syncMotion);
  syncMotion();
})();
