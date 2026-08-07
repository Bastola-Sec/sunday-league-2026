import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AppScrollState } from '../types';

interface ThreeSoccerCanvasProps {
  scrollState: AppScrollState;
  scrollProgress: number; // 0 to 1 smooth value across total scroll
  cinematicTrigger?: number; // Increments whenever a club is selected
}

export const ThreeSoccerCanvas: React.FC<ThreeSoccerCanvasProps> = ({
  scrollState,
  scrollProgress,
  cinematicTrigger = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ballRef = useRef<THREE.Group | null>(null);
  const stadiumLightsRef = useRef<THREE.Group | null>(null);
  const tealSpotRef = useRef<THREE.SpotLight | null>(null);
  const periwinkleSpotRef = useRef<THREE.SpotLight | null>(null);

  // Cinematic swoop animation tracking ref
  const cinematicStartRef = useRef<number>(0);
  const prevTriggerRef = useRef<number>(0);

  // Store current state targets in refs so animate loop reads latest values seamlessly
  const scrollStateRef = useRef(scrollState);
  const scrollProgressRef = useRef(scrollProgress);

  useEffect(() => {
    scrollStateRef.current = scrollState;
    scrollProgressRef.current = scrollProgress;
  }, [scrollState, scrollProgress]);

  useEffect(() => {
    if (cinematicTrigger > 0 && cinematicTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = cinematicTrigger;
      cinematicStartRef.current = Date.now();
    }
  }, [cinematicTrigger]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#05080c');
    scene.fog = new THREE.FogExp2('#05080c', 0.015);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 35, 45);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.appendChild(renderer.domElement);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight('#B7CEEC', 0.8);
    scene.add(ambientLight);

    const tealSpot = new THREE.SpotLight('#4C787E', 3, 100, Math.PI / 4, 0.5, 1);
    tealSpot.position.set(-25, 40, 20);
    tealSpot.castShadow = true;
    scene.add(tealSpot);

    const periwinkleSpot = new THREE.SpotLight('#B7CEEC', 3, 100, Math.PI / 4, 0.5, 1);
    periwinkleSpot.position.set(25, 40, -20);
    periwinkleSpot.castShadow = true;
    scene.add(periwinkleSpot);

    // Pitch Ground Creation
    const pitchWidth = 60;
    const pitchLength = 90;
    const fieldGeometry = new THREE.PlaneGeometry(pitchWidth, pitchLength);
    
    // Create Grass Canvas Texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark emerald green gradient pitch stripes
      ctx.fillStyle = '#1e3d29';
      ctx.fillRect(0, 0, 1024, 1024);
      
      const stripeCount = 14;
      const stripeHeight = 1024 / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        if (i % 2 === 0) {
          ctx.fillStyle = '#234730';
          ctx.fillRect(0, i * stripeHeight, 1024, stripeHeight);
        }
      }

      // Draw Pitch Lines (White & Periwinkle Glow)
      ctx.strokeStyle = '#E2ECF8';
      ctx.lineWidth = 8;

      // Outer Boundary
      ctx.strokeRect(40, 40, 944, 944);

      // Center Line
      ctx.beginPath();
      ctx.moveTo(40, 512);
      ctx.lineTo(984, 512);
      ctx.stroke();

      // Center Circle
      ctx.beginPath();
      ctx.arc(512, 512, 120, 0, Math.PI * 2);
      ctx.stroke();

      // Center Dot
      ctx.fillStyle = '#E2ECF8';
      ctx.beginPath();
      ctx.arc(512, 512, 12, 0, Math.PI * 2);
      ctx.fill();

      // Goal Boxes Top & Bottom
      ctx.strokeRect(312, 40, 400, 160);
      ctx.strokeRect(312, 824, 400, 160);
    }

    const pitchTexture = new THREE.CanvasTexture(canvas);
    pitchTexture.wrapS = THREE.RepeatWrapping;
    pitchTexture.wrapT = THREE.RepeatWrapping;

    const pitchMaterial = new THREE.MeshStandardMaterial({
      map: pitchTexture,
      roughness: 0.6,
      metalness: 0.1,
    });

    const pitchMesh = new THREE.Mesh(fieldGeometry, pitchMaterial);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.receiveShadow = true;
    scene.add(pitchMesh);

    // Goal Posts (White Tubes)
    const goalMaterial = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.2, metalness: 0.8 });
    
    const createGoal = (zPos: number, isRotated: boolean) => {
      const goalGroup = new THREE.Group();
      const postGeom = new THREE.CylinderGeometry(0.2, 0.2, 5);
      const crossGeom = new THREE.CylinderGeometry(0.2, 0.2, 14);

      const leftPost = new THREE.Mesh(postGeom, goalMaterial);
      leftPost.position.set(-7, 2.5, 0);

      const rightPost = new THREE.Mesh(postGeom, goalMaterial);
      rightPost.position.set(7, 2.5, 0);

      const crossbar = new THREE.Mesh(crossGeom, goalMaterial);
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0, 5, 0);

      goalGroup.add(leftPost, rightPost, crossbar);
      goalGroup.position.set(0, 0, zPos);
      if (isRotated) goalGroup.rotation.y = Math.PI;

      return goalGroup;
    };

    scene.add(createGoal(44, false));
    scene.add(createGoal(-44, true));

    // Perimeter LED Sponsor Boards
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: '#4C787E',
      emissive: '#11333D',
      roughness: 0.3,
    });

    const leftBoard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 90), boardMaterial);
    leftBoard.position.set(-31, 1, 0);
    const rightBoard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 90), boardMaterial);
    rightBoard.position.set(31, 1, 0);
    scene.add(leftBoard, rightBoard);

    // Stadium Floodlight Towers (4 corners)
    const stadiumLights = new THREE.Group();
    const towerGeom = new THREE.CylinderGeometry(0.5, 1, 30);
    const towerMat = new THREE.MeshStandardMaterial({ color: '#2C3E50', metalness: 0.9, roughness: 0.2 });

    const createTower = (x: number, z: number) => {
      const tower = new THREE.Mesh(towerGeom, towerMat);
      tower.position.set(x, 15, z);

      // Light Panel Top
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(6, 4, 1),
        new THREE.MeshBasicMaterial({ color: '#B7CEEC' })
      );
      head.position.set(x > 0 ? x - 2 : x + 2, 29, z > 0 ? z - 2 : z + 2);
      head.lookAt(0, 5, 0);

      const towerSpot = new THREE.SpotLight('#B7CEEC', 4, 120, Math.PI / 3, 0.4, 1);
      towerSpot.position.copy(head.position);
      towerSpot.target.position.set(0, 0, 0);
      scene.add(towerSpot);

      stadiumLights.add(tower, head);
    };

    createTower(-36, -48);
    createTower(36, -48);
    createTower(-36, 48);
    createTower(36, 48);
    scene.add(stadiumLights);
    stadiumLightsRef.current = stadiumLights;

    // 3D Soccer Ball
    const ballGroup = new THREE.Group();
    const ballGeom = new THREE.SphereGeometry(1.4, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.3,
      metalness: 0.1,
    });
    const ballMesh = new THREE.Mesh(ballGeom, ballMat);
    ballMesh.castShadow = true;
    ballGroup.add(ballMesh);
    ballGroup.position.set(0, 1.4, 0);
    scene.add(ballGroup);
    ballRef.current = ballGroup;

    // Floating Atmospheric Glow Particles
    const particleCount = 80;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 30 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#B7CEEC',
      size: 0.8,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();

      // Check Cinematic Sweep timer (2.5 seconds)
      const cinematicElapsed = Date.now() - cinematicStartRef.current;
      const isCinematic = cinematicElapsed > 0 && cinematicElapsed < 2500;

      // Base target calculation according to scrollState
      let targetX = 0;
      let targetY = 35;
      let targetZ = 45;
      let lookX = 0;
      let lookY = 0;
      let lookZ = 0;

      switch (scrollStateRef.current) {
        case 1: // Sweeping Field High View
          targetX = Math.sin(scrollProgressRef.current * Math.PI) * 10;
          targetY = 40;
          targetZ = 50;
          break;
        case 2: // Live Action & Fixtures Pitch Focus
          targetX = 0;
          targetY = 8;
          targetZ = 20;
          lookY = 1;
          lookZ = -10;
          break;
        case 3: // Match Venue Ground Level
          targetX = -12;
          targetY = 7;
          targetZ = 22;
          lookY = 2;
          lookZ = -5;
          break;
        case 4: // Standings Overlay
          targetX = 0;
          targetY = 25;
          targetZ = 35;
          break;
        case 5: // Participating Clubs Stage Angle
          targetX = 18;
          targetY = 12;
          targetZ = 20;
          lookX = -5;
          lookY = 2;
          break;
      }

      // If Cinematic Trigger is active, apply dynamic stadium orbit swoop & ball levitation
      if (isCinematic) {
        const progress = cinematicElapsed / 2500; // 0 to 1
        const sweepAngle = progress * Math.PI * 2;
        const sweepRadius = 24 * Math.sin(progress * Math.PI);

        targetX += Math.cos(sweepAngle) * sweepRadius;
        targetZ += Math.sin(sweepAngle) * sweepRadius;
        targetY += Math.sin(progress * Math.PI) * 14;
        lookY = 3;

        if (ballRef.current) {
          ballRef.current.position.y = 1.4 + Math.sin(progress * Math.PI) * 5;
          ballRef.current.rotation.y = time * 3;
        }
      } else {
        if (ballRef.current) {
          ballRef.current.position.y = 1.4 + Math.sin(time * 2) * 0.2;
          ballRef.current.rotation.y = time * 0.5;
        }
      }

      // Smooth Camera Lerp on every frame
      if (cameraRef.current) {
        const camera = cameraRef.current;
        camera.position.x += (targetX - camera.position.x) * 0.08;
        camera.position.y += (targetY - camera.position.y) * 0.08;
        camera.position.z += (targetZ - camera.position.z) * 0.08;
        camera.lookAt(lookX, lookY, lookZ);
      }

      // Float particles
      particles.rotation.y = time * 0.05;

      // WebGL Render Pass
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 w-full h-full pointer-events-none transition-all duration-700 ${
        scrollState === 3 ? 'backdrop-blur-md filter saturate-125 brightness-90' : ''
      }`}
      style={{ zIndex: 0 }}
    />
  );
};
