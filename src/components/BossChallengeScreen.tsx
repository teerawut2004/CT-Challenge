import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowLeft, CheckCircle2, Heart, Sparkles, Terminal, ShieldAlert, Layers, Grid, EyeOff, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioSynth } from '../utils/audio';
import { Question, BOSS_SCENARIO } from '../data/questions';
import { localizeQuestion } from '../utils/localization';

interface BossChallengeScreenProps {
  questions: Question[];
  currentQuestionIdx: number;
  hearts: number;
  characterName: string;
  onAnswerSubmit: (isCorrect: boolean, selectedAnswer: any) => void;
  onExit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function BossChallengeScreen({
  questions,
  currentQuestionIdx,
  hearts,
  characterName,
  onAnswerSubmit,
  onExit,
  soundEnabled,
  onToggleSound
}: BossChallengeScreenProps) {
  const rawQuestion = questions[currentQuestionIdx];
  const currentQuestion = localizeQuestion(rawQuestion, characterName);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<{ text: string; originalIdx: number }[]>([]);

  useEffect(() => {
    setSelectedOption(null);
    if (!currentQuestion) return;
    if (currentQuestion.options) {
      const optionsWithIdx = currentQuestion.options.map((opt, idx) => ({ text: opt, originalIdx: idx }));
      const shuffled = [...optionsWithIdx];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledOptions(shuffled);
    }
  }, [currentQuestionIdx, rawQuestion?.id]);

  const handleToggleAudio = () => {
    onToggleSound();
    audioSynth.playSfx('click');
  };

  const handleOptionSelect = (idx: number) => {
    audioSynth.playSfx('click');
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    const selectedOptionObj = shuffledOptions[selectedOption];
    if (!selectedOptionObj) return;
    const isCorrect = selectedOptionObj.originalIdx === currentQuestion.correctAnswer;
    onAnswerSubmit(isCorrect, selectedOptionObj.originalIdx);
  };

  const handleExitClick = () => {
    audioSynth.playSfx('click');
    onExit();
  };

  // Get matching icon for current CT pillar question
  const getPillarIcon = (index: number) => {
    switch (index) {
      case 0: return <Layers size={18} className="text-cyan-400" />;
      case 1: return <Grid size={18} className="text-purple-400" />;
      case 2: return <EyeOff size={18} className="text-pink-400" />;
      case 3: return <Cpu size={18} className="text-amber-400" />;
      default: return <Sparkles size={18} className="text-rose-400" />;
    }
  };

  const getPillarColorBadge = (index: number) => {
    switch (index) {
      case 0: return "bg-cyan-950/60 text-cyan-400 border-cyan-500/20";
      case 1: return "bg-purple-950/60 text-purple-400 border-purple-500/20";
      case 2: return "bg-pink-950/60 text-pink-400 border-pink-500/20";
      case 3: return "bg-amber-950/60 text-amber-400 border-amber-500/20";
      default: return "bg-rose-950/60 text-rose-400 border-rose-500/20";
    }
  };

  const progressPercent = (currentQuestionIdx / questions.length) * 100;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#050811] text-white overflow-hidden font-sans select-none pb-12">
      {/* Top Warning Neon Bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500/20 via-rose-500 to-rose-500/20 shadow-[0_0_12px_#f43f5e] z-30" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Header HUD */}
      <header className="w-full bg-slate-950/95 border-b border-rose-950/80 backdrop-blur-md p-4 sticky top-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.7)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <button
            onClick={handleExitClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-rose-500 hover:bg-rose-950/30 text-rose-400 font-medium rounded-xl transition-all duration-200 cursor-pointer text-xs md:text-sm"
            id="exit-boss-btn"
          >
            <ArrowLeft size={16} />
            กลับไปแผนที่
          </button>

          <div className="flex-1 flex flex-col items-center max-w-sm md:max-w-md">
            <div className="flex justify-between w-full text-[10px] md:text-xs font-mono text-rose-400 mb-1">
              <span className="flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                ด่านประยุกต์แก้ไขปัญหาสุดท้าทาย (Final Arena)
              </span>
              <span>ภารกิจสุดยอดข้อที่ : {currentQuestionIdx + 1}/{questions.length}</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full border border-rose-950 overflow-hidden relative">
              <motion.div
                className="bg-gradient-to-r from-rose-500 to-red-600 h-full shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Battery Cells HUD */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-rose-950/50 px-3 py-1.5 rounded-xl">
              <span className="hidden md:inline-block text-[10px] font-mono text-rose-400 mr-1 uppercase">LIFE CORES</span>
              {[1, 2, 3].map((idx) => {
                const isActive = idx <= hearts;
                return (
                  <div key={idx} className="relative">
                    <Heart
                      size={18}
                      className={`transition-all duration-300 ${
                        isActive
                          ? "text-rose-500 fill-rose-500 drop-shadow-[0_0_5px_#f43f5e]"
                          : "text-slate-800 fill-slate-950"
                      }`}
                    />
                    {!isActive && (
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] text-rose-500/60 font-mono font-bold">×</span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleToggleAudio}
              className="p-2 bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900/80 rounded-xl transition-all duration-200 text-rose-400 cursor-pointer text-xs"
              id="boss-mute-btn"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Side: Persistent Holographic Scenario Briefing */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-950/85 border border-rose-900/40 rounded-2xl p-5 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden flex flex-col h-full">
            {/* Glowing corner highlights */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-rose-500/40" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-rose-500/40" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-rose-500/40" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-rose-500/40" />

            <div className="border-b border-rose-950/60 pb-3.5 mb-4 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-950/50 border border-rose-500/30">
                <Terminal size={18} className="text-rose-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-400 font-mono uppercase tracking-wider">
                  MISSION SCENARIO
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">📡 ข้อมูลสถานการณ์ร่วมด่านที่ 5</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-rose-950/40 leading-relaxed text-sm md:text-base text-slate-200">
                <p className="font-bold text-rose-300 text-base md:text-lg mb-2">
                  🏫 โครงการ: ศูนย์อาหารอัจฉริยะ (Smart Food Center)
                </p>
                <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                  {BOSS_SCENARIO}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/20 border border-slate-900/60 flex items-start gap-2.5">
                <ShieldAlert size={18} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm text-slate-300 space-y-1">
                  <p className="font-bold text-slate-100">คำชี้แจงสำหรับนักเรียน:</p>
                  <p>ให้นักเรียนนำความรู้หลัก 4 ด้านของวิทยาการคำนวณมาแก้ปัญหาจากสถานการณ์เดียวกันนี้ เพื่อก้าวสู่ทำเนียบสุดยอดโปรแกรมเมอร์!</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Question & Options Display */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-5 md:p-6 flex flex-col justify-between h-full shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-md">
            
            <div className="space-y-4">
              {/* Question Pillar Badge Header */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {getPillarIcon(currentQuestionIdx)}
                  </div>
                  <span className={`text-xs font-bold font-mono uppercase px-2.5 py-1 rounded-lg border tracking-wider ${getPillarColorBadge(currentQuestionIdx)}`}>
                    {currentQuestionIdx === 0 ? "Decomposition" :
                     currentQuestionIdx === 1 ? "Pattern Recognition" :
                     currentQuestionIdx === 2 ? "Abstraction" : "Algorithm Design"}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400">
                  QUESTION {currentQuestionIdx + 1} OF 4
                </span>
              </div>

              {/* Question Text */}
              <div className="py-2">
                <h2 className="text-base md:text-lg lg:text-xl font-bold leading-relaxed text-slate-100 whitespace-pre-line">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options Tray */}
              <div className="space-y-3 pt-2" id="toolbox-tray">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`options-grid-${currentQuestionIdx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3.5"
                  >
                    {shuffledOptions.map((optionObj, idx) => {
                      const isSelected = selectedOption === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleOptionSelect(idx)}
                          className={`w-full p-4 md:p-5 rounded-2xl border text-left transition-all duration-200 transform active:scale-[0.99] cursor-pointer flex items-start gap-4 relative overflow-hidden group ${
                            isSelected
                              ? "bg-white border-rose-500 text-slate-950 ring-2 ring-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]"
                              : "bg-slate-900/40 border-slate-800/80 hover:border-rose-500/40 hover:bg-slate-900/60 text-slate-200"
                          }`}
                        >
                          {/* Option Prefix Circle */}
                          <span
                            className={`w-7 h-7 md:w-8 md:h-8 rounded-xl font-mono text-sm md:text-base font-bold flex items-center justify-center shrink-0 border transition-all duration-200 mt-0.5 ${
                              isSelected
                                ? "bg-rose-600 border-rose-500 text-white"
                                : "bg-slate-950 border-slate-800 text-slate-400 group-hover:border-rose-500/30 group-hover:text-rose-400"
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-sm md:text-base lg:text-lg font-bold leading-relaxed">
                            {optionObj.text}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Check/Submit Action Area */}
            <div className="mt-8 border-t border-slate-900 pt-4">
              <button
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className={`w-full py-4 rounded-xl font-bold tracking-wider transition-all duration-300 cursor-pointer transform active:scale-95 text-center flex items-center justify-center gap-2 ${
                  selectedOption === null
                    ? "bg-slate-900 border border-slate-950 text-slate-500 cursor-not-allowed text-xs md:text-sm"
                    : "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_35px_rgba(244,63,94,0.6)] border border-rose-400/20 text-xs md:text-sm"
                }`}
                id="boss-submit-btn"
              >
                ตรวจคำตอบ <CheckCircle2 size={18} />
              </button>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
