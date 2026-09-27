export type ObstacleType = 'rock' | 'tree' | 'water';
export type LandmarkType = 'museum' | 'castle' | 'tower' | 'themepark' | 'diamond';

export interface GridObstacle {
  x: number; // 0-4
  y: number; // 0-4
  type: ObstacleType;
}

export interface GridLandmark {
  id: string;
  x: number; // 0-4
  y: number; // 0-4
  type: LandmarkType;
  name: string;
  points: number;
}

export interface HintSubMission {
  stepNumber: number;
  title: string;
  fromCoord: string;
  toCoord: string;
  description: string;
  suggestedBlocksText: string;
  pathCoords: { x: number; y: number }[];
  commands: { action: 'up' | 'down' | 'left' | 'right' | 'checkin'; repeat: number }[];
}

export interface LevelInteractiveHint {
  decompositionSummary: string;
  abstractionTip: string;
  patternExample: {
    title: string;
    uncompressed: string[];
    compressed: string;
    blocksSaved: number;
  };
  interactiveQuiz: {
    question: string;
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
      feedback: string;
    }[];
  };
  subMissions: HintSubMission[];
}

export interface GridLevelConfig {
  id: number;
  title: string;
  subtitle: string;
  targetCTPillar: string;
  startPos: { x: number; y: number };
  targetCount: Partial<Record<LandmarkType, number>>;
  landmarks: GridLandmark[];
  obstacles: GridObstacle[];
  targetBlocks3Star: number;
  interactiveHint: LevelInteractiveHint;
}

export const LANDMARK_INFO: Record<LandmarkType, { name: string; icon: string; points: number; color: string }> = {
  museum: { name: 'พิพิธภัณฑ์', icon: '🏛️', points: 15, color: 'from-amber-500 to-yellow-600' },
  castle: { name: 'ปราสาท', icon: '🏰', points: 20, color: 'from-violet-500 to-purple-600' },
  tower: { name: 'หอคอย', icon: '🗼', points: 25, color: 'from-cyan-500 to-blue-600' },
  themepark: { name: 'สวนสนุก', icon: '🎡', points: 30, color: 'from-rose-500 to-pink-600' },
  diamond: { name: 'เพชรสมบัติ', icon: '💎', points: 40, color: 'from-sky-400 to-cyan-500' },
};

export const GRID_LEVELS: GridLevelConfig[] = [
  {
    id: 1,
    title: 'ด่านที่ 1 : การเดินทางเบื้องต้น (เรียนรู้การเดินทางพื้นฐาน)',
    subtitle: 'การเดินทางเบื้องต้น (เรียนรู้การเดินทางพื้นฐาน)',
    targetCTPillar: 'การเดินทางเบื้องต้น (เรียนรู้การเดินทางพื้นฐาน)',
    startPos: { x: 0, y: 0 },
    targetCount: { museum: 1, castle: 1, themepark: 1 },
    landmarks: [
      { id: 'l1_m1', x: 0, y: 3, type: 'museum', name: 'พิพิธภัณฑ์วิทยาศาสตร์แห่งชาติ', points: 15 },
      { id: 'l1_c1', x: 2, y: 4, type: 'castle', name: 'ปราสาทโบราณจักรกล', points: 20 },
      { id: 'l1_tp1', x: 4, y: 0, type: 'themepark', name: 'สวนสนุกไอทีแลนด์', points: 30 },
    ],
    obstacles: [
      // ด่านที่ 1 (2 สิ่งกีดขวาง, 3 เป้าหมาย): เส้นทางเปิดโล่งสำหรับเริ่มต้นเรียนรู้การควบคุมพื้นฐาน
      { x: 1, y: 1, type: 'tree' },
      { x: 3, y: 2, type: 'rock' },
    ],
    targetBlocks3Star: 9,
    interactiveHint: {
      decompositionSummary: 'แบ่งการเดินทางออกเป็น 3 ช่วงย่อยตามลำดับเป้าหมายที่อยู่ใกล้ที่สุด: (0,0) → พิพิธภัณฑ์ (0,3) → ปราสาท (2,4) → สวนสนุก (4,0)',
      abstractionTip: 'สังเกตเฉพาะพิกัดเป้าหมายและต้นไม้ที่ (1,1) กับหินที่ (3,2) การเดินเลียบขอบซ้าย ขอบล่าง และขอบขวาจะปลอดภัยและไม่มีสิ่งกีดขวางเลย',
      patternExample: {
        title: 'การเดินขึ้นด้านบน 4 ช่องรวดจาก (4,4) ไปยังสวนสนุก (4,0)',
        uncompressed: ['⬆️ ขึ้นบน', '⬆️ ขึ้นบน', '⬆️ ขึ้นบน', '⬆️ ขึ้นบน'],
        compressed: '🔁 4x ⬆️ ขึ้นบน',
        blocksSaved: 3,
      },
      interactiveQuiz: {
        question: 'จากจุดเริ่มต้น (0,0) หากต้องการไปเช็คอินที่ พิพิธภัณฑ์ 🏛️ พิกัด (0,3) โดยไม่ชนต้นไม้ที่ (1,1) ควรเลือกวิธีใดจึงจะได้คะแนนประสิทธิภาพสูงสุด?',
        options: [
          {
            id: 'a',
            text: 'ใช้ลูป 🔁 3 รอบ ก้าวลงล่าง (⬇️) แล้วตามด้วยบล็อก 📍 เช็คอิน',
            isCorrect: true,
            feedback: 'ถูกต้อง! การใช้ลูปช่วยให้เดินลง 3 ช่องด้วยบล็อกเดียว และอย่าลืมกด 📍 เช็คอิน เมื่อถึงสถานที่ท่องเที่ยว',
          },
          {
            id: 'b',
            text: 'ก้าวเลี้ยวขวา (➡️) 1 ครั้ง แล้วก้าวลงล่าง (⬇️) 3 ครั้ง',
            isCorrect: false,
            feedback: 'ยังไม่ถูก! หากเลี้ยวขวาแล้วลงล่างจะชนต้นไม้ 🌲 ที่พิกัด (1,1) ทันที',
          },
          {
            id: 'c',
            text: 'เดินไปถึงพิกัด (0,3) แล้วเดินต่อไปปราสาทเลยโดยไม่ต้องกด 📍 เช็คอิน',
            isCorrect: false,
            feedback: 'ระวังนะ! สถานที่ท่องเที่ยว (🏛️, 🏰, 🗼, 🎡) ต้องใช้บล็อกคำสั่ง 📍 เช็คอิน ทุกครั้งเมื่อเดินไปถึง',
          },
        ],
      },
      subMissions: [
        {
          stepNumber: 1,
          title: 'ช่วงที่ 1: เดินไปพิพิธภัณฑ์ 🏛️',
          fromCoord: '0,0',
          toCoord: '0,3',
          description: 'เดินลงล่างตามแนวคอลัมน์ 0 จำนวน 3 ช่อง แล้วกดเช็คอิน',
          suggestedBlocksText: '🔁 3x ⬇️ ลงล่าง  →  📍 เช็คอิน',
          pathCoords: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }],
          commands: [
            { action: 'down', repeat: 3 },
            { action: 'checkin', repeat: 1 },
          ],
        },
        {
          stepNumber: 2,
          title: 'ช่วงที่ 2: เดินไปปราสาท 🏰',
          fromCoord: '0,3',
          toCoord: '2,4',
          description: 'ก้าวลงล่าง 1 ช่องไปที่มุม (0,4) แล้วเลี้ยวขวา 2 ช่องไปที่ปราสาท',
          suggestedBlocksText: '⬇️ ลงล่าง  →  🔁 2x ➡️ เลี้ยวขวา  →  📍 เช็คอิน',
          pathCoords: [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }],
          commands: [
            { action: 'down', repeat: 1 },
            { action: 'right', repeat: 2 },
            { action: 'checkin', repeat: 1 },
          ],
        },
        {
          stepNumber: 3,
          title: 'ช่วงที่ 3: เดินไปสวนสนุก 🎡',
          fromCoord: '2,4',
          toCoord: '4,0',
          description: 'เลี้ยวขวา 2 ช่องไปที่ (4,4) แล้วใช้ลูปขึ้นบน 4 ช่องรวดไปถึงสวนสนุก',
          suggestedBlocksText: '🔁 2x ➡️ เลี้ยวขวา  →  🔁 4x ⬆️ ขึ้นบน  →  📍 เช็คอิน',
          pathCoords: [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 4, y: 0 }],
          commands: [
            { action: 'right', repeat: 2 },
            { action: 'up', repeat: 4 },
            { action: 'checkin', repeat: 1 },
          ],
        },
      ],
    },
  },
  {
    id: 2,
    title: 'ด่านที่ 2 : เส้นทางที่ซับซ้อน (หลีกเลี่ยงสิ่งกีดขวางมากขึ้น)',
    subtitle: 'เส้นทางที่ซับซ้อน (หลีกเลี่ยงสิ่งกีดขวางมากขึ้น)',
    targetCTPillar: 'เส้นทางที่ซับซ้อน (หลีกเลี่ยงสิ่งกีดขวางมากขึ้น)',
    startPos: { x: 0, y: 4 },
    targetCount: { museum: 2, castle: 1, tower: 1 },
    landmarks: [
      { id: 'l2_m1', x: 0, y: 1, type: 'museum', name: 'พิพิธภัณฑ์ศิลปะแห่งที่ 1', points: 15 },
      { id: 'l2_c1', x: 2, y: 0, type: 'castle', name: 'ปราสาทแห่งอัลกอริทึม', points: 20 },
      { id: 'l2_m2', x: 4, y: 1, type: 'museum', name: 'พิพิธภัณฑ์แพทเทิร์นแห่งที่ 2', points: 15 },
      { id: 'l2_t1', x: 4, y: 4, type: 'tower', name: 'หอคอยสกายไลน์', points: 25 },
    ],
    obstacles: [
      // ด่านที่ 2 (3 สิ่งกีดขวาง, 4 เป้าหมาย - พิพิธภัณฑ์ 2 แห่ง): เริ่มมีสิ่งกีดขวางมากขึ้นและเป้าหมายซ้ำประเภท
      { x: 1, y: 2, type: 'tree' },
      { x: 2, y: 2, type: 'water' },
      { x: 3, y: 3, type: 'rock' },
    ],
    targetBlocks3Star: 10,
    interactiveHint: {
      decompositionSummary: 'แบ่งปัญหาเป็น 4 ช่วงเรียงตามเข็มนาฬิกา: (0,4) → พิพิธภัณฑ์ 1 (0,1) → ปราสาท (2,0) → พิพิธภัณฑ์ 2 (4,1) → หอคอย (4,4)',
      abstractionTip: 'ตัดพื้นที่ตรงกลางตารางที่มีต้นไม้ (1,2), บ่อน้ำ (2,2) และหิน (3,3) ออกจากการพิจารณา แล้วใช้เส้นทางเลียบขอบซ้าย-บน-ขวาแทน',
      patternExample: {
        title: 'การเดินขึ้นด้านซ้าย (3 ช่อง) และเดินลงด้านขวา (3 ช่อง) ที่สมมาตรกัน',
        uncompressed: ['⬆️ ขึ้นบน', '⬆️ ขึ้นบน', '⬆️ ขึ้นบน'],
        compressed: '🔁 3x ⬆️ ขึ้นบน (และ 🔁 3x ⬇️ ลงล่าง ในช่วงท้าย)',
        blocksSaved: 4,
      },
      interactiveQuiz: {
        question: 'ในด่านที่ 2 มีสิ่งกีดขวางขวางกั้นอยู่กลางแผนที่ และต้องเช็คอินพิพิธภัณฑ์ 🏛️ ถึง 2 แห่ง เส้นทางใดเหมาะสมที่สุดตามหลักการคิดเชิงนามธรรม?',
        options: [
          {
            id: 'a',
            text: 'เดินเลียบขอบซ้ายขึ้นไป (0,1) → เลียบขอบบนไป (2,0) → เลียบขอบขวาลงมา (4,1) และ (4,4)',
            isCorrect: true,
            feedback: 'ยอดเยี่ยม! การมองภาพรวมแล้วเลือกเส้นทางรูปเกือกม้าเลียบขอบตาราง ทำให้หลบสิ่งกีดขวางตรงกลางได้ 100% และเก็บครบทุกจุด',
          },
          {
            id: 'b',
            text: 'เดินตัดตรงกลางตารางผ่านพิกัด (1,2) และ (2,2) เพื่อย่นระยะทาง',
            isCorrect: false,
            feedback: 'ไม่ปลอดภัย! พิกัด (1,2) มีต้นไม้ และ (2,2) มีบ่อน้ำขวางอยู่ จะทำให้เสียหัวใจพลังชีวิต',
          },
          {
            id: 'c',
            text: 'เช็คอินพิพิธภัณฑ์ 🏛️ แค่จุดเดียวก็เพียงพอแล้ว',
            isCorrect: false,
            feedback: 'ลองดูที่แถบภารกิจด้านบนนะ ด่านนี้กำหนดเป้าหมาย 🏛️ 0/2 ต้องเช็คอินพิพิธภัณฑ์ให้ครบทั้ง 2 แห่ง',
          },
        ],
      },
      subMissions: [
        {
          stepNumber: 1,
          title: 'ช่วงที่ 1: ไปพิพิธภัณฑ์แห่งที่ 1 🏛️',
          fromCoord: '0,4',
          toCoord: '0,1',
          description: 'จากจุดเริ่มต้น (0,4) ใช้ลูปเดินขึ้นบน 3 ช่องไปที่ (0,1) แล้วเช็คอิน',
          suggestedBlocksText: '🔁 3x ⬆️ ขึ้นบน  →  📍 เช็คอิน',
          pathCoords: [{ x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }],
          commands: [
            { action: 'up', repeat: 3 },
            { action: 'checkin', repeat: 1 },
          ],
        },
        {
          stepNumber: 2,
          title: 'ช่วงที่ 2: ไปปราสาท 🏰',
          fromCoord: '0,1',
          toCoord: '2,0',
          description: 'ก้าวขึ้นบน 1 ช่องไปมุม (0,0) แล้วใช้ลูปเลี้ยวขวา 2 ช่องไปปราสาท (2,0)',
          suggestedBlocksText: '⬆️ ขึ้นบน  →  🔁 2x ➡️ เลี้ยวขวา  →  📍 เช็คอิน',
          pathCoords: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
          commands: [
            { action: 'up', repeat: 1 },
            { action: 'right', repeat: 2 },
            { action: 'checkin', repeat: 1 },
          ],
        },
        {
          stepNumber: 3,
          title: 'ช่วงที่ 3: ไปพิพิธภัณฑ์แห่งที่ 2 🏛️',
          fromCoord: '2,0',
          toCoord: '4,1',
          description: 'ใช้ลูปเลี้ยวขวา 2 ช่องไปที่ (4,0) แล้วก้าวลงล่าง 1 ช่องไปที่ (4,1)',
          suggestedBlocksText: '🔁 2x ➡️ เลี้ยวขวา  →  ⬇️ ลงล่าง  →  📍 เช็คอิน',
          pathCoords: [{ x: 3, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 }],
          commands: [
            { action: 'right', repeat: 2 },
            { action: 'down', repeat: 1 },
            { action: 'checkin', repeat: 1 },
          ],
        },
        {
          stepNumber: 4,
          title: 'ช่วงที่ 4: ไปหอคอย 🗼',
          fromCoord: '4,1',
          toCoord: '4,4',
          description: 'ใช้ลูปเดินลงล่าง 3 ช่องรวดไปที่หอคอย (4,4) แล้วเช็คอินปิดภารกิจ',
          suggestedBlocksText: '🔁 3x ⬇️ ลงล่าง  →  📍 เช็คอิน',
          pathCoords: [{ x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }],
          commands: [
            { action: 'down', repeat: 3 },
            { action: 'checkin', repeat: 1 },
          ],
        },
      ],
    },
  },
  {
    id: 3,
    title: 'ด่านที่ 3 : เกาะสมบัติ (ค้นหาสมบัติในเกาะลึกลับ)',
    subtitle: 'เกาะสมบัติ (ค้นหาสมบัติในเกาะลึกลับ)',
    targetCTPillar: 'เกาะสมบัติ (ค้นหาสมบัติในเกาะลึกลับ)',
    startPos: { x: 4, y: 0 },
    targetCount: { castle: 1, tower: 2, diamond: 2 },
    landmarks: [
      { id: 'l3_t1', x: 0, y: 0, type: 'tower', name: 'หอคอยประภาคารทิศเหนือ', points: 25 },
      { id: 'l3_d1', x: 2, y: 2, type: 'diamond', name: 'เพชรใจกลางเกาะสมบัติ', points: 40 },
      { id: 'l3_c1', x: 0, y: 4, type: 'castle', name: 'ปราสาทป้อมปราการชายฝั่ง', points: 20 },
      { id: 'l3_d2', x: 2, y: 4, type: 'diamond', name: 'เพชรมหาสมุทรใต้', points: 40 },
      { id: 'l3_t2', x: 4, y: 4, type: 'tower', name: 'หอคอยประภาคารทิศใต้', points: 25 },
    ],
    obstacles: [
      // ด่านที่ 3 (4 สิ่งกีดขวาง, 5 เป้าหมาย - หอคอย 2 แห่ง + เพชร 2 เม็ด)
      { x: 1, y: 1, type: 'water' },
      { x: 3, y: 1, type: 'rock' },
      { x: 1, y: 3, type: 'water' },
      { x: 3, y: 3, type: 'water' },
    ],
    targetBlocks3Star: 12,
    interactiveHint: {
      decompositionSummary: 'แบ่งเส้นทางเป็น 4 ช่วง: (4,0) → หอคอยเหนือ (0,0) → ปราสาท (0,4) → เก็บเพชร 2 เม็ดที่ (2,4) และ (2,2) → หอคอยใต้ (4,4)',
      abstractionTip: 'ข้อสังเกตสำคัญ: เพชรสมบัติ 💎 จะเก็บเข้ากระเป๋าอัตโนมัติทันทีที่เดินเหยียบช่องนั้น ไม่ต้องใส่บล็อก 📍 เช็คอิน (ช่วยประหยัดบล็อกได้มาก!)',
      patternExample: {
        title: 'การเดินระยะไกล 4 ช่องรวด และการเดินทีละ 2 ช่องซ้ำกันหลายช่วง',
        uncompressed: ['⬅️ เลี้ยวซ้าย', '⬅️ เลี้ยวซ้าย', '⬅️ เลี้ยวซ้าย', '⬅️ เลี้ยวซ้าย'],
        compressed: '🔁 4x ⬅️ เลี้ยวซ้าย (ใช้ 1 บล็อกแทน 4 บล็อก)',
        blocksSaved: 3,
      },
      interactiveQuiz: {
        question: 'เมื่อเดินไปถึงช่องที่มี เพชรสมบัติ 💎 ที่พิกัด (2,4) และ (2,2) ผู้เล่นต้องทำอย่างไรจึงจะเก็บเพชรได้และประหยัดบล็อกที่สุด?',
        options: [
          {
            id: 'a',
            text: 'เพียงแค่เดินผ่านหรือเดินไปเหยียบช่องที่มีเพชร 💎 ระบบจะเก็บเพชรให้อัตโนมัติโดยไม่ต้องใช้บล็อกเช็คอิน',
            isCorrect: true,
            feedback: 'ถูกต้อง! เพชร 💎 จะถูกเก็บอัตโนมัติทันทีที่ก้าวเหยียบ ส่วนหอคอย 🗼 และปราสาท 🏰 เท่านั้นที่ต้องกด 📍 เช็คอิน',
          },
          {
            id: 'b',
            text: 'ต้องกดปุ่ม 📍 เช็คอิน ทุกครั้งที่ยืนบนเพชร 💎 มิฉะนั้นจะไม่ได้เพชร',
            isCorrect: false,
            feedback: 'ไม่จำเป็นเลย! เพชร 💎 เก็บอัตโนมัติเมื่อเดินผ่าน การใส่บล็อกเช็คอินที่เพชรจะทำให้เปลืองบล็อกโดยไม่จำเป็น',
          },
          {
            id: 'c',
            text: 'เดินทะลุช่อง (1,1) หรือ (1,3) เพื่อไปเก็บเพชรตรงกลาง',
            isCorrect: false,
            feedback: 'ระวัง! ช่อง (1,1), (3,1), (1,3), (3,3) เป็นสิ่งกีดขวางทั้ง 4 มุม ต้องเดินเข้าทางช่องทางหลักแถว/คอลัมน์ 0, 2, 4 เท่านั้น',
          },
        ],
      },
      subMissions: [
        {
          stepNumber: 1,
          title: 'ช่วงที่ 1: ไปหอคอยทิศเหนือ 🗼',
          fromCoord: '4,0',
          toCoord: '0,0',
          description: 'จาก (4,0) ใช้ลูปเลี้ยวซ้าย 4 ช่องรวดไปที่ (0,0) แล้วกดเช็คอิน',
          suggestedBlocksText: '🔁 4x ⬅️ เลี้ยวซ้าย  →  📍 เช็คอิน',
          pathCoords: [{ x: 4, y: 0 }, { x: 3, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }],
          commands: [
            { action: 'left', repeat: 4 },
            { action: 'checkin', repeat: 1 },
          ],
        },
        {
          stepNumber: 2,
          title: 'ช่วงที่ 2: ลงไปปราสาทชายฝั่ง 🏰',
          fromCoord: '0,0',
          toCoord: '0,4',
          description: 'ใช้ลูปเดินลงล่าง 4 ช่องรวดไปที่ (0,4) แล้วกดเช็คอิน',
          suggestedBlocksText: '🔁 4x ⬇️ ลงล่าง  →  📍 เช็คอิน',
          pathCoords: [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }],
          commands: [
            { action: 'down', repeat: 4 },
            { action: 'checkin', repeat: 1 },
          ],
        },
        {
          stepNumber: 3,
          title: 'ช่วงที่ 3: กวาดเพชรสมบัติทั้ง 2 เม็ด 💎',
          fromCoord: '0,4',
          toCoord: '2,2',
          description: 'เลี้ยวขวา 2 ช่องเพื่อเก็บเพชรเม็ดแรกที่ (2,4) แล้วขึ้นบน 2 ช่องเก็บเพชรเม็ดที่สองที่ (2,2)',
          suggestedBlocksText: '🔁 2x ➡️ เลี้ยวขวา (เก็บ 💎)  →  🔁 2x ⬆️ ขึ้นบน (เก็บ 💎)',
          pathCoords: [{ x: 1, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 3 }, { x: 2, y: 2 }],
          commands: [
            { action: 'right', repeat: 2 },
            { action: 'up', repeat: 2 },
          ],
        },
        {
          stepNumber: 4,
          title: 'ช่วงที่ 4: ไปหอคอยทิศใต้ 🗼',
          fromCoord: '2,2',
          toCoord: '4,4',
          description: 'จากใจกลางเกาะ (2,2) เลี้ยวขวา 2 ช่อง แล้วลงล่าง 2 ช่องไปที่ (4,4) พร้อมเช็คอิน',
          suggestedBlocksText: '🔁 2x ➡️ เลี้ยวขวา  →  🔁 2x ⬇️ ลงล่าง  →  📍 เช็คอิน',
          pathCoords: [{ x: 3, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }],
          commands: [
            { action: 'right', repeat: 2 },
            { action: 'down', repeat: 2 },
            { action: 'checkin', repeat: 1 },
          ],
        },
      ],
    },
  },
  {
    id: 4,
    title: 'ด่านที่ 4 : ป่าใหญ่ (ผจญภัยในป่าทึบ)',
    subtitle: 'ป่าใหญ่ (ผจญภัยในป่าทึบ)',
    targetCTPillar: 'ป่าใหญ่ (ผจญภัยในป่าทึบ)',
    startPos: { x: 2, y: 2 },
    targetCount: { museum: 1, tower: 1, themepark: 2, diamond: 2 },
    landmarks: [
      { id: 'l4_d1', x: 0, y: 2, type: 'diamond', name: 'เพชรพงไพรตะวันตก', points: 40 },
      { id: 'l4_m1', x: 0, y: 0, type: 'museum', name: 'พิพิธภัณฑ์พฤกษศาสตร์ป่าใหญ่', points: 15 },
      { id: 'l4_tp1', x: 3, y: 0, type: 'themepark', name: 'สวนสนุกผจญภัยเรือนยอดไม้ 1', points: 30 },
      { id: 'l4_d2', x: 4, y: 1, type: 'diamond', name: 'เพชรมรกตแห่งป่าใหญ่', points: 40 },
      { id: 'l4_tp2', x: 4, y: 4, type: 'themepark', name: 'สวนสนุกผจญภัยน้ำตกป่าใหญ่ 2', points: 30 },
      { id: 'l4_t1', x: 0, y: 4, type: 'tower', name: 'หอคอยชมวิวป่าใหญ่', points: 25 },
    ],
    obstacles: [
      // ด่านที่ 4 (5 สิ่งกีดขวาง, 6 เป้าหมาย - สวนสนุก 2 แห่ง + เพชร 2 เม็ด)
      { x: 1, y: 1, type: 'tree' },
      { x: 2, y: 1, type: 'tree' },
      { x: 1, y: 3, type: 'tree' },
      { x: 2, y: 3, type: 'water' },
      { x: 3, y: 2, type: 'rock' },
    ],
    targetBlocks3Star: 14,
    interactiveHint: {
      decompositionSummary: 'เริ่มจากใจกลางป่า (2,2) ออกทางช่องเปิดด้านซ้ายไป (0,2) → ลงไปหอคอย (0,4) → ขึ้นไปพิพิธภัณฑ์ (0,0) → ขวาไปสวนสนุก 1 (3,0) → ลงขวาสุดผ่านเพชร (4,1) ไปจบที่สวนสนุก 2 (4,4)',
      abstractionTip: 'รอบจุดเริ่มต้น (2,2) มีสิ่งกีดขวางปิดทางด้านบน (2,1), ด้านล่าง (2,3), และด้านขวา (3,2) ดังนั้นทางออกเดียวที่ปลอดภัยจากจุดเริ่มต้นคือ "เดินเลี้ยวซ้าย ⬅️"',
      patternExample: {
        title: 'การเดินลงคอลัมน์ขวาสุด 4 ช่องรวด เพื่อเก็บเพชร (4,1) ระหว่างทางไปสวนสนุก (4,4)',
        uncompressed: ['⬇️ ลงล่าง (เก็บ 💎)', '⬇️ ลงล่าง', '⬇️ ลงล่าง', '⬇️ ลงล่าง'],
        compressed: '🔁 4x ⬇️ ลงล่าง (เดินผ่านเพชรและเก็บให้อัตโนมัติระหว่างลูป!)',
        blocksSaved: 3,
      },
      interactiveQuiz: {
        question: 'ตัวละครเริ่มที่ใจกลางป่า (2,2) ซึ่งถูกล้อมด้วยต้นไม้ (2,1), บ่อน้ำ (2,3) และหิน (3,2) คำสั่งแรกสุดที่ต้องใช้เพื่อออกจากจุดเริ่มต้นโดยไม่เสียหัวใจคือข้อใด?',
        options: [
          {
            id: 'a',
            text: 'ใช้ลูป 🔁 2 รอบ เลี้ยวซ้าย (⬅️) เพื่อออกทางช่องว่าง (1,2) และเก็บเพชรที่ (0,2)',
            isCorrect: true,
            feedback: 'ถูกต้อง! ทิศซ้าย (1,2) เป็นทางออกเดียวที่ไม่ถูกสิ่งกีดขวางปิดกั้น และยังพาไปเก็บเพชร 💎 ที่ (0,2) ได้ทันที',
          },
          {
            id: 'b',
            text: 'ก้าวขึ้นบน (⬆️) เพื่อไปพิพิธภัณฑ์และสวนสนุกด้านบนก่อน',
            isCorrect: false,
            feedback: 'ระวัง! ช่อง (2,1) เหนือจุดเริ่มต้นมีต้นไม้ 🌲 ขวางอยู่ หากเดินขึ้นบนจะชนทันที',
          },
          {
            id: 'c',
            text: 'ก้าวเลี้ยวขวา (➡️) เพื่อไปเก็บเพชรฝั่งขวา',
            isCorrect: false,
            feedback: 'ช่อง (3,2) ทางขวามือมีก้อนหิน 🪨 ขวางอยู่ ต้องออกทางฝั่งซ้ายก่อนแล้วค่อยอ้อมขึ้นด้านบน',
          },
        ],
      },
      subMissions: [
        {
          stepNumber: 1,
          title: 'ช่วงที่ 1: ออกทางซ้ายเก็บเพชร 💎 และไปหอคอย 🗼',
          fromCoord: '2,2',
          toCoord: '0,4',
          description: 'เลี้ยวซ้าย 2 ช่องเก็บเพชรที่ (0,2) แล้วลงล่าง 2 ช่องไปเช็คอินหอคอย (0,4)',
          suggestedBlocksText: '🔁 2x ⬅️ เลี้ยวซ้าย (เก็บ 💎)  →  🔁 2x ⬇️ ลงล่าง  →  📍 เช็คอิน',
          pathCoords: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }],
          commands: [
            { action: 'left', repeat: 2 },
            { action: 'down', repeat: 2 },
            { action: 'checkin', repeat: 1 },
          ],
        },
        {
          stepNumber: 2,
          title: 'ช่วงที่ 2: ขึ้นไปพิพิธภัณฑ์ป่าใหญ่ 🏛️',
          fromCoord: '0,4',
          toCoord: '0,0',
          description: 'ใช้ลูปเดินขึ้นบน 4 ช่องรวดจาก (0,4) ไปถึง (0,0) แล้วกดเช็คอิน',
          suggestedBlocksText: '🔁 4x ⬆️ ขึ้นบน  →  📍 เช็คอิน',
          pathCoords: [{ x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 }],
          commands: [
            { action: 'up', repeat: 4 },
            { action: 'checkin', repeat: 1 },
          ],
        },
        {
          stepNumber: 3,
          title: 'ช่วงที่ 3: ไปสวนสนุกแห่งที่ 1 🎡',
          fromCoord: '0,0',
          toCoord: '3,0',
          description: 'ใช้ลูปเลี้ยวขวา 3 ช่องตามขอบบนไปที่ (3,0) แล้วกดเช็คอิน',
          suggestedBlocksText: '🔁 3x ➡️ เลี้ยวขวา  →  📍 เช็คอิน',
          pathCoords: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
          commands: [
            { action: 'right', repeat: 3 },
            { action: 'checkin', repeat: 1 },
          ],
        },
        {
          stepNumber: 4,
          title: 'ช่วงที่ 4: เก็บเพชรเม็ดที่ 2 💎 และไปสวนสนุกแห่งที่ 2 🎡',
          fromCoord: '3,0',
          toCoord: '4,4',
          description: 'เลี้ยวขวา 1 ช่องไปมุม (4,0) แล้วใช้ลูปลงล่าง 4 ช่องรวด (เก็บเพชรที่ 4,1 อัตโนมัติ) ไปเช็คอินที่ (4,4)',
          suggestedBlocksText: '➡️ เลี้ยวขวา  →  🔁 4x ⬇️ ลงล่าง (ผ่านเก็บ 💎)  →  📍 เช็คอิน',
          pathCoords: [{ x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }],
          commands: [
            { action: 'right', repeat: 1 },
            { action: 'down', repeat: 4 },
            { action: 'checkin', repeat: 1 },
          ],
        },
      ],
    },
  },
  {
    id: 5,
    title: 'ด่านที่ 5 : เมืองโบราณลึกลับ (ผจญภัยครั้งสุดท้ายในเมืองโบราณที่เต็มไปด้วยสมบัติ)',
    subtitle: 'เมืองโบราณลึกลับ (ผจญภัยครั้งสุดท้ายในเมืองโบราณที่เต็มไปด้วยสมบัติ)',
    targetCTPillar: 'เมืองโบราณลึกลับ (ผจญภัยครั้งสุดท้ายในเมืองโบราณที่เต็มไปด้วยสมบัติ)',
    startPos: { x: 0, y: 4 },
    targetCount: { museum: 2, castle: 2, tower: 1, diamond: 2 },
    landmarks: [
      { id: 'l5_c1', x: 0, y: 1, type: 'castle', name: 'ปราสาทศิลาโบราณทิศตะวันตก', points: 20 },
      { id: 'l5_d1', x: 0, y: 0, type: 'diamond', name: 'เพชรรัตติกาลโบราณ', points: 40 },
      { id: 'l5_m1', x: 2, y: 0, type: 'museum', name: 'พิพิธภัณฑ์จารึกโบราณแห่งที่ 1', points: 15 },
      { id: 'l5_d2', x: 2, y: 2, type: 'diamond', name: 'เพชรจักรพรรดิใจกลางเมือง', points: 40 },
      { id: 'l5_m2', x: 2, y: 4, type: 'museum', name: 'พิพิธภัณฑ์วัตถุโบราณแห่งที่ 2', points: 15 },
      { id: 'l5_c2', x: 4, y: 4, type: 'castle', name: 'ปราสาทศิลาโบราณทิศตะวันออก', points: 20 },
      { id: 'l5_t1', x: 4, y: 1, type: 'tower', name: 'หอคอยสุริยะเทพโบราณ', points: 25 },
    ],
    obstacles: [
      // ด่านที่ 5 (6 สิ่งกีดขวาง, 7 เป้าหมาย - พิพิธภัณฑ์ 2 + ปราสาท 2 + หอคอย 1 + เพชร 2)
      { x: 1, y: 1, type: 'rock' },
      { x: 1, y: 2, type: 'rock' },
      { x: 1, y: 3, type: 'water' },
      { x: 3, y: 1, type: 'rock' },
      { x: 3, y: 2, type: 'tree' },
      { x: 3, y: 3, type: 'water' },
    ],
    targetBlocks3Star: 15,
    interactiveHint: {
      decompositionSummary: 'แบ่งเมืองโบราณออกเป็น 3 คอลัมน์หลัก (ซ้าย x=0, กลาง x=2, ขวา x=4) เคลื่อนที่แบบซิกแซก (ขึ้นคอลัมน์ซ้าย → ลงคอลัมน์กลาง → ขึ้นคอลัมน์ขวา)',
      abstractionTip: 'คอลัมน์ที่ 1 (x=1) และคอลัมน์ที่ 3 (x=3) มีกำแพงสิ่งกีดขวางกั้นตรงกลาง แต่มีช่องทางเชื่อมที่แถวบนสุด (y=0) และแถวล่างสุด (y=4)',
      patternExample: {
        title: 'รูปแบบซิกแซก S-Curve: ขึ้นคอลัมน์ซ้าย → เลี้ยวขวา 2 → ลงคอลัมน์กลาง → เลี้ยวขวา 2 → ขึ้นคอลัมน์ขวา',
        uncompressed: ['⬇️ ลงล่าง', '⬇️ ลงล่าง (เก็บ 💎)', '⬇️ ลงล่าง', '⬇️ ลงล่าง'],
        compressed: '🔁 4x ⬇️ ลงล่าง (กวาดผ่านคอลัมน์กลางจาก 2,0 ลงมา 2,4 พร้อมเก็บเพชร 2,2 อัตโนมัติ)',
        blocksSaved: 3,
      },
      interactiveQuiz: {
        question: 'ในด่านที่ 5 กำแพงสิ่งกีดขวางกั้นอยู่ตลอดแนวคอลัมน์ x=1 และ x=3 ยกเว้นแถวบนสุด (y=0) และแถวล่างสุด (y=4) รูปแบบการเดินใดทำให้เก็บครบทั้ง 7 เป้าหมายโดยไม่ย้อนกลับซ้ำ?',
        options: [
          {
            id: 'a',
            text: 'เดินรูปตัว S: ขึ้นคอลัมน์ซ้ายสุด → ข้ามแถวบนไปลงคอลัมน์กลาง → ข้ามแถวล่างไปขึ้นคอลัมน์ขวาสุด',
            isCorrect: true,
            feedback: 'สุดยอดนักคิดเชิงคำนวณ! เส้นทางรูปตัว S (S-Curve) ช่วยให้กวาดครบทั้ง 7 เป้าหมายใน 3 คอลัมน์ด้วยจำนวนบล็อกเพียง 11 บล็อก',
          },
          {
            id: 'b',
            text: 'เดินสลับซ้าย-ขวาตัดผ่านแถวกลาง (y=2)',
            isCorrect: false,
            feedback: 'แถวกลางที่ (1,2) และ (3,2) มีหินและต้นไม้กั้นอยู่ ไม่สามารถเดินตัดข้ามคอลัมน์ตรงกลางได้',
          },
          {
            id: 'c',
            text: 'หยุดกด 📍 เช็คอิน ที่เพชร (2,2) ก่อนเดินลงมาที่พิพิธภัณฑ์ (2,4)',
            isCorrect: false,
            feedback: 'ไม่ต้องหยุดเช็คอินที่เพชรนะ! ใช้ลูป 🔁 4x ⬇️ ลงล่าง รวดเดียวจาก (2,0) ลงมา (2,4) เพชรที่ (2,2) จะถูกเก็บให้อัตโนมัติทันทีที่เดินผ่าน',
          },
        ],
      },
      subMissions: [
        {
          stepNumber: 1,
          title: 'ช่วงที่ 1: กวาดคอลัมน์ซ้าย (ปราสาท 1 🏰 + เพชร 1 💎)',
          fromCoord: '0,4',
          toCoord: '0,0',
          description: 'จาก (0,4) ใช้ลูปขึ้นบน 3 ช่องไปเช็คอินปราสาท (0,1) แล้วก้าวขึ้นอีก 1 ช่องเพื่อเก็บเพชรที่ (0,0)',
          suggestedBlocksText: '🔁 3x ⬆️ ขึ้นบน  →  📍 เช็คอิน  →  ⬆️ ขึ้นบน (เก็บ 💎)',
          pathCoords: [{ x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 }],
          commands: [
            { action: 'up', repeat: 3 },
            { action: 'checkin', repeat: 1 },
            { action: 'up', repeat: 1 },
          ],
        },
        {
          stepNumber: 2,
          title: 'ช่วงที่ 2: กวาดคอลัมน์กลาง (พิพิธภัณฑ์ 1 🏛️ + เพชร 2 💎 + พิพิธภัณฑ์ 2 🏛️)',
          fromCoord: '0,0',
          toCoord: '2,4',
          description: 'เลี้ยวขวา 2 ช่องไปเช็คอินพิพิธภัณฑ์ (2,0) แล้วใช้ลูปลงล่าง 4 ช่องรวด (เก็บเพชร 2,2 อัตโนมัติ) ไปเช็คอินพิพิธภัณฑ์ (2,4)',
          suggestedBlocksText: '🔁 2x ➡️ เลี้ยวขวา  →  📍 เช็คอิน  →  🔁 4x ⬇️ ลงล่าง (ผ่านเก็บ 💎)  →  📍 เช็คอิน',
          pathCoords: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }],
          commands: [
            { action: 'right', repeat: 2 },
            { action: 'checkin', repeat: 1 },
            { action: 'down', repeat: 4 },
            { action: 'checkin', repeat: 1 },
          ],
        },
        {
          stepNumber: 3,
          title: 'ช่วงที่ 3: กวาดคอลัมน์ขวา (ปราสาท 2 🏰 + หอคอย 🗼)',
          fromCoord: '2,4',
          toCoord: '4,1',
          description: 'เลี้ยวขวา 2 ช่องไปเช็คอินปราสาท (4,4) แล้วใช้ลูปขึ้นบน 3 ช่องไปเช็คอินหอคอย (4,1)',
          suggestedBlocksText: '🔁 2x ➡️ เลี้ยวขวา  →  📍 เช็คอิน  →  🔁 3x ⬆️ ขึ้นบน  →  📍 เช็คอิน',
          pathCoords: [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }],
          commands: [
            { action: 'right', repeat: 2 },
            { action: 'checkin', repeat: 1 },
            { action: 'up', repeat: 3 },
            { action: 'checkin', repeat: 1 },
          ],
        },
      ],
    },
  },
];
