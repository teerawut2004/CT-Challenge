import React from 'react';
import { 
  CheckCircle2, AlertTriangle, RotateCcw, ArrowRight, Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { audioSynth } from '../utils/audio';

interface FeedbackOverlayProps {
  type: 'correct' | 'incorrect' | 'gameover' | 'level-completed';
  hintText?: string;
  onAction: () => void;
  onReplayLevel?: () => void;
  levelId?: number;
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
  onReplayLevel,
  levelId = 1,
  starsCount = 3,
  isFinalLevel = false,
}: FeedbackOverlayProps) {
  
  const handleAction = () => {
    audioSynth.playSfx('click');
    onAction();
  };

  const handleReplay = () => {
    audioSynth.playSfx('click');
    if (onReplayLevel) {
      onReplayLevel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm select-none assessment-overlay">
      
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

            <p className="text-slate-200 text-sm md:text-base leading-relaxed my-4 font-sans">
              คุณวิเคราะห์ข้อมูลและตอบคำถามได้ถูกต้องสมบูรณ์ ทักษะการคิดของคุณพัฒนาขึ้นอีกขั้นแล้ว!
            </p>

            <button
              onClick={handleAction}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base font-extrabold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
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
            <div className="mx-auto w-16 h-16 bg-amber-950/50 border border-amber-500 rounded-full flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-2xl font-black text-amber-400 tracking-wider uppercase mb-3">
              ยังไม่ถูกต้องนะ! 💡
            </h3>

            {/* Dynamic Hint box */}
            <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl text-left text-sm md:text-base text-amber-100 font-medium leading-relaxed mb-5 whitespace-pre-line">
              <span className="font-bold text-amber-300 block mb-1 text-sm md:text-base">💡 คำใบ้และการแก้ไขข้อผิดพลาด : </span>
              {hintText || "ลองพิจารณารายละเอียดหรือตัวเลือกใหม่อีกครั้งสิ คุณทำได้แน่นอน!"}
            </div>

            <button
              onClick={handleAction}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-base font-extrabold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              id="try-again-btn"
            >
              ลองคิดใหม่อีกครั้ง <RotateCcw size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. GAME OVER MODAL */}
      {type === 'gameover' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-slate-950 border-2 border-rose-500 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.4)]"
          id="gameover-modal"
        >
          <div className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-rose-950/50 border border-rose-500 rounded-full flex items-center justify-center text-rose-400 mb-3 animate-bounce">
              <RotateCcw size={32} />
            </div>

            <h3 className="text-2xl font-black text-rose-400 tracking-wider uppercase mb-2">
              หัวใจพลังชีวิตหมดเกลี้ยง! ❤️❌
            </h3>

            <p className="text-slate-200 text-sm md:text-base leading-relaxed mb-5 font-sans">
              ไม่เป็นไรนะ! ความผิดพลาดคือหนทางของการเรียนรู้<br/>
              ลองเริ่มท้าทายภารกิจใน <span className="text-amber-400 font-bold">ด่านนี้ใหม่อีกครั้ง</span> ดูสิครับ!
            </p>

            <button
              onClick={handleAction}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-950 text-base font-extrabold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              id="restart-level-btn"
            >
              เริ่มเล่นใหม่ในด่านนี้ 🔄
            </button>
          </div>
        </motion.div>
      )}

      {/* 4. LEVEL COMPLETED MODAL */}
      {type === 'level-completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-slate-950 border-2 border-cyan-500 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.45)] relative"
          id="level-completed-modal"
        >
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 shadow-[0_0_15px_#06b6d4]" />

          <div className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-cyan-950/50 border-2 border-cyan-400 rounded-full flex items-center justify-center text-cyan-300 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-bounce duration-1000">
              <Award size={36} />
            </div>

            <h3 className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent tracking-wider mb-3">
              ยินดีด้วย! คุณผ่านด่านที่ {levelId} แล้ว! 🎉
            </h3>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-slate-300 text-sm mb-5 leading-relaxed flex flex-col items-center">
              <p className="mb-2.5 font-medium">คุณทำภารกิจครบถ้วนสมบูรณ์ ได้รับดาวประจำด่าน :</p>
              
              <div className="flex gap-2">
                {[1, 2, 3].map((star) => (
                  <motion.div
                    key={star}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15 + star * 0.1, type: 'spring' }}
                  >
                    <Award
                      size={26}
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

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleReplay}
                className="flex-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-400/60 text-slate-100 font-bold tracking-wide rounded-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                id="replay-mission-btn"
              >
                <RotateCcw size={18} className="text-cyan-400" />
                <span>เล่นด่านนี้อีกครั้ง</span>
              </button>

              <button
                onClick={handleAction}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold tracking-wide rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                id="next-mission-btn"
              >
                <span>{isFinalLevel ? 'ดูสรุปผลการเรียนรู้ 🏆' : 'เล่นด่านถัดไป'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
