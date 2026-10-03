/* =========================================================================
   SYSTEM — CONFIG
   All game content (quests, habits, schedule, achievements, levels, stats
   mapping) lives here so new content can be added without touching logic.
   ========================================================================= */
window.SYS = window.SYS || {};

SYS.CONFIG = {
  storageKey: 'system.app.v1',
  journeyDays: 37,
  schemaVersion: 1,

  /* ---------------- LEVEL ----------------
     EXP required to leave level L = base + (L-1)*step
     L1: 0-499, L2: 500-1099, L3: 1100-1799 ...  (editable anytime) */
  level: { base: 500, step: 100 },

  /* ---------------- 14:00 RULE ---------------- */
  discipline: {
    deadlineMinutes: 14 * 60,     // 14:00
    bonusExp: 150,
    required: ['ielts', 'math', 'coding', 'singing', 'workout'],
    bonusStats: { discipline: 3 }
  },

  /* ---------------- STATS ----------------
     quest.statGains are awarded ONCE per day per quest (on completion). */
  stats: {
    strength:     { label: 'STRENGTH',     icon: 'power',  hint: 'WORKOUT' },
    intelligence: { label: 'INTELLIGENCE', icon: 'brain',  hint: 'MATH · IELTS' },
    discipline:   { label: 'DISCIPLINE',   icon: 'shield', hint: 'CONSISTENCY' },
    tech:         { label: 'TECH',         icon: 'chip',   hint: 'CODING' },
    english:      { label: 'ENGLISH',      icon: 'wave',   hint: 'IELTS · SINGING' }
  },

  /* ---------------- QUESTS ----------------
     type: main | daily
     mode: 'time'  -> progress in minutes (goal = target minutes)
           'track' -> progress via sub-exercise counters
     statGains awarded on completion. */
  quests: [
    {
      id: 'ielts', type: 'main', mode: 'time',
      title: 'IELTS PREP', subtitle: 'เตรียมตัวสอบ IELTS',
      target: 60, unit: 'MIN', exp: 100,
      statGains: { intelligence: 3, english: 3, discipline: 1 },
      studyMinutes: true, before14: true
    },
    {
      id: 'math', type: 'main', mode: 'time',
      title: 'MATH', subtitle: 'เลขพี่ปั้น',
      target: 60, unit: 'MIN', exp: 100,
      statGains: { intelligence: 4, discipline: 1 },
      studyMinutes: true, before14: true
    },
    {
      id: 'coding', type: 'daily', mode: 'time',
      title: 'CODING', subtitle: 'ฝึกเขียนโค้ด',
      target: 60, unit: 'MIN', exp: 80,
      statGains: { tech: 4, discipline: 1 },
      studyMinutes: true, before14: true
    },
    {
      id: 'singing', type: 'daily', mode: 'time',
      title: 'ENGLISH SINGING', subtitle: 'ฝึกร้องเพลงภาษาอังกฤษ',
      target: 30, unit: 'MIN', exp: 50,
      statGains: { english: 4, discipline: 1 },
      studyMinutes: false, before14: true
    },
    {
      id: 'workout', type: 'daily', mode: 'track',
      title: 'WORKOUT', subtitle: 'ฝึกฝนร่างกาย',
      target: 100, unit: '%', exp: 100,
      statGains: { strength: 5, discipline: 1 },
      studyMinutes: false, before14: true,
      exercises: [
        { id: 'pushup',   name: 'PUSH-UP',         target: 100, step: 10, unit: 'reps' },
        { id: 'squat',    name: 'SQUAT',           target: 100, step: 10, unit: 'reps' },
        { id: 'pullup',   name: 'PULL-UP',         target: 20,  step: 5,  unit: 'reps' },
        { id: 'plank',    name: 'PLANK',           target: 60,  step: 15, unit: 'sec'  },
        { id: 'revcrunch',name: 'REVERSE CRUNCH',  target: 25,  step: 5,  unit: 'reps' },
        { id: 'crunch',   name: 'CRUNCH',          target: 25,  step: 5,  unit: 'reps' },
        { id: 'bicycle',  name: 'BICYCLE CRUNCH',  target: 25,  step: 5,  unit: 'reps' },
        { id: 'russian',  name: 'RUSSIAN TWIST',   target: 25,  step: 5,  unit: 'reps' }
      ]
    }
  ],

  /* ---------------- HABITS ----------------
     mode: 'counter' -> +1 until target   |   'toggle' -> single tap */
  habits: [
    { id: 'water',     name: 'WATER',      mode: 'counter', target: 4, unit: 'bottles', exp: 10, statGains: { discipline: 1 } },
    { id: 'meals',     name: 'MEALS',      mode: 'counter', target: 3, unit: '',        exp: 10, statGains: { discipline: 1 } },
    { id: 'bathroom',  name: 'BATHROOM',   mode: 'counter', target: 4, unit: '',        exp: 10, statGains: { discipline: 1 } },
    { id: 'sunscreen', name: 'SUNSCREEN',  mode: 'toggle',  target: 1, unit: '',        exp: 10, statGains: { discipline: 1 } },
    { id: 'cleandesk', name: 'CLEAN DESK', mode: 'toggle',  target: 1, unit: '',        exp: 10, statGains: { discipline: 1 } },
    { id: 'trash',     name: 'TRASH',      mode: 'toggle',  target: 1, unit: '',        exp: 10, statGains: { discipline: 1 } },
    { id: 'bath',      name: 'BATH / SOAK',mode: 'toggle',  target: 1, unit: '',        exp: 10, statGains: { discipline: 1 } }
  ],

  /* ---------------- DAILY SCHEDULE ---------------- */
  schedule: [
    { from: '06:00', to: '06:00', label: 'Wake Up',                kind: 'idle' },
    { from: '06:00', to: '07:30', label: 'WORKOUT',                kind: 'quest', quest: 'workout' },
    { from: '07:30', to: '08:20', label: 'Shower + Sunscreen',     kind: 'care'  },
    { from: '08:20', to: '09:00', label: 'Breakfast + Nap',        kind: 'care'  },
    { from: '09:00', to: '10:00', label: 'IELTS PREP',             kind: 'quest', quest: 'ielts' },
    { from: '10:00', to: '10:30', label: 'Rest / Sleep',           kind: 'rest'  },
    { from: '10:30', to: '11:30', label: 'MATH',                   kind: 'quest', quest: 'math' },
    { from: '11:30', to: '12:00', label: 'Rest / Sleep',           kind: 'rest'  },
    { from: '12:00', to: '12:30', label: 'Lunch',                  kind: 'care'  },
    { from: '12:30', to: '13:30', label: 'CODING',                 kind: 'quest', quest: 'coding' },
    { from: '13:30', to: '14:00', label: 'Rest / Sleep',           kind: 'rest'  },
    { from: '14:00', to: '14:30', label: 'ENGLISH SINGING',        kind: 'quest', quest: 'singing' },
    { from: '14:30', to: '15:30', label: 'WORKOUT CONTINUATION',   kind: 'quest', quest: 'workout' },
    { from: '15:30', to: '23:59', label: 'FREE TIME',              kind: 'free'  }
  ],
  freeTimeFrom: '15:30',

  /* ---------------- ACHIEVEMENTS ----------------
     check(d) — d = derived stats object (see store.derive()) */
  achievements: [
    { id: 'first',   name: 'FIRST STEP',       desc: 'Complete your first Quest',
      icon: 'i-quest',   exp: 25,  check: d => d.totalQuests >= 1,
      progress: d => [Math.min(d.totalQuests, 1), 1, 'QUEST'] },
    { id: 'streak7', name: '7 DAY STREAK',     desc: 'Complete Daily System for 7 consecutive days',
      icon: 'i-flame',   exp: 100, check: d => d.bestStreak >= 7,
      progress: d => [Math.min(d.bestStreak, 7), 7, 'DAYS'] },
    { id: 'study20', name: 'KNOWLEDGE SEEKER', desc: 'Complete 20 hours of study',
      icon: 'i-stats',   exp: 150, check: d => d.studyMinutes >= 1200,
      progress: d => [Math.min(d.studyMinutes, 1200), 1200, 'MIN'] },
    { id: 'train10', name: 'TRAINING ARC',     desc: 'Complete 10 Workout sessions',
      icon: 'i-bolt',    exp: 100, check: d => d.workouts >= 10,
      progress: d => [Math.min(d.workouts, 10), 10, 'SESSIONS'] },
    { id: 'early7',  name: 'DISCIPLINED',      desc: 'Complete required Work before 14:00 for 7 days',
      icon: 'i-clock',   exp: 150, check: d => d.earlyDays >= 7,
      progress: d => [Math.min(d.earlyDays, 7), 7, 'DAYS'] },
    { id: 'day37',   name: '37 DAYS',          desc: 'Complete the entire 37-Day Journey',
      icon: 'i-shield',  exp: 370, check: d => d.daysCompleted >= 37,
      progress: d => [Math.min(d.daysCompleted, 37), 37, 'DAYS'] },
    { id: 'perfect', name: 'PERFECT DAY',      desc: 'Reach 100% completion in a single day',
      icon: 'i-check',   exp: 75,  check: d => d.perfectDays >= 1,
      progress: d => [Math.min(d.perfectDays, 1), 1, 'DAYS'] },
    { id: 'level5',  name: 'RISING PLAYER',    desc: 'Reach Level 05',
      icon: 'i-trophy',  exp: 50,  check: d => d.level >= 5,
      progress: d => [Math.min(d.level, 5), 5, 'LEVEL'] },
    { id: 'level10', name: 'SYSTEM VETERAN',   desc: 'Reach Level 10',
      icon: 'i-trophy',  exp: 150, check: d => d.level >= 10,
      progress: d => [Math.min(d.level, 10), 10, 'LEVEL'] },
    { id: 'habits7', name: 'HABIT MACHINE',    desc: 'Complete every Habit for 7 days',
      icon: 'i-shield',  exp: 100, check: d => d.perfectHabitDays >= 7,
      progress: d => [Math.min(d.perfectHabitDays, 7), 7, 'DAYS'] }
  ],

  /* ---------------- MILESTONES (level-up rewards) ---------------- */
  levelRewards: {
    5:  'STAT POINT · +10 ALL',
    10: 'TITLE · SYSTEM VETERAN'
  }
};

/* -------- lookup helpers -------- */
SYS.CONFIG.questById = id => SYS.CONFIG.quests.find(q => q.id === id);
SYS.CONFIG.habitById = id => SYS.CONFIG.habits.find(h => h.id === id);
SYS.CONFIG.achById   = id => SYS.CONFIG.achievements.find(a => a.id === id);
