import React, { useEffect, useState } from 'react';
import { Trophy, Users, RefreshCw, Database, Sparkles, CheckCircle2, Lock, ArrowRight, Server, FileText, Check, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioSynth } from '../utils/audio';
import { isSupabaseConfigured, fetchLeaderboard, StudentProgress } from '../utils/supabase';

interface ClassroomLeaderboardProps {
  currentStudentName?: string;
  currentStudentClass?: string;
  currentStudentNumber?: string;
}

export default function ClassroomLeaderboard({
  currentStudentName = '',
  currentStudentClass = '',
  currentStudentNumber = ''
}: ClassroomLeaderboardProps) {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  // Load students on mount
  useEffect(() => {
    if (isSupabaseConfigured) {
      loadLeaderboardData();
    }
  }, []);

  const loadLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard();
      setStudents(data);
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    audioSynth.playSfx('click');
    loadLeaderboardData();
  };

  // Extract unique classes for filtering
  const classesList = ['all', ...Array.from(new Set(students.map(s => s.student_class))).filter(Boolean).sort()];

  // Filter and sort students
  const filteredStudents = students
    .filter(s => selectedClassFilter === 'all' || s.student_class === selectedClassFilter)
    // Sort primarily by completed levels count, then by student number or updated_at
    .sort((a, b) => {
      const bCompletedCount = a.completed_levels?.length || 0;
      const aCompletedCount = b.completed_levels?.length || 0;
      if (aCompletedCount !== bCompletedCount) {
        return aCompletedCount - bCompletedCount;
      }
      return new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime();
    });

  // Get current student rank if registered
  const currentStudentRank = currentStudentName
    ? students.findIndex(s => s.student_name === currentStudentName && s.student_class === currentStudentClass) + 1
    : 0;

  // Station info list
  const stations = [
    { id: 1, name: 'Decomposition' },
    { id: 2, name: 'Pattern' },
    { id: 3, name: 'Abstraction' },
    { id: 4, name: 'Algorithm' },
    { id: 5, name: 'Boss Fight' }
  ];

  return (
    <div className="w-full bg-slate-950/70 border border-slate-900 rounded-3xl p-6 shadow-2xl backdrop-blur-md" id="classroom-leaderboard-section">
      {/* Header section with connection status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Trophy className="text-amber-400 animate-pulse" size={22} />
            <h3 className="text-lg md:text-xl font-extrabold text-slate-100 font-sans flex items-center gap-2">
              ทำเนียบเกียรติยศห้องเรียน (Leaderboard)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            สถิติการเรียนรู้เชิงคำนวณแบบเรียลไทม์ของเพื่อนร่วมห้องเรียน
          </p>
        </div>

        {/* Database Status Tag */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isSupabaseConfigured ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[11px] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>SUPABASE CONNECTED</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-[11px] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>OFFLINE DEMO MODE</span>
            </div>
          )}

          {isSupabaseConfigured && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* RENDER MODE A: Supabase IS NOT configured yet */}
      {!isSupabaseConfigured ? (
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-amber-500/15 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <Database size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-bold text-amber-400 font-sans">
                ขั้นตอนการเชื่อมต่อฐานข้อมูล Supabase ของคุณ 🚀
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                เนื่องจากเกมถูกออกแบบให้บันทึกข้อมูลแบบ Cloud Database แท้ คุณสามารถนำโปรเจ็กต์ Supabase ที่คุณสร้างไว้มาเชื่อมต่อกับเกมนี้ได้ง่ายๆ ใน 2 ขั้นตอนดังนี้:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Step 1: SQL Setup */}
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-3">
                  <span className="px-2 py-0.5 bg-cyan-950/60 border border-cyan-500/20 rounded">STEP 1</span>
                  <span>รันคิวรี SQL ใน SUPABASE</span>
                </div>
                <h5 className="text-sm font-bold text-slate-200 mb-2">สร้างโครงสร้างตาราง (Table Schema)</h5>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  คัดลอกคำสั่ง SQL ที่เตรียมไว้เพื่อไปสร้างตารางชื่อ <code className="text-cyan-400 font-mono">students</code> และตั้งค่าระบบความปลอดภัย (Row Level Security) เพื่อรองรับการเก็บสถิติ
                </p>
              </div>

              <button
                onClick={() => {
                  audioSynth.playSfx('click');
                  setShowSqlGuide(true);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/50 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText size={14} />
                ดูคำสั่ง SQL Setup Script
              </button>
            </div>

            {/* Step 2: Env Variables */}
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold mb-3">
                  <span className="px-2 py-0.5 bg-purple-950/60 border border-purple-500/20 rounded">STEP 2</span>
                  <span>ตั้งค่า API KEY ในระบบ</span>
                </div>
                <h5 className="text-sm font-bold text-slate-200 mb-2">ระบุ API URL และ Anon Key</h5>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  นำค่าความปลอดภัยไปใส่ในส่วน <span className="text-purple-300">Settings &gt; Environment Variables</span> เพื่อให้เกมคุยกับคลาวด์ได้แบบเรียลไทม์
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-900 p-3 rounded-xl font-mono text-[10px] text-slate-400 space-y-1">
                <div>VITE_SUPABASE_URL="https://your-proj.supabase.co"</div>
                <div>VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."</div>
              </div>
            </div>
          </div>

          {/* Show mock data instructions */}
          <div className="text-center pt-2">
            <span className="text-xs text-slate-500 font-medium">
              💡 ในโหมด Offline Demo ข้อมูลคะแนนจะจัดเก็บชั่วคราวในอุปกรณ์ของคุณเท่านั้น
            </span>
          </div>
        </div>
      ) : (
        /* RENDER MODE B: Supabase is successfully configured and active! */
        <div className="space-y-5">
          {/* Class Filters & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Class Filter Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium mr-1.5">ตัวกรองชั้นเรียน:</span>
              {classesList.map(klass => (
                <button
                  key={klass}
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setSelectedClassFilter(klass);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200 border ${
                    selectedClassFilter === klass
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {klass === 'all' ? 'ทั้งหมด' : `ม.${klass}`}
                </button>
              ))}
            </div>

            {/* Quick Summary Bar */}
            <div className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
              <Users size={12} />
              <span>ลงทะเบียนแล้ว {students.length} คน</span>
            </div>
          </div>

          {/* Leaderboard Table Grid */}
          <div className="bg-slate-950/50 border border-slate-900 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-400 font-mono">กำลังเชื่อมต่อฐานข้อมูลคลาวด์...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                {selectedClassFilter === 'all' 
                  ? 'ยังไม่มีประวัตินักเรียนทำเนียบเกียรติยศในระบบ' 
                  : `ไม่พบนักเรียนในชั้นเรียน ม.${selectedClassFilter}`}
              </div>
            ) : (
              <div className="divide-y divide-slate-900 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-900/30 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 text-center w-12">อันดับ</th>
                      <th className="py-3 px-4">ชื่อผู้เรียน</th>
                      <th className="py-3 px-4 text-center w-20">ห้อง / เลขที่</th>
                      <th className="py-3 px-4 text-center">ความคืบหน้าระดับสถานีความรู้ (1-5)</th>
                      <th className="py-3 px-4 text-right w-24">ผลลัพธ์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-sm">
                    {filteredStudents.map((student, index) => {
                      const isCurrent = student.student_name === currentStudentName && student.student_class === currentStudentClass;
                      const completedCount = student.completed_levels?.length || 0;
                      
                      return (
                        <tr 
                          key={student.id || index}
                          className={`transition-colors duration-150 ${
                            isCurrent 
                              ? 'bg-cyan-500/5 hover:bg-cyan-500/10' 
                              : 'hover:bg-slate-900/20'
                          }`}
                        >
                          {/* Rank badge */}
                          <td className="py-3.5 px-4 text-center">
                            {index === 0 ? (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/10 border border-amber-400 text-amber-400 text-xs font-black">
                                1
                              </div>
                            ) : index === 1 ? (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/10 border border-slate-300 text-slate-300 text-xs font-black">
                                2
                              </div>
                            ) : index === 2 ? (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/10 border border-amber-700 text-amber-600 text-xs font-black">
                                3
                              </div>
                            ) : (
                              <span className="text-xs font-mono text-slate-500">{index + 1}</span>
                            )}
                          </td>

                          {/* Student identity details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isCurrent ? 'text-cyan-400' : 'text-slate-200'}`}>
                                {student.student_name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                                  ตัวคุณ
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Class / Number */}
                          <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                            ม.{student.student_class} เลขที่ {student.student_number}
                          </td>

                          {/* 5-Station progress lightbar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                              {stations.map(station => {
                                const isCompleted = student.completed_levels?.includes(station.id);
                                const isUnlocked = student.unlocked_levels?.includes(station.id);
                                
                                return (
                                  <div 
                                    key={station.id} 
                                    className="flex-1 flex flex-col items-center gap-1"
                                    title={`${station.name}: ${isCompleted ? 'สำเร็จแล้ว' : isUnlocked ? 'ปลดล็อกแล้ว' : 'ยังไม่ปลดล็อก'}`}
                                  >
                                    <div 
                                      className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                                        isCompleted 
                                          ? 'bg-gradient-to-r from-teal-400 to-emerald-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]'
                                          : isUnlocked 
                                            ? 'bg-cyan-500/30 border border-cyan-500/20'
                                            : 'bg-slate-900'
                                      }`}
                                    />
                                    <span className="text-[8px] font-mono text-slate-600 scale-90">
                                      {station.id}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* Final score / star count */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 text-xs font-mono font-bold text-teal-400">
                              <Sparkles size={11} className="text-teal-400" />
                              <span>ผ่าน {completedCount}/5 ด่าน</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SQL Script Viewer Popup */}
      <AnimatePresence>
        {showSqlGuide && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-950 border border-cyan-500/30 max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal header */}
              <div className="p-5 border-b border-slate-900 flex justify-between items-center bg-slate-950">
                <div className="flex items-center gap-2">
                  <Database className="text-cyan-400" size={18} />
                  <h4 className="text-base font-bold text-slate-100 font-sans">
                    สคริปต์ SQL Setup สำหรับสร้างตาราง
                  </h4>
                </div>
                <button
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setShowSqlGuide(false);
                  }}
                  className="text-slate-400 hover:text-white text-xs font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
                >
                  ปิด
                </button>
              </div>

              {/* Code viewer body */}
              <div className="p-6 overflow-y-auto space-y-4">
                <p className="text-xs text-slate-300">
                  เปิดห้องทำงาน <span className="text-cyan-400 font-bold">Supabase Dashboard</span> ไปที่หัวข้อ <span className="font-semibold text-slate-100">SQL Editor &gt; New Query</span> แล้วนำสคริปต์ด้านล่างนี้ไปวางและกดปุ่ม <span className="text-emerald-400">Run</span> เพื่อสร้างฐานข้อมูลได้ทันที :
                </p>

                <div className="relative">
                  <pre className="p-4 bg-slate-900 border border-slate-800 text-[10px] md:text-xs font-mono text-cyan-300/90 rounded-xl overflow-x-auto whitespace-pre select-all max-h-[50vh]">
{`CREATE TABLE public.students (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_name text NOT NULL,
    student_class text NOT NULL,
    student_number text NOT NULL,
    unlocked_levels jsonb DEFAULT '[1]'::jsonb NOT NULL,
    completed_levels jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_record UNIQUE (student_name, student_class, student_number)
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for scoreboard" ON public.students FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert for registration" ON public.students FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update for progress synchronization" ON public.students FOR UPDATE TO anon USING (true) WITH CHECK (true);`}
                  </pre>
                </div>

                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/25 rounded-xl text-[11px] text-emerald-300 leading-relaxed flex items-start gap-2">
                  <Check className="shrink-0 text-emerald-400 mt-0.5" size={14} />
                  <span>
                    <strong>ไฟล์สคริปต์พร้อมใช้งาน:</strong> เราได้เตรียมไฟล์สคริปต์ฉบับเต็มไว้ที่ไฟล์ <code className="bg-emerald-950 px-1 py-0.5 rounded font-mono text-[10px]">/supabase-setup.sql</code> ในโปรเจ็กต์เรียบร้อยแล้ว คุณสามารถคัดลอกจากไฟล์นั้นได้เช่นกัน!
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
