import React from 'react';
import { 
  ArrowLeft as ArrowLeftIcon, ArrowRight, Sparkles, Flame, Zap, Volume2, VolumeX, BookOpen, CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { audioSynth } from '../utils/audio';
import { questionsData } from '../data/questions';

// Full-body Kawin SVG Component
function KawinFullBody() {
  return (
    <svg viewBox="0 0 100 160" className="w-16 h-24 md:w-20 md:h-28 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
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
    <svg viewBox="0 0 100 160" className="w-16 h-24 md:w-20 md:h-28 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]">
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
  onMissionSuccess,
  onExit,
  soundEnabled,
  onToggleSound
}: PreMissionScreenProps) {
  
  const currentLevelData = questionsData.find(l => l.id === levelId);
  const description = currentLevelData?.conceptDescription || "";

  const handleToggleAudio = () => {
    onToggleSound();
    audioSynth.playSfx('click');
  };

  const handleStartMission = () => {
    audioSynth.playSfx('click');
    onMissionSuccess();
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
              MISSION BRIEFING
            </span>
            <span className="text-sm font-bold text-slate-100">
              ด่านที่ {levelId} : {thaiLevelName}
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
        <motion.div
          key="mission-lobby"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-2xl md:max-w-3xl bg-slate-950/80 border border-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl text-center flex flex-col items-center"
        >
          <div className="p-3.5 bg-cyan-950/50 border border-cyan-500/20 rounded-full mb-3">
            <BookOpen className="text-cyan-400" size={32} />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight mb-2">
            ด่านที่ {levelId} : {thaiLevelName}
          </h2>

          <p className="text-sm md:text-base text-slate-300 max-w-xl mb-6 leading-relaxed">
            เตรียมความพร้อมก่อนเข้าสู่ด่านโจทย์ความรู้แนวคิดเชิงคำนวณ ศึกษาสาระความรู้และกติกาเพื่อเข้าสู่แบบทดสอบท้าทายกันเลย!
          </p>

          {/* Mission Details Box */}
          <div className="w-full mb-6 flex flex-col gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 text-left">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-cyan-400 uppercase tracking-widest font-mono mb-2.5 flex items-center gap-1.5">
                <Sparkles size={15} />
                สาระความรู้เชิงคำนวณประจำฐาน
              </h3>
              <div className="text-slate-100 text-sm md:text-base leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto pr-2 custom-scrollbar font-sans font-medium break-words bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                {description}
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-3.5">
              <h3 className="text-xs md:text-sm font-bold text-amber-400 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                <Flame size={15} />
                คำชี้แจงและกติกาการทำแบบทดสอบ
              </h3>
              <ul className="text-slate-200 text-xs md:text-sm leading-relaxed space-y-2 list-none">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>ในแต่ละด่านจะมีหัวใจพลังชีวิต <span className="text-rose-400 font-bold">3 ดวง</span> หากตอบผิดจะเสียหัวใจ 1 ดวง</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>หากตอบถูกติดต่อกัน <span className="text-emerald-400 font-bold">3 ข้อติด (Streak ×3)</span> จะฟื้นฟูหัวใจกลับคืนมา 1 ดวง!</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>หากตอบผิด ระบบจะแสดง <span className="text-yellow-300 font-bold">คำใบ้ชี้แนะ (Hint)</span> เพื่อให้นักเรียนวิเคราะห์และตอบใหม่อีกครั้ง</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>หากหัวใจหมดลง สามารถ <span className="text-cyan-300 font-bold">เริ่มเล่นด่านนั้นๆ ใหม่ได้ทันที</span> โดยไม่ต้องย้อนกลับไปเริ่มด่านแรก</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Dialogue balloon with character */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full mb-6 text-left flex items-center gap-4">
            <div className="shrink-0">
              {selectedChar === 'porjai' ? <PorjaiFullBody /> : <KawinFullBody />}
            </div>
            <div className="flex-1">
              <span className="text-[11px] font-bold text-cyan-400 font-mono block mb-1">
                {selectedChar === 'porjai' ? 'พอใจ' : 'กวิน'} (ผู้ช่วยประจำตัว)
              </span>
              <p className="text-slate-200 text-xs md:text-sm leading-relaxed">
                “สวัสดีครับคุณ <span className="text-cyan-400 font-bold">{characterName}</span> ยินดีต้อนรับสู่ภารกิจด่านที่ {levelId} ศึกษาเนื้อหาและกติกาเรียบร้อยแล้ว กดปุ่มด้านล่างเพื่อเริ่มทำแบบทดสอบท้าทายได้เลยครับ!”
              </p>
            </div>
          </div>

          {/* Action button: Directly enter gameplay */}
          <button
            onClick={handleStartMission}
            className="w-full max-w-md py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base"
          >
            <Zap size={18} fill="currentColor" /> เข้าสู่แบบทดสอบประจำฐาน <ArrowRight size={18} />
          </button>
        </motion.div>
      </main>
    </div>
  );
}
