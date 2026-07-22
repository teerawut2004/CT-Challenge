import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowLeft, Heart, Sparkles, CheckCircle2, ChevronUp, ChevronDown, Inbox, GripVertical, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioSynth } from '../utils/audio';
import { Question } from '../data/questions';
import { localizeQuestion } from '../utils/localization';

interface GameplayScreenProps {
  levelId: number;
  levelName: string;
  thaiLevelName: string;
  questions: Question[];
  currentQuestionIdx: number;
  hearts: number;
  characterName: string;
  onAnswerSubmit: (isCorrect: boolean, selectedAnswer: any) => void;
  onExit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function GameplayScreen({
  levelId,
  levelName,
  thaiLevelName,
  questions,
  currentQuestionIdx,
  hearts,
  characterName,
  onAnswerSubmit,
  onExit,
  soundEnabled,
  onToggleSound
}: GameplayScreenProps) {
  const rawQuestion = questions[currentQuestionIdx];
  const currentQuestion = localizeQuestion(rawQuestion, characterName);

  const getHighlightClass = (levelId: number) => {
    switch (levelId) {
      case 1:
        return "text-cyan-300 bg-cyan-950/60 font-bold px-1.5 py-0.5 mx-0.5 rounded border border-cyan-500/30 inline-block shadow-[0_0_8px_rgba(6,182,212,0.2)]";
      case 2:
        return "text-purple-300 bg-purple-950/60 font-bold px-1.5 py-0.5 mx-0.5 rounded border border-purple-500/30 inline-block shadow-[0_0_8px_rgba(168,85,247,0.2)]";
      case 3:
        return "text-pink-300 bg-pink-950/60 font-bold px-1.5 py-0.5 mx-0.5 rounded border border-pink-500/30 inline-block shadow-[0_0_8px_rgba(236,72,153,0.2)]";
      case 4:
        return "text-amber-300 bg-amber-950/60 font-bold px-1.5 py-0.5 mx-0.5 rounded border border-amber-500/30 inline-block shadow-[0_0_8px_rgba(245,158,11,0.2)]";
      default:
        return "text-rose-300 bg-rose-950/60 font-bold px-1.5 py-0.5 mx-0.5 rounded border border-rose-500/30 inline-block shadow-[0_0_8px_rgba(244,63,94,0.2)]";
    }
  };

  const renderHighlightedText = (text: string) => {
    if (!text) return null;
    const parts = text.split("'");
    if (parts.length === 1) {
      return <span>{text}</span>;
    }
    const highlightClass = getHighlightClass(levelId);
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

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sequenceOrder, setSequenceOrder] = useState<number[]>([]);

  // Interactive Question States
  const [shuffledOptions, setShuffledOptions] = useState<{ text: string; originalIdx: number }[]>([]);
  const [selectedLeftIdx, setSelectedLeftIdx] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<{ leftIdx: number; rightIdx: number }[]>([]);
  const [categoryAssignments, setCategoryAssignments] = useState<{ [itemIdx: number]: number }>({});
  const [selectedItemIdx, setSelectedItemIdx] = useState<number | null>(null);
  const [draggedOverBoxIdx, setDraggedOverBoxIdx] = useState<number | null>(null);

  // Sequence Drag & Drop and Touch-Swap States
  const [draggedSeqIdx, setDraggedSeqIdx] = useState<number | null>(null);
  const [selectedSeqIdx, setSelectedSeqIdx] = useState<number | null>(null);

  // Reset states when question changes
  useEffect(() => {
    setSelectedOption(null);
    setSelectedLeftIdx(null);
    setMatchedPairs([]);
    setCategoryAssignments({});
    setSelectedItemIdx(null);
    setDraggedOverBoxIdx(null);
    setSelectedSeqIdx(null);
    setDraggedSeqIdx(null);

    if (!currentQuestion) return;

    if (currentQuestion.type === 'multiple-choice') {
      if (currentQuestion.options) {
        const optionsWithIdx = currentQuestion.options.map((opt, idx) => ({ text: opt, originalIdx: idx }));
        // Shuffle the options to distribute correct choices across all positions (scattered)
        const shuffled = [...optionsWithIdx];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setShuffledOptions(shuffled);
      }
    } 
    else if (currentQuestion.type === 'sequence') {
      if (currentQuestion.items) {
        const initialIndices = currentQuestion.items.map((_, idx) => idx);
        // Fisher-Yates shuffle to scramble
        let scrambled = [...initialIndices];
        let attempts = 0;
        const doShuffle = (arr: number[]) => {
          let temp = [...arr];
          for (let i = temp.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [temp[i], temp[j]] = [temp[j], temp[i]];
          }
          return temp;
        };
        // Scramble and guarantee it's not identical to the correct answer initially
        while (attempts < 10 && (scrambled.length <= 1 || JSON.stringify(scrambled) === JSON.stringify(currentQuestion.correctAnswer))) {
          scrambled = doShuffle(scrambled);
          attempts++;
        }
        setSequenceOrder(scrambled);
      }
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

  const handleLeftClick = (lIdx: number) => {
    audioSynth.playSfx('click');
    setSelectedLeftIdx(lIdx);
  };

  const handleRightClick = (rIdx: number) => {
    if (selectedLeftIdx === null) return;
    audioSynth.playSfx('click');
    
    // Remove any existing pair with the same leftIdx or rightIdx (1-to-1 matching rule)
    const filtered = matchedPairs.filter(p => p.leftIdx !== selectedLeftIdx && p.rightIdx !== rIdx);
    
    // Connect them
    setMatchedPairs([...filtered, { leftIdx: selectedLeftIdx, rightIdx: rIdx }]);
    setSelectedLeftIdx(null); // Clear selection
  };

  const clearMatch = (lIdx: number) => {
    audioSynth.playSfx('click');
    setMatchedPairs(matchedPairs.filter(p => p.leftIdx !== lIdx));
  };

  const handleAssign = (itemIdx: number, boxIdx: number) => {
    audioSynth.playSfx('click');
    setCategoryAssignments(prev => ({ ...prev, [itemIdx]: boxIdx }));
    if (selectedItemIdx === itemIdx) {
      setSelectedItemIdx(null);
    }
  };

  const handleRemove = (itemIdx: number) => {
    audioSynth.playSfx('click');
    setCategoryAssignments(prev => {
      const updated = { ...prev };
      delete updated[itemIdx];
      return updated;
    });
    if (selectedItemIdx === itemIdx) {
      setSelectedItemIdx(null);
    }
  };

  const handleMatchClick = (lIdx: number, rIdx: number) => {
    audioSynth.playSfx('click');
    // Strict 1-to-1 matching: remove any existing pairs that have this left item or this right option
    const filtered = matchedPairs.filter(p => p.leftIdx !== lIdx && p.rightIdx !== rIdx);
    setMatchedPairs([...filtered, { leftIdx: lIdx, rightIdx: rIdx }]);
  };

  // Drag and drop / Touch-swap handlers for Sequence Questions
  const handleSeqDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedSeqIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSeqDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedSeqIdx === null || draggedSeqIdx === idx) return;

    const newOrder = [...sequenceOrder];
    const draggedItem = newOrder[draggedSeqIdx];
    newOrder.splice(draggedSeqIdx, 1);
    newOrder.splice(idx, 0, draggedItem);

    setDraggedSeqIdx(idx);
    setSequenceOrder(newOrder);
  };

  const handleSeqDragEnd = () => {
    setDraggedSeqIdx(null);
  };

  const handleSeqDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDraggedSeqIdx(null);
    audioSynth.playSfx('click');
  };

  const handleSeqClickSelect = (idx: number) => {
    audioSynth.playSfx('click');
    if (selectedSeqIdx === null) {
      setSelectedSeqIdx(idx);
    } else {
      if (selectedSeqIdx === idx) {
        setSelectedSeqIdx(null);
      } else {
        // Swap positions
        const newOrder = [...sequenceOrder];
        const temp = newOrder[selectedSeqIdx];
        newOrder[selectedSeqIdx] = newOrder[idx];
        newOrder[idx] = temp;
        setSequenceOrder(newOrder);
        setSelectedSeqIdx(null);
      }
    }
  };

  const handleSubmit = () => {
    if (currentQuestion.type === 'multiple-choice') {
      if (selectedOption === null) return;
      const selectedOptionObj = shuffledOptions[selectedOption];
      if (!selectedOptionObj) return;
      const isCorrect = selectedOptionObj.originalIdx === currentQuestion.correctAnswer;
      onAnswerSubmit(isCorrect, selectedOptionObj.originalIdx);
    } 
    else if (currentQuestion.type === 'sequence') {
      const correctArr = currentQuestion.correctAnswer as number[];
      const isCorrect = JSON.stringify(sequenceOrder) === JSON.stringify(correctArr);
      onAnswerSubmit(isCorrect, sequenceOrder);
    }
    else if (currentQuestion.type === 'matching') {
      const correctArr = currentQuestion.correctAnswer as number[];
      const isCorrect = correctArr.every((targetRightIdx, leftIdx) => {
        const pair = matchedPairs.find(p => p.leftIdx === leftIdx);
        return pair && pair.rightIdx === targetRightIdx;
      }) && matchedPairs.length === correctArr.length;
      onAnswerSubmit(isCorrect, matchedPairs);
    }
    else if (currentQuestion.type === 'categorize') {
      const correctArr = currentQuestion.correctAnswer as number[];
      const totalItems = currentQuestion.categorizeItems?.length || 0;
      let isCorrect = true;
      for (let i = 0; i < totalItems; i++) {
        if (categoryAssignments[i] !== correctArr[i]) {
          isCorrect = false;
          break;
        }
      }
      onAnswerSubmit(isCorrect, categoryAssignments);
    }
  };

  const handleExitClick = () => {
    audioSynth.playSfx('click');
    onExit();
  };

  const progressPercent = ((currentQuestionIdx) / questions.length) * 100;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0B0F19] text-white overflow-hidden font-sans select-none pb-12">
      {/* HUD Gridlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Top Bar Status HUD */}
      <header className="w-full bg-slate-950/80 border-b border-slate-900 backdrop-blur-md p-4 sticky top-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          
          {/* Back/Exit Button */}
          <button
            onClick={handleExitClick}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-slate-400 hover:text-cyan-400 font-medium rounded-xl transition-all duration-200 cursor-pointer text-xs md:text-sm"
            id="exit-gameplay-btn"
          >
            <ArrowLeft size={16} />
            กลับไปหน้าแผนที่
          </button>

          {/* Level Progress */}
          <div className="flex-1 flex flex-col items-center max-w-sm md:max-w-md">
            <div className="flex justify-between w-full text-[10px] md:text-xs font-mono text-cyan-400 mb-1">
              <span>ด่านที่ {levelId} {thaiLevelName}</span>
              <span>ภารกิจ : {currentQuestionIdx + 1}/{questions.length}</span>
            </div>
            {/* Custom Progress Bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-900 overflow-hidden relative">
              <motion.div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* HUD Status: Hearts and Mute */}
          <div className="flex items-center gap-4">
            {/* Battery Cells (Hearts HUD) */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-900 px-3 py-1.5 rounded-xl shadow-inner">
              <span className="hidden md:inline-block text-[10px] font-mono text-rose-400 mr-1">LIFE</span>
              {[1, 2, 3].map((heartIdx) => {
                const isActive = heartIdx <= hearts;
                return (
                  <div key={heartIdx} className="relative">
                    <Heart
                      size={18}
                      className={`transition-all duration-300 ${
                        isActive
                          ? "text-rose-500 fill-rose-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)] animate-pulse"
                          : "text-slate-700 fill-slate-950/60"
                      }`}
                    />
                    {!isActive && (
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] text-rose-500/60 font-mono font-bold">×</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mute toggle button */}
            <button
              onClick={handleToggleAudio}
              className="p-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 rounded-xl transition-all duration-200 text-cyan-400 cursor-pointer text-xs"
              id="gameplay-mute-btn"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6 relative z-10 mt-2">
        
        {/* Simple elegant inline question description */}
        <div className="mb-3 px-1">
          <p className="text-slate-100 text-base md:text-lg lg:text-xl font-bold leading-relaxed">
            {renderHighlightedText(currentQuestion.question)}
          </p>
        </div>

        {/* Interaction Area (Multiple Choice, Sequencing, Matching, or Categorizing) */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {/* MULTIPLE CHOICE LAYOUT */}
            {currentQuestion.type === 'multiple-choice' && (
              <motion.div
                key="mc-layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 gap-3.5"
              >
                {shuffledOptions.map((optionObj, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      className={`w-full p-4 md:p-5 rounded-2xl border text-left transition-all duration-200 transform active:scale-[0.99] cursor-pointer flex items-center gap-4 relative overflow-hidden ${
                        isSelected
                          ? "bg-white border-cyan-500 text-slate-950 ring-2 ring-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      {/* Left Badge number */}
                      <span
                        className={`w-7 h-7 md:w-8 md:h-8 rounded-xl font-mono text-sm md:text-base font-bold flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? "bg-cyan-600 border-cyan-500 text-white"
                            : "bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-base md:text-lg lg:text-xl font-bold leading-snug">{optionObj.text}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* SEQUENCE / ORDERING LAYOUT */}
            {currentQuestion.type === 'sequence' && (
              <motion.div
                key="sequence-layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-3.5"
              >
                <div className="text-xs md:text-sm text-amber-300 font-sans mb-1.5 uppercase tracking-wide flex flex-col sm:flex-row sm:items-center gap-2 bg-amber-950/50 p-3 rounded-xl border border-amber-900/40">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Sparkles size={16} className="text-amber-400 animate-pulse" />
                    <span className="font-extrabold">วิธีตอบ :</span>
                  </div>
                  <span className="font-medium">ลากสลับตำแหน่งเพื่อจัดเรียงลำดับจากบนลงล่าง หรือ แตะเพื่อเลือกแล้วแตะอีกกล่องเพื่อสลับตำแหน่งกัน</span>
                </div>

                <div className="space-y-3">
                  {sequenceOrder.map((itemIdx, seqIdx) => {
                    const itemText = currentQuestion.items ? currentQuestion.items[itemIdx] : '';
                    const isDragged = draggedSeqIdx === seqIdx;
                    const isSelected = selectedSeqIdx === seqIdx;
                    return (
                      <div
                        key={itemIdx}
                        draggable
                        onDragStart={(e) => handleSeqDragStart(e, seqIdx)}
                        onDragOver={(e) => handleSeqDragOver(e, seqIdx)}
                        onDragEnd={handleSeqDragEnd}
                        onDrop={(e) => handleSeqDrop(e, seqIdx)}
                        onClick={() => handleSeqClickSelect(seqIdx)}
                        className={`bg-white border p-4 md:p-5 rounded-2xl flex items-center justify-between gap-4 transition-all duration-200 cursor-grab active:cursor-grabbing select-none relative group ${
                          isDragged
                            ? "opacity-30 scale-[0.98] border-amber-400"
                            : isSelected
                            ? "border-amber-500 ring-2 ring-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)] bg-amber-50/20"
                            : "border-slate-200 hover:border-amber-400/60 hover:bg-slate-50/30 shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 flex-1">
                          {/* Grip Handle */}
                          <div className={`text-slate-400 group-hover:text-amber-500 transition-colors shrink-0 ${isSelected ? "text-amber-500 animate-pulse" : ""}`}>
                            <GripVertical size={20} />
                          </div>
                          
                          {/* Rank indicator badge */}
                          <span className={`w-8 h-8 md:w-9 md:h-9 rounded-xl font-mono text-sm md:text-base font-extrabold flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                            isSelected
                              ? "bg-amber-500 border border-amber-600 text-white"
                              : "bg-amber-100 border border-amber-300 text-amber-900"
                          }`}>
                            0{seqIdx + 1}
                          </span>
                          
                          <p className="text-sm md:text-base lg:text-lg text-slate-950 font-bold leading-normal flex-1">{itemText}</p>
                        </div>

                        {/* Interactive status / help tip */}
                        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 font-mono">
                          {isSelected ? (
                            <span className="text-amber-600 animate-pulse font-bold">กำลังเลือก... แตะอีกช่องเพื่อสลับ</span>
                          ) : (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">ลากหรือแตะสลับ</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* MATCHING LAYOUT (TACTILE CARD CONNECTORS) */}
            {currentQuestion.type === 'matching' && (
              <motion.div
                key="matching-layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="text-xs md:text-sm text-cyan-300 font-sans uppercase tracking-wide flex items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <Sparkles size={16} className="text-cyan-400 animate-pulse shrink-0" />
                  <span className="font-medium">วิธีตอบ : แตะหัวข้อกล่องฝั่งซ้ายให้ขึ้นขอบสีฟ้ากระพริบ แล้วแตะกล่องคำตอบฝั่งขวาเพื่อจับคู่เข้าด้วยกัน</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  {/* Left Column: Source Items */}
                  <div className="space-y-3">
                    <div className="text-xs md:text-sm font-bold text-slate-300 text-center py-2.5 bg-slate-900 rounded-xl font-sans border border-slate-800">
                      1. เลือกหัวข้อ (ฝั่งซ้าย)
                    </div>
                    {currentQuestion.matchingLeft?.map((leftItem, lIdx) => {
                      const currentPair = matchedPairs.find(p => p.leftIdx === lIdx);
                      const isSelected = selectedLeftIdx === lIdx;
                      
                      // Define matching colors per index (light theme / dark text)
                      const colorClasses = [
                        "border-cyan-300 bg-cyan-50/75 text-cyan-950",
                        "border-pink-300 bg-pink-50/75 text-pink-950",
                        "border-amber-300 bg-amber-50/75 text-amber-950",
                        "border-purple-300 bg-purple-50/75 text-purple-950"
                      ];
                      
                      const matchedColor = currentPair !== undefined ? colorClasses[lIdx % colorClasses.length] : "";

                      return (
                        <div
                          key={lIdx}
                          onClick={() => handleLeftClick(lIdx)}
                          className={`p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2.5 cursor-pointer select-none ${
                            isSelected
                              ? "bg-white border-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.01] ring-2 ring-cyan-500/40"
                              : currentPair !== undefined
                              ? `${matchedColor} opacity-95`
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center font-mono shrink-0 mt-0.5 border ${
                              isSelected
                                ? "bg-cyan-600 border-cyan-500 text-white"
                                : currentPair !== undefined
                                ? "bg-white border-slate-300 text-slate-800"
                                : "bg-slate-100 border-slate-200 text-slate-600"
                            }`}>
                              {lIdx + 1}
                            </span>
                            <span className="text-sm md:text-base lg:text-lg font-bold leading-relaxed">{leftItem}</span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                            {isSelected ? (
                              <span className="text-[10px] font-mono text-cyan-600 animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                                แตะคำตอบฝั่งขวาเพื่อจับคู่...
                              </span>
                            ) : currentPair !== undefined ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-600">
                                ✓ เชื่อมโยงแล้ว (คู่ที่ {lIdx + 1})
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400">
                                ยังไม่ได้เลือกจับคู่
                              </span>
                            )}

                            {currentPair !== undefined && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearMatch(lIdx);
                                }}
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-100 bg-rose-50 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                ลบการเชื่อมโยง
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Dest Items */}
                  <div className="space-y-3">
                    <div className="text-xs md:text-sm font-bold text-slate-300 text-center py-2.5 bg-slate-900 rounded-xl font-sans border border-slate-800">
                      2. แตะเลือกคำตอบเข้าคู่ (ฝั่งขวา)
                    </div>
                    {currentQuestion.matchingRight?.map((rightItem, rIdx) => {
                      const associatedPair = matchedPairs.find(p => p.rightIdx === rIdx);
                      const isMatched = associatedPair !== undefined;
                      
                      const colorClasses = [
                        "border-cyan-300 bg-cyan-50/75 text-cyan-950",
                        "border-pink-300 bg-pink-50/75 text-pink-950",
                        "border-amber-300 bg-amber-50/75 text-amber-950",
                        "border-purple-300 bg-purple-50/75 text-purple-950"
                      ];
                      
                      const matchedColor = isMatched ? colorClasses[associatedPair.leftIdx % colorClasses.length] : "";

                      return (
                        <div
                          key={rIdx}
                          onClick={() => {
                            if (selectedLeftIdx !== null) {
                              handleRightClick(rIdx);
                            } else if (!isMatched) {
                              audioSynth.playSfx('click');
                            }
                          }}
                          className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 select-none ${
                            isMatched
                              ? `${matchedColor} opacity-95`
                              : selectedLeftIdx !== null
                              ? "bg-white border-cyan-400 hover:border-cyan-500 hover:bg-cyan-50/20 cursor-pointer animate-pulse text-slate-800"
                              : "bg-slate-50/80 border-slate-200 text-slate-400 opacity-70 cursor-not-allowed"
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center font-mono shrink-0 mt-0.5 border ${
                            isMatched
                              ? "bg-white border-slate-300 text-slate-800"
                              : "bg-slate-100 border-slate-200 text-slate-500"
                          }`}>
                            {isMatched ? String.fromCharCode(65 + rIdx) : "?"}
                          </span>
                          <div className="flex-1">
                            <span className={`text-sm md:text-base lg:text-lg font-bold leading-relaxed block ${
                              isMatched ? 'text-inherit' : 'text-slate-800'
                            }`}>
                              {rightItem}
                            </span>
                            {isMatched && (
                              <span className="text-[10px] md:text-xs font-bold block mt-1 uppercase tracking-wide opacity-80">
                                เข้าคู่กับหัวข้อที่ {associatedPair.leftIdx + 1}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* CATEGORIZE LAYOUT */}
            {currentQuestion.type === 'categorize' && (
              <motion.div
                key="categorize-layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-5"
              >
                <div className="text-xs md:text-sm text-amber-300 font-sans uppercase tracking-wide flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400 animate-pulse shrink-0" />
                    <span className="font-medium">วิธีเล่น : ลากการ์ดข้อความไปวางในกล่อง หรือแตะการ์ดข้อความแล้วแตะเลือกกล่องเป้าหมาย!</span>
                  </div>
                  <span className="text-xs text-slate-400 font-normal shrink-0">
                    (รองรับการลากวางและกดแตะบนมือถือ)
                  </span>
                </div>

                {/* 1. Item Pool (Cards waiting to be classified) */}
                <div className="bg-slate-950/20 border border-slate-900/60 p-4 rounded-2xl">
                  <span className="text-xs font-mono text-slate-300 uppercase tracking-widest block mb-2 font-bold">
                    📋 รายการข้อความที่ต้องจัดหมวดหมู่ ({
                      currentQuestion.categorizeItems?.filter((_, idx) => categoryAssignments[idx] === undefined).length || 0
                    } ข้อความที่เหลือ)
                  </span>

                  <div className="flex flex-wrap gap-3 min-h-[80px] items-center justify-center p-3 rounded-xl bg-slate-950/60 border border-dashed border-slate-900">
                    {/* Unassigned Items */}
                    {(() => {
                      const unassigned = currentQuestion.categorizeItems
                        ?.map((item, idx) => ({ ...item, originalIdx: idx }))
                        .filter(item => categoryAssignments[item.originalIdx] === undefined) || [];

                      if (unassigned.length === 0) {
                        return (
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center py-4 text-emerald-400 text-sm md:text-base font-bold flex items-center gap-2"
                          >
                            🎉 จัดกลุ่มครบถ้วนแล้ว! กรุณาตรวจความถูกต้องในแต่ละกล่อง และกดปุ่ม "ตรวจคำตอบ" ด้านล่าง
                          </motion.div>
                        );
                      }

                      return unassigned.map((item) => {
                        const isSelected = selectedItemIdx === item.originalIdx;
                        return (
                          <motion.div
                            key={item.originalIdx}
                            layout
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", item.originalIdx.toString());
                              setSelectedItemIdx(item.originalIdx);
                            }}
                            onDragEnd={() => setSelectedItemIdx(null)}
                            onClick={() => {
                              audioSynth.playSfx('click');
                              setSelectedItemIdx(selectedItemIdx === item.originalIdx ? null : item.originalIdx);
                            }}
                            className={`p-3.5 rounded-xl border text-sm md:text-base lg:text-lg font-bold cursor-grab active:cursor-grabbing select-none transition-all duration-200 flex items-center gap-2.5 max-w-full sm:max-w-md ${
                              isSelected
                                ? "bg-white border-amber-500 text-amber-950 ring-2 ring-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)] scale-[1.03]"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 shadow-sm"
                            }`}
                            whileHover={{ scale: isSelected ? 1.03 : 1.01 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <GripVertical size={16} className="text-slate-400 shrink-0 cursor-grab" />
                            <span>{item.text}</span>
                          </motion.div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* 2. Destination Classification Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-1">
                  {[0, 1].map((boxIdx) => {
                    const boxName = currentQuestion.categories?.[boxIdx] || `กล่องที่ ${boxIdx + 1}`;
                    const isDraggedOver = draggedOverBoxIdx === boxIdx;
                    const canDropHere = selectedItemIdx !== null;
                    const isHighlight = isDraggedOver || (canDropHere && draggedOverBoxIdx === boxIdx);

                    // Color themes per box index
                    const isBox0 = boxIdx === 0;
                    const borderActiveColor = isBox0 
                      ? "border-cyan-400 bg-cyan-950/25 ring-2 ring-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)]" 
                      : "border-purple-400 bg-purple-950/25 ring-2 ring-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.25)]";
                    const borderNormalColor = isBox0
                      ? "border-slate-900 bg-slate-950/50 hover:border-cyan-500/30"
                      : "border-slate-900 bg-slate-950/50 hover:border-purple-500/30";

                    const headingColor = isBox0 ? "text-cyan-300 bg-cyan-950/60 border-cyan-500/20" : "text-purple-300 bg-purple-950/60 border-purple-500/20";
                    const chipStyle = isBox0 ? "bg-white border-cyan-300 text-cyan-950 font-bold shadow-sm" : "bg-white border-purple-300 text-purple-950 font-bold shadow-sm";

                    // Items assigned to this box
                    const assignedItems = currentQuestion.categorizeItems
                      ?.map((item, idx) => ({ ...item, originalIdx: idx }))
                      .filter(item => categoryAssignments[item.originalIdx] === boxIdx) || [];

                    return (
                      <div
                        key={boxIdx}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedOverBoxIdx !== boxIdx) {
                            setDraggedOverBoxIdx(boxIdx);
                          }
                        }}
                        onDragLeave={() => setDraggedOverBoxIdx(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDraggedOverBoxIdx(null);
                          const itemIdxStr = e.dataTransfer.getData("text/plain");
                          const itemIdx = parseInt(itemIdxStr);
                          if (!isNaN(itemIdx)) {
                            handleAssign(itemIdx, boxIdx);
                          }
                        }}
                        onClick={() => {
                          if (selectedItemIdx !== null) {
                            handleAssign(selectedItemIdx, boxIdx);
                          }
                        }}
                        className={`flex flex-col rounded-2xl border p-4 min-h-[180px] transition-all duration-300 relative ${
                          canDropHere ? "cursor-pointer" : ""
                        } ${isHighlight ? borderActiveColor : borderNormalColor}`}
                      >
                        {/* Box Header Badge */}
                        <div className="flex items-center justify-between mb-3 border-b border-slate-900/60 pb-2">
                          <span className={`text-xs md:text-sm font-bold font-sans uppercase px-3 py-1 rounded-xl border tracking-wide flex items-center gap-1.5 ${headingColor}`}>
                            <Inbox size={14} className="animate-pulse" />
                            {boxName}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            ({assignedItems.length} รายการ)
                          </span>
                        </div>

                        {/* Active selection cue overlay helper */}
                        {canDropHere && assignedItems.length === 0 && !isHighlight && (
                          <div className="absolute inset-0 m-4 flex items-center justify-center pointer-events-none">
                            <span className="text-xs text-slate-400 border border-dashed border-slate-800 px-3 py-2 rounded-xl text-center bg-slate-950/20">
                              👉 แตะที่นี่เพื่อวางการ์ดที่เลือกไว้
                            </span>
                          </div>
                        )}

                        {/* Drop Target Zone background cues */}
                        {isHighlight && (
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/20 rounded-2xl pointer-events-none" />
                        )}

                        {/* Assigned Items List (Chips) */}
                        <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-1 z-10 flex-1">
                          <AnimatePresence>
                            {assignedItems.map((item) => (
                              <motion.div
                                key={item.originalIdx}
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                className={`p-3 rounded-xl border text-sm md:text-base flex items-center justify-between gap-3 ${chipStyle}`}
                              >
                                <span className="leading-relaxed font-bold">{item.text}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(item.originalIdx);
                                  }}
                                  className="p-1 rounded-md bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 cursor-pointer transition-colors shrink-0"
                                  title="ย้ายกลับไปรายการรอดำเนินการ"
                                >
                                  <X size={14} />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {assignedItems.length === 0 && !canDropHere && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600 py-6">
                              <Inbox size={24} className="stroke-[1.5] opacity-30 mb-1" />
                              <span className="text-[11px] font-sans">กล่องว่างเปล่า</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Submission Area */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={
              (currentQuestion.type === 'multiple-choice' && selectedOption === null) ||
              (currentQuestion.type === 'matching' && matchedPairs.length !== (currentQuestion.matchingLeft?.length || 0)) ||
              (currentQuestion.type === 'categorize' && Object.keys(categoryAssignments).length !== (currentQuestion.categorizeItems?.length || 0))
            }
            className={`w-full md:w-auto px-10 py-3.5 rounded-xl font-bold tracking-wider transition-all duration-300 cursor-pointer transform active:scale-95 text-center flex items-center justify-center gap-2 ${
              (
                (currentQuestion.type === 'multiple-choice' && selectedOption === null) ||
                (currentQuestion.type === 'matching' && matchedPairs.length !== (currentQuestion.matchingLeft?.length || 0)) ||
                (currentQuestion.type === 'categorize' && Object.keys(categoryAssignments).length !== (currentQuestion.categorizeItems?.length || 0))
              )
                ? "bg-slate-900 border border-slate-950 text-slate-500 cursor-not-allowed"
                : levelId === 1
                ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)]"
                : levelId === 2
                ? "bg-purple-500 text-white hover:bg-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_35px_rgba(168,85,247,0.5)]"
                : levelId === 3
                ? "bg-pink-500 text-white hover:bg-pink-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_35px_rgba(244,63,94,0.5)]"
                : "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)]"
            }`}
            id="submit-answer-btn"
          >
            ตรวจคำตอบ <CheckCircle2 size={18} />
          </button>
        </div>

      </main>
    </div>
  );
}
