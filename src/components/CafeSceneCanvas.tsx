import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import type { PublicContent } from '../../shared/models';
import { findNextActivity, formatDate, formatTimeRange } from '../lib/format';

interface CafeSceneCanvasProps {
  content: PublicContent;
}

type SceneName =
  | 'entrance'
  | 'counter'
  | 'chalkboard'
  | 'members'
  | 'guide'
  | 'concept'
  | 'closing'
  | 'admin';

interface VectorTriplet {
  position: [number, number, number];
  lookAt: [number, number, number];
}

interface LabelTextureOptions {
  background: string;
  foreground: string;
  accent: string;
  divider?: string;
}

const sceneVectors: Record<SceneName, VectorTriplet> = {
  entrance: {
    position: [0, 3, 13],
    lookAt: [0, 2.2, 2.2],
  },
  counter: {
    position: [0.1, 2.25, 6.6],
    lookAt: [0.2, 1.55, 0.25],
  },
  chalkboard: {
    position: [5.75, 2.6, 3.7],
    lookAt: [4.85, 2.15, -0.2],
  },
  members: {
    position: [-5.8, 2.55, 4.6],
    lookAt: [-4.65, 2.1, 0.4],
  },
  guide: {
    position: [5, 2.45, 8.4],
    lookAt: [5.25, 2.05, 4.2],
  },
  concept: {
    position: [1.45, 2.15, 5.05],
    lookAt: [1.1, 1.55, 0.9],
  },
  closing: {
    position: [-1.4, 2.85, 11.6],
    lookAt: [-1.55, 2.35, 6.2],
  },
  admin: {
    position: [0.6, 2.35, 8.3],
    lookAt: [0.45, 1.85, 1.6],
  },
};

const mobileSceneOffsets: Partial<Record<SceneName, [number, number, number]>> = {
  entrance: [0, 0.05, 1.2],
  counter: [0.15, 0.05, 0.9],
  chalkboard: [-0.45, 0.05, 0.7],
  members: [0.45, 0.05, 0.9],
  guide: [-0.35, 0.05, 0.8],
  concept: [0.2, 0.05, 0.7],
  closing: [0, 0.1, 0.9],
  admin: [0.15, 0.05, 0.8],
};

const routeSceneMap: Record<string, SceneName> = {
  '/schedule': 'chalkboard',
  '/members': 'members',
  '/join': 'guide',
  '/concept': 'concept',
  '/faq': 'closing',
  '/admin': 'admin',
};

const supportsWebgl = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

const toVector3 = (tuple: [number, number, number]): THREE.Vector3 =>
  new THREE.Vector3(tuple[0], tuple[1], tuple[2]);

const isSceneName = (value: string): value is SceneName => value in sceneVectors;

const createLabelTexture = (
  title: string,
  lines: string[],
  options: LabelTextureOptions,
): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  context.fillStyle = options.background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = 'rgba(255, 255, 255, 0.05)';
  context.fillRect(36, 36, canvas.width - 72, canvas.height - 72);

  context.strokeStyle = 'rgba(255, 244, 226, 0.12)';
  context.lineWidth = 4;
  context.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

  context.fillStyle = options.accent;
  context.fillRect(92, 148, canvas.width - 184, 10);

  context.fillStyle = options.foreground;
  context.textBaseline = 'top';
  context.font = '700 74px "Yu Mincho", serif';
  context.fillText(title, 92, 72);

  if (options.divider) {
    context.font = '600 28px "Yu Gothic", sans-serif';
    context.fillStyle = 'rgba(255, 240, 224, 0.82)';
    context.fillText(options.divider, 92, 172);
  }

  context.font = '600 40px "Yu Gothic", sans-serif';
  context.fillStyle = 'rgba(255, 242, 229, 0.92)';
  lines.forEach((line, index) => {
    context.fillText(line, 92, 230 + index * 76);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const createPendantLight = (
  material: THREE.Material,
  bulbMaterial: THREE.MeshStandardMaterial,
): THREE.Group => {
  const group = new THREE.Group();

  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.25, 10), material);
  cable.position.y = -0.62;

  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.74, 0.56, 20), material);
  shade.position.y = -1.35;

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), bulbMaterial);
  bulb.position.set(0, -1.42, 0);

  group.add(cable, shade, bulb);
  return group;
};

const createChair = (
  seatMaterial: THREE.Material,
  legMaterial: THREE.Material,
  backHeight = 0.78,
): THREE.Group => {
  const chair = new THREE.Group();

  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.12, 0.62, 4, 0.05), seatMaterial);
  seat.position.y = 0.62;

  const back = new THREE.Mesh(
    new RoundedBoxGeometry(0.62, backHeight, 0.12, 4, 0.04),
    seatMaterial,
  );
  back.position.set(0, 1.02, -0.25);

  chair.add(seat, back);

  ([
    [-0.22, 0.3, -0.22],
    [0.22, 0.3, -0.22],
    [-0.22, 0.3, 0.22],
    [0.22, 0.3, 0.22],
  ] as const).forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.62, 10), legMaterial);
    leg.position.set(x, y, z);
    chair.add(leg);
  });

  return chair;
};

const createBottle = (material: THREE.Material): THREE.Group => {
  const bottle = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.56, 14), material);
  body.position.y = 0.28;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.18, 10), material);
  neck.position.y = 0.65;

  bottle.add(body, neck);
  return bottle;
};

const getNearestHomeScene = (): SceneName => {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-scene-step]'));

  if (sections.length === 0) {
    return 'entrance';
  }

  const focalLine = window.innerHeight * 0.42;
  let bestScene: SceneName = 'entrance';
  let bestDistance = Number.POSITIVE_INFINITY;

  sections.forEach((section) => {
    const scene = section.dataset['sceneStep'];
    if (!scene || !isSceneName(scene)) {
      return;
    }

    const rect = section.getBoundingClientRect();
    const center = rect.top + Math.min(rect.height, window.innerHeight) * 0.5;
    const distance = Math.abs(center - focalLine);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestScene = scene;
    }
  });

  return bestScene;
};

export const CafeSceneCanvas = ({ content }: CafeSceneCanvasProps) => {
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>('loading');

  const labels = useMemo(() => {
    const nextActivity = findNextActivity(content.activities);
    const members = content.members.slice(0, 3).map((member) => member.vrcName);
    const menuLines = nextActivity
      ? [
          nextActivity.title,
          `${formatDate(nextActivity.date)} ${formatTimeRange(
            nextActivity.startTime,
            nextActivity.endTime,
          )}`,
          nextActivity.meetingPoint,
        ]
      : ['Next schedule coming soon', 'Please check the calendar page', 'Event Cafe'];

    return {
      signTitle: content.settings.siteName,
      menuLines,
      memberLines: members.length > 0 ? members : ['Member 01', 'Member 02', 'Member 03'],
      guideLines: ['1. Friend request', '2. Briefing', '3. Light interview', '4. Welcome'],
    };
  }, [content]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    if (!supportsWebgl()) {
      setState('fallback');
      return;
    }

    const canvas = canvasRef.current;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = reducedMotionQuery.matches;
    let isMobile = window.innerWidth <= 768;
    let disposed = false;
    let frame = 0;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isMobile,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.1 : 1.5));
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1016, isMobile ? 0.034 : 0.027);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 70);
    const lookTarget = new THREE.Vector3(0, 2, 0);
    const cameraTarget = new THREE.Vector3();
    const pointerTarget = new THREE.Vector2();
    const pointerCurrent = new THREE.Vector2();
    const activeScene = { current: 'entrance' as SceneName };

    const root = new THREE.Group();
    scene.add(root);

    const steamPuffs: Array<{
      mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
      baseY: number;
      baseX: number;
      baseZ: number;
      offset: number;
      drift: number;
    }> = [];
    const pendants: Array<{ group: THREE.Group; phase: number }> = [];
    const plantLeaves: Array<{ mesh: THREE.Mesh; phase: number }> = [];
    const particles: Array<{ mesh: THREE.Mesh; phase: number; speed: number; radius: number }> = [];
    const skylineLights: Array<THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>> = [];
    const shimmerMaterials: Array<THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial> = [];

    const woodDark = new THREE.MeshStandardMaterial({
      color: 0x332118,
      roughness: 0.82,
      metalness: 0.08,
    });
    const woodMid = new THREE.MeshStandardMaterial({
      color: 0x66402d,
      roughness: 0.72,
      metalness: 0.08,
    });
    const woodLight = new THREE.MeshStandardMaterial({
      color: 0x8a5d41,
      roughness: 0.66,
      metalness: 0.06,
    });
    const wallCream = new THREE.MeshStandardMaterial({
      color: 0xe4d6c4,
      roughness: 0.96,
      metalness: 0,
    });
    const wallNavy = new THREE.MeshStandardMaterial({
      color: 0x16242c,
      roughness: 0.92,
      metalness: 0.04,
    });
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x221713,
      roughness: 0.84,
      metalness: 0.08,
    });
    const brass = new THREE.MeshStandardMaterial({
      color: 0xc38b4b,
      roughness: 0.32,
      metalness: 0.84,
    });
    const brassDim = new THREE.MeshStandardMaterial({
      color: 0x967040,
      roughness: 0.46,
      metalness: 0.74,
    });
    const upholstery = new THREE.MeshStandardMaterial({
      color: 0x536c53,
      roughness: 0.72,
      metalness: 0.04,
    });
    const darkFabric = new THREE.MeshStandardMaterial({
      color: 0x354031,
      roughness: 0.84,
      metalness: 0.02,
    });
    const ceramic = new THREE.MeshStandardMaterial({
      color: 0xf2e4d0,
      roughness: 0.48,
      metalness: 0.04,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xfff0db,
      transparent: true,
      opacity: 0.42,
      roughness: 0.08,
      metalness: 0.02,
      transmission: 0.55,
      thickness: 0.22,
    });
    const bottleGreen = new THREE.MeshPhysicalMaterial({
      color: 0x3f5f46,
      transparent: true,
      opacity: 0.56,
      roughness: 0.12,
      metalness: 0.04,
      transmission: 0.35,
      thickness: 0.18,
    });
    const bottleAmber = new THREE.MeshPhysicalMaterial({
      color: 0x8f5a2a,
      transparent: true,
      opacity: 0.62,
      roughness: 0.12,
      metalness: 0.04,
      transmission: 0.28,
      thickness: 0.18,
    });
    const foliage = new THREE.MeshStandardMaterial({
      color: 0x58724f,
      roughness: 0.88,
      metalness: 0.02,
    });
    const foliageBright = new THREE.MeshStandardMaterial({
      color: 0x6b825e,
      roughness: 0.82,
      metalness: 0.02,
    });
    const metalDark = new THREE.MeshStandardMaterial({
      color: 0x23262a,
      roughness: 0.52,
      metalness: 0.88,
    });
    const ticketMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0c58f,
      roughness: 0.58,
      metalness: 0.04,
    });
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe2b6,
      emissive: 0xf5b55f,
      emissiveIntensity: 1.7,
      roughness: 0.28,
      metalness: 0.04,
    });
    const signFace = new THREE.MeshStandardMaterial({
      color: 0x3a241c,
      roughness: 0.62,
      metalness: 0.1,
    });

    const ambient = new THREE.AmbientLight(0xf2d8b0, 0.72);
    const hemi = new THREE.HemisphereLight(0x7e99b0, 0x24150f, 1.08);
    const counterLight = new THREE.SpotLight(0xffd8a5, 18, 22, Math.PI / 5.6, 0.5, 1.1);
    counterLight.position.set(0, 5.8, 2.6);
    counterLight.target.position.set(0, 1.2, 0.6);
    counterLight.castShadow = !isMobile;
    counterLight.shadow.mapSize.width = 1024;
    counterLight.shadow.mapSize.height = 1024;
    const windowFill = new THREE.PointLight(0x6ca2c5, 4.2, 18, 1.6);
    windowFill.position.set(-1.8, 3.6, -2.8);

    scene.add(ambient, hemi, counterLight, counterLight.target, windowFill);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), woodDark);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 2.2);
    floor.receiveShadow = !isMobile;
    root.add(floor);

    const rug = new THREE.Mesh(new RoundedBoxGeometry(7.2, 0.06, 8.2, 8, 0.05), darkFabric);
    rug.position.set(0, 0.03, 4.4);
    rug.receiveShadow = !isMobile;
    root.add(rug);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.4), wallNavy);
    backWall.position.set(0, 3, -3.6);
    root.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.4), wallCream);
    leftWall.position.set(-6, 3, 2.2);
    leftWall.rotation.y = Math.PI / 2;
    root.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.4), wallCream);
    rightWall.position.set(6, 3, 2.2);
    rightWall.rotation.y = -Math.PI / 2;
    root.add(rightWall);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(12, 14), trimMaterial);
    ceiling.position.set(0, 6.2, 2.2);
    ceiling.rotation.x = Math.PI / 2;
    root.add(ceiling);

    const frontFrame = new THREE.Mesh(new RoundedBoxGeometry(8.6, 4.9, 0.26, 8, 0.12), trimMaterial);
    frontFrame.position.set(0, 2.8, 8.45);
    root.add(frontFrame);

    const frontOpening = new THREE.Mesh(
      new RoundedBoxGeometry(6.8, 3.9, 0.18, 8, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x0c131a,
        transparent: true,
        opacity: 0.3,
        roughness: 0.9,
        metalness: 0.02,
      }),
    );
    frontOpening.position.set(0, 2.75, 8.35);
    root.add(frontOpening);

    const signTexture = createLabelTexture(labels.signTitle, ['Night Cafe / VRChat'], {
      background: '#3b241b',
      foreground: '#f6e5cf',
      accent: '#d49555',
      divider: 'Warm lights / calm counter / late-night talk',
    });
    const signPlate = new THREE.Mesh(
      new RoundedBoxGeometry(4.8, 1.5, 0.16, 8, 0.08),
      signFace,
    );
    signPlate.position.set(0, 4.22, 7.64);
    const signPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(4.46, 1.18),
      new THREE.MeshStandardMaterial({
        map: signTexture,
        roughness: 0.46,
        metalness: 0.08,
      }),
    );
    signPanel.position.set(0, 4.22, 7.73);
    root.add(signPlate, signPanel);

    const signGlow = new THREE.PointLight(0xffc67d, 3.4, 10, 1.8);
    signGlow.position.set(0, 4.1, 7.15);
    scene.add(signGlow);

    const counterGroup = new THREE.Group();
    counterGroup.position.set(0, 0, 0.2);
    root.add(counterGroup);

    const counterFront = new THREE.Mesh(
      new RoundedBoxGeometry(8, 1.55, 1.32, 8, 0.08),
      woodMid,
    );
    counterFront.position.set(0, 0.76, 0.2);
    counterFront.castShadow = !isMobile;
    counterFront.receiveShadow = !isMobile;
    counterGroup.add(counterFront);

    const counterTop = new THREE.Mesh(
      new RoundedBoxGeometry(8.2, 0.18, 1.62, 8, 0.06),
      woodLight,
    );
    counterTop.position.set(0, 1.58, 0.2);
    counterTop.castShadow = !isMobile;
    counterTop.receiveShadow = !isMobile;
    counterGroup.add(counterTop);

    const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 0.5), woodDark);
    shelfBack.position.set(0, 2.65, -2.95);
    root.add(shelfBack);
    const shelfUpper = shelfBack.clone();
    shelfUpper.position.y = 3.45;
    root.add(shelfUpper);

    [-1.6, -0.8, 0, 0.8, 1.6].forEach((x, index) => {
      const bottle = createBottle(index % 2 === 0 ? bottleGreen : bottleAmber);
      bottle.position.set(x, index % 2 === 0 ? 2.73 : 3.53, -2.82);
      root.add(bottle);

      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.22, 14), ceramic);
      cup.position.set(x + 0.25, index % 2 === 0 ? 2.75 : 3.55, -2.82);
      root.add(cup);
    });

    const coffeeMachine = new THREE.Group();
    coffeeMachine.position.set(-1.35, 1.72, -0.05);
    const machineBody = new THREE.Mesh(
      new RoundedBoxGeometry(0.95, 1.05, 0.58, 6, 0.06),
      metalDark,
    );
    const machineTop = new THREE.Mesh(
      new RoundedBoxGeometry(1.02, 0.14, 0.64, 6, 0.04),
      brassDim,
    );
    machineTop.position.y = 0.56;
    const machineHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.48, 10), brass);
    machineHandle.rotation.z = Math.PI / 2;
    machineHandle.position.set(0.52, 0.1, 0.14);
    coffeeMachine.add(machineBody, machineTop, machineHandle);
    counterGroup.add(coffeeMachine);

    const cupSaucer = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.04, 20), ceramic);
    cupSaucer.position.set(-0.45, 1.68, 0.16);
    counterGroup.add(cupSaucer);

    const coffeeCup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.22, 18), ceramic);
    coffeeCup.position.set(-0.45, 1.8, 0.16);
    counterGroup.add(coffeeCup);

    const cupHandle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.018, 12, 20, Math.PI), ceramic);
    cupHandle.rotation.z = Math.PI / 2;
    cupHandle.position.set(-0.23, 1.8, 0.16);
    counterGroup.add(cupHandle);

    [0, 1, 2, 3].forEach((index) => {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + index * 0.01, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0xf6eee2,
          transparent: true,
          opacity: 0.22,
          roughness: 1,
          metalness: 0,
        }),
      );
      puff.position.set(-0.45 + index * 0.02, 2.04 + index * 0.16, 0.16);
      steamPuffs.push({
        mesh: puff,
        baseX: puff.position.x,
        baseY: puff.position.y,
        baseZ: puff.position.z,
        offset: index * 0.7,
        drift: 0.09 + index * 0.01,
      });
      counterGroup.add(puff);
    });

    const glassCup = new THREE.Mesh<THREE.CylinderGeometry, THREE.MeshPhysicalMaterial>(
      new THREE.CylinderGeometry(0.15, 0.15, 0.36, 18),
      glass,
    );
    glassCup.position.set(0.42, 1.82, 0.1);
    counterGroup.add(glassCup);
    shimmerMaterials.push(glassCup.material);

    const conceptStand = new THREE.Group();
    conceptStand.position.set(1.32, 1.73, 0.72);
    const conceptBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.18, 18), woodLight);
    const conceptStem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.4, 14), brassDim);
    conceptStem.position.y = 0.26;
    const conceptPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.06, 18), brass);
    conceptPlate.position.y = 0.48;
    const conceptCloche = new THREE.Mesh(new THREE.SphereGeometry(0.26, 22, 22), glass);
    conceptCloche.scale.set(1, 0.85, 1);
    conceptCloche.position.y = 0.72;
    const conceptKnob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), brass);
    conceptKnob.position.y = 0.96;
    conceptStand.add(conceptBase, conceptStem, conceptPlate, conceptCloche, conceptKnob);
    counterGroup.add(conceptStand);

    const guestCard = new THREE.Mesh(
      new RoundedBoxGeometry(0.4, 0.02, 0.24, 4, 0.02),
      ticketMaterial,
    );
    guestCard.position.set(1.72, 1.82, 0.42);
    guestCard.rotation.set(-0.4, -0.32, 0.18);
    counterGroup.add(guestCard);

    const menuTent = new THREE.Mesh(
      new RoundedBoxGeometry(0.3, 0.26, 0.04, 4, 0.02),
      ceramic,
    );
    menuTent.position.set(0.98, 1.84, 0.28);
    menuTent.rotation.x = -0.35;
    counterGroup.add(menuTent);

    [-3, -1.2, 0.8].forEach((x, index) => {
      const stool = createChair(upholstery, brassDim, 0.6);
      stool.position.set(x, 0, 2.05);
      stool.scale.setScalar(0.92);
      stool.rotation.y = 0.05 - index * 0.05;
      root.add(stool);
    });

    const table = new THREE.Mesh(
      new RoundedBoxGeometry(1.9, 0.12, 1.1, 6, 0.05),
      woodLight,
    );
    table.position.set(-2.2, 0.92, 5.55);
    table.castShadow = !isMobile;
    table.receiveShadow = !isMobile;
    root.add(table);

    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.94, 16), brassDim);
    tableLeg.position.set(-2.2, 0.45, 5.55);
    root.add(tableLeg);

    ([
      [-3.1, 0, 5.3, 0.48],
      [-1.35, 0, 5.65, -0.62],
    ] as const).forEach(([x, y, z, rotY]) => {
      const chair = createChair(darkFabric, brassDim);
      chair.position.set(x, y, z);
      chair.rotation.y = rotY;
      chair.scale.setScalar(0.88);
      root.add(chair);
    });

    const menuTexture = createLabelTexture('Next Activity', labels.menuLines, {
      background: '#233129',
      foreground: '#f5eadc',
      accent: '#d49b60',
      divider: 'Counter board / warm chalk style',
    });
    const menuFrame = new THREE.Mesh(
      new RoundedBoxGeometry(2.8, 1.9, 0.12, 6, 0.05),
      woodMid,
    );
    menuFrame.position.set(4.55, 2.25, -1.15);
    menuFrame.rotation.y = -Math.PI / 2;
    const menuBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(2.48, 1.58),
      new THREE.MeshStandardMaterial({
        map: menuTexture,
        roughness: 0.68,
        metalness: 0.02,
      }),
    );
    menuBoard.position.set(4.48, 2.25, -1.15);
    menuBoard.rotation.y = -Math.PI / 2;
    root.add(menuFrame, menuBoard);

    const memberTexture = createLabelTexture('Members Wall', labels.memberLines, {
      background: '#4d372b',
      foreground: '#f9ecdc',
      accent: '#93ad82',
      divider: 'Featured cast',
    });
    const memberFrame = new THREE.Mesh(
      new RoundedBoxGeometry(2.7, 1.8, 0.12, 6, 0.05),
      woodMid,
    );
    memberFrame.position.set(-5.25, 2.15, 0.45);
    memberFrame.rotation.y = Math.PI / 2;
    const memberBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(2.36, 1.46),
      new THREE.MeshStandardMaterial({
        map: memberTexture,
        roughness: 0.62,
        metalness: 0.04,
      }),
    );
    memberBoard.position.set(-5.18, 2.15, 0.45);
    memberBoard.rotation.y = Math.PI / 2;
    root.add(memberFrame, memberBoard);

    [-0.65, 0.18, 1.01].forEach((z, index) => {
      const frameMesh = new THREE.Mesh(
        new RoundedBoxGeometry(0.72, 0.92, 0.08, 4, 0.04),
        woodLight,
      );
      frameMesh.position.set(-5.22, 2.02, z);
      frameMesh.rotation.y = Math.PI / 2;
      root.add(frameMesh);

      const portrait = new THREE.Mesh(
        new THREE.PlaneGeometry(0.54, 0.72),
        new THREE.MeshStandardMaterial({
          color: index % 2 === 0 ? 0xd8ceb7 : 0xc5d7c0,
          roughness: 0.74,
          metalness: 0.02,
        }),
      );
      portrait.position.set(-5.16, 2.02, z);
      portrait.rotation.y = Math.PI / 2;
      root.add(portrait);
    });

    const guideTexture = createLabelTexture('Join Flow', labels.guideLines, {
      background: '#efe6d8',
      foreground: '#443126',
      accent: '#8aa078',
      divider: 'Easy steps',
    });
    const guideFrame = new THREE.Mesh(
      new RoundedBoxGeometry(2.75, 1.85, 0.12, 6, 0.05),
      woodMid,
    );
    guideFrame.position.set(5.15, 2.2, 4.4);
    guideFrame.rotation.y = -Math.PI / 2;
    const guideBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.48),
      new THREE.MeshStandardMaterial({
        map: guideTexture,
        roughness: 0.55,
        metalness: 0.02,
      }),
    );
    guideBoard.position.set(5.08, 2.2, 4.4);
    guideBoard.rotation.y = -Math.PI / 2;
    root.add(guideFrame, guideBoard);

    const plantPot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.44, 14), woodLight);
    plantPot.position.set(4.3, 0.25, 0.55);
    root.add(plantPot);
    ([
      [-0.12, 0.58, 0],
      [0.16, 0.8, 0.08],
      [0.04, 1.04, -0.1],
      [-0.2, 0.96, 0.08],
      [0.22, 0.62, -0.04],
    ] as const).forEach(([x, y, z], index) => {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(index % 2 === 0 ? 0.2 : 0.16, 16, 16),
        index % 2 === 0 ? foliage : foliageBright,
      );
      leaf.scale.set(0.8, 1.5, 0.28);
      leaf.position.set(4.3 + x, y, 0.55 + z);
      root.add(leaf);
      plantLeaves.push({ mesh: leaf, phase: index * 0.6 });
    });

    const windowFrame = new THREE.Mesh(
      new RoundedBoxGeometry(4.8, 2.6, 0.16, 8, 0.06),
      woodDark,
    );
    windowFrame.position.set(-1.1, 3.15, -3.45);
    root.add(windowFrame);

    const nightPane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.22, 2.02),
      new THREE.MeshStandardMaterial({
        color: 0x112030,
        roughness: 0.85,
        metalness: 0.02,
        emissive: 0x09131e,
        emissiveIntensity: 0.4,
      }),
    );
    nightPane.position.set(-1.1, 3.15, -3.36);
    root.add(nightPane);

    const mullionVertical = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.04, 0.08), woodDark);
    mullionVertical.position.set(-1.1, 3.15, -3.32);
    root.add(mullionVertical);
    const mullionHorizontal = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 0.08), woodDark);
    mullionHorizontal.position.set(-1.1, 3.15, -3.32);
    root.add(mullionHorizontal);

    [-2.2, -1.25, -0.35, 0.65].forEach((x, buildingIndex) => {
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.8 + buildingIndex * 0.25, 0.3),
        new THREE.MeshStandardMaterial({
          color: 0x1b2634,
          roughness: 0.92,
          metalness: 0.04,
        }),
      );
      building.position.set(x, 2.32 + buildingIndex * 0.12, -3.2);
      root.add(building);

      [0, 1, 2].forEach((row) => {
        const light = new THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>(
          new THREE.BoxGeometry(0.08, 0.1, 0.02),
          new THREE.MeshStandardMaterial({
            color: 0xffddb2,
            emissive: 0xffb561,
            emissiveIntensity: 0.7 + row * 0.08,
            roughness: 0.4,
            metalness: 0.04,
          }),
        );
        light.position.set(
          x - 0.12 + row * 0.12,
          building.position.y - 0.22 + row * 0.16,
          -3.02,
        );
        skylineLights.push(light);
        root.add(light);
      });
    });

    const fairyLightGroup = new THREE.Group();
    root.add(fairyLightGroup);
    [-3.2, -2.2, -1.1, -0.1, 1].forEach((x, index) => {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), glowMaterial);
      bulb.position.set(x, 5.1 + (index % 2 === 0 ? 0.1 : -0.06), -2.9);
      fairyLightGroup.add(bulb);
    });

    [-2.6, 0, 2.6].forEach((x, index) => {
      const pendant = createPendantLight(brassDim, glowMaterial);
      pendant.position.set(x, 5.95, 1.1 + index * 0.2);
      pendants.push({ group: pendant, phase: index * 0.85 });
      root.add(pendant);
    });

    const particleCount = reducedMotion ? 0 : isMobile ? 8 : 18;
    for (let index = 0; index < particleCount; index += 1) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(index % 3 === 0 ? 0.03 : 0.02, 8, 8),
        new THREE.MeshStandardMaterial({
          color: index % 2 === 0 ? 0xffd6a0 : 0xe2f1ff,
          transparent: true,
          opacity: 0.34,
          roughness: 0.3,
          metalness: 0.04,
        }),
      );
      particle.position.set(
        -4.8 + (index % 6) * 1.7,
        1.7 + (index % 4) * 0.68,
        -1.2 + Math.floor(index / 6) * 3.2,
      );
      particles.push({
        mesh: particle,
        phase: index * 0.45,
        speed: 0.26 + (index % 5) * 0.04,
        radius: 0.12 + (index % 4) * 0.03,
      });
      root.add(particle);
    }

    const resize = () => {
      isMobile = window.innerWidth <= 768;
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.1 : 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    const resolveScene = (): SceneName => {
      if (location.pathname.startsWith('/admin')) {
        return 'admin';
      }

      const mappedScene = routeSceneMap[location.pathname];
      if (mappedScene) {
        return mappedScene;
      }

      return getNearestHomeScene();
    };

    const updateScene = () => {
      activeScene.current = resolveScene();
    };

    const updatePointer = (event: PointerEvent) => {
      if (reducedMotion || isMobile) {
        return;
      }

      pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
    };

    const render = () => {
      if (disposed) {
        return;
      }

      frame = window.requestAnimationFrame(render);
      const elapsed = performance.now() * 0.001;

      pointerCurrent.lerp(pointerTarget, reducedMotion ? 0.12 : 0.05);

      const currentScene = activeScene.current;
      const preset = sceneVectors[currentScene];
      const scenePosition = toVector3(preset.position);
      const sceneLookAt = toVector3(preset.lookAt);

      if (isMobile) {
        const offset = mobileSceneOffsets[currentScene];
        if (offset) {
          scenePosition.x += offset[0];
          scenePosition.y += offset[1];
          scenePosition.z += offset[2];
        }
      }

      if (!reducedMotion) {
        if (isMobile) {
          scenePosition.x += Math.sin(elapsed * 0.18) * 0.16;
          scenePosition.y += Math.cos(elapsed * 0.22) * 0.05;
          sceneLookAt.x += Math.sin(elapsed * 0.12) * 0.06;
        } else {
          scenePosition.x += pointerCurrent.x * 0.34;
          scenePosition.y += pointerCurrent.y * 0.12;
          sceneLookAt.x += pointerCurrent.x * 0.12;
          sceneLookAt.y += pointerCurrent.y * 0.05;
        }
      }

      cameraTarget.lerp(scenePosition, reducedMotion ? 0.08 : 0.055);
      lookTarget.lerp(sceneLookAt, reducedMotion ? 0.08 : 0.055);

      camera.position.copy(cameraTarget);
      camera.lookAt(lookTarget);

      root.position.x = !reducedMotion && !isMobile ? pointerCurrent.x * 0.14 : 0;
      root.rotation.y = !reducedMotion && !isMobile ? pointerCurrent.x * 0.03 : 0;
      root.rotation.x = !reducedMotion && !isMobile ? pointerCurrent.y * 0.012 : 0;

      pendants.forEach(({ group, phase }) => {
        group.rotation.z = reducedMotion ? 0 : Math.sin(elapsed * 0.9 + phase) * 0.03;
      });

      plantLeaves.forEach(({ mesh, phase }) => {
        mesh.rotation.z = reducedMotion ? 0 : Math.sin(elapsed * 0.75 + phase) * 0.16;
      });

      steamPuffs.forEach(({ mesh, baseX, baseY, baseZ, offset, drift }, index) => {
        const loop = (elapsed * (0.55 + index * 0.08) + offset) % 1;
        mesh.position.set(
          baseX + Math.sin(elapsed * 1.2 + offset) * drift,
          baseY + loop * 0.45,
          baseZ + Math.cos(elapsed * 1.1 + offset) * 0.05,
        );
        const opacity = reducedMotion ? 0.12 : 0.24 * (1 - loop);
        mesh.material.opacity = opacity;
        mesh.scale.setScalar(0.75 + loop * 1.35);
      });

      particles.forEach(({ mesh, phase, speed, radius }) => {
        mesh.position.y += reducedMotion ? 0 : Math.sin(elapsed * speed + phase) * 0.0025;
        mesh.position.x += reducedMotion ? 0 : Math.cos(elapsed * speed + phase) * 0.0016;
        mesh.position.z += reducedMotion ? 0 : Math.sin(elapsed * (speed * 0.7) + phase) * 0.0012;
        mesh.scale.setScalar(0.92 + Math.sin(elapsed * speed + phase) * radius);
      });

      skylineLights.forEach((light, index) => {
        light.material.emissiveIntensity = 0.55 + Math.sin(elapsed * 0.85 + index * 0.6) * 0.22;
      });

      signGlow.intensity = reducedMotion ? 3.1 : 3.1 + Math.sin(elapsed * 1.1) * 0.45;
      glowMaterial.emissiveIntensity = reducedMotion ? 1.55 : 1.55 + Math.sin(elapsed * 1.5) * 0.18;
      conceptStand.rotation.y = reducedMotion ? 0.12 : Math.sin(elapsed * 0.65) * 0.08 + 0.12;
      guestCard.rotation.z = 0.18 + (reducedMotion ? 0 : Math.sin(elapsed * 0.9) * 0.03);
      if (conceptCloche.material instanceof THREE.MeshPhysicalMaterial) {
        conceptCloche.material.opacity = reducedMotion
          ? 0.42
          : 0.42 + Math.sin(elapsed * 0.8) * 0.04;
      }

      shimmerMaterials.forEach((material, index) => {
        material.emissive = new THREE.Color(0x8a5d27);
        material.emissiveIntensity = 0.03 + Math.sin(elapsed * 0.7 + index) * 0.015;
      });

      renderer.render(scene, camera);
    };

    resize();
    updateScene();
    setState('loading');
    frame = window.requestAnimationFrame(render);
    window.requestAnimationFrame(() => setState('ready'));

    window.addEventListener('resize', resize);
    window.addEventListener('resize', updateScene);
    window.addEventListener('scroll', updateScene, { passive: true });
    window.addEventListener('pointermove', updatePointer, { passive: true });
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', updateScene);
      window.removeEventListener('scroll', updateScene);
      window.removeEventListener('pointermove', updatePointer);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);

      signTexture.dispose();
      menuTexture.dispose();
      memberTexture.dispose();
      guideTexture.dispose();

      const disposeMaterial = (material: THREE.Material): void => {
        const mappedMaterial = material as THREE.Material & { map?: THREE.Texture | null };
        if (mappedMaterial.map) {
          mappedMaterial.map.dispose();
        }
        material.dispose();
      };

      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) {
          return;
        }

        const mesh = object as THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
        mesh.geometry.dispose();

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => {
            disposeMaterial(material);
          });
          return;
        }

        disposeMaterial(mesh.material);
      });

      renderer.dispose();
    };
  }, [content, labels, location.pathname]);

  return (
    <div className="cafe-scene-shell" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={`cafe-scene-canvas ${state === 'ready' ? 'is-ready' : ''}`}
      />
      {state === 'loading' ? (
        <div className="cafe-scene-loader">
          <span className="cafe-loader-lamp" />
          <strong>カフェの室内を準備しています</strong>
          <p>柔らかな照明と店内の背景を読み込み中です。</p>
        </div>
      ) : null}
      {state === 'fallback' ? (
        <div className="cafe-scene-fallback">
          <div className="fallback-window" style={{ left: '12%' }} />
          <div className="fallback-window" style={{ right: '12%', top: '22%' }} />
          <div className="fallback-counter" style={{ left: '50%', transform: 'translateX(-50%)' }} />
          <div className="fallback-sign" style={{ left: '50%', transform: 'translateX(-50%)' }}>
            {labels.signTitle}
          </div>
        </div>
      ) : null}
      <div className="cafe-scene-vignette" />
    </div>
  );
};
