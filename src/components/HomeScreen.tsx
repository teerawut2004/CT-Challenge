import React, { useState, useEffect } from 'react';
import { Play, HelpCircle, Volume2, VolumeX, X, Compass, ShieldAlert, Sparkles, User, MapPin, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioSynth } from '../utils/audio';

interface HomeScreenProps {
  onStartAdventure: (travelerName: string, gender: 'female' | 'male') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function HomeScreen({ onStartAdventure, soundEnabled, onToggleSound }: HomeScreenProps) {
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [travelerName, setTravelerName] = useState('');
  const [selectedGender, setSelectedGender] = useState<'female' | 'male' | null>(null);
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    try {
      const savedName = sessionStorage.getItem('ct_traveler_name') || sessionStorage.getItem('ct_student_name');
      const savedGender = sessionStorage.getItem('ct_traveler_gender');
      if (savedName) setTravelerName(savedName);
      if (savedGender === 'female' || savedGender === 'male') {
        setSelectedGender(savedGender);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelerName.trim()) {
      setNameError(true);
      audioSynth.playSfx('wrong');
      return;
    }
    if (!selectedGender) {
      audioSynth.playSfx('wrong');
      return;
    }

    audioSynth.playSfx('click');
    try {
      sessionStorage.setItem('ct_traveler_name', travelerName.trim());
      sessionStorage.setItem('ct_student_name', travelerName.trim());
      sessionStorage.setItem('ct_traveler_gender', selectedGender);
    } catch (err) {
      console.error(err);
    }
    onStartAdventure(travelerName.trim(), selectedGender);
  };

  const handleToggleAudio = () => {
    onToggleSound();
    audioSynth.playSfx('click');
  };

  const openRules = () => {
    audioSynth.playSfx('click');
    setShowRulesModal(true);
  };

  const closeRules = () => {
    audioSynth.playSfx('click');
    setShowRulesModal(false);
  };

  const isReady = travelerName.trim().length > 0 && selectedGender !== null;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-radial from-slate-900 via-[#0B0F19] to-[#04060b] text-white overflow-hidden font-sans px-4 select-none py-4">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />
      
      {/* Ambient glowing spots */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar with Sound Toggle and Rules Button */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10 pt-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-cyan-950/60 border border-cyan-800/60 rounded-lg text-cyan-400 font-mono text-xs tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Compass size={14} className="animate-spin text-cyan-400" /> ม.2 วิทยาการคำนวณ
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openRules}
            className="px-3.5 py-2 bg-slate-900/80 border border-cyan-500/40 hover:border-cyan-400 hover:bg-slate-800/90 rounded-xl transition-all duration-300 text-cyan-300 hover:text-cyan-200 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-2 text-xs md:text-sm font-semibold"
            id="open-rules-btn"
          >
            <HelpCircle size={18} className="text-cyan-400" />
            <span>แนะนำภารกิจและกติกา</span>
          </button>

          <button
            onClick={handleToggleAudio}
            className="p-2.5 bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 rounded-xl transition-all duration-300 text-cyan-400 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            title={soundEnabled ? "ปิดเสียง" : "เปิดเสียง"}
            id="audio-toggle-btn"
          >
            {soundEnabled ? <Volume2 size={20} className="animate-pulse" /> : <VolumeX size={20} />}
          </button>
        </div>
      </div>

      {/* Main Center Area: Title & Profile Creation Form */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full text-center z-10 py-6 my-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-5"
        >
          <div className="absolute -inset-10 bg-radial from-cyan-500/15 to-transparent blur-2xl pointer-events-none" />
          <h1 
            id="app-title"
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-widest bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(6,182,212,0.4)] font-mono uppercase"
          >
            CT Challenge
          </h1>
          <p className="text-xs sm:text-sm font-mono text-cyan-400/90 mt-2 tracking-widest uppercase flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-cyan-400" />
            ภารกิจโค้ดดิ้งท่องเมืองฝึกคิดเชิงคำนวณ
            <Sparkles size={14} className="text-cyan-400" />
          </p>
        </motion.div>

        {/* Traveler Profile Creation Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full max-w-xl bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.6)] text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/80 mb-5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                สร้างโปรไฟล์นักเดินทาง
              </h2>
              <p className="text-xs text-slate-400">กรอกข้อมูลผู้เรียนและเลือกอวตารเพื่อเริ่มการเดินทางตะลุยด่าน</p>
            </div>
          </div>

          <form onSubmit={handleStart} className="space-y-5">
            {/* Input Name */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>ชื่อ - นามสกุล ผู้เรียน</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={travelerName}
                onChange={(e) => {
                  setTravelerName(e.target.value);
                  if (nameError) setNameError(false);
                }}
                placeholder="เช่น ด.ช.สมชาย ใจดี"
                className={`w-full px-4 py-3 rounded-xl bg-slate-950/80 border ${
                  nameError ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                } text-slate-100 placeholder-slate-500 text-sm md:text-base outline-none transition-all duration-200 font-medium`}
                id="traveler-name-input"
              />
              {nameError && (
                <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                  <ShieldAlert size={14} /> กรุณากรอกชื่อ-นามสกุลก่อนเข้าสู่การผจญภัย
                </p>
              )}
            </div>

            {/* Avatar & Gender Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
                <span>เลือกเพศ / อวตารนักเดินทาง</span>
                <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Female Traveler Option */}
                <div
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setSelectedGender('female');
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-center select-none flex flex-col items-center justify-center gap-2 ${
                    selectedGender === 'female'
                      ? 'bg-gradient-to-b from-pink-950/60 to-slate-900 border-pink-400 ring-2 ring-pink-400/60 shadow-[0_0_25px_rgba(244,63,94,0.35)] scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-pink-500/40 hover:bg-slate-900/60 opacity-80 hover:opacity-100'
                  }`}
                  id="avatar-female-btn"
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-3xl sm:text-4xl transition-transform duration-300 ${
                    selectedGender === 'female' ? 'bg-pink-500/20 border-2 border-pink-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-110' : 'bg-slate-900 border border-slate-700'
                  }`}>
                    👧
                  </div>
                  <div>
                    <span className={`text-xs sm:text-sm font-bold block ${selectedGender === 'female' ? 'text-pink-300' : 'text-slate-300'}`}>
                      นักเดินทางหญิง
                    </span>
                    <span className="text-[10px] text-slate-400">พอใจ (Porjai)</span>
                  </div>
                  {selectedGender === 'female' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500 text-slate-950 font-bold">
                      ✓ เลือกแล้ว
                    </span>
                  )}
                </div>

                {/* Male Traveler Option */}
                <div
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setSelectedGender('male');
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-center select-none flex flex-col items-center justify-center gap-2 ${
                    selectedGender === 'male'
                      ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.35)] scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/60 opacity-80 hover:opacity-100'
                  }`}
                  id="avatar-male-btn"
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-3xl sm:text-4xl transition-transform duration-300 ${
                    selectedGender === 'male' ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-110' : 'bg-slate-900 border border-slate-700'
                  }`}>
                    👦
                  </div>
                  <div>
                    <span className={`text-xs sm:text-sm font-bold block ${selectedGender === 'male' ? 'text-cyan-300' : 'text-slate-300'}`}>
                      นักเดินทางชาย
                    </span>
                    <span className="text-[10px] text-slate-400">กวิน (Kawin)</span>
                  </div>
                  {selectedGender === 'male' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-bold">
                      ✓ เลือกแล้ว
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isReady}
                className={`w-full py-4 rounded-2xl font-extrabold text-base md:text-lg tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  isReady
                    ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transform hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                }`}
                id="enter-adventure-btn"
              >
                <span>เข้าสู่การผจญภัย</span>
                <Play size={20} fill="currentColor" />
              </button>
              {!isReady && (
                <p className="text-[11px] text-center text-slate-500 mt-2 font-mono">
                  * กรุณากรอกชื่อและเลือกอวตารให้ครบเพื่อเปิดใช้งานปุ่ม
                </p>
              )}
            </div>
          </form>
        </motion.div>
      </div>

      {/* Footer Info & Developer Credits */}
      <div className="w-full text-center py-2.5 z-10 flex flex-col items-center gap-1 border-t border-slate-800/60 bg-slate-950/40 backdrop-blur-sm mt-4">
        <div className="text-[11px] text-slate-500 font-mono">
          CT Challenge • นวัตกรรมเกมส่งเสริมทักษะการคิดเชิงคำนวณ ชั้น ม.2
        </div>
        <div className="text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
          <span className="font-semibold text-cyan-400">ผู้พัฒนา :</span>
          <span className="text-slate-300 font-medium">นายธีรวุฒ จำปาเรือง สาขาคอมพิวเตอร์ศึกษา</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="text-slate-400">คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น</span>
        </div>
      </div>

      {/* Modal: แนะนำภารกิจและกติกาการเล่น */}
      <AnimatePresence>
        {showRulesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={closeRules}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-[0_0_50px_rgba(6,182,212,0.25)] relative max-h-[90vh] overflow-y-auto text-left"
            >
              {/* Close Button */}
              <button
                onClick={closeRules}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
                id="close-rules-btn"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-3">
                <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-400">
                  <Compass size={24} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-cyan-300">
                    แนะนำภารกิจและกติกาการเล่น
                  </h3>
                  <p className="text-xs text-slate-400">คู่มือนักเดินทางฝึกคิดเชิงคำนวณ CT Challenge</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {/* 1. เป้าหมาย */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5 text-sm sm:text-base">
                    🎯 เป้าหมายการเดินทาง
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>ในแต่ละด่านจะมีภารกิจเป้าหมายที่แตกต่างกันตามระดับความยาก (เช่น 🏛️ พิพิธภัณฑ์, 🏰 ปราสาท, 🗼 หอคอย, 🎡 สวนสนุก และ 💎 เพชรสมบัติ โดยบางด่านอาจต้องเก็บหรือเช็คอินประเภทละ 1–2 แห่ง)</li>
                    <li>เขียนชุดคำสั่งควบคุมตัวละครเพื่อเดินทางไป <strong>เช็คอิน (📍) และเก็บเพชร (💎) ให้ครบตามจำนวนเป้าหมายของด่าน</strong></li>
                    <li>หลบหลีกสิ่งกีดขวางในแผนที่ ได้แก่ <strong className="text-amber-300">หิน (🪨)</strong>, <strong className="text-emerald-300">ต้นไม้ (🌲)</strong>, และ <strong className="text-blue-300">น้ำ (💧)</strong></li>
                    <li>วางแผนเส้นทางอย่างมีประสิทธิภาพและประยุกต์ใช้ <strong className="text-purple-300">บล็อกลูป (🔁)</strong> เพื่อเขียนคำสั่งให้น้อยและสั้นที่สุด เพื่อพิชิตระดับ 3 ดาว!</li>
                    <li>เมื่อเช็คอินและเก็บเพชรครบตามเป้าหมายของด่าน จะผ่านด่านและสามารถเลือกเล่นด่านถัดไปหรือเล่นด่านเดิมซ้ำได้ทันที!</li>
                  </ul>
                </div>

                {/* 2. การควบคุม */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5 text-sm sm:text-base">
                    🎮 การควบคุมและการเขียนคำสั่ง
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="font-bold text-slate-200 block mb-1">ปุ่มทิศทาง:</span>
                      <p className="text-slate-400 text-xs">
                        [⬆️ ขึ้นบน], [⬇️ ลงล่าง], [⬅️ เลี้ยวซ้าย], [➡️ เลี้ยวขวา] เพื่อสั่งให้ตัวละครก้าวเดินไปทีละ 1 ช่อง
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="font-bold text-slate-200 block mb-1">ปุ่มเช็กอิน (📍):</span>
                      <p className="text-slate-400 text-xs">
                        ใช้บันทึกข้อมูลเมื่อตัวละครก้าวไปยืนตรงพิกัดสถานที่ท่องเที่ยวเป้าหมาย
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 sm:col-span-2">
                      <span className="font-bold text-purple-300 block mb-1 flex items-center gap-1">
                        <Repeat size={14} /> บล็อกลูป (🔁 เพิ่มลูป):
                      </span>
                      <p className="text-slate-400 text-xs">
                        ระบุจำนวนรอบที่ต้องการทำซ้ำ แล้วกดปุ่มลูป จากนั้นคำสั่งทิศทางถัดไปจะถูกทำซ้ำตามจำนวนรอบที่ระบุอัตโนมัติ ช่วยลดจำนวนบรรทัดคำสั่งได้มหาศาล!
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. เกณฑ์คะแนนแลนด์มาร์ก */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5 text-sm sm:text-base">
                    ⭐ เกณฑ์คะแนนแลนด์มาร์กและเพชรสมบัติ
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 text-center">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-amber-500/30">
                      <span className="text-2xl block mb-1">🏛️</span>
                      <span className="font-bold text-slate-200 text-xs block">พิพิธภัณฑ์</span>
                      <span className="text-amber-400 font-mono font-bold text-xs">+15 แต้ม</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-violet-500/30">
                      <span className="text-2xl block mb-1">🏰</span>
                      <span className="font-bold text-slate-200 text-xs block">ปราสาท</span>
                      <span className="text-purple-400 font-mono font-bold text-xs">+20 แต้ม</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-cyan-500/30">
                      <span className="text-2xl block mb-1">🗼</span>
                      <span className="font-bold text-slate-200 text-xs block">หอคอย</span>
                      <span className="text-cyan-400 font-mono font-bold text-xs">+25 แต้ม</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-rose-500/30">
                      <span className="text-2xl block mb-1">🎡</span>
                      <span className="font-bold text-slate-200 text-xs block">สวนสนุก</span>
                      <span className="text-rose-400 font-mono font-bold text-xs">+30 แต้ม</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-sky-400/40 col-span-2 sm:col-span-1">
                      <span className="text-2xl block mb-1">💎</span>
                      <span className="font-bold text-slate-200 text-xs block">เพชรสมบัติ</span>
                      <span className="text-sky-400 font-mono font-bold text-xs">+40 แต้ม</span>
                    </div>
                  </div>
                </div>

                {/* 4. ข้อพึงระวัง */}
                <div className="p-3.5 bg-rose-950/20 rounded-xl border border-rose-900/40 text-rose-200">
                  <h4 className="font-bold text-rose-400 mb-1 flex items-center gap-1.5 text-sm sm:text-base">
                    ⚠️ ข้อพึงระวัง (Caution)
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                    <li><strong>พลังชีวิต (❤️ 3 ดวง):</strong> ในหน้าภารกิจการเดินทางจะมีหัวใจพลังชีวิต 3 ดวง หากเดินชนสิ่งกีดขวาง (หิน/ต้นไม้/น้ำ) การเดินทางจะหยุดชะงักและ <strong>สูญเสียหัวใจทีละ 1 ดวง</strong></li>
                    <li><strong>ห้ามเดินหลุดออกนอกขอบเขตกระดาน 5x5</strong> การเดินทางจะหยุดชะงักทันที</li>
                    <li><strong>ต้องยืนตรงพิกัดแลนด์มาร์ก</strong> ให้ถูกต้องก่อนสั่งการบล็อก [📍 เช็คอิน] มิฉะนั้นระบบจะแจ้งเตือนข้อผิดพลาด</li>
                  </ul>
                </div>
              </div>

              {/* Close Action Button */}
              <div className="mt-5 text-center">
                <button
                  onClick={closeRules}
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] text-sm"
                >
                  เข้าใจแล้ว พร้อมลุย!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
