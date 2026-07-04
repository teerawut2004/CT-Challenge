import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUp, ArrowLeft as ArrowLeftIcon, ArrowRight, Sparkles, Flame, Target, Coins, Zap, Volume2, VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioSynth } from '../utils/audio';
import { questionsData } from '../data/questions';

interface CoinJumperProps {
  character: 'kawin' | 'porjai';
  onWin: () => void;
  levelId: number;
}

function CoinJumper({ character, onWin, levelId }: CoinJumperProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  
  const stateRef = useRef({
    playerY: 138,
    playerVy: 0,
    isGrounded: true,
    coins: [] as Array<{ x: number; y: number; collected: boolean; pulse: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; alpha: number; color: string }>,
    stars: [] as Array<{ x: number; y: number; speed: number; size: number }>,
    score: 0,
    gameWon: false,
    frameCount: 0,
    lastSpawnTime: 0,
  });

  const jumpForce = -11;
  const gravity = 0.5;
  const groundY = 175;
  const playerX = 80;
  const playerSize = 36;

  const triggerJump = () => {
    if (stateRef.current.gameWon) return;
    if (stateRef.current.isGrounded) {
      stateRef.current.playerVy = jumpForce;
      stateRef.current.isGrounded = false;
      audioSynth.playSfx('click');
    }
  };

  useEffect(() => {
    // Generate initial stars for background parallax movement
    const initialStars = [];
    for (let i = 0; i < 20; i++) {
      initialStars.push({
        x: Math.random() * 560,
        y: Math.random() * 150,
        speed: 1 + Math.random() * 3,
        size: 1 + Math.random() * 2,
      });
    }
    stateRef.current.stars = initialStars;
    stateRef.current.coins = [];
    stateRef.current.particles = [];
    stateRef.current.score = 0;
    stateRef.current.gameWon = false;
    stateRef.current.playerY = groundY - playerSize;
    stateRef.current.playerVy = 0;
    stateRef.current.isGrounded = true;
    setScore(0);
    setGameWon(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        triggerJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    let animationId: number;

    const updateGame = () => {
      const state = stateRef.current;
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      state.frameCount++;

      // Background Space gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Parallax Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      state.stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        if (!state.gameWon) {
          star.x -= star.speed;
          if (star.x < 0) {
            star.x = canvas.width;
            star.y = Math.random() * 150;
          }
        }
      });

      // Spawn Coins
      const now = Date.now();
      const spawnInterval = Math.max(600, 1500 - (levelId * 150));
      if (!state.gameWon && now - state.lastSpawnTime > spawnInterval && state.coins.filter(c => !c.collected).length < 4) {
        state.coins.push({
          x: canvas.width + 20,
          y: 60 + Math.random() * 80, // mid to high coins
          collected: false,
          pulse: 0,
        });
        state.lastSpawnTime = now;
      }

      // Draw Floor line with neon glow
      ctx.strokeStyle = character === 'kawin' ? '#06b6d4' : '#f43f5e';
      ctx.lineWidth = 3;
      ctx.shadowColor = character === 'kawin' ? 'rgba(6, 182, 212, 0.5)' : 'rgba(244, 63, 148, 0.5)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset glow

      // Grid helper lines
      ctx.strokeStyle = character === 'kawin' ? 'rgba(6,182,212,0.15)' : 'rgba(244,63,148,0.15)';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      const coinSpeed = 3.0 + (levelId * 0.9);
      const floorSpeed = coinSpeed * 0.875;
      const offset = !state.gameWon ? (state.frameCount * floorSpeed) % gridSpacing : 0;
      for (let x = -offset; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 20, canvas.height);
        ctx.stroke();
      }

      // Physics logic
      state.playerY += state.playerVy;
      state.playerVy += gravity;
      if (state.playerY >= groundY - playerSize) {
        state.playerY = groundY - playerSize;
        state.playerVy = 0;
        state.isGrounded = true;
      }

      // Player Emoji
      ctx.font = '32px sans-serif';
      ctx.textBaseline = 'top';
      const playerEmoji = character === 'kawin' ? '👦' : '👧';
      
      // Glow under player when airborne
      if (!state.isGrounded) {
        ctx.fillStyle = character === 'kawin' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(244, 63, 148, 0.25)';
        ctx.beginPath();
        ctx.arc(playerX + playerSize/2, state.playerY + playerSize/2, 18, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.fillText(playerEmoji, playerX, state.playerY);

      // Coins rendering & collision
      state.coins.forEach(coin => {
        if (coin.collected) return;

        if (!state.gameWon) {
          coin.x -= coinSpeed; // coin movement speed
        }

        coin.pulse += 0.1;
        const radius = 10 + Math.sin(coin.pulse) * 1.5;

        // Gold radial gradient coin
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, radius, 0, Math.PI * 2);
        const goldGrad = ctx.createRadialGradient(coin.x, coin.y, 2, coin.x, coin.y, radius);
        goldGrad.addColorStop(0, '#fef08a');
        goldGrad.addColorStop(0.5, '#eab308');
        goldGrad.addColorStop(1, '#ca8a04');
        ctx.fillStyle = goldGrad;
        ctx.shadowColor = 'rgba(234, 179, 8, 0.6)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Centered dollar sign in the coin
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', coin.x, coin.y);
        ctx.textAlign = 'left';

        // Collision Check
        const dx = (playerX + playerSize/2) - coin.x;
        const dy = (state.playerY + playerSize/2) - coin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < (playerSize/2 + radius)) {
          coin.collected = true;
          state.score++;
          setScore(state.score);
          audioSynth.playSfx('unlock');

          // Star splash particles
          for (let p = 0; p < 8; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3;
            state.particles.push({
              x: coin.x,
              y: coin.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              alpha: 1.0,
              color: '#facc15'
            });
          }

          if (state.score >= 10 && !state.gameWon) {
            state.gameWon = true;
            setGameWon(true);
            audioSynth.playSfx('correct');
          }
        }
      });

      // Filter collected and off-screen coins
      state.coins = state.coins.filter(c => !c.collected && c.x > -30);

      // Update particles
      state.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      state.particles = state.particles.filter(p => p.alpha > 0);

      animationId = requestAnimationFrame(updateGame);
    };

    updateGame();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [character]);

  // Get difficulty level text
  const getDifficultyLabel = () => {
    switch (levelId) {
      case 1:
        return { text: "ระดับพื้นฐาน (Basic) 🟢 Speed: 1x", color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/20" };
      case 2:
        return { text: "ระดับปานกลาง (Normal) 🟡 Speed: 1.25x", color: "text-yellow-400 bg-yellow-950/40 border-yellow-500/20" };
      case 3:
        return { text: "ระดับท้าทาย (Challenging) 🟠 Speed: 1.5x", color: "text-orange-400 bg-orange-950/40 border-orange-500/20" };
      case 4:
        return { text: "ระดับก้าวหน้า (Advanced) 🔴 Speed: 1.75x", color: "text-rose-400 bg-rose-950/40 border-rose-500/20" };
      case 5:
        return { text: "ระดับปรมาจารย์ (Master) 🔥 Speed: 2x", color: "text-pink-400 bg-pink-950/40 border-pink-500/20 animate-pulse" };
      default:
        return { text: `ระดับทั่วไป (Level ${levelId})`, color: "text-slate-400 bg-slate-950/40 border-slate-500/20" };
    }
  };
  const diff = getDifficultyLabel();

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full max-w-lg bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 gap-2.5">
        <div className="flex flex-col gap-1 text-left">
          <span className="text-[11px] text-slate-400 font-medium">
            🎯 เป้าหมาย : เก็บเหรียญทองให้ครบ 10 เหรียญ
          </span>
          <div className={`text-[10px] font-bold font-sans px-2.5 py-0.5 rounded-lg border w-fit ${diff.color}`}>
            {diff.text}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-1.5 bg-amber-950/40 border border-amber-500/30 px-3 py-2 rounded-xl shrink-0">
          <Coins size={14} className="text-amber-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-400 mr-1">เหรียญสะสม:</span>
          <span className="text-sm font-bold text-amber-300 font-mono">
            {score} / 10
          </span>
        </div>
      </div>

      <div 
        onClick={triggerJump}
        className="relative w-full max-w-lg aspect-[2.5/1] rounded-2xl overflow-hidden border-2 border-slate-800 cursor-pointer hover:border-slate-700 active:scale-[0.99] transition-all duration-150 shadow-inner"
      >
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={200} 
          className="w-full h-full block" 
        />
        
        {!gameWon && score === 0 && (
          <div className="absolute inset-0 bg-slate-950/40 pointer-events-none flex flex-col items-center justify-center text-center p-4">
            <span className="text-xs text-slate-300 font-medium">
              กดปุ่ม <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px]">SPACE</span> หรือ <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px]">คลิกหน้าจอ</span> เพื่อกระโดด
            </span>
          </div>
        )}

        {gameWon && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-4 animate-fade-in">
            <span className="text-3xl mb-1">🎉</span>
            <h3 className="text-sm md:text-base font-bold text-amber-400">
              ยอดเยี่ยมมาก! เก็บเหรียญครบแล้ว
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              ประตูด่านคำถามถูกเปิดออกเรียบร้อยแล้ว
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWin();
              }}
              className="mt-3 px-6 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-1"
            >
              <Zap size={12} fill="currentColor" /> เข้าสู่แบบทดสอบท้าทายจริง
            </button>
          </div>
        )}
      </div>

      {!gameWon && (
        <button
          type="button"
          onClick={triggerJump}
          className={`w-full max-w-lg py-3 rounded-2xl border-2 font-extrabold text-sm tracking-wide transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
            character === 'kawin'
              ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
              : 'bg-pink-500 border-pink-300 text-slate-950 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
          }`}
        >
          <ArrowUp size={16} strokeWidth={3} />
          กดตรงนี้เพื่อกระโดด (SPACE)
        </button>
      )}
    </div>
  );
}

// Full-body Kawin SVG Component
function KawinFullBody() {
  return (
    <svg viewBox="0 0 100 160" className="w-28 h-44 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
      {/* Shadow */}
      <ellipse cx="50" cy="148" rx="22" ry="4" fill="rgba(0,0,0,0.4)" />
      
      {/* Head */}
      <rect x="35" y="30" width="30" height="30" rx="10" fill="#fed7aa" />
      
      {/* Ears */}
      <circle cx="32" cy="45" r="4" fill="#fdba74" />
      <circle cx="68" cy="45" r="4" fill="#fdba74" />
      
      {/* Eyes */}
      <circle cx="44" cy="42" r="3" fill="#0f172a" />
      <circle cx="44" cy="41" r="1" fill="#ffffff" />
      <circle cx="56" cy="42" r="3" fill="#0f172a" />
      <circle cx="56" cy="41" r="1" fill="#ffffff" />
      
      {/* Cheeks */}
      <circle cx="40" cy="48" r="2.5" fill="#fca5a5" opacity="0.6" />
      <circle cx="60" cy="48" r="2.5" fill="#fca5a5" opacity="0.6" />
      
      {/* Mouth */}
      <path d="M 46 50 Q 50 54 54 50" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
      
      {/* Hair spikes */}
      <path d="M 32 30 L 38 18 L 44 26 L 50 16 L 56 26 L 62 18 L 68 30 Z" fill="#1e293b" />
      <path d="M 30 32 Q 50 12 70 32 Q 65 24 60 22 Q 50 15 40 22 Q 35 24 30 32" fill="#1e293b" />
      
      {/* Suit/Jacket */}
      <path d="M 30 60 L 70 60 L 73 105 L 27 105 Z" fill="#0891b2" />
      <path d="M 38 60 L 50 85 L 62 60 Z" fill="#0e7490" />
      <line x1="50" y1="60" x2="50" y2="105" stroke="#22d3ee" strokeWidth="2.5" />
      <circle cx="40" cy="75" r="3" fill="#fbbf24" />
      
      {/* Arms */}
      <path d="M 28 60 Q 15 80 23 100 Q 28 100 28 92" fill="#0891b2" />
      <circle cx="23" cy="102" r="4.5" fill="#fed7aa" />
      
      <path d="M 72 60 Q 88 50 84 32 Q 78 32 72 45" fill="#0891b2" />
      <circle cx="84" cy="28" r="4.5" fill="#fed7aa" />
      
      {/* Belt */}
      <rect x="26" y="102" width="48" height="5" fill="#334155" />
      <rect x="46" y="101" width="8" height="7" rx="1.5" fill="#fbbf24" />
      
      {/* Pants */}
      <rect x="31" y="107" width="16" height="33" rx="4" fill="#1e293b" />
      <rect x="53" y="107" width="16" height="33" rx="4" fill="#1e293b" />
      
      {/* Shoes */}
      <path d="M 24 140 L 46 140 L 46 148 L 22 148 Z" fill="#06b6d4" />
      <rect x="21" y="146" width="26" height="3.5" rx="1" fill="#ffffff" />
      
      <path d="M 54 140 L 76 140 L 78 148 L 54 148 Z" fill="#06b6d4" />
      <rect x="53" y="146" width="26" height="3.5" rx="1" fill="#ffffff" />
    </svg>
  );
}

// Full-body Porjai SVG Component
function PorjaiFullBody() {
  return (
    <svg viewBox="0 0 100 160" className="w-28 h-44 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]">
      {/* Shadow */}
      <ellipse cx="50" cy="148" rx="22" ry="4" fill="rgba(0,0,0,0.4)" />
      
      {/* Head */}
      <rect x="35" y="30" width="30" height="30" rx="10" fill="#ffedd5" />
      
      {/* Ears */}
      <circle cx="32" cy="45" r="4" fill="#fed7aa" />
      <circle cx="68" cy="45" r="4" fill="#fed7aa" />
      
      {/* Eyes */}
      <circle cx="44" cy="42" r="3" fill="#0f172a" />
      <circle cx="44" cy="41" r="1" fill="#ffffff" />
      <circle cx="56" cy="42" r="3" fill="#0f172a" />
      <circle cx="56" cy="41" r="1" fill="#ffffff" />
      
      {/* Cheeks */}
      <circle cx="40" cy="49" r="2.5" fill="#fca5a5" opacity="0.7" />
      <circle cx="60" cy="49" r="2.5" fill="#fca5a5" opacity="0.7" />
      
      {/* Mouth */}
      <path d="M 45 49 Q 50 56 55 49" fill="#f43f5e" />
      
      {/* Hair (Brown pigtails) */}
      <path d="M 30 35 Q 50 15 70 35 C 70 20 30 20 30 35" fill="#78350f" />
      <circle cx="28" cy="40" r="8" fill="#78350f" />
      <rect x="29" y="36" width="3" height="8" rx="1" fill="#ec4899" />
      <circle cx="72" cy="40" r="8" fill="#78350f" />
      <rect x="68" y="36" width="3" height="8" rx="1" fill="#ec4899" />
      <path d="M 35 30 Q 42 35 48 30 Q 54 35 65 30" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />
      
      {/* Hoodie/Jacket */}
      <path d="M 30 60 L 70 60 L 73 105 L 27 105 Z" fill="#db2777" />
      <path d="M 30 60 L 50 80 L 70 60" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
      
      {/* Star Badge */}
      <polygon points="50,68 52,73 57,73 53,76 55,81 50,78 45,81 47,76 43,73 48,73" fill="#fbbf24" />
      
      {/* Arms */}
      <path d="M 28 60 Q 14 75 22 92 Q 26 92 28 85" fill="#db2777" />
      <circle cx="22" cy="94" r="4.5" fill="#ffedd5" />
      
      <path d="M 72 60 Q 86 48 82 32 Q 76 32 72 45" fill="#db2777" />
      <circle cx="82" cy="28" r="4.5" fill="#ffedd5" />
      
      {/* Skirt/Shorts */}
      <rect x="31" y="105" width="16" height="15" rx="3" fill="#312e81" />
      <rect x="53" y="105" width="16" height="15" rx="3" fill="#312e81" />
      
      {/* Bare Legs */}
      <rect x="35" y="120" width="8" height="20" fill="#ffedd5" />
      <rect x="57" y="120" width="8" height="20" fill="#ffedd5" />
      
      {/* Shoes */}
      <path d="M 26 140 L 46 140 L 46 148 L 24 148 Z" fill="#ec4899" />
      <rect x="23" y="146" width="24" height="3.5" rx="1" fill="#ffffff" />
      
      <path d="M 54 140 L 74 140 L 76 148 L 54 148 Z" fill="#ec4899" />
      <rect x="53" y="146" width="24" height="3.5" rx="1" fill="#ffffff" />
    </svg>
  );
}

interface PreMissionScreenProps {
  levelId: number;
  levelName: string;
  thaiLevelName: string;
  selectedChar: 'kawin' | 'porjai' | null;
  characterName: string;
  onSaveCharacter: (char: 'kawin' | 'porjai', name: string) => void;
  onMissionSuccess: () => void;
  onExit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function PreMissionScreen({
  levelId,
  levelName,
  thaiLevelName,
  selectedChar,
  characterName,
  onSaveCharacter,
  onMissionSuccess,
  onExit,
  soundEnabled,
  onToggleSound
}: PreMissionScreenProps) {
  
  const currentLevelData = questionsData.find(l => l.id === levelId);
  const description = currentLevelData?.conceptDescription || "";

  // Directly start the mission briefing, bypass character selection
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggleAudio = () => {
    onToggleSound();
    audioSynth.playSfx('click');
  };

  const handleStartMission = () => {
    audioSynth.playSfx('click');
    setIsPlaying(true);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#050811] text-white overflow-hidden font-sans select-none pb-12">
      {/* Background glow effects */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500/20 via-cyan-500 to-cyan-500/20 shadow-[0_0_10px_#06b6d4]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Header */}
      <header className="w-full bg-slate-950/90 border-b border-slate-900 backdrop-blur-md p-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => { audioSynth.playSfx('click'); onExit(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:bg-cyan-950/20 text-cyan-400 font-medium rounded-xl transition-all duration-200 cursor-pointer text-xs md:text-sm"
          >
            <ArrowLeftIcon size={16} />
            กลับไปแผนที่
          </button>
          
          <div className="text-center">
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 block uppercase">
              PRE-MISSION GAMESTAGE
            </span>
            <span className="text-sm font-bold text-slate-100">
              ด่านที่ {levelId} {thaiLevelName}
            </span>
          </div>

          <button
            onClick={handleToggleAudio}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 rounded-xl transition-all duration-200 text-cyan-400 cursor-pointer text-xs"
            id="premission-mute-btn"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col items-center justify-center relative z-10">
        
        <AnimatePresence mode="wait">
          {!isPlaying ? (
            /* PHASE 1: MISSION BRIEFING / ACTIVATION */
            <motion.div
              key="mission-lobby"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              className="w-full max-w-xl bg-slate-950/80 border border-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl text-center flex flex-col items-center"
            >
              <div className="p-3 bg-cyan-950/50 border border-cyan-500/20 rounded-full mb-4">
                <Target className="text-cyan-400 animate-pulse" size={32} />
              </div>

              <h2 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight mb-2">
                ด่านที่ {levelId} {thaiLevelName}
              </h2>

              <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                เตรียมความพร้อมก่อนเข้าสู่ด่านโจทย์ความรู้แนวคิดเชิงคำนวณ มาร่วมฝึกฝนและทดสอบฝีมือในด่านจำลองพลังงานกันเลย!
              </p>

              {/* Mission Details Box */}
              <div className="w-full max-w-xl mb-6 flex flex-col gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 text-left">
                <div>
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                    <Sparkles size={12} />
                    สาระความรู้เชิงคำนวณประจำฐาน
                  </h3>
                  <div className="text-slate-200 text-xs md:text-sm leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto pr-2 custom-scrollbar font-sans">
                    {description}
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono mb-1 flex items-center gap-1.5">
                    <Flame size={12} />
                    คำชี้แจง
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    ก่อนเริ่มทำโจทย์ในแต่ละด่าน นักเรียนจะต้องเล่นมินิเกมและควบคุมตัวละครกระโดดข้ามสิ่งกีดขวางเพื่อสะสมเหรียญพลังงานให้ครบ <span className="text-amber-300 font-bold">10 เหรียญ</span> เพื่อเปิดประตูด้านการเรียนรู้ของแต่ละด่าน!
                  </p>
                </div>
              </div>

              {/* Dialogue balloon from Scout helper */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-md mb-6 text-left relative">
                <p className="text-slate-300 text-xs leading-normal">
                  “สวัสดีครับคุณ <span className="text-cyan-400 font-bold">{characterName}</span> ยินดีต้อนรับสู่ภารกิจด่านที่ {levelId} มาร่วมใจกระโดดเก็บเหรียญให้ครบ 10 เหรียญเพื่อเปิดด่านทดสอบและพิชิตดาวดวงนี้กันเลย!”
                </p>
              </div>

              {/* Action play button */}
              <button
                onClick={handleStartMission}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                เริ่มภารกิจจำลองกระโดดเก็บเหรียญ! <ArrowRight size={16} />
              </button>

            </motion.div>
          ) : (
            /* PHASE 2: PLAYABLE SIDE-SCROLLING COIN JUMPER MINI-GAME */
            <motion.div
              key="playable-jumper"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-2xl bg-slate-950/80 border border-slate-900 rounded-3xl p-5 shadow-2xl flex flex-col items-center"
            >
              <div className="text-center mb-3">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/30 border border-cyan-500/20 px-2.5 py-1 rounded-md mb-2 inline-block">
                  มินิเกมจำลองกระโดดเก็บเหรียญ
                </span>
                <p className="text-xs text-slate-400">
                  ผู้เล่น : <span className="text-cyan-400 font-bold">{characterName}</span>
                </p>
              </div>

              <CoinJumper character={selectedChar || 'kawin'} onWin={onMissionSuccess} levelId={levelId} />
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
