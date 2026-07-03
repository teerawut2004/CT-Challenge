import React from 'react';
import { CheckCircle2, AlertTriangle, RotateCcw, ArrowRight, Award, MapPin, User, BookOpen, Trash2, Sparkles, Check } from 'lucide-react';
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
  onClearAndExit
}: FeedbackOverlayProps) {
  
  const handleAction = () => {
    audioSynth.playSfx('click');
    onAction();
  };

  const handleClearAndExit = () => {
    audioSynth.playSfx('unlock');
    if (onClearAndExit) onClearAndExit();
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm select-none">
      
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

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-6">
              คุณวิเคราะห์ข้อมูลและตอบคำถามได้ถูกต้องสมบูรณ์ ทักษะการคิดของคุณพัฒนาขึ้นอีกขั้นแล้ว!
            </p>

            <button
              onClick={handleAction}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
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
            <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-xl text-left text-sm text-amber-200/90 leading-relaxed mb-6">
              <span className="font-bold text-amber-400 block mb-1 font-mono">💡 คำใบ้ประกอบการเรียนรู้ (Hint) : </span>
              {hintText || "ลองพิจารณารายละเอียดหรือตัวเลือกใหม่อีกครั้งสิ คุณทำได้แน่นอน!"}
            </div>

            <button
              onClick={handleAction}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              id="try-again-btn"
            >
              ลองคิดใหม่อีกครั้ง <RotateCcw size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. GAME OVER MODAL (Resetting progress and returning to Level 1) */}
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

            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
              ไม่เป็นไรนะ! ความผิดพลาดคือหนทางของการเรียนรู้<br/>
              ลองกลับไปฝึกฝนและเริ่มใหม่ตั้งแต่ <span className="text-amber-400 font-bold">ด่านที่ 1</span> ดูสิครับ!
            </p>

            <button
              onClick={handleAction}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-950 font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              id="restart-level-btn"
            >
              กลับไปเริ่มเล่นใหม่ที่ด่านแรก 🔄
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
              ? "border-amber-500 w-full max-w-xl shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-glow" 
              : "border-cyan-500 w-full max-w-lg shadow-[0_0_50px_rgba(6,182,212,0.45)]"
          }`}
          id="level-completed-modal"
        >
          {isFinalLevel ? (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_15px_#f59e0b]" />
          ) : (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 shadow-[0_0_15px_#06b6d4]" />
          )}

          <div className="p-6 text-center">
            {isFinalLevel ? (
              // Final Report Card Screen
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-amber-950/50 border-2 border-amber-400 rounded-full flex items-center justify-center text-amber-300 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-bounce duration-1000">
                  <Award size={44} />
                </div>

                <h3 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent tracking-wider uppercase mb-1">
                  ภารกิจสมบูรณ์ จบหลักสูตร! 🎉
                </h3>
                <p className="text-xs text-amber-400 font-mono mb-4 uppercase tracking-widest flex items-center gap-1 justify-center">
                  <Sparkles size={12} className="animate-spin text-amber-400" /> 
                  COMPLETE REPORT CARD &lt; CT-WORLD ม.2 &gt; 
                  <Sparkles size={12} className="animate-spin text-amber-400" />
                </p>

                {/* Report Card content */}
                <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-left mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  {/* Student profile sub-section */}
                  <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3.5 mb-4">
                    <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-400">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">ข้อมูลผู้บันทึกระบบปฏิบัติการ</div>
                      <div className="text-base font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                        {studentName || "ไม่ระบุชื่อ"}
                        <span className="text-xs font-normal text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                          ชั้น ม.{studentClass || "2"} เลขที่ {studentNumber || "0"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary of 5 levels */}
                  <div className="space-y-2.5">
                    <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider mb-2">สรุปผลการผ่านเกณฑ์มาตรฐานสะสม</div>
                    
                    <div className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-mono text-[10px]">1</span>
                        การแบ่งย่อยปัญหา (Decomposition)
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check size={10} strokeWidth={3} /> PASSED
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 flex items-center justify-center font-mono text-[10px]">2</span>
                        การพิจารณารูปแบบ (Pattern Recognition)
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check size={10} strokeWidth={3} /> PASSED
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-pink-950 text-pink-400 flex items-center justify-center font-mono text-[10px]">3</span>
                        การคิดเชิงนามธรรม (Abstraction)
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check size={10} strokeWidth={3} /> PASSED
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-400 flex items-center justify-center font-mono text-[10px]">4</span>
                        การออกแบบอัลกอริทึม (Algorithm)
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check size={10} strokeWidth={3} /> PASSED
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-400 flex items-center justify-center font-mono text-[10px]">5</span>
                        ด่านบอสประยุกต์ทักษะแก้ไขปัญหา
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check size={10} strokeWidth={3} /> COMPLETED
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mt-4 pt-3.5 border-t border-slate-800/60 font-medium">
                    🔒 <span className="text-amber-400/90 font-semibold">ข้อเสนอความปลอดภัย : </span> ข้อมูลของระบบนี้ถูกจัดเก็บในความจำชั่วคราวเครื่องเพื่อความเป็นส่วนตัวสูงสุด เมื่อเล่นเสร็จสิ้นและต้องการให้เพื่อนคนถัดไปสามารถเล่นต่อได้อย่างสะอาดกรุณากดปุ่มสีส้มด้านล่างเพื่อล้างข้อมูล
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={handleClearAndExit}
                    className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm"
                    id="clear-exit-btn"
                  >
                    <Trash2 size={16} /> ล้างข้อมูล & ส่งต่อให้เพื่อนคนถัดไป 🔄
                  </button>

                  <button
                    onClick={handleAction}
                    className="py-3.5 px-5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm"
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
