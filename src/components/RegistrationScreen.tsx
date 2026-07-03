import React, { useState } from 'react';
import { User, School, Hash, ArrowRight, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioSynth } from '../utils/audio';

interface RegistrationScreenProps {
  onRegister: (name: string, studentClass: string, studentNumber: string) => void;
  onBack: () => void;
  initialName?: string;
  initialClass?: string;
  initialNumber?: string;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export default function RegistrationScreen({
  onRegister,
  onBack,
  initialName = '',
  initialClass = '',
  initialNumber = '',
  soundEnabled = true,
  onToggleSound
}: RegistrationScreenProps) {
  const [name, setName] = useState(initialName);
  const [studentClass, setStudentClass] = useState(initialClass);
  const [studentNumber, setStudentNumber] = useState(initialNumber);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('กรุณากรอกชื่อ - นามสกุล ของนักเรียน');
      audioSynth.playSfx('wrong');
      return;
    }
    if (!studentClass.trim()) {
      setError('กรุณากรอกชั้นเรียน (เช่น ม.2/1)');
      audioSynth.playSfx('wrong');
      return;
    }
    if (!studentNumber.trim() || isNaN(Number(studentNumber)) || Number(studentNumber) <= 0) {
      setError('กรุณากรอกเลขที่ให้ถูกต้อง (เป็นตัวเลขมากกว่า 0)');
      audioSynth.playSfx('wrong');
      return;
    }

    setError('');
    audioSynth.playSfx('click');
    onRegister(name.trim(), studentClass.trim(), studentNumber.trim());
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-radial from-slate-900 via-[#0B0F19] to-[#04060b] text-white px-4 overflow-hidden select-none">
      {/* Decorative background grid and ambient glows */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[200px] h-[200px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-950/85 border border-slate-900 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-md relative z-10"
        id="registration-card"
      >
        {/* Back Button */}
        <button
          onClick={() => {
            audioSynth.playSfx('click');
            onBack();
          }}
          className="absolute top-6 left-6 text-slate-400 hover:text-cyan-400 p-1.5 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-xl transition-all duration-200 cursor-pointer"
          title="กลับหน้าหลัก"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Mute Toggle Button */}
        {onToggleSound && (
          <button
            type="button"
            onClick={() => {
              audioSynth.playSfx('click');
              onToggleSound();
            }}
            className="absolute top-6 right-6 text-slate-400 hover:text-cyan-400 p-1.5 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-xl transition-all duration-200 cursor-pointer"
            title="เปิด/ปิดเสียง"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        )}

        <div className="text-center mt-6 mb-8">
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase bg-cyan-950/45 border border-cyan-500/20 px-3 py-1 rounded-full">
            CT Challenge - Player Profile
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-4 font-sans">
            กรอกข้อมูลผู้เข้าเรียน
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
            กรุณาระบุข้อมูลของคุณเพื่อบันทึกและรวบรวมรายงานผลการทำกิจกรรมเมื่อพิชิตด่านเกมสำเร็จ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <User size={13} className="text-cyan-400" />
              ชื่อ - สามสกุล
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={handleInputChange(setName)}
                placeholder="เด็กชายกวิน เรียนดี"
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-cyan-500/80 text-slate-100 placeholder:text-slate-600 rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                <User size={16} />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 2. Class Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <School size={13} className="text-purple-400" />
                ชั้นมัธยมศึกษาปีที่
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentClass}
                  onChange={handleInputChange(setStudentClass)}
                  placeholder="2/1"
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-purple-500/80 text-slate-100 placeholder:text-slate-600 rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all duration-200"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                  <School size={16} />
                </span>
              </div>
            </div>

            {/* 3. Number Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Hash size={13} className="text-amber-400" />
                เลขที่
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={studentNumber}
                  onChange={handleInputChange(setStudentNumber)}
                  placeholder="15"
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500/80 text-slate-100 placeholder:text-slate-600 rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                  <Hash size={16} />
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-rose-400 bg-rose-950/30 border border-rose-500/20 px-3 py-2 rounded-xl"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.45)] flex items-center justify-center gap-2 cursor-pointer text-sm font-sans"
          >
            บันทึกข้อมูลและไปที่แผนที่ด่านเกม
            <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
