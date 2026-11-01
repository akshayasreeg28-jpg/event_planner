import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { TableSeating, Guest } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  RotateCcw,
  Compass,
  Eye,
  Sun,
  Moon,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Users,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { DIETARY_BADGE_CONFIG } from './FloorplanSeatingPlanner';

export type CameraPreset = 'isometric' | 'top_down' | 'guest_eye' | 'stage_view';
export type AtmosphereMode = 'evening_warm' | 'royal_sangeet' | 'daylight';

interface Floorplan3DViewerProps {
  tables: TableSeating[];
  guests: Guest[];
  eventTitle: string;
  selectedTableId: string | null;
  onSelectTable: (tableId: string | null) => void;
  dietaryFilter: string;
  isDietaryHighlightActive: boolean;
}

export const Floorplan3DViewer: React.FC<Floorplan3DViewerProps> = ({
  tables,
  guests,
  eventTitle,
  selectedTableId,
  onSelectTable,
  dietaryFilter,
  isDietaryHighlightActive,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // UI state
  const [activePreset, setActivePreset] = useState<CameraPreset>('isometric');
  const [atmosphere, setAtmosphere] = useState<AtmosphereMode>('evening_warm');
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);

  // References to keep mutable Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const tableMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    dir: THREE.DirectionalLight;
    hemi: THREE.HemisphereLight;
    stagePoint1: THREE.PointLight;
    stagePoint2: THREE.PointLight;
  } | null>(null);

  // Camera animation target values
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(24, 26, 24));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isTransitioningCam = useRef<boolean>(true);

  // Selected table info calculation
  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const selectedTableGuests = selectedTable
    ? selectedTable.assignedGuestIds
        .map((id) => guests.find((g) => g.id === id))
        .filter(Boolean) as Guest[]
    : [];
  const selectedTableOccupancy = selectedTableGuests.reduce(
    (acc, g) => acc + 1 + (g.plusOnes || 0),
    0
  );

  // Color mapping for table custom color or fallback
  const getTableHexColor = (table: TableSeating): number => {
    if (table.color) {
      return parseInt(table.color.replace('#', '0x'), 16) || 0x4b2a7b;
    }
    if (table.shape === 'head_table') return 0xc59b27; // regal gold
    if (table.shape === 'rectangular') return 0x8b3a52; // rich burgundy
    return 0x4b2a7b; // signature royal purple
  };

  // Convert 2D percentage coordinate (0-100) to 3D world coordinate (-18 to +18)
  const toWorldCoord = (pctX: number, pctY: number): { x: number; z: number } => {
    const clampedX = Math.max(10, Math.min(90, pctX));
    const clampedY = Math.max(10, Math.min(90, pctY));
    const x = ((clampedX - 50) / 100) * 36;
    const z = ((clampedY - 50) / 100) * 36;
    return { x, z };
  };

  // Apply Camera Preset Coordinates
  const setCameraView = useCallback((preset: CameraPreset) => {
    setActivePreset(preset);
    isTransitioningCam.current = true;

    if (preset === 'top_down') {
      targetCamPos.current.set(0, 40, 0.001);
      targetCamLook.current.set(0, 0, 0);
    } else if (preset === 'isometric') {
      targetCamPos.current.set(24, 25, 24);
      targetCamLook.current.set(0, 0, 0);
    } else if (preset === 'guest_eye') {
      // Perspective from the entrance looking across the tables toward the stage
      targetCamPos.current.set(0, 4.5, 20);
      targetCamLook.current.set(0, 1.5, -16);
    } else if (preset === 'stage_view') {
      // Perspective looking from the stage toward the audience
      targetCamPos.current.set(0, 4, -16);
      targetCamLook.current.set(0, 1, 6);
    }

    if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
    setIsAutoRotating(false);
  }, []);

  // Update atmosphere and lighting colors
  useEffect(() => {
    if (!lightsRef.current || !sceneRef.current) return;
    const { ambient, dir, hemi, stagePoint1, stagePoint2 } = lightsRef.current;

    if (atmosphere === 'evening_warm') {
      sceneRef.current.background = new THREE.Color(0x18141e);
      sceneRef.current.fog = new THREE.FogExp2(0x18141e, 0.015);
      ambient.color.setHex(0xffecd2);
      ambient.intensity = 0.5;
      dir.color.setHex(0xffe2b8);
      dir.intensity = 1.3;
      hemi.color.setHex(0xffebd2);
      hemi.groundColor.setHex(0x362145);
      hemi.intensity = 0.6;
      stagePoint1.intensity = 2.0;
      stagePoint2.intensity = 2.0;
    } else if (atmosphere === 'royal_sangeet') {
      sceneRef.current.background = new THREE.Color(0x130b1c);
      sceneRef.current.fog = new THREE.FogExp2(0x130b1c, 0.018);
      ambient.color.setHex(0xd8b4fe);
      ambient.intensity = 0.45;
      dir.color.setHex(0xfbbf24);
      dir.intensity = 1.1;
      hemi.color.setHex(0xc084fc);
      hemi.groundColor.setHex(0x3b0764);
      hemi.intensity = 0.8;
      stagePoint1.color.setHex(0xf43f5e);
      stagePoint2.color.setHex(0xa855f7);
      stagePoint1.intensity = 3.5;
      stagePoint2.intensity = 3.5;
    } else {
      // daylight
      sceneRef.current.background = new THREE.Color(0xf1edf5);
      sceneRef.current.fog = new THREE.FogExp2(0xf1edf5, 0.012);
      ambient.color.setHex(0xffffff);
      ambient.intensity = 0.8;
      dir.color.setHex(0xfffaed);
      dir.intensity = 1.6;
      hemi.color.setHex(0xffffff);
      hemi.groundColor.setHex(0xdfd3ea);
      hemi.intensity = 0.8;
      stagePoint1.intensity = 1.0;
      stagePoint2.intensity = 1.0;
    }
  }, [atmosphere]);

  // Main Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as per guidelines
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x18141e);
    scene.fog = new THREE.FogExp2(0x18141e, 0.015);

    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 200);
    camera.position.set(24, 25, 24);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Studio Environment Map (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // do not go below ground plane
    controls.minDistance = 4;
    controls.maxDistance = 75;
    controls.target.set(0, 0, 0);

    // Stop scripted camera animation when user touches controls
    controls.addEventListener('start', () => {
      isTransitioningCam.current = false;
    });

    // 5. Lighting Setup
    const ambient = new THREE.AmbientLight(0xffecd2, 0.5);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffebd2, 0x362145, 0.6);
    hemi.position.set(0, 30, 0);
    scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0xffe2b8, 1.3);
    dirLight.position.set(15, 28, 15);
    dirLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 80;
      const d = 22;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight(0xd4c2ff, 0.4);
    fillLight.position.set(-15, 18, -15);
    scene.add(fillLight);

    // Stage spotlights (Mandap Accent)
    const stagePoint1 = new THREE.PointLight(0xffb03b, 2.0, 18);
    stagePoint1.position.set(-8, 6, -16);
    scene.add(stagePoint1);

    const stagePoint2 = new THREE.PointLight(0xffb03b, 2.0, 18);
    stagePoint2.position.set(8, 6, -16);
    scene.add(stagePoint2);

    lightsRef.current = {
      ambient,
      dir: dirLight,
      hemi,
      stagePoint1,
      stagePoint2,
    };

    // 6. Floor & Hall Perimeter Architecture
    // Banquet Floor (Polished parquet/wood look)
    const floorGeo = new THREE.PlaneGeometry(44, 44);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x241d2c,
      roughness: 0.35,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);

    // Architectural Perimeter Boundary Wall Plinth
    const plinthGeo = new THREE.BoxGeometry(45, 0.4, 45);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x140e1b,
      roughness: 0.8,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.21;
    scene.add(plinth);

    // Subtle gold architectural border trim
    const borderPoints = [
      new THREE.Vector3(-21.5, 0.02, -21.5),
      new THREE.Vector3(21.5, 0.02, -21.5),
      new THREE.Vector3(21.5, 0.02, 21.5),
      new THREE.Vector3(-21.5, 0.02, 21.5),
      new THREE.Vector3(-21.5, 0.02, -21.5),
    ];
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x82643a, linewidth: 2 });
    const borderLine = new THREE.Line(borderGeo, borderMat);
    scene.add(borderLine);

    // 7. Venue Landmarks (Mandap/Stage, Dance Floor, Buffet, Entrance)
    // ---------------------------------------------------------------
    // (A) MAIN STAGE / MANDAP (At Z = -17)
    const stageGroup = new THREE.Group();
    stageGroup.position.set(0, 0, -17);

    // Stage Platform (2 steps)
    const stageBaseGeo = new THREE.BoxGeometry(16, 0.6, 6);
    const stageBaseMat = new THREE.MeshStandardMaterial({
      color: 0x4a2a72,
      roughness: 0.3,
      metalness: 0.2,
    });
    const stageBase = new THREE.Mesh(stageBaseGeo, stageBaseMat);
    stageBase.position.y = 0.3;
    stageBase.receiveShadow = !isSoftwareGl;
    stageBase.castShadow = !isSoftwareGl;
    stageGroup.add(stageBase);

    // Stage Top Carpet (Regal Gold/Ivory Runner)
    const stageCarpetGeo = new THREE.BoxGeometry(14, 0.05, 5);
    const stageCarpetMat = new THREE.MeshStandardMaterial({
      color: 0xc49a45,
      roughness: 0.6,
      metalness: 0.3,
    });
    const stageCarpet = new THREE.Mesh(stageCarpetGeo, stageCarpetMat);
    stageCarpet.position.y = 0.63;
    stageGroup.add(stageCarpet);

    // 4 Mandap Columns / Pillars
    const colGeo = new THREE.CylinderGeometry(0.2, 0.25, 4, 16);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.7,
      roughness: 0.2,
    });
    const colPositions = [
      [-6, 2.6, -2],
      [6, 2.6, -2],
      [-6, 2.6, 2],
      [6, 2.6, 2],
    ];
    colPositions.forEach(([cx, cy, cz]) => {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cx, cy, cz);
      col.castShadow = !isSoftwareGl;
      stageGroup.add(col);
    });

    // Mandap Canopy Roof Arch
    const canopyGeo = new THREE.BoxGeometry(13.5, 0.4, 5.5);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x5e2750,
      roughness: 0.5,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 4.7, 0);
    stageGroup.add(canopy);

    // Floral Garland along Canopy
    const garlandGeo = new THREE.TorusGeometry(6.2, 0.15, 8, 24);
    const garlandMat = new THREE.MeshStandardMaterial({
      color: 0xffa040,
      roughness: 0.8,
    });
    const garland = new THREE.Mesh(garlandGeo, garlandMat);
    garland.rotation.x = Math.PI / 2;
    garland.position.set(0, 4.6, 2.5);
    stageGroup.add(garland);

    // Stage Backdrop Panel
    const backdropGeo = new THREE.BoxGeometry(15, 3.8, 0.2);
    const backdropMat = new THREE.MeshStandardMaterial({
      color: 0x2b133d,
      roughness: 0.7,
    });
    const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
    backdrop.position.set(0, 2.5, -2.6);
    stageGroup.add(backdrop);

    scene.add(stageGroup);

    // ---------------------------------------------------------------
    // (B) DANCE FLOOR (In Center: Z = 1)
    const danceGroup = new THREE.Group();
    danceGroup.position.set(0, 0.03, 1);

    const danceGeo = new THREE.BoxGeometry(10, 0.06, 10);
    const danceMat = new THREE.MeshStandardMaterial({
      color: 0x1f172a,
      roughness: 0.2,
      metalness: 0.4,
    });
    const danceFloor = new THREE.Mesh(danceGeo, danceMat);
    danceFloor.receiveShadow = !isSoftwareGl;
    danceGroup.add(danceFloor);

    // Golden Trim around dance floor
    const danceTrimGeo = new THREE.BoxGeometry(10.4, 0.08, 10.4);
    const danceTrimMat = new THREE.MeshStandardMaterial({
      color: 0x82643a,
      roughness: 0.3,
      metalness: 0.6,
    });
    const danceTrim = new THREE.Mesh(danceTrimGeo, danceTrimMat);
    danceTrim.position.y = -0.01;
    danceGroup.add(danceTrim);

    // Decorative inner geometric accent
    const innerGeo = new THREE.PlaneGeometry(6, 6);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x362447,
      roughness: 0.3,
      metalness: 0.3,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const innerPlane = new THREE.Mesh(innerGeo, innerMat);
    innerPlane.rotation.x = -Math.PI / 2;
    innerPlane.rotation.z = Math.PI / 4;
    innerPlane.position.y = 0.04;
    danceGroup.add(innerPlane);

    scene.add(danceGroup);

    // ---------------------------------------------------------------
    // (C) BUFFET & BEVERAGE BAR COUNTERS (Along Left Wall: X = -18)
    const buffetGroup = new THREE.Group();
    buffetGroup.position.set(-18.5, 0, 0);

    const buffetCounterGeo = new THREE.BoxGeometry(2.5, 1.1, 14);
    const buffetCounterMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b45,
      roughness: 0.4,
      metalness: 0.2,
    });
    const buffetCounter = new THREE.Mesh(buffetCounterGeo, buffetCounterMat);
    buffetCounter.position.y = 0.55;
    buffetCounter.castShadow = !isSoftwareGl;
    buffetGroup.add(buffetCounter);

    // White marble countertop
    const buffetTopGeo = new THREE.BoxGeometry(2.8, 0.1, 14.4);
    const buffetTopMat = new THREE.MeshStandardMaterial({
      color: 0xe8e2ee,
      roughness: 0.2,
      metalness: 0.1,
    });
    const buffetTop = new THREE.Mesh(buffetTopGeo, buffetTopMat);
    buffetTop.position.y = 1.15;
    buffetGroup.add(buffetTop);

    // 4 Chafing dishes (warming trays)
    const dishGeo = new THREE.CylinderGeometry(0.5, 0.4, 0.3, 16);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.85,
      roughness: 0.15,
    });
    [-4.5, -1.5, 1.5, 4.5].forEach((dz) => {
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.set(0, 1.35, dz);
      buffetGroup.add(dish);
    });

    scene.add(buffetGroup);

    // ---------------------------------------------------------------
    // (D) GRAND ENTRANCE ARCH & FOYER (At Bottom Z = 18.5)
    const entranceGroup = new THREE.Group();
    entranceGroup.position.set(0, 0, 18.5);

    // Red Carpet runner leading in
    const runnerGeo = new THREE.BoxGeometry(5, 0.03, 7);
    const runnerMat = new THREE.MeshStandardMaterial({
      color: 0x8a1c2d,
      roughness: 0.7,
    });
    const runner = new THREE.Mesh(runnerGeo, runnerMat);
    runner.position.set(0, 0.02, -1.5);
    entranceGroup.add(runner);

    // Welcome Arch
    const archPillarGeo = new THREE.CylinderGeometry(0.25, 0.3, 3.5, 16);
    const archMat = new THREE.MeshStandardMaterial({
      color: 0xbf953f,
      metalness: 0.7,
      roughness: 0.2,
    });
    const leftPillar = new THREE.Mesh(archPillarGeo, archMat);
    leftPillar.position.set(-2.8, 1.75, 1);
    entranceGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(archPillarGeo, archMat);
    rightPillar.position.set(2.8, 1.75, 1);
    entranceGroup.add(rightPillar);

    const archBeamGeo = new THREE.BoxGeometry(6.2, 0.35, 0.4);
    const archBeam = new THREE.Mesh(archBeamGeo, archMat);
    archBeam.position.set(0, 3.6, 1);
    entranceGroup.add(archBeam);

    scene.add(entranceGroup);

    // 8. Raycasting for Table Selection & Tooltip Hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const interactiveMeshes: THREE.Object3D[] = [];
      tableMeshesRef.current.forEach((grp) => {
        grp.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && child.userData.isTablePart) {
            interactiveMeshes.push(child);
          }
        });
      });

      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const tblId = hit.userData.tableId;
        setHoveredTableId(tblId || null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredTableId(null);
        renderer.domElement.style.cursor = 'default';
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      // Only handle left click
      if (e.button !== 0) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const interactiveMeshes: THREE.Object3D[] = [];
      tableMeshesRef.current.forEach((grp) => {
        grp.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && child.userData.isTablePart) {
            interactiveMeshes.push(child);
          }
        });
      });

      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const tblId = hit.userData.tableId;
        if (tblId) {
          onSelectTable(tblId);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handlePointerDown);

    // 9. Resize Listener
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Camera lerp transition to target preset position
      if (isTransitioningCam.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.06);
        controlsRef.current.target.lerp(targetCamLook.current, 0.06);
        controlsRef.current.update();

        if (cameraRef.current.position.distanceTo(targetCamPos.current) < 0.1) {
          isTransitioningCam.current = false;
        }
      } else if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handlePointerDown);
      renderer.dispose();
      scene.clear();
      if (container && renderer.domElement) {
        container.innerHTML = '';
      }
    };
  }, [onSelectTable]);

  // Build & Synchronize Table Models whenever tables, guests, or dietary filter changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old tables
    tableMeshesRef.current.forEach((grp) => {
      scene.remove(grp);
      grp.traverse((child) => {
        if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
      });
    });
    tableMeshesRef.current.clear();

    // Materials factory
    const chairLegMat = new THREE.MeshStandardMaterial({
      color: 0x3d2719,
      roughness: 0.5,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.7,
      roughness: 0.25,
    });
    const centerpieceVaseMat = new THREE.MeshStandardMaterial({
      color: 0xc9a84a,
      metalness: 0.8,
      roughness: 0.2,
    });
    const floralMat = new THREE.MeshStandardMaterial({
      color: 0xff6b8b,
      roughness: 0.8,
    });
    const runnerMat = new THREE.MeshStandardMaterial({
      color: 0xf5eedb,
      roughness: 0.6,
    });

    // Helper to create a procedural 3D chair (multi-part model)
    const createProceduralChair = (cushionColor = 0x4a2a72) => {
      const chairGroup = new THREE.Group();

      // Seat cushion
      const seatGeo = new THREE.BoxGeometry(0.55, 0.12, 0.55);
      const seatMat = new THREE.MeshStandardMaterial({
        color: cushionColor,
        roughness: 0.6,
      });
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.y = 0.55;
      chairGroup.add(seat);

      // Backrest
      const backGeo = new THREE.BoxGeometry(0.55, 0.65, 0.08);
      const backMat = new THREE.MeshStandardMaterial({
        color: cushionColor,
        roughness: 0.6,
      });
      const back = new THREE.Mesh(backGeo, backMat);
      back.position.set(0, 0.95, -0.24);
      chairGroup.add(back);

      // 4 Legs
      const legGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.55, 8);
      const legOffsets = [
        [-0.23, 0.275, -0.23],
        [0.23, 0.275, -0.23],
        [-0.23, 0.275, 0.23],
        [0.23, 0.275, 0.23],
      ];
      legOffsets.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, chairLegMat);
        leg.position.set(lx, ly, lz);
        chairGroup.add(leg);
      });

      return chairGroup;
    };

    // Render each table
    tables.forEach((table) => {
      const tableGroup = new THREE.Group();
      const { x: worldX, z: worldZ } = toWorldCoord(table.x ?? 50, table.y ?? 50);
      tableGroup.position.set(worldX, 0, worldZ);

      const tableBaseHex = getTableHexColor(table);
      const isSelected = selectedTableId === table.id;
      const isHovered = hoveredTableId === table.id;

      // Table Cloth Material
      const tableMat = new THREE.MeshStandardMaterial({
        color: tableBaseHex,
        roughness: 0.45,
        metalness: 0.1,
        emissive: isSelected ? 0x221133 : isHovered ? 0x1a0d24 : 0x000000,
        emissiveIntensity: isSelected ? 0.6 : isHovered ? 0.3 : 0,
      });

      // Gather seated guests for this table
      const seatedGuests = table.assignedGuestIds
        .map((id) => guests.find((g) => g.id === id))
        .filter(Boolean) as Guest[];

      // Check for dietary needs matches
      const hasAllergies = seatedGuests.some(
        (g) => g.dietaryNeeds === 'allergies' || (g.allergies && g.allergies.length > 0)
      );
      const hasJain = seatedGuests.some((g) => g.dietaryNeeds === 'jain');
      const hasVegan = seatedGuests.some((g) => g.dietaryNeeds === 'vegan');
      const hasGlutenFree = seatedGuests.some((g) => g.dietaryNeeds === 'gluten_free');
      const hasHalal = seatedGuests.some((g) => g.dietaryNeeds === 'halal');

      let matchesFilter = false;
      let haloColorHex = 0xffffff;

      if (isDietaryHighlightActive) {
        if (dietaryFilter === 'allergies' && hasAllergies) {
          matchesFilter = true;
          haloColorHex = 0xf43f5e; // Rose
        } else if (dietaryFilter === 'jain' && hasJain) {
          matchesFilter = true;
          haloColorHex = 0xf59e0b; // Amber
        } else if (dietaryFilter === 'vegan' && hasVegan) {
          matchesFilter = true;
          haloColorHex = 0x10b981; // Emerald
        } else if (dietaryFilter === 'gluten_free' && hasGlutenFree) {
          matchesFilter = true;
          haloColorHex = 0xeab308; // Yellow
        } else if (dietaryFilter === 'halal' && hasHalal) {
          matchesFilter = true;
          haloColorHex = 0x0ea5e9; // Sky
        } else if (dietaryFilter === 'all_special' && (hasAllergies || hasJain || hasVegan || hasGlutenFree || hasHalal)) {
          matchesFilter = true;
          haloColorHex = hasAllergies ? 0xf43f5e : 0xf59e0b;
        }
      }

      // 1. Dietary Halo Ring on Floor if active
      if (matchesFilter) {
        const haloGeo = new THREE.RingGeometry(2.3, 2.7, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: haloColorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.rotation.x = -Math.PI / 2;
        haloMesh.position.y = 0.02;
        tableGroup.add(haloMesh);
      }

      // Contact shadow beneath table
      const shadowGeo = new THREE.CircleGeometry(2.4, 24);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x0a0510,
        transparent: true,
        opacity: 0.45,
      });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.01;
      tableGroup.add(shadow);

      // Shape-specific 3D Table Construction
      if (table.shape === 'round' || !table.shape) {
        // Round Banquet Table
        // Tabletop with tablecloth skirt
        const topGeo = new THREE.CylinderGeometry(1.8, 1.85, 0.1, 32);
        const top = new THREE.Mesh(topGeo, tableMat);
        top.position.y = 0.95;
        top.userData = { isTablePart: true, tableId: table.id };
        tableGroup.add(top);

        // Tablecloth Draping Skirt
        const skirtGeo = new THREE.CylinderGeometry(1.82, 1.95, 0.65, 32);
        const skirt = new THREE.Mesh(skirtGeo, tableMat);
        skirt.position.y = 0.62;
        skirt.userData = { isTablePart: true, tableId: table.id };
        tableGroup.add(skirt);

        // Center Pedestal Base
        const baseGeo = new THREE.CylinderGeometry(0.2, 0.5, 0.9, 16);
        const base = new THREE.Mesh(baseGeo, chairLegMat);
        base.position.y = 0.45;
        tableGroup.add(base);

        // Centerpiece (Gold Vase + Florals)
        const vaseGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.45, 12);
        const vase = new THREE.Mesh(vaseGeo, centerpieceVaseMat);
        vase.position.y = 1.2;
        tableGroup.add(vase);

        const flowerGeo = new THREE.DodecahedronGeometry(0.35, 1);
        const flowers = new THREE.Mesh(flowerGeo, floralMat);
        flowers.position.y = 1.55;
        tableGroup.add(flowers);

        // Radially positioned Chairs
        const numChairs = table.capacity || 8;
        const chairRadius = 2.15;
        for (let i = 0; i < numChairs; i++) {
          const angle = (i / numChairs) * Math.PI * 2;
          const cx = Math.sin(angle) * chairRadius;
          const cz = Math.cos(angle) * chairRadius;

          // Guest cushion color
          let cushionColor = 0x4a2a72;
          const guestAtSeat = seatedGuests[i];
          if (guestAtSeat) {
            if (guestAtSeat.dietaryNeeds === 'allergies') cushionColor = 0xf43f5e;
            else if (guestAtSeat.dietaryNeeds === 'jain') cushionColor = 0xf59e0b;
            else if (guestAtSeat.dietaryNeeds === 'vegan') cushionColor = 0x10b981;
            else if (guestAtSeat.dietaryNeeds === 'gluten_free') cushionColor = 0xeab308;
            else if (guestAtSeat.dietaryNeeds === 'halal') cushionColor = 0x0ea5e9;
          }

          const chair = createProceduralChair(cushionColor);
          chair.position.set(cx, 0, cz);
          chair.rotation.y = angle + Math.PI; // Face table center
          tableGroup.add(chair);
        }
      } else if (table.shape === 'rectangular') {
        // Rectangular Banquet Table
        const tableLength = 3.6;
        const tableWidth = 1.8;

        // Tabletop
        const topGeo = new THREE.BoxGeometry(tableLength, 0.1, tableWidth);
        const top = new THREE.Mesh(topGeo, tableMat);
        top.position.y = 0.95;
        top.userData = { isTablePart: true, tableId: table.id };
        tableGroup.add(top);

        // Tablecloth skirt
        const skirtGeo = new THREE.BoxGeometry(tableLength - 0.05, 0.6, tableWidth - 0.05);
        const skirt = new THREE.Mesh(skirtGeo, tableMat);
        skirt.position.y = 0.65;
        skirt.userData = { isTablePart: true, tableId: table.id };
        tableGroup.add(skirt);

        // Silk Runner down the center
        const runnerGeo = new THREE.BoxGeometry(tableLength + 0.05, 0.02, 0.6);
        const runner = new THREE.Mesh(runnerGeo, runnerMat);
        runner.position.y = 1.01;
        tableGroup.add(runner);

        // Centerpieces (2 vases)
        [-0.9, 0.9].forEach((vx) => {
          const vase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.1, 0.4, 12),
            centerpieceVaseMat
          );
          vase.position.set(vx, 1.2, 0);
          tableGroup.add(vase);

          const flowers = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), floralMat);
          flowers.position.set(vx, 1.5, 0);
          tableGroup.add(flowers);
        });

        // Chairs along both sides
        const chairsPerSide = Math.floor(table.capacity / 2) || 4;
        const spacing = (tableLength - 0.6) / (chairsPerSide - 1 || 1);

        for (let side = -1; side <= 1; side += 2) {
          for (let i = 0; i < chairsPerSide; i++) {
            const cx = -((tableLength - 0.6) / 2) + i * spacing;
            const cz = side * 1.35;
            const guestIndex = side === -1 ? i : chairsPerSide + i;
            const guestAtSeat = seatedGuests[guestIndex];

            let cushionColor = 0x8b3a52;
            if (guestAtSeat) {
              if (guestAtSeat.dietaryNeeds === 'allergies') cushionColor = 0xf43f5e;
              else if (guestAtSeat.dietaryNeeds === 'jain') cushionColor = 0xf59e0b;
              else if (guestAtSeat.dietaryNeeds === 'vegan') cushionColor = 0x10b981;
            }

            const chair = createProceduralChair(cushionColor);
            chair.position.set(cx, 0, cz);
            chair.rotation.y = side === -1 ? 0 : Math.PI;
            tableGroup.add(chair);
          }
        }
      } else {
        // Head Table (VIP / Bride & Groom)
        const tableLength = 4.4;
        const tableWidth = 1.6;

        // Elevated Step Base
        const platformGeo = new THREE.BoxGeometry(tableLength + 1.2, 0.15, tableWidth + 1.2);
        const platformMat = new THREE.MeshStandardMaterial({
          color: 0x5e2750,
          roughness: 0.4,
        });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.y = 0.075;
        tableGroup.add(platform);

        // Gold Trim along platform
        const trim = new THREE.Mesh(
          new THREE.BoxGeometry(tableLength + 1.3, 0.05, tableWidth + 1.3),
          goldTrimMat
        );
        trim.position.y = 0.15;
        tableGroup.add(trim);

        // Main Tabletop
        const topGeo = new THREE.BoxGeometry(tableLength, 0.12, tableWidth);
        const top = new THREE.Mesh(topGeo, tableMat);
        top.position.y = 1.1;
        top.userData = { isTablePart: true, tableId: table.id };
        tableGroup.add(top);

        // Velvet Skirt
        const skirtGeo = new THREE.BoxGeometry(tableLength - 0.05, 0.75, tableWidth - 0.05);
        const skirt = new THREE.Mesh(skirtGeo, tableMat);
        skirt.position.y = 0.72;
        skirt.userData = { isTablePart: true, tableId: table.id };
        tableGroup.add(skirt);

        // Lush garland along front edge
        const garland = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, tableLength, 12),
          floralMat
        );
        garland.rotation.z = Math.PI / 2;
        garland.position.set(0, 1.1, tableWidth / 2);
        tableGroup.add(garland);

        // Regal VIP Chairs (facing outward toward guests)
        const numVipChairs = table.capacity || 8;
        const vipSpacing = (tableLength - 0.6) / (numVipChairs - 1 || 1);
        for (let i = 0; i < numVipChairs; i++) {
          const cx = -((tableLength - 0.6) / 2) + i * vipSpacing;
          const chair = createProceduralChair(0xc49a45); // Regal Gold
          chair.position.set(cx, 0.15, -0.7);
          chair.rotation.y = 0; // Facing audience
          tableGroup.add(chair);
        }
      }

      scene.add(tableGroup);
      tableMeshesRef.current.set(table.id, tableGroup);
    });
  }, [tables, guests, selectedTableId, hoveredTableId, dietaryFilter, isDietaryHighlightActive]);

  // Toggle Auto-Rotation
  const toggleAutoRotate = () => {
    if (controlsRef.current) {
      const next = !isAutoRotating;
      controlsRef.current.autoRotate = next;
      controlsRef.current.autoRotateSpeed = 1.2;
      setIsAutoRotating(next);
      if (next) isTransitioningCam.current = false;
    }
  };

  return (
    <div className="relative w-full h-[620px] bg-[#18141e] rounded-2xl overflow-hidden shadow-xl border border-[#4B2A7B]/30 select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Badge Bar (Event Title & Quick Status) */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto bg-[#18141e]/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg text-white">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-serif font-bold text-xs tracking-wide">
            {eventTitle} — 3D Venue Walkthrough
          </span>
          <span className="text-zinc-500">·</span>
          <span className="text-[11px] text-zinc-300 font-mono">
            {tables.length} Tables · {tables.reduce((acc, t) => acc + t.capacity, 0)} Seats
          </span>
        </div>

        {/* Current Camera Angle Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <Badge variant="purple" size="sm">
            {activePreset === 'isometric'
              ? '📐 Isometric 45°'
              : activePreset === 'top_down'
              ? '👁️ Top-Down Bird’s Eye'
              : activePreset === 'guest_eye'
              ? '🚶 Guest Foyer Walk'
              : '🎭 Stage Horizon'}
          </Badge>
        </div>
      </div>

      {/* Selected Table Inspector Overlay Card (When a table is clicked in 3D) */}
      {selectedTable && (
        <div className="absolute top-14 right-4 w-72 bg-[#1e1728]/95 backdrop-blur-lg border border-[#c49a45]/40 rounded-2xl p-4 shadow-2xl text-white z-20 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                Table Selected
              </span>
              <h4 className="text-sm font-bold font-serif text-white">{selectedTable.name}</h4>
              <span className="text-[11px] text-zinc-400 capitalize">
                {selectedTable.shape?.replace('_', ' ') || 'Round'} Table · {selectedTable.locationNote || 'Main Hall'}
              </span>
            </div>

            <button
              onClick={() => onSelectTable(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Occupancy Bar */}
          <div className="mt-3 p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-300">Occupancy</span>
            <span
              className={`font-mono font-bold ${
                selectedTableOccupancy > selectedTable.capacity ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {selectedTableOccupancy} / {selectedTable.capacity} Chairs
            </span>
          </div>

          {/* Seated Guests List */}
          <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {selectedTableGuests.length > 0 ? (
              selectedTableGuests.map((g) => {
                const diet = DIETARY_BADGE_CONFIG[g.dietaryNeeds] || DIETARY_BADGE_CONFIG.standard;
                return (
                  <div
                    key={g.id}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-[11px] flex items-center justify-between"
                  >
                    <span className="font-medium truncate">{g.name}</span>
                    <span className="text-[10px] shrink-0 flex items-center gap-1">
                      <span>{diet.icon}</span>
                      <span className="capitalize text-zinc-400">{g.dietaryNeeds.replace('_', ' ')}</span>
                    </span>
                  </div>
                );
              })
            ) : (
              <span className="text-[11px] text-zinc-400 italic block py-2 text-center">
                No guests assigned to this table yet.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Ergonomic Collapsible Bottom Control Dock (Zero Viewport Center Occlusion) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-auto max-w-[95%] z-20">
        <div className="bg-[#18141e]/90 backdrop-blur-md rounded-2xl border border-white/15 p-2 shadow-2xl flex flex-col items-center">
          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            className="flex items-center gap-1.5 px-3 py-0.5 mb-1 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            {isControlsCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Show 3D Viewport Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Minimize Dock</span>
              </>
            )}
          </button>

          {!isControlsCollapsed && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
              {/* Camera Presets: Top-Down vs Isometric vs Walkthrough */}
              <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 gap-1 text-xs">
                <button
                  onClick={() => setCameraView('isometric')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreset === 'isometric'
                      ? 'bg-[#FF7A6B] text-white shadow-xs'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Isometric 3D</span>
                </button>

                <button
                  onClick={() => setCameraView('top_down')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreset === 'top_down'
                      ? 'bg-[#FF7A6B] text-white shadow-xs'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Top-Down (Bird’s Eye)</span>
                </button>

                <button
                  onClick={() => setCameraView('guest_eye')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreset === 'guest_eye'
                      ? 'bg-[#FF7A6B] text-white shadow-xs'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Guest Eye</span>
                </button>
              </div>

              {/* Atmosphere / Lighting Switcher */}
              <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 gap-1 text-xs">
                <button
                  onClick={() => setAtmosphere('evening_warm')}
                  title="Warm Evening Banquet"
                  className={`p-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    atmosphere === 'evening_warm'
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setAtmosphere('royal_sangeet')}
                  title="Royal Sangeet Neon & Purple"
                  className={`p-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    atmosphere === 'royal_sangeet'
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setAtmosphere('daylight')}
                  title="Bright Daylight Hall"
                  className={`p-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    atmosphere === 'daylight'
                      ? 'bg-amber-200/30 text-yellow-200 border border-yellow-300/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Auto-Rotate Toggle */}
              <button
                onClick={toggleAutoRotate}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAutoRotating
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                    : 'bg-black/40 border-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
                <span>{isAutoRotating ? 'Rotating' : 'Auto-Orbit'}</span>
              </button>

              {/* Reset to Default */}
              <button
                onClick={() => setCameraView('isometric')}
                className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-black/40 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
              >
                Reset Camera
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
