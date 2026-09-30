import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, X, Share2, Award, ArrowRight } from 'lucide-react';
import { Match, Team, Player } from '../types';
import { TeamLogo } from './TeamLogos';

interface CupChampionsCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  winnerTeam: Team | null;
  runnerUpTeam: Team | null;
  tournamentTitle?: string;
  mvpPlayer?: Player | null;
  onNavigateToBrackets?: () => void;
}

export const CupChampionsCelebrationModal: React.FC<CupChampionsCelebrationModalProps> = ({
  isOpen,
  onClose,
  match,
  winnerTeam,
  runnerUpTeam,
  tournamentTitle = 'DASHAIN CUP 2026',
  mvpPlayer,
  onNavigateToBrackets,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 3D Three.js Scene Setup (Rotating Golden Trophy & Particle Confetti)
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.parentElement?.clientHeight || 450;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 14);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const goldSpot = new THREE.SpotLight(0xfbbf24, 8, 50, Math.PI / 3, 0.5, 1);
    goldSpot.position.set(10, 15, 10);
    scene.add(goldSpot);

    const blueSpot = new THREE.SpotLight(0x38bdf8, 5, 50, Math.PI / 3, 0.5, 1);
    blueSpot.position.set(-10, 15, -5);
    scene.add(blueSpot);

    // 3D Golden Trophy Group
    const trophyGroup = new THREE.Group();

    // Gold Material
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 2.5,
    });

    const darkGoldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.25,
    });

    // Trophy Base (Black & Gold Pedestal)
    const baseGeo = new THREE.CylinderGeometry(1.8, 2.2, 1.2, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.3 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -2.5;
    trophyGroup.add(baseMesh);

    // Trophy Stem
    const stemGeo = new THREE.CylinderGeometry(0.5, 0.9, 1.5, 16);
    const stemMesh = new THREE.Mesh(stemGeo, darkGoldMaterial);
    stemMesh.position.y = -1.2;
    trophyGroup.add(stemMesh);

    // Trophy Cup Body
    const cupGeo = new THREE.CylinderGeometry(1.9, 0.7, 3.2, 32, 1, true);
    const cupMesh = new THREE.Mesh(cupGeo, goldMaterial);
    cupMesh.position.y = 1.0;
    trophyGroup.add(cupMesh);

    // Cup Base Inside
    const cupBottomGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 32);
    const cupBottomMesh = new THREE.Mesh(cupBottomGeo, darkGoldMaterial);
    cupBottomMesh.position.y = -0.5;
    trophyGroup.add(cupBottomMesh);

    // Trophy Handles (Torus arcs)
    const handleGeo = new THREE.TorusGeometry(1.2, 0.2, 16, 32, Math.PI);
    const handleLeft = new THREE.Mesh(handleGeo, goldMaterial);
    handleLeft.position.set(-1.6, 1.2, 0);
    handleLeft.rotation.z = Math.PI / 2;
    trophyGroup.add(handleLeft);

    const handleRight = new THREE.Mesh(handleGeo, goldMaterial);
    handleRight.position.set(1.6, 1.2, 0);
    handleRight.rotation.z = -Math.PI / 2;
    trophyGroup.add(handleRight);

    // Crown / Top Star
    const crownGeo = new THREE.ConeGeometry(0.6, 0.8, 5);
    const crownMesh = new THREE.Mesh(crownGeo, goldMaterial);
    crownMesh.position.y = 2.9;
    crownMesh.rotation.x = Math.PI;
    trophyGroup.add(crownMesh);

    scene.add(trophyGroup);

    // Confetti Particles System
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number; rot: number }[] = [];

    const palette = [
      new THREE.Color(0xfbbf24), // Gold
      new THREE.Color(0xf43f5e), // Crimson
      new THREE.Color(0x38bdf8), // Cyan
      new THREE.Color(0xa855f7), // Purple
      new THREE.Color(0x34d399), // Emerald
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = Math.random() * 12 - 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      velocities.push({
        x: (Math.random() - 0.5) * 0.04,
        y: -Math.random() * 0.06 - 0.02,
        z: (Math.random() - 0.5) * 0.04,
        rot: Math.random() * 0.1,
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate Trophy smoothly
      trophyGroup.rotation.y = elapsedTime * 0.8;
      trophyGroup.position.y = Math.sin(elapsedTime * 2) * 0.15;

      // Animate Confetti falling
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] += velocities[i].y;
        posArr[i * 3] += Math.sin(elapsedTime + i) * 0.01 + velocities[i].x;

        // Reset particle to top if it falls below bottom
        if (posArr[i * 3 + 1] < -6) {
          posArr[i * 3 + 1] = 8;
          posArr[i * 3] = (Math.random() - 0.5) * 18;
        }
      }
      posAttr.needsUpdate = true;

      // Render
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      goldGeoDispose(scene);
    };
  }, [isOpen]);

  if (!isOpen || !winnerTeam) return null;

  const isHomeWinner = match?.homeTeamId === winnerTeam.id;
  const winnerScore = isHomeWinner ? match?.homeScore : match?.awayScore;
  const loserScore = isHomeWinner ? match?.awayScore : match?.homeScore;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-[#0a1526]/95 via-[#050b14]/95 to-[#020509]/98 text-white shadow-[0_0_80px_rgba(245,158,11,0.35)]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 3D Canvas Container */}
          <div className="relative w-full h-[280px] sm:h-[340px] flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {/* Glowing Backdrop Ray */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020509] via-transparent to-amber-500/10 pointer-events-none" />

            {/* Top Tournament Badge */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono font-black text-[11px] uppercase tracking-widest backdrop-blur-md shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>{tournamentTitle} CHAMPIONS</span>
              <Trophy className="w-4 h-4 text-amber-300" />
            </div>

            {/* Winner Logo Floating */}
            <div className="absolute bottom-4 z-20 flex flex-col items-center gap-2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]">
              <TeamLogo teamId={winnerTeam.id} size={88} className="ring-4 ring-amber-400/60 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.8)]" />
            </div>
          </div>

          {/* Winner Details & Poster Content */}
          <div className="p-6 sm:p-8 space-y-6 text-center relative z-20 -mt-2">
            {/* Title & Celebration Text */}
            <div className="space-y-1">
              <p className="text-xs font-mono font-bold tracking-[0.25em] text-amber-400 uppercase">
                OFFICIAL WINNERS & CUP HOLDERS
              </p>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] uppercase">
                {winnerTeam.name}
              </h2>
            </div>

            {/* Match Final Result Banner Pill */}
            {match && (
              <div className="inline-flex items-center justify-center gap-4 px-6 py-2.5 rounded-2xl bg-white/5 border border-amber-500/30 font-mono text-sm shadow-xl">
                <span className="font-extrabold text-white text-sm">{winnerTeam.shortName || winnerTeam.name}</span>
                <span className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-lg">
                  {winnerScore} - {loserScore}
                </span>
                <span className="font-bold text-gray-400 text-sm">{runnerUpTeam?.shortName || runnerUpTeam?.name || 'Opponent'}</span>
              </div>
            )}

            {/* MVP / Golden Boot Highlight if present */}
            {mvpPlayer && (
              <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-400/15 to-amber-500/10 border border-amber-400/30 text-xs">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-left">
                  <p className="font-mono font-black text-amber-300 text-[10px] uppercase tracking-wider">Tournament MVP</p>
                  <p className="font-bold text-white text-xs">{mvpPlayer.name} ({winnerTeam.shortName})</p>
                </div>
              </div>
            )}


          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function goldGeoDispose(scene: THREE.Scene) {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    }
  });
}

export default CupChampionsCelebrationModal;
