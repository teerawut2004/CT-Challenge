export interface FilterItem {
  text: string;
  isEssential: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'sequence' | 'toolbox' | 'matching' | 'categorize' | 'filter-data';
  question: string;
  description?: string;
  options?: string[]; // for multiple-choice / strategy selection
  items?: string[]; // for sequence / algorithm planning
  
  // For matching (จับคู่ / ค้นหารูปแบบ)
  matchingLeft?: string[];
  matchingRight?: string[];
  
  // For categorize (แยกปัญหา / จัดกลุ่ม)
  categories?: string[];
  categorizeItems?: { text: string; categoryIdx: number }[];
  
  // For filter-data (เลือกข้อมูลสำคัญ / Abstraction)
  filterItems?: FilterItem[];
  
  correctAnswer: any; // index for MC, array of indices for sequence, correct matched pairs array, category assignments map, or array of indices for filter-data
  hint: string;
  debugHint?: string; // guidance for debugging errors
  visualType?: 'car' | 'fan' | 'rocket' | 'bicycle' | 'travel' | 'radar' | 'shape' | 'font' | 'map' | 'house' | 'noodle' | 'flowchart' | 'binary' | 'wisdom' | 'weather-radar' | 'number-sequence' | 'animal-grouping' | 'robot-loop' | 'dictionary-search' | 'algorithm-correctness' | 'pseudocode' | 'sports-decom' | 'heart-filter' | 'fire-exit' | 'wifi-login' | 'app-dev' | 'science-project' | 'atm' | 'sorting' | 'spam-email' | 'traffic' | 'traffic-sign' | 'student-id' | 'game-var' | 'linear-search' | 'shopping-cart' | 'vending-machine' | 'geometry-calc';
}

export interface Level {
  id: number;
  name: string;
  thaiName: string;
  concept: string;
  conceptDescription: string;
  facilityName: string;
  iconName: string;
  accentColor: string;
  bgColor: string;
  questions: Question[];
}

export interface BossScenario {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export const questionsData: Level[] = [
  {
    id: 1,
    name: "Level 1",
    thaiName: "การเดินทางเบื้องต้น (เรียนรู้การเดินทางพื้นฐาน)",
    concept: "Decomposition",
    conceptDescription: "เป็นการย่อยปัญหาหรือระบบที่ซับซ้อนออกเป็นส่วนย่อยๆ ที่มีขนาดเล็กลง เพื่อให้จัดการและแก้ไขได้ง่ายขึ้น เช่น การแยกแยะชิ้นส่วนของพัดลมออกเป็นมอเตอร์ ใบพัด ตะแกรง หรือการซอยโครงการใหญ่ออกเป็นภารกิจสั้นๆ ช่วยให้แต่ละปัญหาย่อยวิเคราะห์และแก้ไขได้ตรงจุดยิ่งขึ้น",
    facilityName: "ฐานปฏิบัติการย่อยปัญหา",
    iconName: "Puzzle",
    accentColor: "text-cyan-400 bg-cyan-950/40 border-cyan-500/50 hover:bg-cyan-900/50",
    bgColor: "from-cyan-950 to-blue-950",
    questions: [
      {
        id: "d1",
        type: "categorize",
        question: "วิเคราะห์สถานการณ์: 'รถจักรยานยนต์สตาร์ทไม่ติด' จงแยกย่อยปัญหา (Decomposition) โดยจัดกลุ่มว่าส่วนใดคือ 'ระบบสำคัญที่มีผลต่อการสตาร์ท' และส่วนใดคือ 'ชิ้นส่วนภายนอกที่ไม่เกี่ยวกับการสตาร์ท'",
        categories: [
          "ระบบสำคัญที่มีผลต่อการสตาร์ท",
          "ชิ้นส่วนภายนอกที่ไม่เกี่ยวกับการสตาร์ท"
        ],
        categorizeItems: [
          { text: "ระบบหัวเทียนและระบบไฟจุดระเบิด", categoryIdx: 0 },
          { text: "ระบบน้ำมันเชื้อเพลิงและคาร์บูเรเตอร์", categoryIdx: 0 },
          { text: "แบตเตอรี่และมอเตอร์สตาร์ทไฟฟ้า", categoryIdx: 0 },
          { text: "กระจกมองหลังและลวดลายสติกเกอร์", categoryIdx: 1 },
          { text: "ลวดลายดอกยางและบังโคลนหน้ารถ", categoryIdx: 1 }
        ],
        correctAnswer: [0, 0, 0, 1, 1],
        hint: "การคิดเชิงย่อยปัญหา (Decomposition) ควรมองหาส่วนประกอบย่อยที่มีผลกระทบและเกี่ยวข้องโดยตรงต่อการสตาร์ทเครื่องยนต์",
        visualType: "car"
      }
    ]
  },
  {
    id: 2,
    name: "Level 2",
    thaiName: "เส้นทางที่ซับซ้อน (หลีกเลี่ยงสิ่งกีดขวางมากขึ้น)",
    concept: "Pattern Recognition",
    conceptDescription: "เป็นการหารูปแบบ ความสัมพันธ์ หรือลักษณะร่วมกันของสิ่งต่างๆ เพื่อนำแนวทางที่เคยใช้ได้ผลในอดีตมาประยุกต์แก้ไขปัญหาใหม่ เช่น การเปรียบเทียบความคล้ายกันของเกียร์จักรยานกับระบบรอก หรือการสังเกตสถิติฝนตกเพื่อทำนายความต้องการซื้อร่ม ช่วยประหยัดเวลาและสร้างระบบประมวลผลที่แม่นยำ",
    facilityName: "ฐานปฏิบัติการค้นหารูปแบบ",
    iconName: "Binary",
    accentColor: "text-purple-400 bg-purple-950/40 border-purple-500/50 hover:bg-purple-900/50",
    bgColor: "from-purple-950 to-indigo-950",
    questions: [
      {
        id: "p1",
        type: "matching",
        question: "วิเคราะห์รูปแบบกลไก: จงจับคู่ 'ระบบส่งกำลังทางกล' ที่มีรูปแบบการทำงาน (Pattern) สอดคล้องตรงกันตามหลัก Pattern Recognition",
        matchingLeft: [
          "1. โซ่และสเตอร์ของรถจักรยาน",
          "2. สายพานลำเลียงกล่องสินค้าในโรงงาน",
          "3. ฟันเฟืองขบกันในนาฬิกาไขลาน"
        ],
        matchingRight: [
          "ถ่ายทอดแรงหมุนผ่านข้อต่อโซ่โลหะที่คล้องระหว่างแกน",
          "ถ่ายทอดแรงหมุนผ่านแรงเสียดทานของสายพานยางรอบลูกกลิ้ง",
          "ถ่ายทอดแรงบิดและปรับอัตราทดผ่านซี่ฟันที่สบกันโดยตรง"
        ],
        correctAnswer: [0, 1, 2],
        hint: "Pattern ของระบบส่งกำลัง: โซ่-ข้อต่อ, สายพาน-แรงเสียดทาน, ฟันเฟือง-ซี่ฟันขบกัน",
        visualType: "bicycle"
      }
    ]
  },
  {
    id: 3,
    name: "Level 3",
    thaiName: "เกาะสมบัติ (ค้นหาสมบัติในเกาะลึกลับ)",
    concept: "Abstraction",
    conceptDescription: "เป็นการคัดแยกเฉพาะข้อมูลสำคัญและจำเป็นต่อการแก้ปัญหา และละทิ้งรายละเอียดปลีกย่อยที่ไม่เกี่ยวข้องออกไป เช่น การมองแผนที่รถไฟฟ้าที่ระบุเพียงสถานีและเส้นทางโยงโดยตัดภาพตึกหรือถนนจริงออกไป ช่วยให้เข้าใจโครงสร้างหลักและตัดสินใจได้รวดเร็วขึ้น",
    facilityName: "ฐานปฏิบัติการสกัดแก่นสาระ",
    iconName: "Layers",
    accentColor: "text-pink-400 bg-pink-950/40 border-pink-500/50 hover:bg-pink-900/50",
    bgColor: "from-pink-950 to-purple-950",
    questions: [
      {
        id: "a1",
        type: "filter-data",
        question: "วิเคราะห์ข้อมูลสำคัญ (Abstraction): ในการพัฒนาระบบ 'บัตรประจำตัวนักเรียนดิจิทัล' จงคลิกคัดเลือกเฉพาะ 'ข้อมูลจำเป็น (Essential Data)' ที่ต้องจัดเก็บบนบัตร และตัดทอนข้อมูลส่วนเกินออก",
        filterItems: [
          { text: "เลขประจำตัวนักเรียน 5 หลัก", isEssential: true },
          { text: "ชื่อ - นามสกุล ของนักเรียน", isEssential: true },
          { text: "ระดับชั้นและห้องเรียนปัจจุบัน", isEssential: true },
          { text: "รูปถ่ายหน้าตรงของนักเรียน", isEssential: true },
          { text: "สีเสื้อตัวโปรดที่ชอบใส่ในวันหยุด", isEssential: false },
          { text: "ยี่ห้อรองเท้าผ้าใบที่ใส่มาเรียน", isEssential: false },
          { text: "ชื่อสัตว์เลี้ยงที่บ้าน", isEssential: false }
        ],
        correctAnswer: [0, 1, 2, 3],
        hint: "Abstraction: มุ่งเน้นเฉพาะข้อมูลจำเป็นต่อการยืนยันตัวตนทางการศึกษา (รหัส, ชื่อ, ชั้น, รูปถ่าย) และตัดรายละเอียดส่วนเกินออกไป",
        visualType: "student-id"
      }
    ]
  },
  {
    id: 4,
    name: "Level 4",
    thaiName: "ป่าใหญ่ (ผจญภัยในป่าทึบ)",
    concept: "Algorithm",
    conceptDescription: "เป็นการออกแบบกระบวนการแก้ปัญหาอย่างเป็นลำดับขั้นตอน (Step-by-step) ที่มีความชัดเจนและไม่คลุมเครือ เพื่อให้คนหรือคอมพิวเตอร์สามารถนำไปปฏิบัติได้อย่างถูกต้อง เช่น ขั้นตอนการต้มบะหมี่สำเร็จรูป หรือขั้นตอนการสืบค้นข้อมูลในพจนานุกรมเล่มหนาด้วยวิธีแบ่งครึ่งอย่างเป็นระบบ\n\n สัญลักษณ์พื้นฐานในการเขียนผังงาน (Flowchart) ที่สำคัญ:\n• วงรี (Terminator): จุดเริ่มต้นและจุดสิ้นสุด (Start / End)\n• สี่เหลี่ยมผืนผ้า (Process): กระบวนการทำงาน หรือการคำนวณ\n• สี่เหลี่ยมขนมเปียกปูน (Decision): การตัดสินใจ หรือตรวจสอบเงื่อนไข (ใช่/ไม่ใช่)\n• สี่เหลี่ยมด้านขนาน (Input/Output): การรับข้อมูลเข้า หรือแสดงผลลัพธ์\n• ลูกศร (Flowline): ทิศทางและลำดับขั้นตอนการทำงาน",
    facilityName: "ฐานปฏิบัติการลำดับขั้นตอนวิธี",
    iconName: "FileCode",
    accentColor: "text-amber-400 bg-amber-950/40 border-amber-500/50 hover:bg-amber-900/50",
    bgColor: "from-amber-950 to-orange-950",
    questions: [
      {
        id: "al1",
        type: "sequence",
        question: "จัดลำดับขั้นตอนวิธี (Algorithm Design): จงช่วยเรียงลำดับขั้นตอนวิธี 'การสืบค้นหาคำศัพท์ในพจนานุกรมเล่มหนาแบบทวิภาค (Binary Search / ค้นหาแบบแบ่งครึ่ง)' ให้ถูกต้องตามลำดับตรรกะ พร้อมสั่งรันคำสั่ง",
        items: [
          "1. เปิดหน้ากระดาษตรงกึ่งกลางเล่มพจนานุกรมพิจารณาคำศัพท์หน้านั้น",
          "2. เปรียบเทียบคำศัพท์ที่ต้องการค้นหากับคำศัพท์ที่ระบุตรงหน้ากึ่งกลางนั้น",
          "3. หากยังไม่ใช่ตัวสะกดที่หา ให้ตัดครึ่งเล่มฝั่งที่ไม่สอดคล้องออกไป และสนใจเฉพาะส่วนที่เหลือ",
          "4. ทำซ้ำขั้นตอนแบ่งครึ่งและคัดเลือกฝั่งที่สัมพันธ์ต่อเนื่องจนพบหน้าคำศัพท์เป้าหมายอย่างแม่นยำ"
        ],
        correctAnswer: [0, 1, 2, 3],
        hint: "Algorithm Design: พฤติกรรมค้นหาแบบแบ่งครึ่งเริ่มจากการเทียบกึ่งกลาง -> ตัดครึ่งหนึ่ง -> เดินสเต็ปหาต่อในส่วนที่ร่นระยะเข้ามา",
        debugHint: "ข้อผิดพลาด: ต้องเปิดตรงกึ่งกลางเล่มและเปรียบเทียบคำศัพท์ก่อน จึงจะสามารถตัดส่วนที่ไม่เกี่ยวข้องออกได้!",
        visualType: "dictionary-search"
      }
    ]
  },
  {
    id: 5,
    name: "Level 5",
    thaiName: "เมืองโบราณลึกลับ (ผจญภัยครั้งสุดท้ายในเมืองโบราณที่เต็มไปด้วยสมบัติ)",
    concept: "4-Pillars Integrated Challenge",
    conceptDescription: "การประยุกต์ใช้ทักษะการคิดเชิงคำนวณครบทั้ง 4 ด้าน (Decomposition, Pattern Recognition, Abstraction, และ Algorithm Design) เพื่อวางแผนและแก้ปัญหาในสถานการณ์จริงได้อย่างเป็นระบบ",
    facilityName: "ลานภารกิจทัศนศึกษา ม.2",
    iconName: "Flame",
    accentColor: "text-rose-400 bg-rose-950/40 border-rose-500/50 hover:bg-rose-900/50",
    bgColor: "from-rose-950 to-red-950",
    questions: [
      {
        id: "b_integrated",
        type: "multiple-choice",
        question: "จากสถานการณ์ทัศนศึกษานอกสถานที่ของนักเรียนชั้น ม.2 หากต้องประยุกต์ใช้ทักษะการคิดเชิงคำนวณ 'ครบทั้ง 4 ด้าน' เพื่อออกแบบระบบบริหารจัดการการเดินทางให้ปลอดภัยและมีประสิทธิภาพสูงสุด ข้อใดอธิบายการนำทักษะทั้ง 4 ด้านไปปฏิบัติได้อย่างถูกต้อง ครบถ้วน และตรงตามหลักการที่สุด?",
        options: [
          "1) Decomposition: แยกย่อยระบบออกเป็น 3 ฝ่ายงาน (ยานพาหนะ, ข้อมูลสุขภาพ/ยาประจำตัว, งบประมาณ)\n2) Pattern Recognition: สังเกตสถิติจราจรพบช่วงเช้าถนนสายหลักรถติดหนัก จึงปรับเวลาออกเดินทางเป็น 06:45 น.\n3) Abstraction: บันทึกเฉพาะข้อมูลจำเป็น (ชื่อ-สกุล, เบอร์ฉุกเฉิน, ประวัติแพ้ยา) และตัดข้อมูลส่วนเกิน (สีชุดโปรด, ของเล่น)\n4) Algorithm Design: วางขั้นตอนวิธีเช็กชื่อและขึ้นรถอย่างเป็นระบบ พร้อมเงื่อนไขตรวจสอบหากนักเรียนมาไม่ครบ",
          
          "1) Decomposition: เลือกบันทึกเฉพาะข้อมูลชื่อและเบอร์ฉุกเฉินของนักเรียน\n2) Pattern Recognition: แบ่งงานออกเป็นฝ่ายยานพาหนะและฝ่ายงบประมาณ\n3) Abstraction: เขียนผังงาน Flowchart ขั้นตอนการเช็กชื่อขึ้นรถ\n4) Algorithm Design: ตรวจดูสถิติจราจรในอดีตเพื่อกำหนดเวลาเดินทาง",
          
          "1) Decomposition: ให้นักเรียนทุกคนแยกย้ายหาวิธีเดินทางด้วยตนเองโดยไม่ต้องมีฝ่ายประสานงาน\n2) Pattern Recognition: สุ่มเลือกเส้นทางใหม่ทุกๆ 15 นาทีโดยไม่ใช้ข้อมูลแผนที่\n3) Abstraction: จัดเก็บข้อมูลทุกอย่างของนักเรียนอย่างละเอียดรวมถึงเกมที่ชอบเล่นและรายชื่อเพื่อนสนิท\n4) Algorithm Design: สั่งออกเดินทางทันทีโดยไม่ต้องเรียงลำดับขั้นตอนและไม่ต้องตั้งเงื่อนไขเช็กชื่อ",
          
          "1) Decomposition: รวมภาระงานทั้งหมดให้ครูผู้ดูแลเพียงท่านเดียวเป็นผู้ตัดสินใจทุกเรื่อง\n2) Pattern Recognition: นำสูตรคำนวณทางฟิสิกส์ชั้นสูงมาใช้แทนการสังเกตสภาพการจราจรจริง\n3) Abstraction: ตัดทอนข้อมูลประวัติแพ้ยาและเบอร์โทรฉุกเฉินออกทั้งหมดเพื่อประหยัดพื้นที่กระดาษ\n4) Algorithm Design: ปล่อยให้เหตุการณ์ดำเนินไปตามความสะดวกหน้างานโดยไม่มีแผนผังขั้นตอนสำรอง"
        ],
        correctAnswer: 0,
        hint: "การประยุกต์ทักษะทั้ง 4 ด้าน:\n• Decomposition = ซอยย่อยระบบใหญ่เป็นฝ่ายงานย่อย\n• Pattern Recognition = นำสถิติจราจรที่พบซ้ำมาปรับเวลาเดินทาง\n• Abstraction = เก็บเฉพาะข้อมูลจำเป็นต่อความปลอดภัย (ชื่อ, เบอร์ฉุกเฉิน, ยา)\n• Algorithm Design = วางขั้นตอนเช็กชื่อเป็นสเต็ปพร้อมเงื่อนไขตรวจสอบ",
        debugHint: "ข้อผิดพลาด: พิจารณาความหมายของแต่ละทักษะให้ถูกต้อง: การแบ่งฝ่ายงานคืองานย่อย (Decomposition), การดูเวลารถติดคือแพทเทิร์น (Pattern), การเลือกเฉพาะเบอร์ฉุกเฉินคือแก่นสำคัญ (Abstraction), และการจัดลำดับเช็กชื่อคืออัลกอริทึม (Algorithm)!",
        visualType: "flowchart"
      }
    ]
  }
];

export const bossScenariosPool: BossScenario[] = [
  {
    id: "field-trip",
    title: "ภารกิจบูรณาการทัศนศึกษา ม.2 (4-Pillar Integration)",
    description: "สถานการณ์หลัก: โรงเรียนจัดกิจกรรมทัศนศึกษานอกสถานที่สำหรับนักเรียนชั้น ม.2 โดยมีนักเรียนเข้าร่วม 120 คน เพื่อไปศึกษาแหล่งเรียนรู้ทางวิทยาศาสตร์และเทคโนโลยี ทีมของนักเรียนได้รับมอบหมายให้ออกแบบ 'ระบบบริหารจัดการการเดินทางและความปลอดภัยอัตโนมัติ' ซึ่งนักเรียนต้องนำทักษะการคิดเชิงคำนวณครบทั้ง 4 ด้าน (Decomposition, Pattern Recognition, Abstraction, และ Algorithm Design) มาประยุกต์ใช้ร่วมกันในการแก้ปัญหานี้ให้สำเร็จลุล่วงอย่างปลอดภัยสูงสุด",
    questions: [
      questionsData[4].questions[0]
    ]
  }
];

export const BOSS_SCENARIO = bossScenariosPool[0].description;
