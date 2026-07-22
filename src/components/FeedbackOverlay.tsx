import React from 'react';
import { 
  CheckCircle2, AlertTriangle, RotateCcw, ArrowRight, Award, MapPin, User, 
  BookOpen, Trash2, Sparkles, Check, Layers, Cpu, EyeOff, Grid, Printer, 
  Home, BarChart3, BrainCircuit, ArrowUpRight 
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

  const handlePrintPDF = () => {
    audioSynth.playSfx('click');
    window.print();
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

  // Define Pillars array with icons, colors, descriptions and dynamic evaluations
  const pillars = [
    {
      id: 1,
      title: "Decomposition (การแบ่งย่อยปัญหา)",
      description: "ความสามารถในการแยกแยะปัญหาใหญ่ ซับซ้อน ออกเป็นปัญหาย่อยๆ เพื่อให้ง่ายต่อการทำความเข้าใจและวิเคราะห์จัดการ",
      score: p1Score,
      points: p1Points,
      icon: Layers,
      color: "from-cyan-400 to-teal-400",
      textColor: "text-cyan-400",
      bgColor: "bg-cyan-950/20",
      borderColor: "border-cyan-500/20",
      eval: 
        p1Score === 3 
          ? {
              status: "ดีเยี่ยม",
              badgeColor: "bg-emerald-950/60 text-emerald-400 border-emerald-500/20",
              strength: "สามารถวิเคราะห์แยกแยะงานใหญ่ออกเป็นส่วนย่อยได้อย่างละเอียด ชัดเจน เช่น การวางแผนและแบ่งหมวดหมู่ส่วนประกอบกิจกรรมกีฬาสีและเมนูทำอาหารได้อย่างเป็นระบบสมบูรณ์",
              improvement: "ควรรักษาระบบระเบียบการคิดเชิงโครงสร้างนี้ไว้ และลองฝึกนำไปใช้วางแผนจัดตารางเวลาการอ่านหนังสือหรือโครงการระยะยาวจริง"
            }
          : p1Score === 2
          ? {
              status: "ดีมาก",
              badgeColor: "bg-cyan-950/60 text-cyan-400 border-cyan-500/20",
              strength: "สามารถจัดกลุ่มและแบ่งหมวดหมู่งานหลักได้ถูกต้องเป็นขั้นตอนที่ดีในระดับมาตรฐานเป็นส่วนใหญ่",
              improvement: "ลองฝึกเจาะลึกรายละเอียดงานย่อยๆ เพิ่มขึ้นอีกเล็กน้อย เพื่อช่วยให้มองเห็นขั้นตอนซ่อนเร้นที่อาจตกหล่นไป"
            }
          : {
              status: "ต้องปรับปรุง",
              badgeColor: "bg-amber-950/60 text-amber-400 border-amber-500/20",
              strength: "เข้าใจแนวคิดในการแบ่งปัญหาออกเป็นขั้นตอนการทำงานเบื้องต้นได้พอใช้",
              improvement: "ลองฝึกทักษะเพิ่มโดยแยกงานในบ้านง่ายๆ เช่น แผนการจัดโต๊ะอ่านหนังสือ หรือขั้นตอนเตรียมทำรายงาน ออกเป็นขั้นตอนย่อยยิบ"
            }
    },
    {
      id: 2,
      title: "Pattern Recognition (การพิจารณารูปแบบ)",
      description: "ความสามารถในการสังเกต ค้นหารูปแบบ ความเหมือน ความต่าง หรือแนวโน้มลักษณะร่วมกันในปัญหาต่างๆ",
      score: p2Score,
      points: p2Points,
      icon: Grid,
      color: "from-purple-400 to-indigo-400",
      textColor: "text-purple-400",
      bgColor: "bg-purple-950/20",
      borderColor: "border-purple-500/20",
      eval: 
        p2Score === 3 
          ? {
              status: "ดีเยี่ยม",
              badgeColor: "bg-emerald-950/60 text-emerald-400 border-emerald-500/20",
              strength: "ยอดเยี่ยมในการสังเกตและค้นหารูปแบบ ความสอดคล้อง หรือความผิดปกติของตัวเลข แนวโน้มข้อความสแปม หรือความเชื่อมโยงปัญหา เช่น อาการเสียของเครื่องใช้ไฟฟ้า ได้อย่างว่องไวและแม่นยำสูง",
              improvement: "ท้าทายตนเองต่อด้วยการสังเกตรูปแบบและวิเคราะห์สถิติ คาดการณ์แนวโน้มข้อมูลของสภาพอากาศ หรือแนวโน้มการเติบโตยอดขายในบทเรียนวิชาสังคมและคณิตศาสตร์"
            }
          : p2Score === 2
          ? {
              status: "ดีมาก",
              badgeColor: "bg-purple-950/60 text-purple-400 border-purple-500/20",
              strength: "สามารถเปรียบเทียบข้อกำหนดเพื่อมองหารูปลักษณ์ภายนอกและความคล้ายคลึงของแพทเทิร์นปัญหาทั่วไปได้ค่อนข้างดีเยี่ยม",
              improvement: "ฝึกมองหารูปแบบพฤติกรรมในระดับเชิงสถิติหรือความสัมพันธ์ที่ซับซ้อนเพิ่มขึ้นเพื่อให้ประยุกต์ใช้โซลูชันแก้ไขได้ว่องไวยิ่งขึ้น"
            }
          : {
              status: "ต้องปรับปรุง",
              badgeColor: "bg-amber-950/60 text-amber-400 border-amber-500/20",
              strength: "เข้าใจโครงสร้างแพทเทิร์นและจับคู่วิเคราะห์รูปแบบความต่างทางกายภาพพื้นฐานที่ชัดเจนได้ดี",
              improvement: "ลองเล่นเกมปริศนาอักษรไขว้ จับผิดภาพ ค้นหาแบบรูปคณิตศาสตร์ หรือจัดระเบียบของเล่นตามประเภทสีและขนาดเพื่อเสริมความเชี่ยวชาญ"
            }
    },
    {
      id: 3,
      title: "Abstraction (การคิดเชิงนามธรรม)",
      description: "ความสามารถในการคัดแยกรายละเอียดที่สำคัญและจำเป็น เพื่อมุ่งเน้นไปที่หัวใจหรือแก่นของปัญหาอย่างแท้จริง",
      score: p3Score,
      points: p3Points,
      icon: EyeOff,
      color: "from-pink-400 to-rose-400",
      textColor: "text-pink-400",
      bgColor: "bg-pink-950/20",
      borderColor: "border-pink-500/20",
      eval: 
        p3Score === 3 
          ? {
              status: "ดีเยี่ยม",
              badgeColor: "bg-emerald-950/60 text-emerald-400 border-emerald-500/20",
              strength: "มีความสามารถที่น่าทึ่งในการคัดแยกรายละเอียดปลีกย่อย (เช่น ลวดลายเสื้อผ้า สีผม) ออกไปอย่างชัดแจ้ง และโฟกัสเฉพาะแก่นแท้ของปัญหาเพื่อวาดป้ายสัญลักษณ์ทางหนีไฟหรือแผนภาพได้อย่างมืออาชีพ",
              improvement: "นำไปต่อยอดใช้สรุปสาระสำคัญจากการเรียนเพื่อเขียนแผนผังความคิด (Mind Map) รวบยอด หรืออธิบายแนวความคิดยากๆ ให้เข้าใจง่ายภายใน 1 บรรทัด"
            }
          : p3Score === 2
          ? {
              status: "ดีมาก",
              badgeColor: "bg-pink-950/60 text-pink-400 border-pink-500/20",
              strength: "สามารถคัดสรรและอธิบายจุดสำคัญรวมถึงความหมายเชิงสากลของสัญลักษณ์ต่างๆ ได้ถูกต้องแม่นยำเป็นหลัก",
              improvement: "ระมัดระวังสิ่งเร้าและรายละเอียดรองอื่นๆ ดึงดูดความสนใจไปจากจุดหลักของเนื้อหาใจความจริง"
            }
          : {
              status: "ต้องปรับปรุง",
              badgeColor: "bg-amber-950/60 text-amber-400 border-amber-500/20",
              strength: "มีความสามารถที่จะคัดทิ้งข้อมูลที่ไม่ได้เกี่ยวข้องกับใจความเบื้องต้นได้ดีระดับหนึ่ง",
              improvement: "ลองฝึกด้วยการวาดภาพไอคอนแทนความหมายง่ายๆ หรือพยายามอ่านข่าวสั้นแล้วสรุปเฉพาะใจความหลัก ใคร ทำอะไร ที่ไหน ให้ได้ในประโยคเดียว"
            }
    },
    {
      id: 4,
      title: "Algorithm Design (การออกแบบขั้นตอนวิธี)",
      description: "ความสามารถในการเรียงลำดับขั้นตอนการแก้ปัญหาหรือการทำงานเป็นข้อๆ อย่างชัดเจน เพื่อให้ผู้อื่นทำตามได้อย่างแม่นยำ",
      score: p4Score,
      points: p4Points,
      icon: Cpu,
      color: "from-amber-400 to-orange-400",
      textColor: "text-amber-400",
      bgColor: "bg-amber-950/20",
      borderColor: "border-amber-500/20",
      eval: 
        p4Score === 3 
          ? {
              status: "ดีเยี่ยม",
              badgeColor: "bg-emerald-950/60 text-emerald-400 border-emerald-500/20",
              strength: "มีทักษะตรรกะที่ยอดเยี่ยม สามารถเรียงลำดับขั้นตอนอย่างไม่คลุมเครือ เชื่อมโยงสัญลักษณ์ผังงานวิทยาการคำนวณ (Flowchart) หรือสร้างรหัสเทียม (Pseudocode) ตลอดจนเงื่อนไขตัดสินใจได้อย่างสมบูรณ์",
              improvement: "แนะนำศึกษาและเข้าสู่วงการเขียนโค้ดคอมพิวเตอร์จริง (Coding) ผ่านการต่อบล็อกคำสั่งของ Scratch หรือเริ่มเรียนไวยากรณ์สากลอย่างภาษา Python"
            }
          : p4Score === 2
          ? {
              status: "ดีมาก",
              badgeColor: "bg-amber-950/60 text-amber-400 border-amber-500/20",
              strength: "สามารถออกแบบขั้นตอนปฏิบัติที่มีเงื่อนไขประกอบและทิศทางตัดสินใจได้อย่างลื่นไหลและเข้าใจง่าย",
              improvement: "ลองพิจารณาเคสที่เป็นไปได้กรณีอื่นๆ หรือเพิ่มแนวทางควบคุมความผิดพลาด (Edge Cases) เข้าไปในขั้นตอนวิธีให้คลุมเครือน้อยที่สุด"
            }
          : {
              status: "ต้องปรับปรุง",
              badgeColor: "bg-amber-950/60 text-amber-400 border-amber-500/20",
              strength: "สามารถจัดลำดับความชัดเจนของสเต็ปทำงานแบบทิศทางเดี่ยวขั้นพื้นฐานได้ดี",
              improvement: "ลองเขียนขั้นตอนวิธีแก้ปัญหาเรื่องใกล้ตัว เช่น การเขียนสูตรชงนมร้อน หรือเขียนบอกทางไปห้องน้ำให้ละเอียด และทดสอบให้เพื่อนทำตามโดยห้ามอธิบายเพิ่ม"
            }
    }
  ];

  const excellentPillars = pillars.filter(p => p.score === 3);
  const needsImprovementPillars = pillars.filter(p => p.score < 3);

  const maxScore = Math.max(p1Score, p2Score, p3Score, p4Score);
  const minScore = Math.min(p1Score, p2Score, p3Score, p4Score);

  const strongPillars = pillars.filter(p => p.score === maxScore);
  const improvePillars = pillars.filter(p => p.score < 3);
  const lowPillars = improvePillars.length > 0 ? improvePillars : pillars.filter(p => p.score === minScore);

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm select-none assessment-overlay">
      
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

      {/* 4. LEVEL COMPLETED CELEBRATORY MODAL */}
      {type === 'level-completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`bg-slate-950 border-2 rounded-2xl overflow-hidden relative ${
            isFinalLevel 
              ? "border-amber-500 w-full max-w-4xl shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-glow max-h-[92vh] overflow-y-auto custom-scrollbar" 
              : "border-cyan-500 w-full max-w-lg shadow-[0_0_50px_rgba(6,182,212,0.45)]"
          }`}
          id="level-completed-modal"
        >
          {isFinalLevel ? (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_15px_#f59e0b] no-print" />
          ) : (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 shadow-[0_0_15px_#06b6d4] no-print" />
          )}

          {/* Self-contained CSS print styles */}
          <style>{`
            @media print {
              body, #root {
                background: white !important;
                color: #0f172a !important;
              }
              .no-print {
                display: none !important;
              }
              .print-full-width {
                width: 100% !important;
                max-width: 100% !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                margin: 0 !important;
                padding: 1.5cm !important;
                background: white !important;
                color: #0f172a !important;
                border: none !important;
                box-shadow: none !important;
                overflow: visible !important;
                max-height: none !important;
              }
              .print-bg-white {
                background-color: white !important;
                background: white !important;
                color: #0f172a !important;
                border: 1px solid #e2e8f0 !important;
                box-shadow: none !important;
              }
              .print-border {
                border: 1px solid #cbd5e1 !important;
              }
              .print-text-dark {
                color: #0f172a !important;
              }
              .print-text-muted {
                color: #475569 !important;
              }
              .print-grid-2 {
                display: grid !important;
                grid-template-cols: 1fr 1fr !important;
                gap: 1rem !important;
              }
              .print-bar {
                background-color: #cbd5e1 !important;
              }
              .print-bar-filled {
                background-color: #475569 !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          <div className="p-4 sm:p-6 md:p-8 text-center print-full-width">
            {isFinalLevel ? (
              // Final Comprehensive Assessment Dashboard
              <div className="flex flex-col items-center">
                {/* Celebratory academic badge */}
                <div className="w-16 h-16 bg-amber-950/40 border-2 border-amber-400 rounded-full flex items-center justify-center text-amber-300 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-bounce duration-1000 no-print">
                  <Award size={36} />
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent tracking-wider uppercase mb-1 print-text-dark">
                  รายงานผลการประเมินทักษะการคิดเชิงคำนวณ
                </h3>
                <p className="text-[10px] sm:text-xs text-amber-400 font-mono mb-6 uppercase tracking-widest flex items-center gap-1.5 justify-center print-text-muted">
                  <Sparkles size={11} className="animate-spin text-amber-400 no-print" /> 
                  COMPUTATIONAL THINKING ASSESSMENT REPORT CARD &lt; CT-WORLD ม.2 &gt; 
                  <Sparkles size={11} className="animate-spin text-amber-400 no-print" />
                </p>

                {/* Printable Dashboard Card Area */}
                <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 text-left mb-6 relative overflow-hidden print-bg-white print-border">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none no-print" />
                  
                  {/* Student profile sub-section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-5 print-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-400 print-border">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-mono text-slate-500 tracking-wider">ข้อมูลส่วนตัวผู้เรียน</div>
                        <div className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 flex-wrap print-text-dark">
                          {studentName || "ไม่ระบุชื่อ"}
                          <span className="text-[11px] font-normal text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 print-border print-text-muted">
                            ชั้น ม.{studentClass || "2"} เลขที่ {studentNumber || "0"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-[10px] font-mono text-slate-500 no-print">
                      <span>วันที่ประเมิน: {new Date().toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>

                  {/* 100-Point Score Overview and Quick Assessment Classifications */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Circle Score Gauge */}
                    <div className="md:col-span-1 bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center print-bg-white print-border">
                      <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider mb-2">คะแนนเฉลี่ยสะสม</span>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        {/* Circular progress track SVG */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" className="stroke-slate-800 fill-none print-bar" strokeWidth="8" />
                          <circle cx="48" cy="48" r="40" className="stroke-amber-400 fill-none print-bar-filled" strokeWidth="8" 
                                  strokeDasharray={`${2 * Math.PI * 40}`} 
                                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - averageScore / 100)}`} 
                                  strokeLinecap="round" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-amber-400 print-text-dark">{averageScore}</span>
                          <span className="text-[9px] text-slate-500 font-mono">เต็ม 100</span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Quick Stats Lists */}
                    <div className="md:col-span-2 bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex flex-col justify-between print-bg-white print-border">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5 print-text-dark">
                          <BrainCircuit size={14} className="text-amber-400" /> การจำแนกทักษะตามระดับผลลัพธ์
                        </h4>
                        <div className="space-y-2 text-[11px]">
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold shrink-0">🏆 ด้านที่ดีเยี่ยม (100 คะแนน):</span>
                            <div className="text-slate-300 leading-relaxed print-text-muted">
                              {excellentPillars.length > 0 ? (
                                <span className="font-semibold text-emerald-400">
                                  {excellentPillars.map(p => p.title.split(' ')[0]).join(', ')}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">ไม่มีด้านที่ได้ดีเยี่ยมในรอบนี้</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold shrink-0">🔧 ด้านที่ต้องปรับปรุง (&lt; 100 คะแนน):</span>
                            <div className="text-slate-300 leading-relaxed print-text-muted">
                              {needsImprovementPillars.length > 0 ? (
                                <span className="font-semibold text-amber-300">
                                  {needsImprovementPillars.map(p => p.title.split(' ')[0]).join(', ')}
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-bold">ไม่มี (ยอดเยี่ยมมาก! เชี่ยวชาญระดับดีเยี่ยมครบทุกด้าน)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-[9px] text-slate-400 italic mt-2 leading-relaxed border-t border-slate-900/60 pt-2 print-border print-text-muted">
                        * หมายเหตุ: คะแนนประเมินคํานวณจากจำนวนชีวิตคงเหลือในการพิชิตโจทย์ของด่าน 1 - 4 (ระดับ 3 ดาว = 100 คะแนน ดีเยี่ยม, 2 ดาว = 80 คะแนน ดีมาก, 1 ดาว = 60 คะแนน ต้องปรับปรุง)
                      </div>
                    </div>
                  </div>

                  {/* CT Pillars grid - Responsive (1 col on mobile, 2 cols on tablet/desktop) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 print-grid-2">
                    {pillars.map((p) => {
                      const IconComponent = p.icon;
                      return (
                        <div 
                          key={p.id} 
                          className="p-3 sm:p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between print-bg-white print-border"
                        >
                          <div>
                            {/* Card Header with Icon, Name, and Proficiency Badge */}
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-amber-400 print-border">
                                  <IconComponent size={16} />
                                </div>
                                <h4 className="text-[12px] sm:text-[13px] font-bold text-slate-200 print-text-dark">
                                  {p.title}
                                </h4>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${p.eval.badgeColor}`}>
                                {p.eval.status}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="text-[11px] text-slate-400 leading-relaxed mb-3 print-text-muted">
                              {p.description}
                            </p>
                          </div>

                          {/* Progress Meter */}
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1 print-text-muted">
                              <span>ผลคะแนนประเมินด้านนี้</span>
                              <span className="font-bold print-text-dark">{p.points} / 100 คะแนน</span>
                            </div>
                            
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 print-bar">
                              <div 
                                className={`h-full bg-gradient-to-r ${p.color} rounded-full print-bar-filled`} 
                                style={{ width: `${p.points}%` }} 
                              />
                            </div>
                            
                            {/* Strength & Improvement Text details */}
                            <div className="mt-3 space-y-2 text-[11px] border-t border-slate-900/80 pt-2.5 print-border">
                              <div>
                                <span className="font-semibold text-emerald-400 block mb-0.5 flex items-center gap-1">
                                  <span className="text-[10px] bg-emerald-950/80 px-1 py-0.2 rounded text-emerald-300 font-bold border border-emerald-500/10 no-print">จุดเด่น</span>
                                  จุดแข็งที่ตรวจพบ:
                                </span>
                                <span className="text-slate-300 leading-relaxed print-text-muted">
                                  {p.eval.strength}
                                </span>
                              </div>
                              
                              <div>
                                <span className="font-semibold text-amber-400 block mb-0.5 flex items-center gap-1">
                                  <span className="text-[10px] bg-amber-950/80 px-1 py-0.2 rounded text-amber-300 font-bold border border-amber-500/10 no-print">คำแนะนำ</span>
                                  แนวทางพัฒนาเพิ่มเติม:
                                </span>
                                <span className="text-slate-300 leading-relaxed print-text-muted">
                                  {p.eval.improvement}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Assessment (Bento Block for Strengths and Weaknesses) */}
                  <div className="mt-5 p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 relative print-bg-white print-border">
                    <h4 className="text-[12px] sm:text-[13px] font-bold text-amber-400 mb-3 flex items-center gap-1.5 print-text-dark">
                      <BrainCircuit size={16} /> สรุปการจำแนกทักษะรายบุคคลและการประเมินย้อนกลับ
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] leading-relaxed">
                      {/* ด้านที่ดีเยี่ยม */}
                      <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60 print-bg-white print-border">
                        <span className="font-bold text-emerald-400 block mb-1.5 flex items-center gap-1">
                          🏆 ด้านที่ได้ระดับดีเยี่ยม (100 คะแนนเต็ม)
                        </span>
                        <div className="space-y-2 text-slate-300 print-text-muted font-sans">
                          {excellentPillars.length > 0 ? (
                            excellentPillars.map(p => (
                              <div key={p.id} className="flex items-start gap-1.5">
                                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                                <div>
                                  <strong className="text-slate-200 print-text-dark">{p.title}</strong>
                                  <p className="text-slate-400 mt-0.5 text-[10px] leading-normal print-text-muted">{p.eval.strength}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic">
                              ไม่มีด้านที่ได้ระดับดีเยี่ยมในขณะนี้ แนะนำให้ฝึกทบทวนระดับบ่อยขึ้นเพื่อความเชี่ยวชาญ
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ด้านที่ต้องปรับปรุงแก้ไข */}
                      <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60 print-bg-white print-border">
                        <span className="font-bold text-amber-400 block mb-1.5 flex items-center gap-1">
                          🔧 ด้านที่ต้องปรับปรุงแก้ไข (คะแนนต่ำกว่า 100)
                        </span>
                        <div className="space-y-2 text-slate-300 print-text-muted font-sans">
                          {needsImprovementPillars.length > 0 ? (
                            needsImprovementPillars.map(p => (
                              <div key={p.id} className="flex items-start gap-1.5">
                                <span className="text-amber-400 font-bold shrink-0">•</span>
                                <div>
                                  <strong className="text-slate-200 print-text-dark">{p.title} ({p.points} คะแนน)</strong>
                                  <p className="text-slate-400 mt-0.5 text-[10px] leading-normal print-text-muted">{p.eval.improvement}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-start gap-1.5 font-sans">
                              <span className="text-emerald-400 font-bold">✨</span>
                              <div className="text-slate-300">
                                <strong>ยอดเยี่ยมระดับเหรียญทองเกียรติยศ!</strong> นักเรียนไม่มีด้านที่ต้องปรับปรุงเลย มีความเชี่ยวชาญในทักษะการคิดเชิงคำนวณครบถ้วนสมบูรณ์ในทุกมิติ สามารถพัฒนาฝีมือต่อในการแก้ปัญหาระบบเขียนโค้ดและโครงสร้างจริงได้ทันที!
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Endorsement signature line for printable PDF */}
                  <div className="mt-8 hidden print:flex justify-between items-end border-t border-slate-200 pt-6 text-[11px] text-slate-500">
                    <div className="text-center">
                      <div className="w-32 border-b border-slate-400 mx-auto mb-1 h-8" />
                      <div>ลงชื่อ ............................................................</div>
                      <div className="mt-1">({studentName || "................................................"}) ผู้เรียน</div>
                    </div>
                    <div className="text-center">
                      <div className="w-32 border-b border-slate-400 mx-auto mb-1 h-8" />
                      <div>ลงชื่อ ............................................................</div>
                      <div className="mt-1">(ผู้ประเมินทักษะ / AI Mentor)</div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Action control buttons (Hidden during PDF print) */}
                <div className="flex flex-col sm:flex-row gap-3 w-full no-print">
                  <button
                    onClick={handlePrintPDF}
                    className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                    id="export-pdf-btn"
                  >
                    <Printer size={16} /> ส่งออกรายงานผล (PDF) 📄
                  </button>

                  <button
                    onClick={handleClearAndExit}
                    className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                    id="finish-btn"
                  >
                    <CheckCircle2 size={16} /> เสร็จสิ้นการเรียนรู้ (กลับหน้าแรก) 🏁
                  </button>

                  <button
                    onClick={handleAction}
                    className="py-3.5 px-5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                    id="just-map-btn"
                  >
                    ดูแผนที่ต่อ 🗺️
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
