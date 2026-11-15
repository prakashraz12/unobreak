'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const PI = Math.PI;

const PEEK_REST_Z = 0.6;

const CARD_W = 1.0;
const CARD_L = 1.5;

const SLOT_EXIT = { y: 0.8, z: 2.4 } as const;
const CAM_FOV = 30;

const CAM_POS = [0, 15.4, 18.4] as const;
const CAM_TARGET = [0, 1.2, 0] as const;

export const DEALER_TURN_S = 0.16;
const EJECT_S = 0.12;

export const DEALER_HANDOFF_S = DEALER_TURN_S + EJECT_S;

const placeCamera = (cam: THREE.PerspectiveCamera) => {
  cam.position.set(...CAM_POS);
  cam.lookAt(...CAM_TARGET);
};

export const dealerSlotOnScreen = (aimDeg: number, size: number) => {
  const cam = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 100);
  placeCamera(cam);
  cam.updateMatrixWorld();
  const a = (aimDeg * PI) / 180;
  const toPx = (x: number, z: number) => {
    const p = new THREE.Vector3(
      x * Math.cos(a) + z * Math.sin(a),
      SLOT_EXIT.y,
      -x * Math.sin(a) + z * Math.cos(a),
    ).project(cam);
    return { x: (p.x * size) / 2, y: (-p.y * size) / 2 };
  };
  const c = toPx(0, SLOT_EXIT.z);
  const l = toPx(-CARD_W / 2, SLOT_EXIT.z);
  const r = toPx(CARD_W / 2, SLOT_EXIT.z);
  return {
    x: c.x,
    y: c.y,
    width: Math.hypot(r.x - l.x, r.y - l.y),

    behind: Math.cos(a) < 0,
  };
};

interface DealerMachine3DProps {
  aim?: number;

  pulse?: number;
  className?: string;
}

const DealerMachine3D = ({
  aim = 0,
  pulse = 0,
  className,
}: DealerMachine3DProps) => {
  const host = useRef<HTMLDivElement>(null);
  const machRef = useRef<THREE.Group | null>(null);
  const peekRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const mach = machRef.current;
    if (!mach) return;
    const target = (aim * PI) / 180;
    const y =
      target + 2 * PI * Math.round((mach.rotation.y - target) / (2 * PI));
    gsap.to(mach.rotation, {
      y,
      duration: DEALER_TURN_S,
      ease: 'power2.inOut',
    });
    gsap.to(mach.position, {
      y: 0.16,
      duration: DEALER_TURN_S / 2,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
    });
  }, [aim]);

  useEffect(() => {
    const peek = peekRef.current;
    if (!peek || pulse === 0) return;
    gsap.killTweensOf(peek.position);
    gsap
      .timeline({ delay: DEALER_TURN_S })
      .set(peek, { visible: true })
      .fromTo(
        peek.position,
        { z: PEEK_REST_Z, y: 0.6 },
        { ...SLOT_EXIT, duration: EJECT_S, ease: 'power2.out' },
      )
      .set(peek, { visible: false })
      .set(peek.position, { z: PEEK_REST_Z, y: 0.6 });
  }, [pulse]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const R = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    R.setPixelRatio(Math.min(devicePixelRatio, 2));
    R.shadowMap.enabled = true;
    R.shadowMap.type = THREE.PCFSoftShadowMap;
    R.outputColorSpace = THREE.SRGBColorSpace;
    R.toneMapping = THREE.ACESFilmicToneMapping;
    R.toneMappingExposure = 1.15;
    el.appendChild(R.domElement);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 100);
    const root = new THREE.Group();
    scene.add(root);

    {
      const pm = new THREE.PMREMGenerator(R);
      const es = new THREE.Scene();
      es.add(
        new THREE.Mesh(
          new THREE.BoxGeometry(30, 30, 30),
          new THREE.MeshBasicMaterial({
            color: 0x4a4a54,
            side: THREE.BackSide,
          }),
        ),
      );
      [
        [0, 13, 0, 14, 0.2, 14, 2],
        [-13, 4, 4, 0.2, 7, 10, 1.3],
        [13, 4, -3, 0.2, 7, 10, 1],
        [0, 4, 13, 10, 6, 0.2, 0.8],
      ].forEach(([x, y, z, w, h, d, i]) => {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(w!, h!, d!),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(i!, i!, i!) }),
        );
        m.position.set(x!, y!, z!);
        es.add(m);
      });
      scene.environment = pm.fromScene(es).texture;
      pm.dispose();
    }
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(4, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {
      left: -5,
      right: 5,
      top: 5,
      bottom: -5,
      near: 1,
      far: 25,
    });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    scene.add(key, new THREE.HemisphereLight(0xffffff, 0x888890, 1.1));

    const catcher = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10).rotateX(-PI / 2),
      new THREE.ShadowMaterial({ opacity: 0.22 }),
    );
    catcher.receiveShadow = true;
    scene.add(catcher);

    const mach = new THREE.Group();
    root.add(mach);
    machRef.current = mach;

    const cv = (w: number, h: number) =>
      Object.assign(document.createElement('canvas'), {
        width: w,
        height: h,
      });
    const tx = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    };
    const plastic = (c: number, r = 0.38) =>
      new THREE.MeshPhysicalMaterial({
        color: c,
        roughness: r,
        metalness: 0.12,
        clearcoat: 0.9,
        clearcoatRoughness: 0.22,
      });
    const rr = (w: number, h: number, r: number) => {
      const s = new THREE.Shape(),
        x = -w / 2,
        y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    };
    const ext = (w: number, h: number, r: number, d: number, b: number) =>
      new THREE.ExtrudeGeometry(rr(w - 2 * b, h - 2 * b, r), {
        depth: d - 2 * b,
        bevelEnabled: true,
        bevelSize: b,
        bevelThickness: b,
        bevelSegments: 5,
        curveSegments: 20,
      });
    const slab = (w: number, d: number, h: number, r: number, b = 0.04) => {
      const g = ext(w, d, r, h, b);
      g.rotateX(-PI / 2);
      g.translate(0, b, 0);
      return g;
    };
    const add = (
      g: THREE.BufferGeometry,
      m: THREE.Material | THREE.Material[],
      x: number,
      y: number,
      z: number,
      p: THREE.Object3D = mach,
    ) => {
      const o = new THREE.Mesh(g, m);
      o.position.set(x, y, z);
      o.castShadow = o.receiveShadow = true;
      p.add(o);
      return o;
    };

    const cardTex = () => {
      const k = 4,
        c = cv(180 * k, 120 * k),
        g = c.getContext('2d')!;
      g.translate(90 * k, 60 * k);
      g.rotate(PI / 2);
      g.scale(k, k);
      g.translate(-60, -90);
      g.fillStyle = '#fff';
      g.strokeStyle = '#cfcfcf';
      g.lineWidth = 1;
      g.beginPath();
      g.roundRect(0.5, 0.5, 119, 179, 11);
      g.fill();
      g.stroke();
      g.fillStyle = '#111';
      g.beginPath();
      g.roundRect(7, 7, 106, 166, 7);
      g.fill();
      g.translate(60, 90);
      g.save();
      g.rotate((30 * PI) / 180);
      g.fillStyle = '#e3202b';
      g.beginPath();
      g.ellipse(0, 0, 40, 68, 0, 0, 2 * PI);
      g.fill();
      g.restore();
      g.rotate((-22 * PI) / 180);
      g.font = `900 italic 40px 'Arial Black','Helvetica Neue',Arial,sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.lineJoin = 'round';
      g.strokeStyle = '#111';
      g.lineWidth = 5;
      g.strokeText('UNO', 0, 0);
      g.fillStyle = '#f7d109';
      g.fillText('UNO', 0, 0);
      const t = tx(c);

      t.repeat.set(1 / CARD_L, 1 / CARD_W);
      t.offset.set(0.5, 0.5);
      return t;
    };
    const tri = (g: CanvasRenderingContext2D, a: number[]) => {
      g.beginPath();
      g.moveTo(a[0]!, a[1]!);
      g.lineTo(a[2]!, a[3]!);
      g.lineTo(a[4]!, a[5]!);
      g.closePath();
      g.fill();
    };
    const ICON = {
      play: (g: CanvasRenderingContext2D) => tri(g, [46, 32, 98, 64, 46, 96]),
      plus: (g: CanvasRenderingContext2D) => {
        g.fillRect(32, 60, 64, 9);
        g.fillRect(60, 32, 9, 64);
      },
      minus: (g: CanvasRenderingContext2D) => g.fillRect(32, 60, 64, 9),
      up: (g: CanvasRenderingContext2D) => tri(g, [64, 38, 94, 88, 34, 88]),
      down: (g: CanvasRenderingContext2D) => tri(g, [34, 40, 94, 40, 64, 90]),
      stop: (g: CanvasRenderingContext2D) => g.fillRect(42, 42, 44, 44),
    };
    const icon = (fn: (g: CanvasRenderingContext2D) => void) => {
      const c = cv(128, 128),
        g = c.getContext('2d')!;
      g.fillStyle = '#d6d6dc';
      fn(g);
      return tx(c);
    };

    const body = plastic(0x131316, 0.34),
      panelM = plastic(0x232327, 0.5);
    add(slab(3, 2.6, 2, 0.42), body, 0, 0, 0);
    add(slab(2.5, 2.1, 0.34, 0.32), body, 0, 1.96, -0.05);
    add(slab(1.8, 1.25, 0.06, 0.18, 0.02), panelM, 0, 2.28, -0.05);
    add(
      new THREE.BoxGeometry(1.05, 0.03, 0.5),
      new THREE.MeshPhysicalMaterial({
        color: 0x9aa0a8,
        roughness: 0.08,
        metalness: 0.4,
        clearcoat: 1,
      }),
      0,
      2.36,
      -0.32,
    );
    add(
      new THREE.BoxGeometry(0.3, 0.032, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      0.22,
      2.37,
      -0.32,
    );
    [
      [0, 0],
      [-0.2, 0],
      [0.2, 0],
      [0, -0.13],
      [0, 0.13],
    ].forEach(([x, z]) =>
      add(
        new THREE.CylinderGeometry(0.075, 0.075, 0.04, 24),
        plastic(0x2c2c31, 0.45),
        x!,
        2.35,
        0.33 + z!,
      ),
    );
    add(ext(2.5, 0.8, 0.2, 0.05, 0.012), panelM, 0, 1.5, 1.3);
    add(
      ext(1.05, 0.55, 0.09, 0.03, 0.008),
      plastic(0x050506, 0.15),
      0,
      1.5,
      1.36,
    );

    const blk = new THREE.MeshBasicMaterial({ color: 0x020203 });
    const frame = (w: number, h: number, iw: number, ih: number) => {
      const s = rr(w, h, 0.1);
      s.holes.push(rr(iw, ih, 0.04));
      return new THREE.ExtrudeGeometry(s, {
        depth: 0.04,
        bevelEnabled: true,
        bevelSize: 0.012,
        bevelThickness: 0.012,
        bevelSegments: 3,
        curveSegments: 12,
      });
    };
    const fm = plastic(0x2a2a2f, 0.35);
    add(frame(2.1, 0.3, 1.8, 0.11), fm, 0, 0.6, 1.3);
    add(new THREE.BoxGeometry(1.8, 0.11, 0.05), blk, 0, 0.6, 1.29);
    [-1, 1].forEach((s) => {
      add(
        frame(1.5, 0.3, 1.3, 0.11).rotateY((s * PI) / 2),
        fm,
        s * 1.25,
        2.15,
        -0.05,
      );
      add(new THREE.BoxGeometry(0.05, 0.11, 1.3), blk, s * 1.22, 2.15, -0.05);
    });

    const dc = cv(320, 170),
      dg = dc.getContext('2d')!,
      dt = tx(dc);
    add(
      new THREE.PlaneGeometry(0.95, 0.5),
      new THREE.MeshBasicMaterial({ map: dt }),
      0,
      1.5,
      1.4,
    ).castShadow = false;
    dg.fillStyle = '#040405';
    dg.fillRect(0, 0, 320, 170);
    dg.fillStyle = '#8f949c';
    dg.font = 'bold 18px "Courier New",monospace';
    dg.textAlign = 'left';
    dg.fillText('READY', 14, 26);
    dg.fillRect(270, 12, 34, 14);
    dg.fillRect(304, 16, 4, 6);
    dg.fillStyle = '#f4f4f4';
    dg.font = 'bold 72px "Courier New",monospace';
    dg.textAlign = 'center';
    [4, 7, 24].forEach((n, i) => dg.fillText(String(n), 56 + i * 104, 108));
    dg.fillStyle = '#c9ccd1';
    dg.font = '20px "Courier New",monospace';
    ['people', 'sheet', 'bottom'].forEach((t, i) =>
      dg.fillText(t, 56 + i * 104, 148),
    );
    dt.needsUpdate = true;

    const btn = (
      x: number,
      y: number,
      r: number,
      ic: keyof typeof ICON,
      col = 0x2b2b30,
      ic2 = 0xd6d6dc,
    ) => {
      const m = add(
        new THREE.CylinderGeometry(r, r * 1.05, 0.08, 40).rotateX(PI / 2),
        plastic(col, 0.4),
        x,
        y,
        1.4,
      );
      const o = new THREE.Mesh(
        new THREE.CircleGeometry(r * 0.8, 40),
        new THREE.MeshBasicMaterial({
          map: icon(ICON[ic]),
          transparent: true,
          color: ic2,
        }),
      );
      o.position.z = 0.045;
      m.add(o);
    };
    btn(-1.0, 1.5, 0.22, 'play');
    btn(-0.62, 1.68, 0.1, 'plus');
    btn(-0.62, 1.32, 0.1, 'minus');
    btn(1.0, 1.5, 0.22, 'stop', 0xc4161c, 0xffe8e8);
    btn(0.62, 1.68, 0.1, 'up');
    btn(0.62, 1.32, 0.1, 'down');

    const cardGeo = new THREE.ExtrudeGeometry(
      rr(CARD_L, CARD_W, (11 / 120) * CARD_W),
      { depth: 0.012, bevelEnabled: false, curveSegments: 8 },
    ).rotateX(-PI / 2);
    const cw = new THREE.MeshStandardMaterial({
      color: 0xf4f4f4,
      roughness: 0.5,
    });

    const cm = new THREE.MeshBasicMaterial({
      map: cardTex(),
      toneMapped: false,
    });
    const cardMats = [cm, cw];
    const mkCard = () => {
      const m = new THREE.Mesh(cardGeo, cardMats);
      m.castShadow = m.receiveShadow = true;
      return m;
    };
    [-1, 1].forEach((s) => {
      const g = new THREE.Group();
      g.position.set(s * 1.22, 2.15, -0.25);
      g.rotation.z = s * 0.5;
      for (let i = 0; i < 16; i++) {
        const m = mkCard();
        m.position.set(
          s * 0.75 + (Math.random() - 0.5) * 0.03,
          i * 0.02 + 0.01,
          (Math.random() - 0.5) * 0.03,
        );
        m.rotation.y = (Math.random() - 0.5) * 0.025;
        g.add(m);
      }
      mach.add(g);
    });
    const peek = mkCard();
    peek.position.set(0, 0.6, PEEK_REST_Z);
    peek.rotation.set(0.05, 0, 0);
    peek.visible = false;
    mach.add(peek);
    peekRef.current = peek;

    const size = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      R.setSize(w, h);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(size);
    ro.observe(el);
    size();

    let raf = 0;
    const tick = () => {
      placeCamera(cam);
      R.render(scene, cam);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      machRef.current = null;
      peekRef.current = null;
      gsap.killTweensOf([mach.rotation, mach.position, peek.position]);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material;
          (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
        }
      });
      scene.environment?.dispose();
      R.dispose();
      el.removeChild(R.domElement);
    };
  }, []);

  return (
    <div ref={host} className={className} style={{ pointerEvents: 'none' }} />
  );
};

export default DealerMachine3D;
