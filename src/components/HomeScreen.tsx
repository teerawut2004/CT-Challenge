import React, { useState } from 'react';
import { Play, BookOpen, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioSynth } from '../utils/audio';

interface HomeScreenProps {
  onStartGame: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function HomeScreen({ onStartGame, soundEnabled, onToggleSound }: HomeScreenProps) {
  const [showObjectives, setShowObjectives] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handleStart = () => {
    audioSynth.playSfx('click');
    onStartGame();
  };

  const handleToggleAudio = () => {
    onToggleSound();
    audioSynth.playSfx('click');
  };

  const handleOpenObjective = () => {
    audioSynth.playSfx('click');
    setShowObjectives(true);
  };

  const handleOpenHowToPlay = () => {
    audioSynth.playSfx('click');
    setShowHowToPlay(true);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-radial from-slate-900 via-[#0B0F19] to-[#04060b] text-white overflow-hidden font-sans px-4 select-none">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Ambient decorative glowing spots */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar with Sound Toggle */}
      <div className="w-full max-w-5xl flex justify-end p-4 z-10">
        <button
          onClick={handleToggleAudio}
          className="p-3 bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 rounded-xl transition-all duration-300 text-cyan-400 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          title={soundEnabled ? "ปิดเสียง" : "เปิดเสียง"}
          id="audio-toggle-btn"
        >
          {soundEnabled ? <Volume2 size={24} className="animate-pulse" /> : <VolumeX size={24} />}
        </button>
      </div>

      {/* Title & App Core Presentation */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl text-center z-10 py-8">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative mb-6"
        >
          <div className="absolute -inset-10 bg-radial from-cyan-500/10 to-transparent blur-xl" />
          <h1 
            id="app-title"
            className="text-6xl md:text-7xl font-extrabold tracking-widest bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent filter drop-shadow-[0_0_15px_rgba(6,182,212,0.4)] font-mono uppercase"
          >
            CT Challenge
          </h1>
          <p className="text-sm md:text-base font-mono text-cyan-400/80 mt-3 tracking-widest uppercase">
            &lt; Computational Thinking Learning Game &gt;
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-slate-300 text-base md:text-lg mb-10 max-w-lg leading-relaxed border-l-2 border-cyan-500/50 pl-4 text-left"
        >
          ยินดีต้อนรับเข้าสู่เกมพัฒนาทักษะ <span className="text-cyan-400 font-semibold">แนวคิดเชิงคำนวณ</span> สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 2 ร่วมเรียนรู้ ตะลุยด่าน ตอบคำถามเพื่อพิชิตความท้าทายสุดสนุกไปด้วยกัน!
        </motion.p>

        {/* Start Game Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col gap-4 w-full max-w-xs md:max-w-sm"
        >
          <button
            onClick={handleStart}
            id="start-adventure-btn"
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-lg md:text-xl tracking-wider rounded-xl transition-all duration-300 transform hover:scale-[1.03] active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] border border-cyan-300/30 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            <span className="flex items-center justify-center gap-2">
              เข้าสู่แผนที่ด่านเกม <Play size={20} fill="currentColor" />
            </span>
          </button>

          {/* Sub menu controls */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleOpenObjective}
              id="objectives-btn"
              className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/90 text-sm md:text-base text-purple-300 font-medium rounded-xl transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.1)]"
            >
              <BookOpen size={16} />
              วัตถุประสงค์
            </button>
            <button
              onClick={handleOpenHowToPlay}
              id="how-to-play-btn"
              className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/90 text-sm md:text-base text-amber-300 font-medium rounded-xl transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.1)]"
            >
              <HelpCircle size={16} />
              กติกาการเล่น
            </button>
          </div>
        </motion.div>
      </div>

      {/* Developer Credits Info */}
      <div className="w-full max-w-5xl text-center py-6 border-t border-slate-900 z-10 leading-relaxed">
        <p className="text-slate-500 text-xs tracking-wide">
          ผู้พัฒนา : นายธรีวุฒ จำปาเรือง สาขาคอมพิวเตอร์ศึกษา
        </p>
        <p className="text-slate-500 text-xs tracking-wide mt-1">
          คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น
        </p>
      </div>

      {/* Pop-up Modals */}
      <AnimatePresence>
        {/* Objectives Modal */}
        {showObjectives && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-950 border border-purple-500/40 w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)] relative"
              id="objectives-modal"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 border-b border-purple-500/20 pb-3 mb-4">
                  <BookOpen className="text-purple-400" size={24} />
                  <h3 className="text-xl font-bold text-purple-300">วัตถุประสงค์การเรียนรู้</h3>
                </div>
                <div className="space-y-4 text-slate-300 text-sm md:text-base">
                  <div className="flex gap-3 items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-950 border border-purple-500 text-purple-300 font-mono text-xs mt-0.5 shrink-0">1</span>
                    <p>เพื่อพัฒนาทักษะด้าน <span className="text-purple-400 font-semibold">แนวคิดเชิงคำนวณ (Computational Thinking)</span> ทั้ง 4 เสาหลักของนักเรียน ม.2</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-950 border border-purple-500 text-purple-300 font-mono text-xs mt-0.5 shrink-0">2</span>
                    <p>เพื่อให้นักเรียนเข้าใจกระบวนการ <span className="text-cyan-400 font-semibold">ย่อยปัญหา (Decomposition)</span> และ <span className="text-purple-400 font-semibold">จดจำรูปแบบ (Pattern Recognition)</span> ได้อย่างเหมาะสม</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-950 border border-purple-500 text-purple-300 font-mono text-xs mt-0.5 shrink-0">3</span>
                    <p>เพื่อเพิ่มทักษะด้าน <span className="text-pink-400 font-semibold">การคิดเชิงนามธรรม (Abstraction)</span> โดยคัดแยกรายละเอียดที่ไม่สำคัญออก และกระบวนการ <span className="text-amber-400 font-semibold">อัลกอริทึม (Algorithm)</span> ลำดับคำสั่ง</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-950 border border-purple-500 text-purple-300 font-mono text-xs mt-0.5 shrink-0">4</span>
                    <p>ฝึกฝนการคิดอย่างเป็นระบบเพื่อประยุกต์แก้ไขโจทย์ปัญหาในชีวิตประจำวัน</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => { audioSynth.playSfx('click'); setShowObjectives(false); }}
                    className="px-5 py-2 bg-purple-900/40 border border-purple-500 hover:bg-purple-600 hover:text-slate-950 text-purple-300 font-semibold rounded-lg transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* How To Play Modal */}
        {showHowToPlay && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-950 border border-amber-500/40 w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.3)] relative"
              id="how-to-play-modal"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3 mb-4">
                  <HelpCircle className="text-amber-400" size={24} />
                  <h3 className="text-xl font-bold text-amber-300">กติกาการเล่นเกม</h3>
                </div>
                <div className="space-y-3.5 text-slate-300 text-sm md:text-base max-h-[60vh] overflow-y-auto pr-1">
                  <p className="text-slate-400 italic">กฎการฝ่าด่านทั้ง 5 ด่านความรู้ : </p>
                  <ul className="space-y-2.5">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">●</span>
                      <span>ผู้เล่นต้องฝ่าด่านทีละสถานี โดยตอบคำถามให้ผ่านครบสถานีละ <span className="text-cyan-400 font-semibold">5 ข้อ</span> เพื่อปลดล็อกด่านถัดไป</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">●</span>
                      <span>คุณมี <span className="text-rose-500 font-semibold">หัวใจพลังงานชีวิต (Life Cores) 3 ดวง</span> หากตอบผิดจะเสียหัวใจครั้งละ 1 ดวง</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">●</span>
                      <span>หาก <span className="text-emerald-400 font-semibold">ตอบถูกติดต่อกัน 3 ข้อ (Streak ×3)</span> หัวใจที่เสียไปจะฟื้นฟูคืนมา 1 ดวงทันที!</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold">●</span>
                      <span>หากหัวใจหมดลงเหลือ 0 ระบบจะถือว่าจบเกม และต้องเริ่มด่านแรกใหม่ทั้งหมดเพื่อฝึกฝนใหม่</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 font-bold">●</span>
                      <span><span className="text-pink-400 font-semibold">ด่านประยุกต์ด่านที่ 5</span> จะเป็นการนำทั้ง 4 เสาหลักของแนวคิดเชิงคำนวณมาแก้ปัญหาจริงจาก CT TOOLBOX</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => { audioSynth.playSfx('click'); setShowHowToPlay(false); }}
                    className="px-5 py-2 bg-amber-900/40 border border-amber-500 hover:bg-amber-600 hover:text-slate-950 text-amber-300 font-semibold rounded-lg transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    เข้าใจแล้ว
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
