export const VERSION = 1;
export const LABS = [
  {
    id: "it",
    name: "IT-квантум",
    short: "Программирование",
    icon: "⌘",
    color: "#6bb4ba",
    hue: 0,
    unlock: 0,
    project: "Робот-почтальон",
  },
  {
    id: "bio",
    name: "Биоквантум",
    short: "Живые системы",
    icon: "❋",
    color: "#89b96a",
    hue: 35,
    unlock: 1,
    project: "Умная теплица",
  },
  {
    id: "robo",
    name: "Промробоквантум",
    short: "Робототехника",
    icon: "⚙",
    color: "#e9ae68",
    hue: 330,
    unlock: 2,
    project: "Робот-сортировщик",
  },
  {
    id: "vr",
    name: "VR/AR-квантум",
    short: "Виртуальные миры",
    icon: "◈",
    color: "#b4a0d5",
    hue: 80,
    unlock: 3,
    project: "Виртуальная выставка",
  },
  {
    id: "nano",
    name: "Наноквантум",
    short: "Мир частиц",
    icon: "⚛",
    color: "#91bfc1",
    hue: 5,
    unlock: 4,
    project: "Лаборатория материалов",
  },
  {
    id: "hi",
    name: "Хайтек",
    short: "Инженерная мастерская",
    icon: "ϟ",
    color: "#e5bc72",
    hue: 345,
    unlock: 5,
    project: "Умный светильник",
  },
  {
    id: "media",
    name: "Медиаквантум",
    short: "Истории и медиа",
    icon: "▣",
    color: "#d39897",
    hue: 295,
    unlock: 6,
    project: "Репортаж о выставке",
  },
  {
    id: "auto",
    name: "Автоквантум",
    short: "Транспорт будущего",
    icon: "◎",
    color: "#97aabc",
    hue: 35,
    unlock: 8,
    project: "Испытание электромобиля",
  },
  {
    id: "geo",
    name: "Геоквантум",
    short: "Исследование Земли",
    icon: "⌖",
    color: "#a9bc81",
    hue: 20,
    unlock: 10,
    project: "Карта экспедиции",
  },
  {
    id: "design",
    name: "Промдизайн квантум",
    short: "Дизайн для человека",
    icon: "✳",
    color: "#d7a6c0",
    hue: 270,
    unlock: 12,
    project: "Удобный школьный стул",
  },
];
export const CHAPTERS = [
  {
    title: "Первое открытие",
    text: "У вашего центра уже есть IT-лаборатория. Наймите преподавателя и завершите первый проект.",
    need: { projects: 1, teachers: 1 },
    coins: 220,
    knowledge: 60,
  },
  {
    title: "Живая наука",
    text: "Откройте второе направление и выполните ещё несколько проектов.",
    need: { floors: 2, projects: 4 },
    coins: 450,
    knowledge: 150,
  },
  {
    title: "Сильная команда",
    text: "Развивайте лаборатории и отправьте первую команду на выставку.",
    need: { floors: 3, level: 2, trophies: 1 },
    coins: 700,
    knowledge: 250,
  },
  {
    title: "Объединяем идеи",
    text: "Откройте пять направлений и завершите совместный проект «Умная теплица».",
    need: { floors: 5, joint: 1 },
    coins: 1200,
    knowledge: 400,
  },
  {
    title: "Наука без границ",
    text: "Расширьте центр до восьми направлений и заработайте шесть наград.",
    need: { floors: 8, trophies: 6, projects: 24 },
    coins: 2000,
    knowledge: 650,
  },
  {
    title: "Кванториум будущего",
    text: "Все десять направлений, сорок проектов и лаборатория третьего уровня. Ваш центр готов к большой выставке!",
    need: { floors: 10, projects: 40, level: 3 },
    coins: 3000,
    knowledge: 1000,
  },
];
const FIRST = [
  "Алина",
  "Марк",
  "София",
  "Тимур",
  "Вера",
  "Лев",
  "Артём",
  "Ева",
  "Олег",
  "Нина",
];
const LAST = [
  "Лебедева",
  "Ким",
  "Миронова",
  "Соколов",
  "Волкова",
  "Орлов",
  "Смирнов",
  "Соколова",
  "Морозов",
  "Новикова",
];
export const lab = (id) => LABS.find((l) => l.id === id);
export const capacity = (f) => 4 + (f.level - 1) * 2;
export const teacherList = (s) => Object.values(s.teachers);
export const activeTeachers = (s, f) =>
  f.teachers.map((id) => s.teachers[id]).filter((t) => t && !t.training);
export const bestSkill = (s, f) =>
  Math.max(0, ...activeTeachers(s, f).map((t) => t.skills[f.id] || 0));
export const totalProjects = (s) =>
  s.floors.reduce((n, f) => n + f.projects, 0);
export const floorCost = (s) =>
  Math.round((320 * Math.pow(1.28, s.floors.length - 1)) / 10) * 10;
export const upgradeCost = (f) => ({
  coins: 200 * f.level,
  knowledge: 100 * f.level,
});
export const incomeRate = (s) =>
  s.floors.reduce(
    (n, f) =>
      n +
      activeTeachers(s, f).reduce((a, t) => a + 3 + (t.skills[f.id] || 0), 0),
    0,
  );
export const floorState = (s, f) =>
  f.ready
    ? "ready"
    : f.lesson > 0
      ? bestSkill(s, f) > 0
        ? "learning"
        : "paused"
      : bestSkill(s, f) === 0
        ? "teacher"
        : "waiting";
export function newFloor(id) {
  return {
    id,
    level: 1,
    students: 0,
    teachers: [],
    lesson: 0,
    lessonTotal: 0,
    ready: false,
    projects: 0,
    team: 0,
    branch: null,
  };
}
export function initialState(now = Date.now()) {
  return {
    version: VERSION,
    coins: 280,
    knowledge: 0,
    trophies: 0,
    elapsed: 0,
    floors: [newFloor("it")],
    teachers: {},
    candidates: [
      {
        id: "candidate-first",
        name: "Алина Лебедева",
        skills: { it: 5, bio: 3 },
        cost: 120,
      },
    ],
    candidateClock: 0,
    spawnClock: 0,
    newbieClock: 0,
    newbies: [],
    competitions: [],
    joint: null,
    jointDone: 0,
    chapter: 0,
    collection: [],
    log: [],
    stats: { escorted: 0, trained: 0 },
    settings: { sound: false, motion: true, speed: 1, paused: false },
    savedAt: now,
    uid: 1,
  };
}
export function note(s, text) {
  s.log.unshift({ text, at: s.elapsed });
  s.log = s.log.slice(0, 30);
}
export function candidate(s) {
  let i = s.uid++ % FIRST.length;
  const domain = s.floors[s.uid % s.floors.length].id;
  const secondary = LABS[(s.uid + 2) % LABS.length].id;
  return {
    id: "t" + s.uid,
    name: FIRST[i] + " " + LAST[i],
    skills: {
      [domain]: 4 + (s.uid % 4),
      ...(secondary !== domain ? { [secondary]: 2 + (s.uid % 3) } : {}),
    },
    cost: 100 + (s.uid % 4) * 25,
  };
}
export function chapterProgress(s) {
  const c = CHAPTERS[s.chapter];
  if (!c) return { complete: true, items: [] };
  const values = {
    projects: totalProjects(s),
    teachers: teacherList(s).length,
    floors: s.floors.length,
    level: Math.max(...s.floors.map((f) => f.level)),
    trophies: s.trophies,
    joint: s.jointDone,
  };
  const labels = {
    projects: "Проекты",
    teachers: "Преподаватели",
    floors: "Направления",
    level: "Уровень лаборатории",
    trophies: "Награды",
    joint: "Совместный проект",
  };
  const items = Object.entries(c.need).map(([k, n]) => ({
    label: labels[k],
    value: values[k],
    need: n,
  }));
  return { complete: items.every((x) => x.value >= x.need), items };
}
export function act(s, type, p = {}) {
  const f = s.floors.find((x) => x.id === p.floor);
  let result = { ok: true };
  const fail = (error) => ({ ok: false, error });
  switch (type) {
    case "build": {
      let l = lab(p.id);
      if (!l) return fail("Неизвестное направление");
      if (s.floors.some((x) => x.id === p.id))
        return fail("Этот квантум уже построен");
      if (totalProjects(s) < l.unlock)
        return fail("Сначала выполните больше проектов");
      let cost = floorCost(s);
      if (s.coins < cost) return fail("Не хватает монет");
      s.coins -= cost;
      s.floors.push(newFloor(p.id));
      s.candidates.push(candidate(s));
      s.candidates = s.candidates.slice(-5);
      note(s, `Открыт ${l.name}`);
      break;
    }
    case "hire": {
      const t = s.candidates.find((x) => x.id === p.id);
      if (!t) return fail("Кандидат уже недоступен");
      if (!f) return fail("Выберите квантум");
      if (f.teachers.length >= 3)
        return fail("В квантуме уже три преподавателя");
      if (!t.skills[f.id]) return fail("У кандидата нет профильного навыка");
      if (s.coins < t.cost) return fail("Не хватает монет");
      s.coins -= t.cost;
      s.teachers[t.id] = { ...t, training: null };
      f.teachers.push(t.id);
      s.candidates = s.candidates.filter((x) => x.id !== t.id);
      note(s, `${t.name} принят в ${lab(f.id).name}`);
      break;
    }
    case "reject":
      s.candidates = s.candidates.filter((x) => x.id !== p.id);
      break;
    case "move": {
      const t = s.teachers[p.id];
      if (!t || !f) return fail("Не найден преподаватель");
      if (t.training) return fail("Дождитесь завершения обучения");
      if (f.teachers.length >= 3) return fail("Нет места");
      if (!t.skills[f.id]) return fail("Нет профильного навыка");
      s.floors.forEach(
        (x) => (x.teachers = x.teachers.filter((id) => id !== p.id)),
      );
      f.teachers.push(p.id);
      break;
    }
    case "fire": {
      const t = s.teachers[p.id];
      if (!t || t.training) return fail("Преподаватель недоступен");
      s.floors.forEach(
        (x) => (x.teachers = x.teachers.filter((id) => id !== p.id)),
      );
      delete s.teachers[p.id];
      break;
    }
    case "train": {
      const t = s.teachers[p.id];
      const home = s.floors.find((x) => x.teachers.includes(p.id));
      if (!t || !home || t.training) return fail("Преподаватель недоступен");
      if (t.skills[home.id] >= 10) return fail("Навык уже максимальный");
      let cost = 30 * t.skills[home.id];
      if (s.knowledge < cost) return fail(`Нужно ${cost} знаний`);
      s.knowledge -= cost;
      t.training = { left: 90, total: 90, skill: home.id };
      note(s, `${t.name} начал повышение квалификации`);
      break;
    }
    case "upgrade": {
      if (!f || f.level >= 3) return fail("Уже максимальный уровень");
      if (f.lesson > 0 || f.ready)
        return fail("Сначала завершите текущий проект");
      let c = upgradeCost(f);
      if (s.coins < c.coins || s.knowledge < c.knowledge)
        return fail("Не хватает ресурсов");
      s.coins -= c.coins;
      s.knowledge -= c.knowledge;
      f.level++;
      note(s, `${lab(f.id).name}: уровень ${f.level}`);
      break;
    }
    case "branch":
      if (
        !f ||
        f.level < 2 ||
        f.branch ||
        !["speed", "quality"].includes(p.value)
      )
        return fail("Специализация недоступна");
      f.branch = p.value;
      break;
    case "complete": {
      if (!f || !f.ready) return fail("Проект ещё не готов");
      let variant = f.projects % 3;
      f.ready = false;
      f.students = 0;
      f.lesson = 0;
      f.projects++;
      let reward = 110 + 30 * (f.level - 1) + (f.branch === "quality" ? 45 : 0);
      s.coins += reward;
      s.knowledge += 35 + f.level * 10;
      if (f.projects % 3 === 0 && f.team < 5) {
        f.team++;
        note(s, `Новый участник команды: ${lab(f.id).name}`);
      }
      const key = f.id + ":" + variant;
      if (!s.collection.includes(key)) s.collection.push(key);
      note(s, `${lab(f.id).name}: проект выполнен (+${reward} монет)`);
      result.reward = { coins: reward, knowledge: 35 + f.level * 10 };
      break;
    }
    case "escort": {
      const n = s.newbies.find((x) => x.id === p.id);
      if (!n || !f || n.target !== f.id) return fail("Это другой этаж");
      if (f.ready || f.lesson > 0 || f.students >= capacity(f))
        return fail("В квантуме пока нет мест");
      f.students++;
      s.newbies = s.newbies.filter((x) => x.id !== p.id);
      s.stats.escorted++;
      s.coins += 25;
      s.knowledge += 10;
      result.reward = { coins: 25, knowledge: 10 };
      break;
    }
    case "competition": {
      if (!f || f.team < 2) return fail("Нужно два участника команды");
      if (s.competitions.some((x) => x.floor === f.id))
        return fail("Команда уже участвует");
      const levels = [
        { need: 25, time: 90, reward: 1 },
        { need: 45, time: 150, reward: 2 },
        { need: 65, time: 210, reward: 3 },
      ];
      let c = levels[p.level];
      if (!c) return fail("Неизвестное соревнование");
      let power = f.team * 10 + bestSkill(s, f) * 3;
      if (power < c.need) return fail("Сначала подготовьте команду");
      s.competitions.push({
        floor: f.id,
        left: c.time,
        total: c.time,
        reward: c.reward,
        level: p.level,
      });
      break;
    }
    case "joint": {
      if (s.joint) return fail("Совместный проект уже идёт");
      if (
        !["it", "bio", "hi"].every((id) =>
          s.floors.some((x) => x.id === id && x.projects > 0),
        )
      )
        return fail("Нужны IT, Био и Хайтек с завершённым проектом");
      if (s.knowledge < 180) return fail("Нужно 180 знаний");
      s.knowledge -= 180;
      s.joint = { left: 180, total: 180 };
      break;
    }
    case "claimChapter": {
      if (!CHAPTERS[s.chapter] || !chapterProgress(s).complete)
        return fail("Не все цели выполнены");
      const c = CHAPTERS[s.chapter];
      s.coins += c.coins;
      s.knowledge += c.knowledge;
      s.chapter++;
      note(s, `Завершена глава «${c.title}»`);
      result.reward = { coins: c.coins, knowledge: c.knowledge };
      break;
    }
    case "settings": {
      if (p.key === "speed" && [1, 2].includes(p.value))
        s.settings.speed = p.value;
      else if (
        ["sound", "motion", "paused"].includes(p.key) &&
        typeof p.value === "boolean"
      )
        s.settings[p.key] = p.value;
      else return fail("Неверная настройка");
      break;
    }
    default:
      return fail("Неизвестное действие");
  }
  return result;
}
export function advance(s, seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  seconds = Math.min(seconds, 7200);
  let rest = seconds;
  while (rest > 0) {
    const dt = Math.min(rest, 1);
    rest -= dt;
    s.elapsed += dt;
    s.coins += (incomeRate(s) * dt) / 60;
    for (const t of teacherList(s)) {
      if (t.training) {
        t.training.left -= dt;
        if (t.training.left <= 0) {
          t.skills[t.training.skill] = Math.min(
            10,
            t.skills[t.training.skill] + 1,
          );
          t.training = null;
          s.stats.trained++;
          note(s, `${t.name} завершил обучение`);
        }
      }
    }
    for (const f of s.floors) {
      const skill = bestSkill(s, f);
      if (
        !f.ready &&
        f.lesson === 0 &&
        f.students >= capacity(f) &&
        skill > 0
      ) {
        f.lessonTotal =
          Math.max(18, 52 - skill * 2 - activeTeachers(s, f).length * 3) *
          (f.branch === "speed" ? 0.75 : 1);
        f.lesson = f.lessonTotal;
      }
      if (f.lesson > 0 && skill > 0) {
        f.lesson = Math.max(0, f.lesson - dt);
        if (f.lesson === 0) {
          f.ready = true;
          note(s, `${lab(f.id).name}: можно защитить проект`);
        }
      }
    }
    s.spawnClock += dt;
    if (s.spawnClock >= 12) {
      s.spawnClock = 0;
      const available = s.floors.filter(
        (f) =>
          !f.ready &&
          f.lesson === 0 &&
          f.students < capacity(f) &&
          bestSkill(s, f) > 0,
      );
      if (available.length) {
        const target = available[Math.floor(s.elapsed / 12) % available.length];
        target.students++;
      }
    }
    s.candidateClock += dt;
    if (s.candidateClock >= 65) {
      s.candidateClock = 0;
      if (s.candidates.length < 5) s.candidates.push(candidate(s));
    }
    s.newbieClock += dt;
    if (s.newbieClock >= 80) {
      s.newbieClock = 0;
      if (s.newbies.length < 3) {
        const f = s.floors[Math.floor(s.elapsed / 80) % s.floors.length];
        s.newbies.push({
          id: "n" + s.uid++,
          name: FIRST[s.uid % FIRST.length],
          target: f.id,
        });
      }
    }
    for (const c of s.competitions) c.left -= dt;
    for (const c of s.competitions.filter((c) => c.left <= 0)) {
      s.trophies += c.reward;
      s.knowledge += 50 * c.reward;
      s.coins += 100 * c.reward;
      note(s, `${lab(c.floor).name}: получено ${c.reward} наград`);
    }
    s.competitions = s.competitions.filter((c) => c.left > 0);
    if (s.joint) {
      s.joint.left -= dt;
      if (s.joint.left <= 0) {
        s.joint = null;
        s.jointDone++;
        s.coins += 600;
        s.knowledge += 150;
        s.trophies += 2;
        note(s, "Совместный проект «Умная теплица» завершён!");
      }
    }
  }
}
const finite = (v, min = 0, max = 1e12) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
export function validateSave(x) {
  if (
    !x ||
    x.version !== VERSION ||
    !finite(x.savedAt, 0, 9e15) ||
    !finite(x.elapsed) ||
    !finite(x.uid) ||
    !Number.isInteger(x.uid) ||
    !finite(x.chapter, 0, 6) ||
    !Number.isInteger(x.chapter)
  )
    throw Error("Неизвестный формат сохранения");
  for (const k of [
    "coins",
    "knowledge",
    "trophies",
    "candidateClock",
    "spawnClock",
    "newbieClock",
    "jointDone",
  ])
    if (!finite(x[k])) throw Error("Повреждены ресурсы сохранения");
  if (
    !Array.isArray(x.floors) ||
    !x.floors.length ||
    x.floors.length > 10 ||
    new Set(x.floors.map((f) => f.id)).size !== x.floors.length
  )
    throw Error("Неверный список этажей");
  if (
    !x.teachers ||
    Array.isArray(x.teachers) ||
    typeof x.teachers !== "object" ||
    Object.keys(x.teachers).length > 30
  )
    throw Error("Неверный список преподавателей");
  const teacher = (t) => {
    if (
      !t ||
      typeof t.id !== "string" ||
      !/^(candidate-first|t\d+)$/.test(t.id) ||
      typeof t.name !== "string" ||
      t.name.length > 80 ||
      !finite(t.cost) ||
      !t.skills ||
      typeof t.skills !== "object" ||
      Object.entries(t.skills).some(
        ([id, n]) => !lab(id) || !Number.isInteger(n) || n < 1 || n > 10,
      )
    )
      throw Error("Повреждены навыки преподавателя");
    if (
      t.training &&
      (!finite(t.training.left, 0, 90) ||
        t.training.total !== 90 ||
        !lab(t.training.skill))
    )
      throw Error("Повреждено обучение");
  };
  for (const [id, t] of Object.entries(x.teachers)) {
    teacher(t);
    if (t.id !== id) throw Error("Неверный ID преподавателя");
  }
  const assigned = new Set();
  for (const f of x.floors) {
    if (
      !lab(f.id) ||
      ![1, 2, 3].includes(f.level) ||
      !Number.isInteger(f.students) ||
      f.students < 0 ||
      f.students > capacity(f) ||
      !finite(f.lesson, 0, 60) ||
      !finite(f.lessonTotal, 0, 60) ||
      typeof f.ready !== "boolean" ||
      !finite(f.projects) ||
      !Number.isInteger(f.projects) ||
      !Number.isInteger(f.team) ||
      f.team < 0 ||
      f.team > 5 ||
      ![null, "speed", "quality"].includes(f.branch) ||
      !Array.isArray(f.teachers) ||
      f.teachers.length > 3
    )
      throw Error("Повреждены данные этажа");
    for (const id of f.teachers) {
      if (!x.teachers[id] || assigned.has(id) || !x.teachers[id].skills[f.id])
        throw Error("Некорректное назначение");
      assigned.add(id);
    }
  }
  if (assigned.size !== Object.keys(x.teachers).length)
    throw Error("Преподаватель без назначения");
  if (!Array.isArray(x.candidates) || x.candidates.length > 5)
    throw Error("Повреждены кандидаты");
  x.candidates.forEach(teacher);
  if (
    new Set(x.candidates.map((t) => t.id)).size !== x.candidates.length ||
    x.candidates.some((t) => x.teachers[t.id])
  )
    throw Error("Повторяющийся кандидат");
  if (
    !Array.isArray(x.newbies) ||
    x.newbies.length > 3 ||
    x.newbies.some(
      (n) =>
        typeof n.id !== "string" ||
        !/^n\d+$/.test(n.id) ||
        typeof n.name !== "string" ||
        n.name.length > 80 ||
        !x.floors.some((f) => f.id === n.target),
    )
  )
    throw Error("Повреждена очередь");
  if (
    !Array.isArray(x.competitions) ||
    x.competitions.length > 10 ||
    x.competitions.some(
      (c) =>
        !x.floors.some((f) => f.id === c.floor) ||
        !finite(c.left, 0, 210) ||
        ![90, 150, 210].includes(c.total) ||
        ![1, 2, 3].includes(c.reward) ||
        ![0, 1, 2].includes(c.level),
    )
  )
    throw Error("Повреждены соревнования");
  if (x.joint && (!finite(x.joint.left, 0, 180) || x.joint.total !== 180))
    throw Error("Повреждён совместный проект");
  if (
    !Array.isArray(x.collection) ||
    x.collection.length > 30 ||
    x.collection.some((k) => !/^\w+:[012]$/.test(k) || !lab(k.split(":")[0]))
  )
    throw Error("Повреждена коллекция");
  if (
    !x.stats ||
    !finite(x.stats.escorted) ||
    !finite(x.stats.trained) ||
    !Array.isArray(x.log) ||
    x.log.length > 30 ||
    x.log.some(
      (l) => typeof l.text !== "string" || l.text.length > 300 || !finite(l.at),
    )
  )
    throw Error("Повреждён журнал");
  if (
    !x.settings ||
    ![1, 2].includes(x.settings.speed) ||
    ["sound", "motion", "paused"].some(
      (k) => typeof x.settings[k] !== "boolean",
    )
  )
    throw Error("Повреждены настройки");
  return x;
}
