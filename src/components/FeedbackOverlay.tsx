import React from 'react';
import { 
  CheckCircle2, AlertTriangle, RotateCcw, ArrowRight, Award, User, 
  Sparkles, Layers, Cpu, EyeOff, Grid, 
  BrainCircuit, TrendingUp, Compass, Target, ShieldCheck, HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { audioSynth } from '../utils/audio';

interface FeedbackOverlayProps {
  type: 'correct' | 'incorrect' | 'gameover' | 'level-completed';
  hintText?: string;
  onAction: () => void;
  starsCount?: number;
  isFinalLevel?: boolean;
  studentName?: string;
  studentClass?: string;
  studentNumber?: string;
  onClearAndExit?: () => void;
  levelScores?: Record<number, number>;
}

export default function FeedbackOverlay({ 
  type, 
  hintText = '', 
  onAction, 
  starsCount = 3,
  isFinalLevel = false,
  studentName = '',
  studentClass = '',
  studentNumber = '',
  onClearAndExit,
  levelScores
}: FeedbackOverlayProps) {
  
  const handleAction = () => {
    audioSynth.playSfx('click');
    onAction();
  };

  const handleClearAndExit = () => {
    audioSynth.playSfx('unlock');
    if (onClearAndExit) onClearAndExit();
  };

  // Dynamic scores parsing
  const scores = levelScores || { 1: 3, 2: 3, 3: 3, 4: 3 };

  const p1Score = scores[1] ?? 3;
  const p2Score = scores[2] ?? 3;
  const p3Score = scores[3] ?? 3;
  const p4Score = scores[4] ?? 3;

  const p1Points = p1Score === 3 ? 100 : p1Score === 2 ? 80 : 60;
  const p2Points = p2Score === 3 ? 100 : p2Score === 2 ? 80 : 60;
  const p3Points = p3Score === 3 ? 100 : p3Score === 2 ? 80 : 60;
  const p4Points = p4Score === 3 ? 100 : p4Score === 2 ? 80 : 60;

  const averageScore = Math.round((p1Points + p2Points + p3Points + p4Points) / 4);

  // Overall Mastery Tier
  const getOverallTier = (avg: number) => {
    if (avg >= 95) return { label: "ระดับยอดเยี่ยม (Master of CT)", color: "text-amber-300 bg-amber-950/60 border-amber-400/40", icon: Award };
    if (avg >= 80) return { label: "ระดับดีมาก (Advanced CT)", color: "text-emerald-300 bg-emerald-950/60 border-emerald-400/40", icon: ShieldCheck };
    return { label: "ระดับพื้นฐาน (Developing CT)", color: "text-cyan-300 bg-cyan-950/60 border-cyan-400/40", icon: Compass };
  };

  const overallTier = getOverallTier(averageScore);

  // Define Pillars array with icons, colors, descriptions and dynamic evaluations
  const pillars = [
    {
      id: 1,
      title: "Decomposition (การแยกส่วนประกอบและย่อยปัญหา)",
      shortTitle: "การแบ่งย่อยปัญหา",
      description: "ความสามารถในการจำแนก วิเคราะห์ และแตกปัญหาหรือภารกิจขนาดใหญ่ออกเป็นส่วนย่อยๆ เพื่อให้วางแผนและจัดการได้อย่างเป็นระบบ",
      score: p1Score,
      points: p1Points,
      icon: Layers,
      color: "from-cyan-500 to-teal-400",
      textColor: "text-cyan-400",
      bgColor: "bg-cyan-950/20",
      borderColor: "border-cyan-500/30",
      eval: 
        p1Score === 3 
          ? {
              status: "ดีเยี่ยม (100 คะแนน)",
              badgeColor: "bg-emerald-950/70 text-emerald-300 border-emerald-500/30",
              strength: "สามารถวิเคราะห์และแตกโครงสร้างงานใหญ่ออกเป็นหมวดย่อยได้อย่างครอบคลุม ชัดเจน และมีตรรกะระเบียบที่ยอดเยี่ยม",
              improvement: "ยอดเยี่ยมมาก! รักษาวิธีคิดแบบแยกแยะนี้ไว้ และนำไปประยุกต์ใช้ในการวางแผนจัดตารางอ่านหนังสือหรือบริหารโครงงานขนาดใหญ่"
            }
          : p1Score === 2
          ? {
              status: "ดีมาก (80 คะแนน)",
              badgeColor: "bg-cyan-950/70 text-cyan-300 border-cyan-500/30",
              strength: "สามารถจัดกลุ่มและแบ่งหมวดหมู่งานหลักได้ถูกต้องเป็นระเบียบตามเกณฑ์มาตรฐานที่ดี",
              improvement: "ลองฝึกเพิ่มความละเอียดในการมองขั้นตอนย่อยที่อาจซ่อนอยู่ เพื่อไม่ให้ตกหล่นรายละเอียดปลีกย่อยที่สำคัญ"
            }
          : {
              status: "ควรพัฒนา (60 คะแนน)",
              badgeColor: "bg-amber-950/70 text-amber-300 border-amber-500/30",
              strength: "มีความเข้าใจในการจำแนกปัญหาเบื้องต้น สามารถระบุความต้องการหลักได้พอใช้",
              improvement: "ฝึกแยกงานในชีวิตประจำวัน เช่น การจัดตารางกิจกรรมใน 1 วัน หรือขั้นตอนการเตรียมรายงาน ออกเป็นข้อย่อยๆ ให้เห็นภาพชัดเจนขึ้น"
            }
    },
    {
      id: 2,
      title: "Pattern Recognition (การหารูปแบบ)",
      shortTitle: "การหารูปแบบ",
      description: "ความสามารถในการเปรียบเทียบ สังเกตแนวโน้ม ความเหมือน หรือความเชื่อมโยงของข้อมูล เพื่อนำวิธีแก้ปัญหาเดิมมาปรับใช้ซ้ำได้อย่างมีประสิทธิภาพ",
      score: p2Score,
      points: p2Points,
      icon: Grid,
      color: "from-purple-500 to-indigo-400",
      textColor: "text-purple-400",
      bgColor: "bg-purple-950/20",
      borderColor: "border-purple-500/30",
      eval: 
        p2Score === 3 
          ? {
              status: "ดีเยี่ยม (100 คะแนน)",
              badgeColor: "bg-emerald-950/70 text-emerald-300 border-emerald-500/30",
              strength: "มีสายตาที่เฉียบคมในการค้นหาความเชื่อมโยง แบบรูป และแนวโน้มของสถานการณ์ต่างๆ ได้อย่างแม่นยำและรวดเร็ว",
              improvement: "ยอดเยี่ยมมาก! ท้าทายตนเองต่อด้วยการสังเกตรูปแบบสถิติ กราฟข้อมูล หรือพฤติกรรมในบทเรียนคณิตศาสตร์และวิทยาศาสตร์"
            }
          : p2Score === 2
          ? {
              status: "ดีมาก (80 คะแนน)",
              badgeColor: "bg-purple-950/70 text-purple-300 border-purple-500/30",
              strength: "สามารถสังเกตความคล้ายคลึงและจำแนกรูปแบบลักษณะของปัญหาทั่วไปได้อย่างถูกต้องเป็นส่วนใหญ่",
              improvement: "ลองฝึกมองหารูปแบบความสัมพันธ์เชิงสาเหตุและผลลัพธ์ที่ลึกซึ้งยิ่งขึ้น เพื่อช่วยคาดการณ์แนวโน้มล่วงหน้าได้อย่างแม่นยำ"
            }
          : {
              status: "ควรพัฒนา (60 คะแนน)",
              badgeColor: "bg-amber-950/70 text-amber-300 border-amber-500/30",
              strength: "เข้าใจรูปแบบพื้นฐานที่มีความแตกต่างทางกายภาพชัดเจนได้ดี",
              improvement: "ฝึกเล่นเกมจับคู่ ค้นหาแบบรูปคณิตศาสตร์ หรือเปรียบเทียบความเหมือนต่างของข่าวสารในชีวิตประจำวันเพื่อเพิ่มความชำนาญ"
            }
    },
    {
      id: 3,
      title: "Abstraction (การคิดเชิงนามธรรม)",
      shortTitle: "การคิดเชิงนามธรรม",
      description: "ความสามารถในการคัดกรองข้อมูล คัดเลือกเฉพาะสิ่งสำคัญที่จำเป็นต่อการแก้ปัญหา และตัดรายละเอียดที่ไม่เกี่ยวข้องออกไป",
      score: p3Score,
      points: p3Points,
      icon: EyeOff,
      color: "from-pink-500 to-rose-400",
      textColor: "text-pink-400",
      bgColor: "bg-pink-950/20",
      borderColor: "border-pink-500/30",
      eval: 
        p3Score === 3 
          ? {
              status: "ดีเยี่ยม (100 คะแนน)",
              badgeColor: "bg-emerald-950/70 text-emerald-300 border-emerald-500/30",
              strength: "สามารถดึงสาระสำคัญที่เป็นแก่นแท้ของปัญหา และตัดสิ่งรบกวนที่ไม่จำเป็นออกไปได้อย่างสมบูรณ์แบบ",
              improvement: "นำทักษะนี้ไปต่อยอดเขียนสรุปเนื้อหาบทเรียน (Summary Notes), ทำ Mind Map รวบยอด หรืออธิบายประเด็นซับซ้อนให้เข้าใจง่ายในประโยคสั้นๆ"
            }
          : p3Score === 2
          ? {
              status: "ดีมาก (80 คะแนน)",
              badgeColor: "bg-pink-950/70 text-pink-300 border-pink-500/30",
              strength: "สามารถคัดเลือกข้อมูลหลักและแยกสิ่งสำคัญออกจากข้อมูลทั่วไปได้ถูกต้องเป็นส่วนใหญ่",
              improvement: "ระมัดระวังรายละเอียดปลีกย่อยหรือข้อมูลเสริมที่อาจทำให้เสียเวลาหรือเบี่ยงเบนความสนใจจากเป้าหมายหลัก"
            }
          : {
              status: "ควรพัฒนา (60 คะแนน)",
              badgeColor: "bg-amber-950/70 text-amber-300 border-amber-500/30",
              strength: "สามารถระบุเป้าหมายเบื้องต้นได้ตามแนวทางที่กำหนด",
              improvement: "ฝึกอ่านบทความหรือโจทย์แล้วถามตัวเองว่า 'ข้อมูลไหนที่จำเป็นต้องใช้จริงๆ' และตัดข้อมูลที่เป็นเพียงรายละเอียดเสริมออกไป"
            }
    },
    {
      id: 4,
      title: "Algorithm Design (การออกแบบขั้นตอนวิธี)",
      shortTitle: "การออกแบบขั้นตอนวิธี",
      description: "ความสามารถในการวางลำดับขั้นตอน วิธีการแก้ปัญหา หรือชุดคำสั่งอย่างเป็นลำดับสเต็ปที่ชัดเจน ไม่คลุมเครือ และปฏิบัติตามได้จริง",
      score: p4Score,
      points: p4Points,
      icon: Cpu,
      color: "from-amber-500 to-orange-400",
      textColor: "text-amber-400",
      bgColor: "bg-amber-950/20",
      borderColor: "border-amber-500/30",
      eval: 
        p4Score === 3 
          ? {
              status: "ดีเยี่ยม (100 คะแนน)",
              badgeColor: "bg-emerald-950/70 text-emerald-300 border-emerald-500/30",
              strength: "มีตรรกะการคิดอย่างเป็นขั้นเป็นตอนที่ชัดเจน มีการตรวจสอบเงื่อนไขและจัดการทางเลือกได้อย่างสมบูรณ์แบบ",
              improvement: "พร้อมแล้วสำหรับการเรียนรู้การเขียนโค้ดจริง (Coding) ด้วย Scratch หรือภาษา Python เพื่อสร้างโปรแกรมและเกมในอนาคต!"
            }
          : p4Score === 2
          ? {
              status: "ดีมาก (80 คะแนน)",
              badgeColor: "bg-amber-950/70 text-amber-300 border-amber-500/30",
              strength: "สามารถออกแบบลำดับการทำงานและเงื่อนไขการตัดสินใจได้อย่างเข้าใจง่ายและมีทิศทางถูกต้อง",
              improvement: "ลองฝึกคิดกรณีข้อผิดพลาด (Error handling) หรือเหตุการณ์ไม่คาดฝันเพิ่มเติม เพื่อให้ขั้นตอนวิธีมีความรัดกุมยิ่งขึ้น"
            }
          : {
              status: "ควรพัฒนา (60 คะแนน)",
              badgeColor: "bg-amber-950/70 text-amber-300 border-amber-500/30",
              strength: "สามารถเรียงลำดับขั้นตอนทำงานแบบตรงไปตรงมาได้ดี",
              improvement: "ฝึกเขียนขั้นตอนวิธีง่ายๆ ในชีวิตประจำวัน เช่น สูตรทำอาหาร หรือขั้นตอนการเดินทางอย่างละเอียดแล้วให้คนอื่นลองทำตาม"
            }
    }
  ];

  const excellentPillars = pillars.filter(p => p.points === 100);
  const needsImprovementPillars = pillars.filter(p => p.points < 100);

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm select-none assessment-overlay overflow-y-auto">
      
      {/* 1. CORRECT MODAL */}
      {type === 'correct' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-slate-950 border-2 border-emerald-500 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.35)] relative"
          id="correct-modal"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-400 to-emerald-500/20 shadow-[0_0_10px_#10b981]" />
          
          <div className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-950/50 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-bounce">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="text-2xl font-black text-emerald-400 tracking-wider uppercase mb-1">
              ยอดเยี่ยมมาก! 👍
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-3 uppercase tracking-widest">
              &lt; CORRECT ANSWER &gt;
            </p>

            <p className="text-slate-200 text-sm md:text-base lg:text-lg leading-relaxed mb-6 font-sans">
              คุณวิเคราะห์ข้อมูลและตอบคำถามได้ถูกต้องสมบูรณ์ ทักษะการคิดของคุณพัฒนาขึ้นอีกขั้นแล้ว!
            </p>

            <button
              onClick={handleAction}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base font-extrabold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              id="next-question-btn"
            >
              ทำภารกิจถัดไป <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. INCORRECT MODAL */}
      {type === 'incorrect' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-slate-950 border-2 border-amber-500 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.35)] relative"
          id="incorrect-modal"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20 shadow-[0_0_10px_#f59e0b]" />

          <div className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-950/50 border border-amber-500 rounded-full flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-2xl font-black text-amber-400 tracking-wider uppercase mb-1">
              ยังไม่ถูกต้องนะ! 💡
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4 uppercase tracking-widest">
              &lt; TRY AGAIN &gt;
            </p>

            {/* Dynamic Hint box */}
            <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl text-left text-sm md:text-base text-amber-100 font-medium leading-relaxed mb-6">
              <span className="font-bold text-amber-300 block mb-1 font-mono text-sm md:text-base">💡 คำใบ้ประกอบการเรียนรู้ (Hint) : </span>
              {hintText || "ลองพิจารณารายละเอียดหรือตัวเลือกใหม่อีกครั้งสิ คุณทำได้แน่นอน!"}
            </div>

            <button
              onClick={handleAction}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 text-base font-extrabold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              id="try-again-btn"
            >
              ลองคิดใหม่อีกครั้ง <RotateCcw size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. GAME OVER MODAL (Restarting current level) */}
      {type === 'gameover' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-slate-950 border-2 border-rose-500 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.4)]"
          id="gameover-modal"
        >
          <div className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-rose-950/50 border border-rose-500 rounded-full flex items-center justify-center text-rose-400 mb-4 animate-bounce">
              <RotateCcw size={32} />
            </div>

            <h3 className="text-2xl font-black text-rose-400 tracking-wider uppercase mb-1">
              หัวใจชีวิตหมดเกลี้ยง! ❤️❌
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4 uppercase tracking-widest">
              &lt; LIFE CORES DEPLETED &gt;
            </p>

            <p className="text-slate-200 text-base md:text-lg leading-relaxed mb-6 font-sans">
              ไม่เป็นไรนะ! ความผิดพลาดคือหนทางของการเรียนรู้<br/>
              ลองเริ่มท้าทายภารกิจใน <span className="text-amber-400 font-bold">ด่านนี้ใหม่อีกครั้ง</span> ดูสิครับ!
            </p>

            <button
              onClick={handleAction}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-950 text-base font-extrabold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              id="restart-level-btn"
            >
              เริ่มเล่นใหม่ในด่านนี้ 🔄
            </button>
          </div>
        </motion.div>
      )}

      {/* 4. LEVEL COMPLETED CELEBRATORY MODAL / FINAL COMPETENCY DASHBOARD */}
      {type === 'level-completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`bg-slate-950 border-2 rounded-2xl overflow-hidden relative ${
            isFinalLevel 
              ? "border-amber-500/80 w-full max-w-5xl shadow-[0_0_60px_rgba(245,158,11,0.25)] max-h-[92vh] overflow-y-auto custom-scrollbar" 
              : "border-cyan-500 w-full max-w-lg shadow-[0_0_50px_rgba(6,182,212,0.45)]"
          }`}
          id="level-completed-modal"
        >
          {isFinalLevel ? (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_15px_#f59e0b]" />
          ) : (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 shadow-[0_0_15px_#06b6d4]" />
          )}

          <div className="p-4 sm:p-6 md:p-8 text-center">
            {isFinalLevel ? (
              // Final Comprehensive Competency Dashboard
              <div className="flex flex-col items-center">
                {/* Celebratory academic badge */}
                <div className="w-16 h-16 bg-amber-950/40 border-2 border-amber-400 rounded-full flex items-center justify-center text-amber-300 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-bounce duration-1000">
                  <Award size={36} />
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent tracking-wider uppercase mb-1">
                  แดชบอร์ดสรุปผลการประเมินทักษะการคิดเชิงคำนวณ
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-400/90 font-mono mb-6 uppercase tracking-widest flex items-center gap-1.5 justify-center">
                  <Sparkles size={13} className="animate-spin text-amber-400" /> 
                  COMPUTATIONAL THINKING MASTERY DASHBOARD &lt; CT-WORLD ม.2 &gt; 
                  <Sparkles size={13} className="animate-spin text-amber-400" />
                </p>

                {/* Dashboard Main Container */}
                <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 text-left mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Student Profile Header Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-950/50 border border-amber-500/30 rounded-xl text-amber-400 shadow-sm">
                        <User size={22} />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">ข้อมูลผู้เรียน</div>
                        <div className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                          {studentName || "ไม่ระบุชื่อ"}
                          <span className="text-xs font-normal text-slate-300 font-mono bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                            ชั้น ม.{studentClass || "2"} เลขที่ {studentNumber || "0"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${overallTier.color}`}>
                        <overallTier.icon size={14} />
                        {overallTier.label}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Stats (Score Gauge + Multi-bar Breakdown) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Circle Score Gauge */}
                    <div className="md:col-span-1 bg-slate-950/50 border border-slate-800/90 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                      <span className="text-[11px] uppercase font-mono text-slate-400 tracking-wider mb-2 font-bold flex items-center gap-1">
                        <Target size={13} className="text-amber-400" /> คะแนนเฉลี่ยรวม 4 มิติ
                      </span>
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="46" className="stroke-slate-800 fill-none" strokeWidth="9" />
                          <circle 
                            cx="56" cy="56" r="46" 
                            className="stroke-amber-400 fill-none transition-all duration-1000 ease-out" 
                            strokeWidth="9" 
                            strokeDasharray={`${2 * Math.PI * 46}`} 
                            strokeDashoffset={`${2 * Math.PI * 46 * (1 - averageScore / 100)}`} 
                            strokeLinecap="round" 
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-amber-400">{averageScore}</span>
                          <span className="text-[10px] text-slate-400 font-mono">เต็ม 100 คะแนน</span>
                        </div>
                      </div>
                    </div>

                    {/* Competency Multi-bar Chart View */}
                    <div className="md:col-span-2 bg-slate-950/50 border border-slate-800/90 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <TrendingUp size={15} className="text-amber-400" /> แผนภูมิเปรียบเทียบสมรรถนะรายมิติ
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">เกณฑ์ผ่าน: 80+</span>
                        </h4>
                        
                        <div className="space-y-2.5">
                          {pillars.map(p => (
                            <div key={p.id} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-sans">
                                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                                  <span className="text-slate-500 font-mono text-[10px]">0{p.id}.</span> {p.shortTitle}
                                </span>
                                <span className="font-mono font-bold text-slate-200">{p.points}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                                <div 
                                  className={`h-full bg-gradient-to-r ${p.color} rounded-full transition-all duration-700`}
                                  style={{ width: `${p.points}%` }} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-slate-400 italic mt-3 pt-2 border-t border-slate-800/60 leading-relaxed flex items-center gap-1.5">
                        <HelpCircle size={12} className="text-slate-500 shrink-0" />
                        <span>คำนวณจากความแม่นยำในการพิชิตภารกิจและจำนวนพลังชีวิตคงเหลือประจำแต่ละฐาน</span>
                      </div>
                    </div>
                  </div>

                  {/* CT Pillars 4-Domain Detail Cards Grid */}
                  <h4 className="text-xs sm:text-sm font-bold text-slate-300 mb-3 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                    <BrainCircuit size={16} className="text-amber-400" /> 
                    รายละเอียดการวิเคราะห์สมรรถนะรายด้านทั้ง 4 มิติ
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pillars.map((p) => {
                      const IconComponent = p.icon;
                      return (
                        <div 
                          key={p.id} 
                          className="p-4 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Header with Icon, Name, and Proficiency Badge */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 shadow-sm">
                                  <IconComponent size={18} />
                                </div>
                                <div>
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                                    {p.title}
                                  </h4>
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${p.eval.badgeColor}`}>
                                {p.eval.status}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">
                              {p.description}
                            </p>
                          </div>

                          {/* Strength & Improvement Text details */}
                          <div className="space-y-2 text-xs border-t border-slate-900 pt-3">
                            <div className="bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl">
                              <span className="font-bold text-emerald-400 block mb-0.5 flex items-center gap-1">
                                🌟 จุดเด่นที่ตรวจพบ:
                              </span>
                              <span className="text-slate-200 leading-relaxed">
                                {p.eval.strength}
                              </span>
                            </div>
                            
                            <div className="bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-xl">
                              <span className="font-bold text-amber-400 block mb-0.5 flex items-center gap-1">
                                💡 คำแนะนำและจุดที่พัฒนาต่อยอด:
                              </span>
                              <span className="text-slate-200 leading-relaxed">
                                {p.eval.improvement}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Individual Diagnostic Matrix Summary */}
                  <div className="mt-5 p-4 sm:p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 relative">
                    <h4 className="text-xs sm:text-sm font-bold text-amber-400 mb-3 flex items-center gap-1.5">
                      <BrainCircuit size={16} /> สรุปผลการวินิจฉัยสมรรถนะรายบุคคล (Personalized Diagnostic)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                      {/* ด้านที่ดีเยี่ยม */}
                      <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                        <span className="font-bold text-emerald-400 block mb-2 flex items-center gap-1.5">
                          🏆 มิติที่มีความเชี่ยวชาญระดับดีเยี่ยม ({excellentPillars.length} ด้าน)
                        </span>
                        <div className="space-y-2 text-slate-300 font-sans">
                          {excellentPillars.length > 0 ? (
                            excellentPillars.map(p => (
                              <div key={p.id} className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                                <div>
                                  <strong className="text-slate-100">{p.shortTitle} ({p.points} คะแนน):</strong>
                                  <p className="text-slate-300 mt-0.5 leading-normal">{p.eval.strength}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-400 italic">
                              ยังไม่มีมิติที่ได้ระดับ 100 คะแนนเต็ม แนะนำให้ฝึกทบทวนและทำซ้ำเพื่อก้าวสู่ระดับดีเยี่ยม
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ด้านที่ต้องปรับปรุงแก้ไข */}
                      <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                        <span className="font-bold text-amber-400 block mb-2 flex items-center gap-1.5">
                          🔧 มิติที่ควรทบทวนและพัฒนาเพิ่มเติม ({needsImprovementPillars.length} ด้าน)
                        </span>
                        <div className="space-y-2 text-slate-300 font-sans">
                          {needsImprovementPillars.length > 0 ? (
                            needsImprovementPillars.map(p => (
                              <div key={p.id} className="flex items-start gap-2">
                                <span className="text-amber-400 font-bold shrink-0">•</span>
                                <div>
                                  <strong className="text-slate-100">{p.shortTitle} ({p.points} คะแนน):</strong>
                                  <p className="text-slate-300 mt-0.5 leading-normal">{p.eval.improvement}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-start gap-2 font-sans p-1">
                              <span className="text-amber-400 font-bold">✨</span>
                              <div className="text-slate-200">
                                <strong>สุดยอดผู้เชี่ยวชาญการคิดเชิงคำนวณ!</strong> นักเรียนมีความรู้ความเข้าใจครบถ้วนทั้ง 4 มิติระดับ 100 คะแนนเต็ม พร้อมนำไปประยุกต์ใช้ในการเขียนโปรแกรมและการแก้ปัญหาในชีวิตจริงได้อย่างมีประสิทธิภาพสูงสุด
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Action Control Buttons (Without PDF export button) */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={handleClearAndExit}
                    className="flex-1 py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm sm:text-base font-extrabold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                    id="finish-btn"
                  >
                    <CheckCircle2 size={18} /> เสร็จสิ้นการเรียนรู้ (กลับหน้าแรก) 🏁
                  </button>

                  <button
                    onClick={handleAction}
                    className="py-4 px-6 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-sm sm:text-base font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    id="just-map-btn"
                  >
                    ดูแผนที่เส้นทางต่อ 🗺️
                  </button>
                </div>
              </div>
            ) : (
              // Standard Level Completed Screen
              <>
                <div className="mx-auto w-20 h-20 bg-cyan-950/50 border-2 border-cyan-400 rounded-full flex items-center justify-center text-cyan-300 mb-5 shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-bounce duration-1000">
                  <Award size={44} />
                </div>

                <h3 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent tracking-wider uppercase mb-1">
                  เก่งมาก ผ่านด่านสำเร็จ! 🎉
                </h3>
                <p className="text-xs text-slate-400 font-mono mb-3 uppercase tracking-widest">
                  &lt; LEVEL COMPLETED &gt;
                </p>

                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-slate-300 text-sm md:text-base mb-6 leading-relaxed flex flex-col items-center">
                  <p className="mb-3 font-medium">ยินดีด้วย! คุณทำภารกิจครบถ้วนสมบูรณ์ ได้รับเหรียญดาวเกียรติยศประจำฐานดังนี้ : </p>
                  
                  {/* Star score display */}
                  <div className="flex gap-2">
                    {[1, 2, 3].map((star) => (
                      <motion.div
                        key={star}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + star * 0.15, type: 'spring' }}
                      >
                        <Award
                          size={28}
                          className={
                            star <= starsCount
                              ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_#facc15]"
                              : "text-slate-800"
                          }
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAction}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  id="back-to-map-btn"
                >
                  กลับไปหน้าแผนที่เส้นทาง 🗺️
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}

    </div>
  );
}
