import React from 'react';
import { 
  Car, Fan, Rocket, Bike, Map, 
  TrendingUp, Circle, HelpCircle, 
  Coffee, Network, Flame, Sparkles,
  Play, Cpu, HelpCircle as QuestionIcon, Square,
  CloudRain, Umbrella, CheckCircle2, ChevronRight,
  BookOpen, Heart, Filter, ArrowRight, Repeat,
  Trophy, Activity, LogOut, Wifi
} from 'lucide-react';
import { motion } from 'motion/react';

interface LevelVisualsProps {
  visualType: 
    | 'car' | 'fan' | 'rocket' | 'bicycle' | 'travel' 
    | 'radar' | 'shape' | 'font' | 'map' | 'house' 
    | 'noodle' | 'flowchart' | 'binary' | 'wisdom'
    | 'weather-radar' | 'number-sequence' | 'animal-grouping' | 'robot-loop' 
    | 'dictionary-search' | 'algorithm-correctness' | 'pseudocode' 
    | 'sports-decom' | 'heart-filter' | 'fire-exit' | 'wifi-login';
  activeStep?: number;
}

export default function LevelVisuals({ visualType, activeStep = 0 }: LevelVisualsProps) {
  return (
    <div className="w-full h-56 md:h-64 bg-slate-900 border-2 border-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-xl select-none">
      
      {/* Decorative dark grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 to-slate-900/40 pointer-events-none" />

      {/* 1. CAR (ปัญหารถของกวิน) */}
      {visualType === 'car' && (
        <div className="flex flex-col items-center justify-center gap-4 text-cyan-400 z-10">
          <div className="relative">
            <motion.div
              animate={{ y: [0, -4, 0], rotate: [0, 0.5, -0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="bg-slate-950 p-5 rounded-3xl border border-cyan-500/20 shadow-lg shadow-cyan-500/5"
            >
              <Car size={72} className="text-cyan-400 drop-shadow-[0_2px_15px_rgba(34,211,238,0.3)]" />
            </motion.div>
            <div className="absolute -top-2 -right-2 bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full animate-bounce">
              สตาร์ทไม่ติด! 🔌
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs text-slate-300 font-medium">สลายปัญหาด้วย Decomposition : วิเคราะห์ทีละระบบย่อย</span>
          </div>
        </div>
      )}

      {/* 2. FAN (ส่วนประกอบของพัดลม) */}
      {visualType === 'fan' && (
        <div className="flex items-center gap-8 px-6 z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            className="w-20 h-20 rounded-full border-4 border-dashed border-emerald-500/50 flex items-center justify-center bg-emerald-950/40 shadow-lg shadow-emerald-500/5"
          >
            <Fan size={48} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
          </motion.div>
          <div className="text-left max-w-xs">
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">
              Decomposition Analysis
            </span>
            <div className="mt-2.5 space-y-1">
              <p className="text-xs text-slate-200 font-semibold">การแบ่งย่อยชิ้นส่วนอุปกรณ์</p>
              <p className="text-[11px] text-slate-400 leading-normal">
                ศึกษาหน้าที่ของมอเตอร์ ใบพัด ปุ่มกด และโครงครอบ เพื่อตรวจสอบจุดเสียได้อย่างรวดเร็ว
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. ROCKET (พิกัดตรรกะอวกาศ) */}
      {visualType === 'rocket' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-3 z-10">
          <div className="text-[9px] font-mono font-semibold text-indigo-300 bg-indigo-950/50 border border-indigo-500/20 px-2 py-0.5 rounded-full mb-2">
            พิกัดตรรกะอวกาศ ขนาด 5x5 ช่อง (จาก 🚀 ไปหา 🪐)
          </div>
          
          {/* 5x5 Grid */}
          <div className="grid grid-cols-5 gap-1 bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-xl">
            {Array.from({ length: 25 }).map((_, idx) => {
              const row = Math.floor(idx / 5);
              const col = idx % 5;
              
              const isStart = row === 4 && col === 1;
              const isTarget = row === 2 && col === 4;

              return (
                <div 
                  key={idx} 
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex flex-col items-center justify-center text-xs border relative ${
                    isStart 
                      ? "bg-blue-950/50 border-blue-500/50 text-blue-400 shadow-sm" 
                      : isTarget 
                      ? "bg-rose-950/50 border-rose-500/50 text-rose-400 shadow-sm animate-pulse" 
                      : "bg-slate-900/30 border-slate-800/60"
                  }`}
                >
                  {isStart && (
                    <motion.div
                      animate={{ y: [0, -1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Rocket size={16} className="text-blue-400 -rotate-45" />
                    </motion.div>
                  )}
                  {isTarget && <span className="text-sm">🪐</span>}
                  
                  {/* Coordinate label */}
                  <span className="absolute bottom-0.5 right-0.5 text-[5px] text-slate-500 font-mono">
                    {row},{col}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. BICYCLE (ระบบโซ่จักรยาน) */}
      {visualType === 'bicycle' && (
        <div className="flex flex-col items-center justify-center gap-3 z-10">
          <div className="flex items-center gap-8">
            <div className="p-3.5 bg-slate-950 rounded-full border border-purple-500/20 shadow-md text-purple-400">
              <Bike size={36} />
            </div>
            
            {/* Gear-Chain */}
            <div className="relative flex items-center gap-14">
              {/* Front gear */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                className="w-14 h-14 rounded-full border-4 border-dashed border-purple-500/50 flex items-center justify-center bg-purple-950/20 shadow-md"
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 border border-purple-500/30" />
              </motion.div>
              {/* Chain */}
              <div className="absolute top-1/2 -translate-y-1/2 left-5 right-5 h-6 border-y border-dashed border-purple-500/30 pointer-events-none" />
              {/* Back gear */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="w-9 h-9 rounded-full border-4 border-dashed border-purple-500/40 flex items-center justify-center bg-purple-950/20 shadow-md"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
              </motion.div>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">การคิดเชื่อมโยงกลไก : โซ่และเฟืองจักรยานส่งแรงอย่างเป็นสัดส่วน</span>
        </div>
      )}

      {/* 5. TRAVEL (ทัศนศึกษา) */}
      {visualType === 'travel' && (
        <div className="flex flex-col items-center gap-3 px-6 w-full max-w-sm z-10">
          <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/20 px-3 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">
            Travel Planning Options
          </span>
          <div className="grid grid-cols-4 gap-2.5 w-full">
            {[
              { emoji: "🚗", label: "รถส่วนตัว" },
              { emoji: "🚌", label: "รถบัสยักษ์" },
              { emoji: "🚐", label: "รถตู้ทีม" },
              { emoji: "🚂", label: "รถไฟตั๋ว" }
            ].map((v, i) => (
              <div key={i} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-1 shadow-md hover:border-cyan-500/30 transition-all duration-300">
                <span className="text-xl">{v.emoji}</span>
                <span className="text-[10px] text-slate-300 font-bold">{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. RADAR (ยอดขายช่วงวิเคราะห์สถิติ) */}
      {visualType === 'radar' && (
        <div className="flex items-center gap-6 justify-center px-6 z-10">
          <div className="relative w-16 h-16 flex items-center justify-center border border-slate-800 rounded-2xl bg-slate-950 shadow-md text-purple-400">
            <TrendingUp size={36} />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-left max-w-xs">
            <h4 className="text-[10px] font-bold text-purple-400 font-mono tracking-wider uppercase bg-purple-950/50 px-2 py-0.5 rounded-md inline-block border border-purple-500/20">
              Sales Trend Study
            </h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              การวิเคราะห์พฤติกรรมความสัมพันธ์และสถิติแนวโน้มช่วยในการพยากรณ์ความต้องการผู้คนได้อย่างแม่นยำ
            </p>
          </div>
        </div>
      )}

      {/* WEATHER-RADAR (พยากรณ์ฝนตก -> ยอดขายร่มพุ่ง 5 เท่า) */}
      {visualType === 'weather-radar' && (
        <div className="flex items-center gap-6 justify-center px-6 z-10 w-full max-w-md">
          <div className="flex flex-col items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-blue-500/20 shadow-md shrink-0">
            <div className="flex items-center gap-1.5">
              <CloudRain className="text-blue-400 animate-bounce" size={24} />
              <span className="text-xs font-mono text-blue-300 font-bold">ฝนตก &gt; 80%</span>
            </div>
            <ArrowRight size={14} className="text-slate-500 rotate-90 sm:rotate-0" />
            <div className="flex items-center gap-1.5">
              <Umbrella className="text-pink-400 animate-pulse" size={24} />
              <span className="text-xs font-mono text-pink-300 font-bold">ยอดร่ม x5 เท่า!</span>
            </div>
          </div>
          <div className="text-left">
            <h4 className="text-[10px] font-bold text-blue-300 font-mono tracking-wider uppercase bg-blue-950/60 px-2.5 py-0.5 rounded-md inline-block border border-blue-500/30">
              Weather & Sales Pattern
            </h4>
            <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
              สหกรณ์สืบพบรูปแบบความสัมพันธ์ของภูมิอากาศและยอดขาย นำมาใช้สต็อกร่มพับและเสื้อกันฝนล่วงหน้าได้อย่างสมบูรณ์
            </p>
          </div>
        </div>
      )}

      {/* NUMBER-SEQUENCE (รหัส 3, 6, 12, 24 -> 48) */}
      {visualType === 'number-sequence' && (
        <div className="flex flex-col items-center justify-center gap-4 z-10 w-full px-6">
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-950 py-3 px-4 rounded-2xl border border-violet-500/20 shadow-lg">
            {[3, 6, 12, 24].map((num, i) => (
              <React.Fragment key={i}>
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
                  {num}
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-mono font-bold text-violet-400">x2</span>
                  <ChevronRight size={12} className="text-violet-500/60" />
                </div>
              </React.Fragment>
            ))}
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-10 h-10 rounded-lg bg-violet-950 border border-violet-500 flex items-center justify-center font-mono text-sm font-extrabold text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
            >
              48
            </motion.div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono font-medium">ตรวจหา Pattern : อัตราการเพิ่มคงที่คูณ 2 ในทุกจุด</span>
        </div>
      )}

      {/* ANIMAL-GROUPING (จัดกลุ่มสัตว์มีปีก vs สัตว์เลี้ยงลูกด้วยนม) */}
      {visualType === 'animal-grouping' && (
        <div className="flex flex-col items-center gap-2.5 z-10 w-full px-4">
          <div className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 rounded-full mb-1">
            Pattern Matching : จัดกลุ่มลักษณะชีววิทยาที่มีร่วมกัน
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-blue-500/20 shadow-sm text-center">
              <span className="text-[10px] font-bold text-blue-400 block mb-1.5">🕊️ กลุ่มสัตว์มีปีก</span>
              <div className="flex justify-center gap-1.5 text-xs text-slate-300 font-mono">
                <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">🐔 ไก่บ้าน</span>
                <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">🐦 นกพิราบ</span>
              </div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-pink-500/20 shadow-sm text-center">
              <span className="text-[10px] font-bold text-pink-400 block mb-1.5">🐶 กลุ่มสัตว์เลี้ยงลูกด้วยนม</span>
              <div className="flex justify-center gap-1.5 text-xs text-slate-300 font-mono">
                <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">🐱 แมวเหมียว</span>
                <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">🐕 สุนัขบ้าน</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROBOT-LOOP (หุ่นยนต์วาดสามเหลี่ยมด้านเท่าวนซ้ำ 3 รอบ) */}
      {visualType === 'robot-loop' && (
        <div className="flex items-center gap-6 justify-center px-6 z-10 w-full max-w-md">
          <div className="relative w-16 h-16 bg-slate-950 border border-amber-500/30 rounded-2xl flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 120, 240, 360] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-10 h-10 border-t-2 border-r-2 border-l-2 border-amber-400 rounded-sm flex items-center justify-center"
            >
              <Cpu size={18} className="text-amber-500" />
            </motion.div>
            <Repeat size={14} className="absolute bottom-1 right-1 text-amber-400 animate-spin" />
          </div>
          <div className="text-left font-mono">
            <div className="text-[10px] text-amber-400 font-bold uppercase bg-amber-950/60 border border-amber-500/20 px-2.5 py-0.5 rounded-md inline-block mb-1.5">
              ROBOTIC TRIANGLE LOOP
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>REPEAT 3 TIMES:</span>
              </div>
              <div className="pl-3.5 text-slate-400">
                - Move Forward 100 px<br/>
                - Turn Right 120 Deg
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. SHAPE (ทรงกลมร่วม) */}
      {visualType === 'shape' && (
        <div className="flex flex-col items-center justify-center gap-3 z-10">
          <div className="flex items-center gap-5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-md">
            <span className="text-3xl" title="ส้ม">🍊</span>
            <span className="text-slate-500 text-sm">➔</span>
            <span className="text-3xl" title="บาสเก็ตบอล">🏀</span>
            <span className="text-slate-500 text-sm">➔</span>
            <div className="w-10 h-10 rounded-full border-4 border-pink-500 flex items-center justify-center bg-pink-950/20 shadow-sm">
              <div className="w-3.5 h-3.5 rounded-full bg-pink-500 animate-pulse" />
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">การคิดเชิงนามธรรม : สกัดทิ้งรายละเอียดเปลือกนก ละเว้นสีและกลิ่น เหลือเพียงโครงกลม</span>
        </div>
      )}

      {/* 8. FONT (ตัวอักษร WELCOME) */}
      {visualType === 'font' && (
        <div className="flex flex-col items-center justify-center gap-3.5 z-10">
          <div className="flex gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-lg">
            <span className="text-xl font-serif italic text-red-400">W</span>
            <span className="text-2xl font-bold text-yellow-400">E</span>
            <span className="text-lg font-mono tracking-widest text-emerald-400">L</span>
            <span className="text-3xl font-sans text-blue-400">C</span>
            <span className="text-xl font-extrabold text-indigo-400">O</span>
            <span className="text-2xl font-mono text-purple-400">M</span>
            <span className="text-xl font-serif text-teal-400">E</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Abstraction : ละเฉดสี/ฟอนต์ที่ไม่เกี่ยว สกัดเฉพาะตัวอักษรและความหมาย "WELCOME"
          </span>
        </div>
      )}

      {/* 9. MAP (แผนที่รถไฟฟ้าสับสาย) */}
      {visualType === 'map' && (
        <div className="flex items-center gap-6 px-6 w-full max-w-sm z-10">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg flex items-center justify-center text-slate-400 shrink-0">
            <Map size={28} />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold font-mono">
              <span>สถานี</span>
              <span className="flex-1 h-[2px] bg-emerald-500/50" />
              <span>จุดเชื่อม</span>
              <span className="flex-1 h-[2px] bg-cyan-500/50" />
              <span>ปลายทาง</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              โมเดลเส้นทางรถไฟฟ้าเชิงนามธรรม : ลบตึกรามบ้านช่องทิ้งทั้งหมด เหลือเพียงจุดเชื่อมต่อรางเพื่อให้เข้าใจเส้นทางได้ชัดเจน
            </p>
          </div>
        </div>
      )}

      {/* 10. HOUSE (วาดรูปบ้าน) */}
      {visualType === 'house' && (
        <div className="flex items-center gap-6 justify-center z-10">
          <div className="relative w-16 h-16 flex flex-col items-center justify-end bg-slate-950 p-2 rounded-xl border border-slate-800 shadow-md">
            <div className="w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-b-[20px] border-b-emerald-400 drop-shadow-sm" />
            <div className="w-11 h-10 bg-yellow-400 border border-slate-700 rounded-sm" />
          </div>
          <div className="text-left font-mono text-[10px] text-slate-400 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-lg">
            <div className="text-emerald-400 font-bold mb-0.5">&lt; House Blueprint Model &gt;</div>
            <div>- Roof : Triangle Shape (สามเหลี่ยม)</div>
            <div>- Base : Square Shape (สี่เหลี่ยม)</div>
          </div>
        </div>
      )}

      {/* DICTIONARY-SEARCH (Binary Search ค้นพจนานุกรม) */}
      {visualType === 'dictionary-search' && (
        <div className="flex items-center gap-6 justify-center px-6 z-10 w-full max-w-sm">
          <div className="w-14 h-14 bg-slate-950 border border-sky-500/30 rounded-2xl flex items-center justify-center text-sky-400 shadow-lg shrink-0">
            <BookOpen size={30} className="animate-pulse" />
          </div>
          <div className="text-left font-mono">
            <span className="text-[10px] text-sky-300 font-bold uppercase bg-sky-950/60 border border-sky-500/20 px-2.5 py-0.5 rounded-md inline-block mb-1.5">
              Binary Search Algorithm
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="px-1.5 py-0.5 bg-rose-950 text-rose-300 rounded border border-rose-900">A-L (ตัดออก)</span>
              <span className="text-slate-600">➔</span>
              <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-900 font-bold">M-Z (ค้นหาต่อ)</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">แบ่งข้อมูลออกเป็นครึ่งหนึ่งในทุกสเต็ปเพื่อย่นระยะเวลาการสืบค้น</p>
          </div>
        </div>
      )}

      {/* ALGORITHM-CORRECTNESS (ความถูกต้องแม่นยำของลำดับขั้นตอน) */}
      {visualType === 'algorithm-correctness' && (
        <div className="flex flex-col items-center justify-center gap-3 z-10 w-full px-6">
          <div className="flex items-center gap-4 bg-slate-950 py-3 px-5 rounded-2xl border border-emerald-500/20 shadow-lg">
            <div className="text-[11px] font-mono text-slate-400">Input (ข้อมูลเข้า)</div>
            <ArrowRight size={14} className="text-emerald-500" />
            <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 text-xs font-mono font-bold">
              [ Algorithm Logic ]
            </div>
            <ArrowRight size={14} className="text-emerald-500" />
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 font-mono">
              <CheckCircle2 size={14} />
              <span>Correct Output!</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-sans">คุณสมบัติแรกสุดของสเต็ปการรันที่สำเร็จ : ผลลัพธ์ปลายทางต้องถูกต้อง (Correctness)</span>
        </div>
      )}

      {/* PSEUDOCODE (รหัสเทียมสลับคอมพิวเตอร์) */}
      {visualType === 'pseudocode' && (
        <div className="flex flex-col items-center justify-center gap-2 z-10 w-full px-6">
          <div className="w-full max-w-sm bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-md font-mono text-[9px] text-slate-300 text-left">
            <div className="text-slate-500 border-b border-slate-900 pb-1 mb-1.5 flex justify-between">
              <span>📝 pseudocode.txt</span>
              <span className="text-slate-600">ภาษามนุษย์เรียบง่าย</span>
            </div>
            <div className="text-violet-400">START</div>
            <div className="pl-3 text-cyan-400">INPUT score_data</div>
            <div className="pl-3 text-pink-400">IF score_data &gt;= 50 THEN</div>
            <div className="pl-6 text-emerald-400">PRINT "Pass the Arena Challenge"</div>
            <div className="pl-3 text-pink-400">ENDIF</div>
            <div className="text-violet-400">END</div>
          </div>
        </div>
      )}

      {/* 11. NOODLE (ต้มบะหมี่สำเร็จรูป) */}
      {visualType === 'noodle' && (
        <div className="flex items-center gap-6 justify-center px-6 z-10">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="w-14 h-14 bg-amber-950 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-lg"
          >
            <Coffee size={28} />
          </motion.div>
          <div className="text-left">
            <span className="text-[10px] font-mono text-amber-400 font-bold tracking-widest uppercase bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/20 block mb-1.5 w-max">
              Step-by-Step Cooking
            </span>
            <div className="flex gap-1.5 text-[10px] text-slate-300 font-mono">
              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md shadow-sm">ขั้นที่ 1</span>
              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md shadow-sm">ขั้นที่ 2</span>
              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md shadow-sm">ขั้นที่ 3</span>
            </div>
          </div>
        </div>
      )}

      {/* 12. FLOWCHART (ผังงาน) */}
      {visualType === 'flowchart' && (
        <div className="flex flex-col items-center justify-center gap-3.5 z-10 w-full px-6">
          <div className="flex items-center gap-2.5 justify-center p-3.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-lg">
            <div className="px-2.5 py-1 bg-indigo-950 border border-indigo-500/30 text-indigo-300 rounded-full text-[9px] font-mono shadow-sm">
              Terminal (เริ่ม/จบ)
            </div>
            <span className="text-slate-600 font-bold font-mono">➔</span>
            <div className="px-2.5 py-1 bg-emerald-950 border border-emerald-500/30 text-emerald-300 rounded-md text-[9px] font-mono shadow-sm">
              Process (คำนวณ)
            </div>
            <span className="text-slate-600 font-bold font-mono">➔</span>
            <div className="px-2.5 py-1 bg-amber-950 border border-amber-500/30 text-amber-300 rounded-lg text-[9px] font-mono shadow-sm">
              Decision (เงื่อนไข)
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">สัญญลักษณ์เรขาคณิตสากลที่ใช้ในการวาดผังขั้นตอนการไหลงาน</span>
        </div>
      )}

      {/* 13. BINARY (รหัสสองสถานะ) */}
      {visualType === 'binary' && (
        <div className="flex flex-col items-center gap-2.5 z-10">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-base font-bold text-slate-500 shadow-sm">
              0 (OFF)
            </div>
            <span className="text-slate-500 font-bold font-mono text-xs">VS</span>
            <motion.div 
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl font-mono text-base font-bold text-emerald-400 shadow-md"
            >
              1 (ON)
            </motion.div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-medium">สัญญลักษณ์สถานะสวิตช์ปิด/เปิดสำหรับคอมพิวเตอร์</span>
        </div>
      )}

      {/* SPORTS-DECOM (บอส 1: ประธานกีฬาสี แยกปัญหาย่อย) */}
      {visualType === 'sports-decom' && (
        <div className="flex flex-col items-center gap-2 w-full px-6 z-10">
          <div className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/20 px-3 py-0.5 rounded-full mb-1">
            Boss Challenge #1 : Decomposition (กีฬาสีโครงการใหญ่)
          </div>
          <div className="flex items-center gap-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-md w-full max-w-sm justify-center">
            <div className="p-2 bg-rose-950 text-rose-400 rounded-xl border border-rose-500/15 flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <ChevronRight size={14} className="text-slate-600" />
            <div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold text-slate-300 font-mono text-center">
              <span className="px-1.5 py-1 bg-slate-900 border border-slate-800 rounded">🎭 เตรียมเวที</span>
              <span className="px-1.5 py-1 bg-slate-900 border border-slate-800 rounded">🍹 จัดอาหาร</span>
              <span className="px-1.5 py-1 bg-slate-900 border border-slate-800 rounded">📝 ลงทะเบียน</span>
            </div>
          </div>
        </div>
      )}

      {/* HEART-FILTER (บอส 2: กลไกปั๊มเลือด vs เครื่องกรองตู้ปลา) */}
      {visualType === 'heart-filter' && (
        <div className="flex flex-col items-center gap-2 w-full px-6 z-10">
          <div className="text-[10px] font-mono font-bold text-pink-400 bg-pink-950/60 border border-pink-500/20 px-3 py-0.5 rounded-full mb-1">
            Boss Challenge #2 : Pattern Recognition (สูบฉีด vs กรองน้ำ)
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm bg-slate-950 p-2.5 rounded-2xl border border-slate-800 shadow-md text-center">
            <div className="border-r border-slate-900 pr-2">
              <div className="flex justify-center items-center gap-1 text-rose-400 text-xs font-bold mb-1">
                <Heart size={14} className="animate-pulse" />
                <span>หัวใจปั๊มเลือด</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono leading-normal block">หล่อเลี้ยงระบบเซลล์และอวัยวะ</span>
            </div>
            <div className="pl-2">
              <div className="flex justify-center items-center gap-1 text-sky-400 text-xs font-bold mb-1">
                <Filter size={14} />
                <span>กรองน้ำตู้ปลา</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono leading-normal block">หมุนเวียนล้างน้ำตู้ปลาสะอาด</span>
            </div>
          </div>
          <span className="text-[9px] text-emerald-400 font-mono font-bold">ร่วมกลไก : "การปั๊มหมุนเวียนไหลผ่านตัวกลางเพื่อประโยชน์ระบบหลัก"</span>
        </div>
      )}

      {/* FIRE-EXIT (บอส 3: ป้ายสัญลักษณ์ทางหนีไฟฉุกเฉิน) */}
      {visualType === 'fire-exit' && (
        <div className="flex flex-col items-center gap-3 w-full px-6 z-10">
          <div className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-3 py-0.5 rounded-full">
            Boss Challenge #3 : Abstraction (ป้ายทางหนีไฟ)
          </div>
          
          <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-md">
            {/* Real green exit sign look */}
            <div className="bg-emerald-600 text-slate-950 px-4 py-2 rounded-lg border-2 border-emerald-400 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse">
              <span className="text-2xl font-extrabold text-white">🏃‍♂️</span>
              <div className="h-6 w-1.5 bg-white rounded-full" />
              <LogOut size={24} className="text-white" />
            </div>
            
            <div className="text-left font-mono text-[9px] text-slate-400">
              <span className="text-emerald-400 font-bold block mb-0.5">&lt; สกัดละทิ้งรายละเอียด &gt;</span>
              <div>❌ ทรงผม / สีผิว / ลวดลายเสื้อผ้า</div>
              <div className="text-emerald-300 font-bold">✔️ คัดเหลือแค่ : ท่าทางวิ่ง + ประตูหนีไฟ</div>
            </div>
          </div>
        </div>
      )}

      {/* WIFI-LOGIN (บอส 4: ลำดับขั้นตอนวิธี Wi-Fi ล็อกอิน) */}
      {visualType === 'wifi-login' && (
        <div className="flex flex-col items-center gap-2 w-full px-6 z-10">
          <div className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/20 px-3 py-0.5 rounded-full mb-1">
            Boss Challenge #4 : Algorithm Design (ลำดับลงทะเบียนดิจิทัล)
          </div>
          <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-md w-full max-w-sm justify-center text-[9px] font-mono text-slate-300">
            <div className="px-2 py-1 bg-slate-900 border border-slate-800 rounded flex flex-col items-center">
              <Wifi size={14} className="text-sky-400" />
              <span>1. เชื่อมต่อ</span>
            </div>
            <ChevronRight size={12} className="text-slate-600" />
            <div className="px-2 py-1 bg-slate-900 border border-slate-800 rounded flex flex-col items-center">
              <Repeat size={14} className="text-amber-400 animate-spin" />
              <span>2. กรอกรหัส</span>
            </div>
            <ChevronRight size={12} className="text-slate-600" />
            <div className="px-2 py-1 bg-emerald-950 border border-emerald-900 rounded flex flex-col items-center text-emerald-300">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>3. ดำเนินงาน</span>
            </div>
          </div>
        </div>
      )}

      {/* 14. WISDOM (ลานประลองสุดท้าย / บอส 5) */}
      {visualType === 'wisdom' && (
        <div className="flex items-center gap-5 text-rose-500 px-6 z-10">
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95], rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-16 h-16 bg-rose-950/60 border-2 border-rose-500/30 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)] shrink-0"
          >
            <Flame size={32} className="text-rose-400" />
          </motion.div>
          <div className="text-left">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Sparkles size={14} /> Ultimate Wisdom Core
            </h4>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              ประสานพลังของ Decomposition, Pattern, Abstraction และ Algorithm ครบทั้ง 4 มิติเพื่อคลี่คลายปัญหาอย่างโปรแกรมเมอร์ผู้เชี่ยวชาญ!
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
