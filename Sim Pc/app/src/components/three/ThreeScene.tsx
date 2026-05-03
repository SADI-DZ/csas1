import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  componentId: string;
  autoRotate?: boolean;
  height?: string;
  onLoad?: () => void;
}

const componentGeometries: Record<string, () => THREE.Group> = {
  cpu: () => {
    const group = new THREE.Group();
    // Metal top
    const topGeo = new THREE.BoxGeometry(1.5, 0.15, 1.5);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      metalness: 0.9,
      roughness: 0.2,
    });
    const top = new THREE.Mesh(topGeo, metalMat);
    top.position.y = 0.075;
    group.add(top);
    // PCB base
    const pcbGeo = new THREE.BoxGeometry(1.7, 0.05, 1.7);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x1a5a3a,
      metalness: 0.1,
      roughness: 0.8,
    });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.position.y = -0.025;
    group.add(pcb);
    // Pins (golden dots)
    const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.06);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 1,
      roughness: 0.3,
    });
    for (let x = -6; x <= 6; x++) {
      for (let z = -6; z <= 6; z++) {
        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set(x * 0.1, -0.06, z * 0.1);
        group.add(pin);
      }
    }
    return group;
  },
  motherboard: () => {
    const group = new THREE.Group();
    // Main board
    const boardGeo = new THREE.BoxGeometry(3.5, 0.08, 3);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a2a,
      metalness: 0.3,
      roughness: 0.7,
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    group.add(board);
    // CPU socket
    const socketGeo = new THREE.BoxGeometry(0.8, 0.12, 0.8);
    const socketMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.4,
    });
    const socket = new THREE.Mesh(socketGeo, socketMat);
    socket.position.set(-0.5, 0.08, -0.5);
    group.add(socket);
    // RAM slots
    const ramSlotGeo = new THREE.BoxGeometry(1.2, 0.1, 0.15);
    const ramSlotMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.5,
      roughness: 0.6,
    });
    for (let i = 0; i < 4; i++) {
      const slot = new THREE.Mesh(ramSlotGeo, ramSlotMat);
      slot.position.set(0.8, 0.06, -0.6 + i * 0.25);
      group.add(slot);
    }
    // PCIe slot
    const pcieGeo = new THREE.BoxGeometry(2.5, 0.1, 0.12);
    const pcieMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.6,
      roughness: 0.5,
    });
    const pcie = new THREE.Mesh(pcieGeo, pcieMat);
    pcie.position.set(0, 0.06, 0.8);
    group.add(pcie);
    // VRM heatsink
    const vrmGeo = new THREE.BoxGeometry(0.6, 0.25, 0.4);
    const vrmMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.3,
    });
    const vrm = new THREE.Mesh(vrmGeo, vrmMat);
    vrm.position.set(-1.2, 0.12, -0.8);
    group.add(vrm);
    // Chipset heatsink
    const chipGeo = new THREE.BoxGeometry(0.5, 0.15, 0.5);
    const chip = new THREE.Mesh(chipGeo, vrmMat);
    chip.position.set(0.5, 0.08, 0.5);
    group.add(chip);
    return group;
  },
  ram: () => {
    const group = new THREE.Group();
    // Main body
    const bodyGeo = new THREE.BoxGeometry(2.2, 0.25, 0.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    // Heat spreader top
    const topGeo = new THREE.BoxGeometry(2.2, 0.08, 0.22);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0xffd700,
      emissiveIntensity: 0.1,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.16;
    group.add(top);
    // Gold pins
    const pinGeo = new THREE.BoxGeometry(2.2, 0.05, 0.03);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 1,
      roughness: 0.2,
    });
    const pins = new THREE.Mesh(pinGeo, pinMat);
    pins.position.y = -0.15;
    group.add(pins);
    return group;
  },
  gpu: () => {
    const group = new THREE.Group();
    // Main PCB
    const pcbGeo = new THREE.BoxGeometry(3, 0.15, 1.2);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.4,
      roughness: 0.6,
    });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    group.add(pcb);
    // Shroud
    const shroudGeo = new THREE.BoxGeometry(2.8, 0.4, 1.1);
    const shroudMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.7,
      roughness: 0.3,
    });
    const shroud = new THREE.Mesh(shroudGeo, shroudMat);
    shroud.position.y = 0.25;
    group.add(shroud);
    // Fans
    const fanGeo = new THREE.TorusGeometry(0.3, 0.05, 8, 16);
    const fanMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.5,
      roughness: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.6,
      roughness: 0.4,
    });
    for (let i = 0; i < 3; i++) {
      const fanGroup = new THREE.Group();
      const rim = new THREE.Mesh(fanGeo, fanMat);
      fanGroup.add(rim);
      // Fan blades
      for (let b = 0; b < 9; b++) {
        const bladeGeo = new THREE.BoxGeometry(0.04, 0.02, 0.25);
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.set(0, 0, 0.15);
        blade.rotation.y = (b / 9) * Math.PI * 2;
        blade.rotateOnAxis(new THREE.Vector3(0, 1, 0), (b / 9) * Math.PI * 2);
        fanGroup.add(blade);
      }
      // Hub
      const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.03, 16);
      const hub = new THREE.Mesh(hubGeo, bladeMat);
      hub.rotation.x = Math.PI / 2;
      fanGroup.add(hub);
      fanGroup.position.set(-0.8 + i * 0.8, 0.45, 0);
      fanGroup.rotation.x = Math.PI / 2;
      group.add(fanGroup);
    }
    // RGB strip
    const rgbGeo = new THREE.BoxGeometry(2.8, 0.02, 0.02);
    const rgbMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.5,
    });
    const rgb = new THREE.Mesh(rgbGeo, rgbMat);
    rgb.position.set(0, 0.47, -0.56);
    group.add(rgb);
    // PCIe connector
    const pcieGeo = new THREE.BoxGeometry(0.4, 0.2, 0.08);
    const pcieMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
    });
    const pcie = new THREE.Mesh(pcieGeo, pcieMat);
    pcie.position.set(0, -0.05, 0.55);
    group.add(pcie);
    return group;
  },
  psu: () => {
    const group = new THREE.Group();
    // Main body
    const bodyGeo = new THREE.BoxGeometry(1.8, 1, 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.7,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    // Fan grill
    const grillGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16);
    const grillMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.5,
      roughness: 0.6,
    });
    const grill = new THREE.Mesh(grillGeo, grillMat);
    grill.rotation.x = Math.PI / 2;
    grill.position.set(0, 0, 0.61);
    group.add(grill);
    // Fan blades
    const bladeGeo = new THREE.BoxGeometry(0.03, 0.6, 0.02);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.6,
      roughness: 0.4,
    });
    const fanGroup = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.z = (i / 7) * Math.PI * 2;
      fanGroup.add(blade);
    }
    fanGroup.position.set(0, 0, 0.63);
    group.add(fanGroup);
    // Power switch area
    const switchGeo = new THREE.BoxGeometry(0.3, 0.4, 0.02);
    const switchMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.5,
      roughness: 0.7,
    });
    const switchMesh = new THREE.Mesh(switchGeo, switchMat);
    switchMesh.position.set(0, 0, -0.61);
    group.add(switchMesh);
    // Cable bundle
    for (let i = 0; i < 5; i++) {
      const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5);
      const cableMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x222222 : 0x111111,
        metalness: 0.2,
        roughness: 0.8,
      });
      const cable = new THREE.Mesh(cableGeo, cableMat);
      cable.rotation.x = Math.PI / 2;
      cable.position.set(-0.4 + i * 0.2, 0.2, -0.8);
      group.add(cable);
    }
    return group;
  },
  ssd: () => {
    const group = new THREE.Group();
    // Main body
    const bodyGeo = new THREE.BoxGeometry(1, 0.06, 0.7);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.5,
      roughness: 0.5,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    // Label
    const labelGeo = new THREE.PlaneGeometry(0.8, 0.5);
    const labelMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.6,
      roughness: 0.4,
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.rotation.x = -Math.PI / 2;
    label.position.y = 0.031;
    group.add(label);
    // NAND chips
    const chipGeo = new THREE.BoxGeometry(0.2, 0.02, 0.2);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.3,
      roughness: 0.7,
    });
    for (let i = 0; i < 4; i++) {
      const chip = new THREE.Mesh(chipGeo, chipMat);
      chip.position.set(-0.2 + (i % 2) * 0.4, 0.04, -0.1 + Math.floor(i / 2) * 0.2);
      group.add(chip);
    }
    // Connector
    const connGeo = new THREE.BoxGeometry(0.15, 0.04, 0.04);
    const connMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
    });
    const conn = new THREE.Mesh(connGeo, connMat);
    conn.position.set(0.52, 0, 0);
    group.add(conn);
    // LED indicator
    const ledGeo = new THREE.SphereGeometry(0.03);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.8,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(-0.35, 0.05, -0.25);
    group.add(led);
    return group;
  },
  cooler: () => {
    const group = new THREE.Group();
    // Radiator
    const radGeo = new THREE.BoxGeometry(2.5, 0.15, 0.8);
    const radMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.7,
      roughness: 0.4,
    });
    const rad = new THREE.Mesh(radGeo, radMat);
    group.add(rad);
    // Fins
    const finGeo = new THREE.BoxGeometry(0.01, 0.12, 0.7);
    const finMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.3,
    });
    for (let i = 0; i < 30; i++) {
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.position.set(-1.2 + i * 0.08, 0, 0);
      group.add(fin);
    }
    // Pump/Cold plate
    const pumpGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
    const pumpMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.8,
      roughness: 0.3,
    });
    const pump = new THREE.Mesh(pumpGeo, pumpMat);
    pump.position.set(0, -0.5, 0.8);
    group.add(pump);
    // Tubes
    const tubeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.8,
      transparent: true,
      opacity: 0.9,
    });
    for (let i = 0; i < 2; i++) {
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.position.set(-0.15 + i * 0.3, -0.2, 0.6);
      tube.rotation.x = 0.3;
      group.add(tube);
    }
    // RGB ring on pump
    const ringGeo = new THREE.TorusGeometry(0.3, 0.02, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, -0.42, 0.8);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    return group;
  },
  case: () => {
    const group = new THREE.Group();
    // Main frame
    const frameGeo = new THREE.BoxGeometry(2.2, 3.5, 2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    group.add(frame);
    // Front panel mesh
    const frontGeo = new THREE.BoxGeometry(2.22, 3.2, 0.05);
    const frontMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.4,
      roughness: 0.6,
      transparent: true,
      opacity: 0.7,
    });
    const front = new THREE.Mesh(frontGeo, frontMat);
    front.position.set(0, -0.1, 1);
    group.add(front);
    // Side panel (transparent)
    const sideGeo = new THREE.BoxGeometry(0.02, 3.2, 1.9);
    const sideMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.25,
    });
    const side = new THREE.Mesh(sideGeo, sideMat);
    side.position.set(1.11, -0.1, 0);
    group.add(side);
    // Internal RGB fans (front)
    const fanGeo = new THREE.TorusGeometry(0.25, 0.03, 8, 16);
    const fanMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.6,
    });
    for (let i = 0; i < 3; i++) {
      const fan = new THREE.Mesh(fanGeo, fanMat);
      fan.position.set(0, 0.8 - i * 0.9, 0.95);
      group.add(fan);
    }
    // RGB strip (bottom)
    const stripGeo = new THREE.BoxGeometry(2, 0.03, 0.03);
    const stripMat = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.5,
    });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, -1.7, 0.9);
    group.add(strip);
    // Feet
    const footGeo = new THREE.BoxGeometry(0.3, 0.1, 0.3);
    const footMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3,
    });
    for (let i = 0; i < 4; i++) {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(
        -0.8 + (i % 2) * 1.6,
        -1.8,
        -0.6 + Math.floor(i / 2) * 1.2
      );
      group.add(foot);
    }
    return group;
  },
};

export default function ThreeScene({ componentId, autoRotate = true, height = '300px', onLoad }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    group: THREE.Group;
    animationId: number;
  } | null>(null);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(3, 2, 4);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const blueLight = new THREE.PointLight(0x0088ff, 0.5, 10);
    blueLight.position.set(-3, 2, 3);
    scene.add(blueLight);

    const greenLight = new THREE.PointLight(0x00ff88, 0.3, 10);
    greenLight.position.set(3, -2, -3);
    scene.add(greenLight);

    // Component group
    const group = new THREE.Group();
    scene.add(group);

    // Floor grid
    const gridHelper = new THREE.GridHelper(8, 20, 0x222222, 0x111111);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    // Store references
    sceneRef.current = { scene, camera, renderer, group, animationId: 0 };

    if (onLoad) onLoad();
  }, [onLoad]);

  const loadComponent = useCallback((id: string) => {
    if (!sceneRef.current) return;

    // Clear previous
    while (sceneRef.current.group.children.length > 0) {
      const child = sceneRef.current.group.children[0];
      sceneRef.current.group.remove(child);
    }

    // Load new geometry
    const geometryFn = componentGeometries[id];
    if (geometryFn) {
      const mesh = geometryFn();
      sceneRef.current.group.add(mesh);
    }
  }, []);

  const animate = useCallback(() => {
    if (!sceneRef.current) return;

    const { renderer, scene, camera, group } = sceneRef.current;

    if (autoRotate) {
      group.rotation.y += 0.005;
    }

    renderer.render(scene, camera);
    sceneRef.current.animationId = requestAnimationFrame(animate);
  }, [autoRotate]);

  const handleResize = useCallback(() => {
    if (!sceneRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const { camera, renderer } = sceneRef.current;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }, []);

  useEffect(() => {
    initScene();
    loadComponent(componentId);

    const animFrame = requestAnimationFrame(animate);
    if (sceneRef.current) {
      sceneRef.current.animationId = animFrame;
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        sceneRef.current.renderer.dispose();
        if (containerRef.current && sceneRef.current.renderer.domElement.parentNode) {
          containerRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
      }
    };
  }, [initScene, loadComponent, animate, handleResize, componentId]);

  useEffect(() => {
    loadComponent(componentId);
  }, [componentId, loadComponent]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, borderRadius: '12px', overflow: 'hidden' }}
    />
  );
}
