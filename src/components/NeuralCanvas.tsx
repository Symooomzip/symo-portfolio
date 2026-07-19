import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Interactive neural-network particle field.
 * variant="dark" (default): glowing additive particles for the hero — steel nodes,
 * magenta hubs, edges lerping steel -> violet, white signal pulses. Fades out on scroll.
 * variant="light": the same brain in daylight — restrained lavender-grey particles on
 * white for the Expertise section. Normal blending (additive is invisible on white),
 * colors fade toward white instead of black, renders only while on screen.
 * Adapts to software rendering / weak GPUs by lowering resolution and counts.
 */
export default function NeuralCanvas({
  className,
  variant = 'dark',
  scrollFade = variant === 'dark',
  fogColor,
}: {
  className?: string;
  variant?: 'dark' | 'light';
  /** fade the canvas out as the page scrolls (hero behavior). */
  scrollFade?: boolean;
  /** override the fog color to match a custom section background. */
  fogColor?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas: HTMLCanvasElement = maybeCanvas;
    const isLight = variant === 'light';

    let isSoftware = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const probe =
        probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      const dbg =
        probe && probe.getExtension('WEBGL_debug_renderer_info');
      const name = dbg
        ? (probe as WebGLRenderingContext).getParameter(dbg.UNMASKED_RENDERER_WEBGL)
        : '';
      isSoftware = /swiftshader|llvmpipe|software|microsoft basic/i.test(String(name));
    } catch {
      /* probe failed; assume hardware */
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isSoftware,
    });
    let resScale = isSoftware ? 0.5 : 1;
    renderer.setPixelRatio(isSoftware ? 1 : Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(fogColor ?? (isLight ? 0xffffff : 0x121414), 0.035);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 16;

    let viewW = 0;
    let viewH = 0;
    function fitViewport(force = false) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!force && w === viewW && h === viewH) return;
      if (w === 0 || h === 0) return;
      viewW = w;
      viewH = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(Math.round(w * resScale), Math.round(h * resScale), false);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
    fitViewport();

    const isMobile = window.innerWidth < 768;
    const NODE_COUNT = isLight
      ? isSoftware
        ? 40
        : isMobile
          ? 60
          : 120
      : isSoftware
        ? 55
        : isMobile
          ? 90
          : 190;
    const RANGE = 13;
    const CONNECT_DIST = isSoftware ? 4.4 : isMobile ? 3.6 : 3.1;
    const blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;

    function makeGlowTexture(color: string) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, color);
      g.addColorStop(0.35, color.replace('1)', '0.6)'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }

    const group = new THREE.Group();
    scene.add(group);

    const nodes: { pos: THREE.Vector3; vel: THREE.Vector3 }[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 2 * RANGE,
          (Math.random() - 0.5) * 2 * RANGE * 0.62,
          (Math.random() - 0.5) * 2 * RANGE * 0.55,
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.012,
        ),
      });
    }

    const nodePositions = new Float32Array(NODE_COUNT * 3);
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    const mainNodes = new THREE.Points(
      nodeGeo,
      new THREE.PointsMaterial({
        size: 0.22,
        map: makeGlowTexture(isLight ? 'rgba(110,105,150,1)' : 'rgba(187,204,215,1)'),
        transparent: true,
        opacity: isLight ? 0.45 : 0.95,
        depthWrite: false,
        blending,
      }),
    );
    group.add(mainNodes);

    const hubIdx: number[] = [];
    for (let i = 0; i < NODE_COUNT; i += 9) hubIdx.push(i);
    const hubPositions = new Float32Array(hubIdx.length * 3);
    const hubGeo = new THREE.BufferGeometry();
    hubGeo.setAttribute('position', new THREE.BufferAttribute(hubPositions, 3));
    const hubs = new THREE.Points(
      hubGeo,
      new THREE.PointsMaterial({
        size: 0.5,
        map: makeGlowTexture('rgba(182,0,168,1)'),
        transparent: true,
        opacity: isLight ? 0.4 : 0.9,
        depthWrite: false,
        blending,
      }),
    );
    group.add(hubs);

    const MAX_EDGES = NODE_COUNT * 8;
    const edgePositions = new Float32Array(MAX_EDGES * 6);
    const edgeColors = new Float32Array(MAX_EDGES * 6);
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
    edgeGeo.setAttribute('color', new THREE.BufferAttribute(edgeColors, 3));
    const edges = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: isLight ? 0.5 : 0.55,
        blending,
        depthWrite: false,
      }),
    );
    group.add(edges);

    const PULSE_COUNT = isLight ? 5 : isSoftware ? 4 : isMobile ? 6 : 14;
    const pulses: { a: number; b: number; t: number }[] = [];
    const pulsePositions = new Float32Array(PULSE_COUNT * 3);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
    const pulsePoints = new THREE.Points(
      pulseGeo,
      new THREE.PointsMaterial({
        size: 0.34,
        map: makeGlowTexture(isLight ? 'rgba(182,0,168,1)' : 'rgba(255,255,255,1)'),
        transparent: true,
        opacity: isLight ? 0.75 : 1,
        depthWrite: false,
        blending,
      }),
    );
    group.add(pulsePoints);
    for (let i = 0; i < PULSE_COUNT; i++) pulses.push({ a: 0, b: 0, t: 2 });

    const mouse = new THREE.Vector2(-99, -99);
    const onMouseMove = (e: MouseEvent) => {
      // NDC relative to the canvas box, so it works when the canvas
      // covers a section instead of the whole viewport
      const r = canvas.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    const onResize = () => fitViewport();
    window.addEventListener('resize', onResize);

    // only simulate/render while the canvas is actually on screen
    let inView = true;
    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: '100px' },
    );
    observer.observe(canvas);

    const edgeA = new THREE.Color(isLight ? 0x8a86a8 : 0x646973);
    const edgeB = new THREE.Color(0x7621b0);
    const white = new THREE.Color(0xffffff);
    const tmpColor = new THREE.Color();
    const currentEdges: number[] = [];

    let lastFrame = 0;
    let slowStreak = 0;
    let rafId = 0;
    let disposed = false;

    function animate(time: number) {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);
      if (!inView) return;
      fitViewport();
      if (viewW === 0) return;

      if (lastFrame) {
        const dt = time - lastFrame;
        if (dt > 90) slowStreak++;
        else if (dt < 40) slowStreak = Math.max(0, slowStreak - 1);
        if (slowStreak >= 10 && resScale > 0.3) {
          resScale = Math.max(0.3, resScale * 0.7);
          slowStreak = 0;
          fitViewport(true);
        }
      }
      lastFrame = time;

      const vec = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const dist = -camera.position.z / dir.z;
      const mouseWorld = camera.position.clone().add(dir.multiplyScalar(dist));
      const localMouse = group.worldToLocal(mouseWorld.clone());

      for (let i = 0; i < NODE_COUNT; i++) {
        const n = nodes[i];
        n.pos.add(n.vel);
        if (Math.abs(n.pos.x) > RANGE) n.vel.x *= -1;
        if (Math.abs(n.pos.y) > RANGE * 0.62) n.vel.y *= -1;
        if (Math.abs(n.pos.z) > RANGE * 0.55) n.vel.z *= -1;

        const dx = n.pos.x - localMouse.x;
        const dy = n.pos.y - localMouse.y;
        const dz = n.pos.z - localMouse.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 16 && d2 > 0.001) {
          const f = 0.06 / d2;
          n.pos.x += dx * f;
          n.pos.y += dy * f;
          n.pos.z += dz * f;
        }

        nodePositions[i * 3] = n.pos.x;
        nodePositions[i * 3 + 1] = n.pos.y;
        nodePositions[i * 3 + 2] = n.pos.z;
      }
      nodeGeo.attributes.position.needsUpdate = true;

      for (let h = 0; h < hubIdx.length; h++) {
        const n = nodes[hubIdx[h]];
        hubPositions[h * 3] = n.pos.x;
        hubPositions[h * 3 + 1] = n.pos.y;
        hubPositions[h * 3 + 2] = n.pos.z;
      }
      hubGeo.attributes.position.needsUpdate = true;

      let e = 0;
      currentEdges.length = 0;
      for (let i = 0; i < NODE_COUNT && e < MAX_EDGES; i++) {
        for (let j = i + 1; j < NODE_COUNT && e < MAX_EDGES; j++) {
          const a = nodes[i].pos;
          const b = nodes[j].pos;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dz = a.z - b.z;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < CONNECT_DIST) {
            const o = e * 6;
            edgePositions[o] = a.x;
            edgePositions[o + 1] = a.y;
            edgePositions[o + 2] = a.z;
            edgePositions[o + 3] = b.x;
            edgePositions[o + 4] = b.y;
            edgePositions[o + 5] = b.z;
            const alpha = 1 - d / CONNECT_DIST;
            tmpColor.copy(edgeA).lerp(edgeB, (a.y + RANGE) / (2 * RANGE));
            if (isLight) {
              // on white, "fading" means blending toward white, not black
              tmpColor.lerp(white, 1 - alpha * 0.85);
            } else {
              tmpColor.multiplyScalar(alpha * 0.9);
            }
            edgeColors[o] = tmpColor.r;
            edgeColors[o + 1] = tmpColor.g;
            edgeColors[o + 2] = tmpColor.b;
            edgeColors[o + 3] = tmpColor.r;
            edgeColors[o + 4] = tmpColor.g;
            edgeColors[o + 5] = tmpColor.b;
            currentEdges.push(i, j);
            e++;
          }
        }
      }
      edgeGeo.setDrawRange(0, e * 2);
      edgeGeo.attributes.position.needsUpdate = true;
      edgeGeo.attributes.color.needsUpdate = true;

      for (let p = 0; p < PULSE_COUNT; p++) {
        const pu = pulses[p];
        pu.t += 0.02;
        if (pu.t >= 1 && currentEdges.length > 0) {
          const pick = Math.floor(Math.random() * (currentEdges.length / 2));
          pu.a = currentEdges[pick * 2];
          pu.b = currentEdges[pick * 2 + 1];
          pu.t = 0;
        }
        const a = nodes[pu.a].pos;
        const b = nodes[pu.b].pos;
        const t = Math.min(pu.t, 1);
        pulsePositions[p * 3] = a.x + (b.x - a.x) * t;
        pulsePositions[p * 3 + 1] = a.y + (b.y - a.y) * t;
        pulsePositions[p * 3 + 2] = a.z + (b.z - a.z) * t;
      }
      pulseGeo.attributes.position.needsUpdate = true;

      group.rotation.y = time * 0.00004 + mouse.x * 0.06;
      group.rotation.x = mouse.y * 0.04;

      if (scrollFade) {
        const fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.9));
        canvas.style.opacity = String(fade);
        if (fade > 0.01) renderer.render(scene, camera);
      } else {
        renderer.render(scene, camera);
      }
    }
    rafId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      nodeGeo.dispose();
      hubGeo.dispose();
      edgeGeo.dispose();
      pulseGeo.dispose();
    };
  }, [variant, scrollFade, fogColor]);

  return <canvas ref={canvasRef} className={className} />;
}
