import React from 'react';
import {
  Award, RotateCcw,
  BrainCircuit, Layers, Grid, EyeOff, Cpu, CheckCircle2, Sparkles, Wrench, AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import { audioSynth } from '../utils/audio';
import { LevelDiagnosticStats, calculateTrueSkillScore } from '../App';

interface FinalDashboardScreenProps {
  travelerName: string;
  travelerGender: 'female' | 'male';
  totalAccumulatedScore: number;
  levelScores: Record<number, number>; // star score (1-3)
  levelDiagnostics?: Record<number, LevelDiagnosticStats>;
  levelGridScores: Record<number, number>;
  levelGridBlocksUsed: Record<number, { blocks: number; usedLoop: boolean }>;
  onPlayAgain: () => void;
}

export default function FinalDashboardScreen({
  travelerName,
  travelerGender,
  levelScores,
  levelDiagnostics,
  levelGridBlocksUsed,
  onPlayAgain,
}: FinalDashboardScreenProps) {

  const calculatePillarStats = (
    levelId: number,
    baseTitle: string,
    englishName: string,
    gridSkillDesc: string,
    exerciseSubtitle: string,
    icon: React.ElementType,
    barColor: string,
    iconColor: string
  ) => {
    const trueStats = calculateTrueSkillScore(
      levelDiagnostics?.[levelId],
      levelId,
      levelGridBlocksUsed?.[levelId],
      levelDiagnostics?.[5],
      levelGridBlocksUsed?.[5]
    );
    const remainingHearts = Math.max(1, Math.min(3, levelScores[levelId] || trueStats.stars));

    return {
      id: levelId,
      title: baseTitle,
      englishName,
      gridSkillDesc,
      exerciseSubtitle,
      remainingHearts,
      totalMistakes: trueStats.totalMistakes,
      retryCount: trueStats.retryCount,
      gridMistakes: trueStats.gridMistakes,
      gridObstaclesHit: trueStats.gridObstaclesHit,
      gridTargetErrors: trueStats.gridTargetErrors,
      gridLoopMissed: trueStats.gridLoopMissed,
      gridResets: trueStats.gridResets,
      exerciseMistakes: trueStats.exerciseMistakes,
      exerciseRetries: trueStats.exerciseRetries,
      bossMissedInPillar: trueStats.bossMissedInPillar,
      gridScore: trueStats.gridScore,
      exerciseScore: trueStats.exerciseScore,
      blocksUsed: trueStats.blocksUsed,
      targetBlocks3Star: trueStats.targetBlocks3Star,
      usedLoop: trueStats.usedLoop,
      stars: trueStats.stars,
      percent: trueStats.score,
      points: trueStats.score,
      tier: trueStats.tier,
      shortTier: trueStats.shortTier,
      icon,
      barColor,
      iconColor,
    };
  };

  const ctPillars = [
    calculatePillarStats(
      1,
      'การแบ่งย่อยปัญหา',
      'Decomposition',
      'ตาราง 5x5: แบ่งช่วงเดินเก็บเป้าหมายครบตามลำดับ + ด่าน 5',
      'แบบฝึกหัด: แยกย่อยขั้นตอนแก้ปัญหา',
      Layers,
      'from-cyan-500 to-teal-400',
      'text-cyan-400'
    ),
    calculatePillarStats(
      2,
      'การหารูปแบบ',
      'Pattern Recognition',
      'ตาราง 5x5: ใช้บล็อก 🔄 วนลูปย่อคำสั่งซ้ำตั้งแต่รอบแรก + ด่าน 5',
      'แบบฝึกหัด: คาดการณ์ลำดับและรูปแบบ',
      Grid,
      'from-purple-500 to-indigo-400',
      'text-purple-400'
    ),
    calculatePillarStats(
      3,
      'การคิดเชิงนามธรรม',
      'Abstraction',
      'ตาราง 5x5: คัดกรองเส้นทางหลบสิ่งกีดขวางและเก็บเพชรอัตโนมัติ + ด่าน 5',
      'แบบฝึกหัด: คัดเลือกสิ่งของสำคัญ 5 รายการ',
      EyeOff,
      'from-pink-500 to-rose-400',
      'text-pink-400'
    ),
    calculatePillarStats(
      4,
      'การออกแบบอัลกอริทึม',
      'Algorithm Design',
      'ตาราง 5x5: จัดลำดับคำสั่งประหยัดบล็อก (≤ เกณฑ์ 3 ดาว) + ด่าน 5',
      'แบบฝึกหัด: ออกแบบผังงาน (Flowchart)',
      Cpu,
      'from-amber-500 to-orange-400',
      'text-amber-400'
    ),
  ];

  const level5CapstoneStats = calculateTrueSkillScore(
    levelDiagnostics?.[5],
    5,
    levelGridBlocksUsed?.[5]
  );

  const totalSkillPoints = ctPillars.reduce((acc, curr) => acc + curr.points, 0);
  const maxSkillPoints = ctPillars.length * 100;

  const averageCTScore = Math.round(
    ctPillars.reduce((acc, curr) => acc + curr.percent, 0) / ctPillars.length
  );

  const overallTier =
    averageCTScore >= 85
      ? 'ระดับดีเยี่ยม (Master)'
      : averageCTScore >= 65
      ? 'ระดับปานกลาง (Developing)'
      : 'ระดับควรเสริมทักษะ (Needs Practice)';

  // --- วิเคราะห์จุดเด่น (🌟 Strongest Skill) และจุดที่ควรเสริมรายบุคคล (🛠️ Skill to Practice) ---
  const sortedForBest = [...ctPillars].sort((a, b) => {
    if (b.percent !== a.percent) return b.percent - a.percent;
    if (a.totalMistakes !== b.totalMistakes) return a.totalMistakes - b.totalMistakes;
    const excessA = a.blocksUsed - a.targetBlocks3Star;
    const excessB = b.blocksUsed - b.targetBlocks3Star;
    if (excessA !== excessB) return excessA - excessB;
    return b.exerciseScore - a.exerciseScore;
  });

  const strongestPillar = sortedForBest[0];
  const tiedBestTitles = ctPillars
    .filter(p => p.id !== strongestPillar.id && p.percent === strongestPillar.percent && p.totalMistakes === strongestPillar.totalMistakes)
    .map(p => p.title);

  const sortedForWeakest = [...ctPillars]
    .filter(p => p.id !== strongestPillar.id)
    .sort((a, b) => {
      if (a.percent !== b.percent) return a.percent - b.percent;
      if (b.totalMistakes !== a.totalMistakes) return b.totalMistakes - a.totalMistakes;
      const excessA = a.blocksUsed - a.targetBlocks3Star;
      const excessB = b.blocksUsed - b.targetBlocks3Star;
      if (excessB !== excessA) return excessB - excessA;
      return b.retryCount - a.retryCount;
    });

  const weakestPillar = sortedForWeakest[0] || ctPillars[ctPillars.length - 1];

  // สร้างข้อความสรุปจุดเด่นจากข้อมูลจริงของนักเรียน
  const buildStrengthAnalysis = (p: typeof strongestPillar): string => {
    const highlights: string[] = [];
    if (p.blocksUsed <= p.targetBlocks3Star) {
      highlights.push(
        `วางแผนเดินตาราง 5x5 ในด่านที่ ${p.id} ด้วยชุดคำสั่งที่กระชับเพียง ${p.blocksUsed}/${p.targetBlocks3Star} บล็อก`
      );
    } else {
      highlights.push(
        `ทำภารกิจเดินตาราง 5x5 ในด่านที่ ${p.id} สำเร็จได้คะแนนตาราง ${p.gridScore}/50 คะแนน`
      );
    }
    if (p.usedLoop && p.gridLoopMissed === 0) {
      highlights.push('ประยุกต์ใช้บล็อก 🔄 วนลูปย่อคำสั่งซ้ำได้ตั้งแต่รอบแรก');
    }
    if (p.gridObstaclesHit === 0) {
      highlights.push('หลบหลีกสิ่งกีดขวางบนแผนที่ได้แม่นยำโดยไม่ชนเลย');
    }
    if (p.exerciseMistakes === 0 && !p.bossMissedInPillar) {
      highlights.push(`ทำ${p.exerciseSubtitle}ถูกต้องตั้งแต่ครั้งแรก (50/50 คะแนน)`);
    } else {
      highlights.push(`ผ่าน${p.exerciseSubtitle}ได้ ${p.exerciseScore}/50 คะแนน`);
    }
    return highlights.join(' · ');
  };

  // สร้างคำแนะนำเฉพาะเจาะจงตามจุดที่นักเรียนทำผิดจริง (Specific Personalized Recommendations)
  const buildSpecificDiagnosticRecommendations = (p: typeof weakestPillar): string[] => {
    const recs: string[] = [];
    const excessBlocks = Math.max(0, p.blocksUsed - p.targetBlocks3Star);

    // 1. จุดผิดจากแบบฝึกหัดท้ายด่านของทักษะนั้นโดยตรง
    if (p.exerciseMistakes > 0) {
      if (p.id === 1) {
        recs.push(
          `จากแบบฝึกหัดด่านที่ 1 (ผิด ${p.exerciseMistakes} ครั้ง): ควรฝึกเรียงลำดับการแยกย่อยขั้นตอนโครงงานและการวางแผนเดินทาง โดยพิจารณาว่าขั้นตอนใดเป็นจุดเริ่มต้นที่ต้องเตรียมก่อน (เช่น กำหนดหัวข้อ/จุดหมาย ➔ ค้นคว้า/เตรียมงบ ➔ ลงมือทำ ➔ สรุปผล)`
        );
      } else if (p.id === 2) {
        recs.push(
          `จากแบบฝึกหัดด่านที่ 2 (ผิด ${p.exerciseMistakes} ครั้ง): ควรฝึกสังเกต "แก่นของรูปแบบที่ซ้ำกันเป็นรอบ" อย่างน้อย 2 รอบติดกันก่อนเติมสัญลักษณ์หรือทิศทางถัดไปที่หายไป`
        );
      } else if (p.id === 3) {
        recs.push(
          `จากแบบฝึกหัดด่านที่ 3 (ผิด ${p.exerciseMistakes} ครั้ง): ควรฝึกตั้งคำถามว่า "สิ่งของชิ้นใดถ้าไม่มีแล้วจะทำภารกิจหลักไม่ได้" เพื่อคัดเฉพาะสิ่งจำเป็น 5 ชิ้น และตัดของฟุ่มเฟือย (เช่น ขนม ของเล่น เครื่องประดับ) ออก`
        );
      } else if (p.id === 4) {
        recs.push(
          `จากแบบฝึกหัดด่านที่ 4 (ผิด ${p.exerciseMistakes} ครั้ง): ควรทบทวนรูปทรงสัญลักษณ์ผังงาน (Flowchart) โดยเฉพาะสี่เหลี่ยมขนมเปียกปูนสำหรับตรวจสอบเงื่อนไข ("ถ้ามีเงินมากกว่า 20 บาท") และการแยกเส้นทางซ้าย-ขวาก่อนรวมเข้าจุดเชื่อมต่อ`
        );
      }
    }

    // 2. จุดผิดจากภารกิจสรุปรวบยอด ด่านที่ 5 (Boss Challenge) ในมิตินี้
    if (p.bossMissedInPillar) {
      recs.push(
        `จากภารกิจสรุปรวบยอดด่านที่ 5 (Boss Challenge): เคยเลือกคำตอบด้าน "${p.title}" คลาดเคลื่อน — แนะนำให้ทบทวนการนำนิยามของ ${p.englishName} ไปเชื่อมโยงกับโจทย์สถานการณ์จริง`
      );
    }

    // 3. จุดผิดจากการเดินตาราง 5x5 ในด่านของทักษะนั้น
    if (p.gridObstaclesHit > 0) {
      recs.push(
        `จากตาราง 5x5 ด่านที่ ${p.id} (ชนสิ่งกีดขวาง/ตกขอบ ${p.gridObstaclesHit} ครั้ง): แนะนำให้สังเกตพิกัดสิ่งกีดขวาง (🌲 ต้นไม้, 🪨 หิน, 💧 บ่อน้ำ) บนตาราง 5x5 และไล่พิกัดทีละช่องในใจก่อนกดรันคำสั่ง`
      );
    }

    if (p.gridTargetErrors > 0) {
      recs.push(
        `จากตาราง 5x5 ด่านที่ ${p.id} (เช็คอินคลาดเคลื่อน/เก็บเป้าหมายไม่ครบ ${p.gridTargetErrors} ครั้ง): แนะนำให้แบ่งเส้นทางเป็นช่วงย่อยทีละเป้าหมาย และจำว่าสถานที่ท่องเที่ยวต้องใส่บล็อก 📍 เช็คอิน ส่วนเพชร 💎 เก็บอัตโนมัติเมื่อเดินผ่าน`
      );
    }

    if (!p.usedLoop || p.gridLoopMissed > 0) {
      recs.push(
        `จากตาราง 5x5 ด่านที่ ${p.id} (ไม่ได้ใช้ 🔄 วนลูปตั้งแต่รอบแรก ${Math.max(1, p.gridLoopMissed)} ครั้ง): เมื่อต้องเดินทิศทางเดิมติดต่อกันตั้งแต่ 2 ช่องขึ้นไป แนะนำให้กดปุ่ม "🔁 เพิ่มลูป" ก่อนเลือกทิศทางเสมอ`
      );
    }

    if (excessBlocks > 0) {
      recs.push(
        `จากตาราง 5x5 ด่านที่ ${p.id} (ใช้ ${p.blocksUsed} บล็อก เกินเกณฑ์ 3 ดาว ${p.targetBlocks3Star} บล็อก อยู่ ${excessBlocks} บล็อก): แนะนำให้ลดการเดินอ้อมย้อนกลับไปมา และใช้การวนลูปยุบรวมบล็อกคำสั่งที่ซ้ำกัน`
      );
    }

    // 4. หากในด่านของ weakestPillar ไม่มีข้อผิดพลาดเลย ให้ตรวจสอบข้อผิดพลาดรวมจากด่านอื่น ๆ หรือด่านที่ 5
    if (recs.length === 0) {
      const anyObstacleLevels = ctPillars.filter(x => x.gridObstaclesHit > 0);
      const anyLoopMissedLevels = ctPillars.filter(x => !x.usedLoop || x.gridLoopMissed > 0);
      const anyExerciseMistakeLevels = ctPillars.filter(x => x.exerciseMistakes > 0);

      if (anyExerciseMistakeLevels.length > 0) {
        const l = anyExerciseMistakeLevels[0];
        recs.push(
          `พบการทำแบบฝึกหัดผิดในด่านที่ ${l.id} (${l.title} จำนวน ${l.exerciseMistakes} ครั้ง): แนะนำให้ทบทวนใบความรู้และขั้นตอนการคิดของด้าน ${l.title} เพิ่มเติม`
        );
      }
      if (anyObstacleLevels.length > 0) {
        const l = anyObstacleLevels[0];
        recs.push(
          `พบการเดินชนสิ่งกีดขวางในตาราง 5x5 ด่านที่ ${l.id} (${l.gridObstaclesHit} ครั้ง): แนะนำให้วางแผนตรวจสอบพิกัดสิ่งกีดขวางล่วงหน้าก่อนสั่งรัน`
        );
      }
      if (anyLoopMissedLevels.length > 0) {
        const l = anyLoopMissedLevels[0];
        recs.push(
          `ในตาราง 5x5 ด่านที่ ${l.id} ยังมีรอบที่ไม่ได้ใช้ลูปย่อคำสั่งซ้ำ: แนะนำให้ฝึกมองหารูปแบบการเดินซ้ำและใช้ 🔄 วนลูปตั้งแต่รอบแรก`
        );
      }
      if (level5CapstoneStats.totalMistakes > 0) {
        recs.push(
          `ในด่านบูรณาการที่ 5 (เมืองโบราณลึกลับ) มีข้อผิดพลาดสะสม ${level5CapstoneStats.totalMistakes} ครั้ง (ตาราง 5x5 พลาด ${level5CapstoneStats.gridMistakes} ครั้ง, ภารกิจบอสผิด ${level5CapstoneStats.exerciseMistakes} ครั้ง): แนะนำให้ฝึกเชื่อมโยงทั้ง 4 ทักษะเข้าด้วยกันในโจทย์ที่ซับซ้อน`
        );
      }
    }

    // 5. กรณีที่ผู้เรียนทำได้สมบูรณ์แบบทุกด่าน (0 ข้อผิดพลาด และบล็อกไม่เกินเกณฑ์เลย)
    if (recs.length === 0) {
      recs.push(
        `นักเรียนทำภารกิจด้าน "${p.title}" ได้อย่างยอดเยี่ยม (${p.percent}%) โดยไม่พบข้อผิดพลาดเลย! คำแนะนำเพื่อพัฒนาต่อยอด: ลองท้าทายตนเองด้วยการออกแบบอัลกอริทึมทางเลือกใหม่ที่ใช้จำนวนบล็อกน้อยที่สุดเท่าที่เป็นไปได้ และนำหลักการ ${p.englishName} ไปประยุกต์แก้โจทย์การเขียนโปรแกรมในระดับที่ซับซ้อนขึ้น`
      );
    }

    return recs;
  };

  const strengthSummaryText = buildStrengthAnalysis(strongestPillar);
  const specificRecommendations = buildSpecificDiagnosticRecommendations(weakestPillar);

  return (
    <div className="h-full w-full bg-radial from-slate-900 via-[#0B0F19] to-[#04060b] text-white flex flex-col items-center justify-start sm:justify-center px-3 sm:px-4 py-2 font-sans select-none relative overflow-y-auto">
      {/* Subtle background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-6xl mx-auto z-10 bg-slate-900/85 border border-slate-800 rounded-3xl p-3.5 sm:p-5 backdrop-blur-md shadow-2xl my-auto"
      >
        {/* 1. COMPACT HEADER & PROFILE ROW */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0">
              {travelerGender === 'female' ? '👧' : '👦'}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-amber-400 font-bold mb-0.5">
                <Award size={15} className="shrink-0" />
                <span>แดชบอร์ดประเมินทักษะการคิดเชิงคำนวณและวิเคราะห์รายบุคคล (Diagnostic Report)</span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-slate-100">
                {travelerName || 'นักเดินทางยอดเยี่ยม'}
              </h1>
              <div className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <span>{travelerGender === 'female' ? 'นักเดินทางหญิง (พอใจ)' : 'นักเดินทางชาย (กวิน)'}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-semibold">{overallTier}</span>
              </div>
            </div>
          </div>

          {/* Score Summary from 5x5 Grid + Exercises */}
          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-center pr-4 border-r border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                คะแนนประเมินทักษะรวม 4 ด้าน
              </span>
              <span className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
                {totalSkillPoints} <span className="text-xs font-normal text-slate-400">/ {maxSkillPoints}</span>
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                ความแม่นยำเฉลี่ย
              </span>
              <span className="text-lg sm:text-2xl font-black text-cyan-400 font-mono">
                {averageCTScore}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. INDIVIDUAL DIAGNOSTIC FEEDBACK BOX (กล่องวิเคราะห์รายบุคคล: จุดเด่น & จุดที่ควรเสริมพร้อมคำแนะนำเฉพาะเจาะจง) */}
        <div
          className="my-3 p-3.5 rounded-2xl bg-slate-950/85 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.12)]"
          id="individual-diagnostic-feedback-box"
        >
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5 pb-2 border-b border-slate-800/90">
            <h2 className="text-xs sm:text-sm font-black text-cyan-300 flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>การวิเคราะห์รายบุคคล (Diagnostic Feedback : สรุปจุดเด่นและจุดที่ควรเสริมตามผลการเล่นจริง)</span>
            </h2>
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
              วิเคราะห์จากข้อมูลตาราง 5x5, แบบฝึกหัดท้ายด่าน และภารกิจสรุปรวบยอดด่านที่ 5
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Left Card: 🌟 ทักษะที่โดดเด่นที่สุดของนักเรียน */}
            <div
              className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/40 flex flex-col justify-between gap-2"
              id="diagnostic-strongest-skill-card"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                    <span>🌟 ทักษะที่โดดเด่นที่สุดของนักเรียน</span>
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-300">
                    {strongestPillar.percent}% · {strongestPillar.shortTier}
                  </span>
                </div>

                <div className="text-sm sm:text-base font-black text-white">
                  ด้าน{strongestPillar.title} ({strongestPillar.englishName})
                  {tiedBestTitles.length > 0 && (
                    <span className="text-xs font-semibold text-emerald-300 block sm:inline sm:ml-1.5">
                      (โดดเด่นเทียบเท่า: {tiedBestTitles.join(', ')})
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed mt-1.5">
                  <strong className="text-emerald-300">จุดเด่นที่ทำได้ดี:</strong> {strengthSummaryText}
                </p>
              </div>

              <div className="pt-1.5 border-t border-emerald-500/20 flex items-center justify-between text-[11px] font-mono text-emerald-200/90">
                <span>ตาราง 5x5: {strongestPillar.gridScore}/50</span>
                <span>·</span>
                <span>แบบฝึกหัด: {strongestPillar.exerciseScore}/50</span>
                <span>·</span>
                <span>ผิดสะสม: {strongestPillar.totalMistakes} ครั้ง</span>
              </div>
            </div>

            {/* Right Card: 🛠️ ทักษะที่ควรฝึกฝนเพิ่มเติม พร้อมคำแนะนำเฉพาะเจาะจงตามจุดที่ทำผิดจริง */}
            <div
              className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/45 flex flex-col justify-between gap-2"
              id="diagnostic-improvement-skill-card"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                    <Wrench size={14} className="text-amber-400 shrink-0" />
                    <span>🛠️ ทักษะที่ควรฝึกฝนเพิ่มเติมและคำแนะนำเฉพาะบุคคล</span>
                  </span>
                  <span className="text-xs font-mono font-black text-amber-300">
                    {weakestPillar.percent}% · {weakestPillar.shortTier}
                  </span>
                </div>

                <div className="text-sm sm:text-base font-black text-white">
                  ด้าน{weakestPillar.title} ({weakestPillar.englishName})
                </div>

                <div className="mt-1.5 space-y-1">
                  {specificRecommendations.map((rec, idx) => (
                    <p key={idx} className="text-xs text-amber-100/95 leading-relaxed flex items-start gap-1.5">
                      <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="pt-1.5 border-t border-amber-500/20 flex items-center justify-between text-[11px] font-mono text-amber-200/90">
                <span>ตาราง 5x5: {weakestPillar.gridScore}/50</span>
                <span>·</span>
                <span>แบบฝึกหัด: {weakestPillar.exerciseScore}/50</span>
                <span>·</span>
                <span>ผิดสะสม: {weakestPillar.totalMistakes} ครั้ง</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 4 CT PILLARS COMPACT 2x2 GRID (5x5 GRID MISSION [50] + EXERCISE [50] = 100%) */}
        <div className="my-3">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <BrainCircuit size={16} className="text-cyan-400" />
              <span>ผลประเมินทักษะการคิดเชิงคำนวณ 4 มิติ (ภารกิจเดินตาราง 5x5 [50 คะแนน] + แบบฝึกหัด [50 คะแนน])</span>
            </h2>
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
              คำนวณจากจำนวนบล็อก การใช้ลูป การหลบสิ่งกีดขวางในตาราง 5x5 และความถูกต้องในแบบฝึกหัดตั้งแต่รอบแรก
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ctPillars.map((pillar) => {
              const IconComp = pillar.icon;
              const tierColor =
                pillar.percent >= 85
                  ? 'text-emerald-400'
                  : pillar.percent >= 65
                  ? 'text-amber-300'
                  : 'text-rose-400';

              return (
                <div
                  key={pillar.id}
                  className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-xl bg-slate-900 border border-slate-800 ${pillar.iconColor} shrink-0`}>
                        <IconComp size={15} />
                      </div>
                      <div className="truncate">
                        <h3 className="font-bold text-slate-100 text-xs sm:text-sm truncate">
                          {pillar.title} <span className="text-[11px] font-normal text-slate-400">({pillar.englishName})</span>
                        </h3>
                        <span className="text-[10px] text-cyan-300/90 block truncate">
                          {pillar.gridSkillDesc}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-black text-amber-400 font-mono block leading-none">
                        {pillar.percent}%
                      </span>
                      <span className={`text-[10px] font-bold ${tierColor}`}>
                        {pillar.tier}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full bg-gradient-to-r ${pillar.barColor} rounded-full`}
                      style={{ width: `${pillar.percent}%` }}
                    />
                  </div>

                  {/* Direct Breakdown: 5x5 Grid Score (50) + Exercise Score (50) */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] sm:text-[11px] font-mono">
                    <div className="px-2 py-1 rounded-lg bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between text-cyan-200">
                      <span>🗺️ ตาราง 5x5 ({pillar.blocksUsed}/{pillar.targetBlocks3Star} บล็อก{pillar.usedLoop ? '·🔄' : ''})</span>
                      <strong className="text-cyan-300">{pillar.gridScore}/50</strong>
                    </div>
                    <div className="px-2 py-1 rounded-lg bg-slate-900/90 border border-purple-500/30 flex items-center justify-between text-purple-200">
                      <span className="truncate mr-1">📝 {pillar.exerciseSubtitle}</span>
                      <strong className="text-purple-300 shrink-0">{pillar.exerciseScore}/50</strong>
                    </div>
                  </div>

                  {/* Cumulative Mistakes & Retries Detail */}
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 pt-0.5 gap-1.5 font-mono">
                    <span className="text-rose-300">
                      พลาดตาราง 5x5: <strong>{pillar.gridMistakes}</strong> ครั้ง
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-rose-300">
                      ผิดแบบฝึกหัด: <strong>{pillar.exerciseMistakes}</strong> ครั้ง
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-300">
                      เริ่มใหม่รวม: <strong>{pillar.retryCount}</strong> รอบ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. LEVEL SUMMARY STRIP (LEVELS 1 - 5 INCLUDING CAPSTONE BOSS CHALLENGE) */}
        <div className="mb-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
            สรุปคะแนนภารกิจตาราง 5x5 และแบบฝึกหัด/ภารกิจสรุปรวบยอดรายด่าน (ด่านที่ 1 – 5)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ctPillars.map((pillar) => (
              <div
                key={pillar.id}
                className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/90 text-center flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-400 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>ด่านที่ {pillar.id} ({pillar.shortTier})</span>
                </span>
                <span className="text-xs text-slate-100 font-bold truncate max-w-full leading-tight">
                  {pillar.title}
                </span>
                <span className="text-xs font-mono font-extrabold text-amber-300">
                  {pillar.points}/100 ({pillar.gridScore}+{pillar.exerciseScore})
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  บล็อก {pillar.blocksUsed}/{pillar.targetBlocks3Star} · ผิดรวม {pillar.totalMistakes} ครั้ง
                </span>
              </div>
            ))}

            {/* Level 5 Capstone (5x5 Grid + Boss Challenge) Summary Card */}
            <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-rose-950/25 border border-rose-500/40 text-center flex flex-col items-center justify-center gap-0.5">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-rose-300 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>ด่านที่ 5 ({level5CapstoneStats.shortTier})</span>
              </span>
              <span className="text-xs text-rose-100 font-bold truncate max-w-full leading-tight">
                บูรณาการ 4 ทักษะ (Boss)
              </span>
              <span className="text-xs font-mono font-extrabold text-amber-300">
                {level5CapstoneStats.score}/100 ({level5CapstoneStats.gridScore}+{level5CapstoneStats.exerciseScore})
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                บล็อก {level5CapstoneStats.blocksUsed}/{level5CapstoneStats.targetBlocks3Star} · ผิดรวม {level5CapstoneStats.totalMistakes} ครั้ง
              </span>
            </div>
          </div>
        </div>

        {/* 5. ACTION BUTTON */}
        <div className="flex justify-end items-center pt-2 border-t border-slate-800/80">
          <button
            onClick={() => {
              audioSynth.playSfx('click');
              onPlayAgain();
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95"
            id="play-again-btn"
          >
            <RotateCcw size={16} />
            <span>เล่นอีกครั้ง (กลับหน้าแรก)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
