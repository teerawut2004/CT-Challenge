import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowLeft, CheckCircle2, Heart, Pickaxe, Radar, Cpu, FileCode } from 'lucide-react';
import { motion } from 'motion/react';
import { audioSynth } from '../utils/audio';
import { Question } from '../data/questions';
import { localizeQuestion } from '../utils/localization';

interface BossChallengeScreenProps {
  questions: Question[];
  currentQuestionIdx: number;
  hearts: number;
  characterName: string;
  onAnswerSubmit: (isCorrect: boolean, selectedAnswer: string) => void;
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

  const renderHighlightedText = (text: string) => {
    if (!text) return null;
    const parts = text.split("'");
    if (parts.length === 1) {
      return <span>{text}</span>;
    }
    const highlightClass = "text-rose-300 bg-rose-950/60 font-bold px-1.5 py-0.5 mx-0.5 rounded border border-rose-500/30 inline-block shadow-[0_0_8px_rgba(244,63,94,0.2)]";
    return (
      <span>
        {parts.map((part, index) => {
          if (index % 2 !== 0) {
            return (
              <span key={index} className={highlightClass}>
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTool(null);
  }, [currentQuestionIdx]);

  const handleToggleAudio = () => {
    onToggleSound();
    audioSynth.playSfx('click');
  };

  const handleToolSelect = (toolName: string) => {
    audioSynth.playSfx('click');
    setSelectedTool(toolName);
  };

  const handleSubmit = () => {
    if (selectedTool === null) return;
    
    // Map of question ID to the correct computational thinking pillar name(s)
    const idToCorrectTool: Record<string, string | string[]> = {
      'b1': 'Decomposition',
      'b2': 'Pattern Recognition',
      'b3': 'Abstraction',
      'b4': 'Algorithm',
      'b5': ['Decomposition', 'Pattern Recognition', 'Abstraction', 'Algorithm'] // b5 integrates all 4 pillars
    };

    const correct = idToCorrectTool[currentQuestion.id];
    let isCorrect = false;

    if (correct !== undefined) {
      if (Array.isArray(correct)) {
        isCorrect = correct.includes(selectedTool);
      } else {
        isCorrect = correct === selectedTool;
      }
    } else {
      // Graceful fallback for any other custom questions
      const correctStr = String(currentQuestion.correctAnswer || "");
      isCorrect = correctStr.includes(selectedTool);
    }

    onAnswerSubmit(isCorrect, selectedTool);
  };

  const handleExitClick = () => {
    audioSynth.playSfx('click');
    onExit();
  };

  // Define the 4 pillars toolbox config
  const toolboxItems = [
    {
      id: 'Decomposition',
      name: 'Decomposition',
      thaiName: 'การแบ่งปัญหาใหญ่เป็นปัญหาย่อย',
      icon: Pickaxe,
      color: 'bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50',
      activeColor: 'bg-white border-cyan-500 text-cyan-950 ring-2 ring-cyan-500/45 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
    },
    {
      id: 'Pattern Recognition',
      name: 'Pattern Recognition',
      thaiName: 'การพิจารณารูปแบบ',
      icon: Radar,
      color: 'bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50',
      activeColor: 'bg-white border-purple-500 text-purple-950 ring-2 ring-purple-500/45 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
    },
    {
      id: 'Abstraction',
      name: 'Abstraction',
      thaiName: 'การคิดเชิงนามธรรม',
      icon: Cpu,
      color: 'bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50',
      activeColor: 'bg-white border-rose-500 text-rose-950 ring-2 ring-rose-500/45 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
    },
    {
      id: 'Algorithm',
      name: 'Algorithm',
      thaiName: 'การออกแบบอัลกอริทึม',
      icon: FileCode,
      color: 'bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50',
      activeColor: 'bg-white border-amber-500 text-amber-950 ring-2 ring-amber-500/45 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
    }
  ];

  const progressPercent = ((currentQuestionIdx) / questions.length) * 100;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#050811] text-white overflow-hidden font-sans select-none pb-12">
      {/* Glow alert warning neon lines */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500/20 via-rose-500 to-rose-500/20 shadow-[0_0_10px_#f43f5e]" />
      
      {/* Background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.01)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Header HUD */}
      <header className="w-full bg-slate-950/90 border-b border-rose-950/80 backdrop-blur-md p-4 sticky top-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
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
              <span className="flex items-center gap-1">
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

      {/* Main Layout */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 flex flex-col gap-5 relative z-10 mt-4">
        
        {/* Simple elegant inline question description */}
        <div className="mb-2 px-1">
          <p className="text-slate-200 text-sm md:text-base font-semibold leading-relaxed whitespace-pre-line">
            {renderHighlightedText(currentQuestion.question)}
          </p>
        </div>

        {/* The 4 pillars Toolbox Panel */}
        <div className="w-full flex flex-col gap-4">
          <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-4 flex-1 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div>
              <div className="border-b border-slate-900 pb-3 mb-4 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-300 font-mono tracking-wider uppercase flex items-center gap-2">
                  <Pickaxe size={16} className="text-amber-500" />
                  CT TOOLBOX (เลือกทักษะที่นำมาใช้)
                </h4>
                <span className="text-[9px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-500">CT-TOOLS</span>
              </div>

              {/* Toolbox Tray */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3" id="toolbox-tray">
                {toolboxItems.map((tool) => {
                  const isSelected = selectedTool === tool.id;
                  const IconComp = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all duration-300 transform active:scale-98 cursor-pointer flex items-center gap-3 relative overflow-hidden group ${
                        isSelected
                          ? tool.activeColor
                          : tool.color
                      }`}
                    >
                      <div className={`p-2 rounded-lg border ${
                        isSelected
                          ? 'bg-slate-900 border-slate-950 text-white'
                          : 'bg-slate-50 border-slate-100 text-slate-500'
                      }`}>
                        <IconComp size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold font-mono tracking-wide uppercase ${
                          isSelected ? 'text-slate-950' : 'text-slate-800'
                        }`}>
                          {tool.name}
                        </span>
                        <span className={`text-[10px] mt-0.5 font-medium ${
                          isSelected ? 'text-slate-700' : 'text-slate-500'
                        }`}>
                          {tool.thaiName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Action within Toolbox sidebar */}
            <div className="mt-6 border-t border-slate-900 pt-4">
              <button
                onClick={handleSubmit}
                disabled={selectedTool === null}
                className={`w-full py-4 rounded-xl font-bold tracking-wider transition-all duration-300 cursor-pointer transform active:scale-95 text-center flex items-center justify-center gap-2 ${
                  selectedTool === null
                    ? "bg-slate-900 border border-slate-950 text-slate-500 cursor-not-allowed"
                    : "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_35px_rgba(244,63,94,0.6)] border border-rose-400/20"
                }`}
                id="boss-submit-btn"
              >
                ตรวจคำตอบ <CheckCircle2 size={18} />
              </button>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
