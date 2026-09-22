import {
  LABS,
  CHAPTERS,
  lab,
  initialState,
  act,
  advance,
  capacity,
  teacherList,
  activeTeachers,
  bestSkill,
  totalProjects,
  floorCost,
  upgradeCost,
  incomeRate,
  floorState,
  chapterProgress,
  validateSave,
} from "./engine.js";
import { TASKS } from "./tasks.js";
const KEY = "quantorium-save-v1";
const ATLAS_URLS = {
  a: "assets/rooms-a.png",
  b: "assets/rooms-b.png",
  c: "assets/rooms-c.png",
};
const ROOM_ART = {
  it: ["a", 0, 0],
  vr: ["a", 1, 0],
  bio: ["a", 0, 1],
  nano: ["a", 1, 1],
  robo: ["b", 0, 0],
  hi: ["b", 1, 0],
  media: ["b", 0, 1],
  auto: ["b", 1, 1],
  geo: ["c", 0, 0],
  design: ["c", 1, 0],
  reception: ["c", 0, 1],
  director: ["c", 1, 1],
};
function roomArt(id) {
  const [sheet, x, y] = ROOM_ART[id] || ROOM_ART.it;
  return `<span class="room-art" aria-hidden="true" style="background-image:url('${ATLAS_URLS[sheet]}');background-position:${x * 100}% ${y * 100}%"></span>`;
}
function sprite(row = 0, walking = false) {
  const frames = [
    [0, 320],
    [320, 332],
    [652, 291],
    [943, 311],
  ];
  const [top, height] = frames[row];
  return `<span class="sprite ${walking ? "sprite-walk" : ""}" style="--sprite-y:${(top / (1254 - height)) * 100}%;--sprite-height:${(1254 / height) * 100}%" aria-hidden="true"></span>`;
}

const $ = (q) => document.querySelector(q);
const esc = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n) => Math.floor(n).toLocaleString("ru-RU");
const time = (n) =>
  `${Math.floor(Math.ceil(Math.max(0, n)) / 60)}:${String(Math.ceil(Math.max(0, n)) % 60).padStart(2, "0")}`;
let state = initialState(),
  saveError = "",
  saveBlocked = false,
  offline = null;
let modalView = null,
  game = null,
  worldSignature = "",
  railSignature = "",
  lastTick = performance.now(),
  saveTimer = 0,
  audio = null,
  importPending = null;
let rawSave = null;
try {
  rawSave = localStorage.getItem(KEY);
} catch {
  saveError =
    "Браузер не разрешил сохранение. Игра работает, но перед выходом экспортируйте прогресс в настройках.";
}
if (rawSave) {
  try {
    state = validateSave(JSON.parse(rawSave));
    let seconds = Math.min(
      7200,
      Math.max(0, (Date.now() - state.savedAt) / 1000),
    );
    if (seconds > 30 && !state.settings.paused) {
      let coins = state.coins;
      advance(state, seconds);
      offline = { seconds, coins: Math.floor(state.coins - coins) };
    }
    state.savedAt = Date.now();
  } catch {
    saveError =
      "Не удалось прочитать сохранение. Исходные данные сохранены. Можно импортировать копию или начать заново в настройках.";
    saveBlocked = true;
  }
}

function save() {
  if (saveBlocked) return;
  try {
    state.savedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
    if (saveError) {
      saveError = "";
      render();
    }
  } catch {
    if (!saveError) {
      saveError =
        "Браузер не разрешил сохранение. Экспортируйте прогресс в настройках, прежде чем закрывать игру.";
      render();
    }
  }
}
function sound(win = false) {
  if (!state.settings.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    [0, ...(win ? [0.1, 0.2] : [])].forEach((delay, i) => {
      const o = audio.createOscillator(),
        g = audio.createGain();
      o.type = "sine";
      o.frequency.value = [523, 659, 784][i];
      g.gain.setValueAtTime(0.04, audio.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + delay + 0.16,
      );
      o.connect(g);
      g.connect(audio.destination);
      o.start(audio.currentTime + delay);
      o.stop(audio.currentTime + delay + 0.18);
    });
  } catch {}
}
function toast(text, error = false) {
  let e = document.createElement("div");
  e.className = "toast" + (error ? " error" : "");
  e.textContent = text;
  $("#toasts").append(e);
  setTimeout(() => e.remove(), 4000);
}
function confetti() {
  if (!state.settings.motion) return;
  for (let i = 0; i < 22; i++) {
    let p = document.createElement("i");
    p.className = "spark";
    p.style.setProperty("--x", (Math.random() - 0.5) * 420 + "px");
    p.style.setProperty("--y", (Math.random() - 0.4) * 360 + "px");
    p.style.background = ["#d8ed95", "#e9c878", "#91b9a4"][i % 3];
    $("#celebration").append(p);
    setTimeout(() => p.remove(), 1000);
  }
}
const button = (label, action, data = "", cls = "primary", disabled = false) =>
  `<button class="btn ${cls}" data-action="${action}" ${data} ${disabled ? "disabled" : ""}>${label}</button>`;
const progress = (value, total, attrs = "") =>
  `<div class="progress-track"><i ${attrs} style="width:${Math.min(100, Math.max(0, (value / total) * 100))}%"></i></div>`;
function shell() {
  $("#app").innerHTML =
    `<aside class="sidebar"><div class="brand"><div class="brand-mark">к</div><div>кванториум<small>город идей</small></div></div><div class="nav-caption">Ваш научный центр</div><nav class="nav" aria-label="Основная навигация">${[
      ["tower", "▥", "Моя башня"],
      ["build", "⊞", "Строительство"],
      ["staff", "♧", "Преподаватели"],
      ["projects", "⚑", "Проекты"],
      ["collection", "✧", "Коллекция"],
    ]
      .map(
        ([id, icon, label]) =>
          `<button class="${id === "tower" ? "active" : ""}" data-action="nav" data-view="${id}" aria-label="${label}"><span class="nav-icon">${icon}</span><span class="nav-text">${label}</span></button>`,
      )
      .join(
        "",
      )}</nav><div class="sidebar-foot"><div class="director"><div class="avatar sprite-avatar">${sprite(1)}</div><div><b>Директор кванториума</b><small>Всё начинается с идеи</small></div></div><button class="settings-link" data-action="nav" data-view="settings" aria-label="Настройки">⚙ <span>Настройки игры</span></button></div></aside>
 <div class="workspace"><header class="topbar"><span class="mobile-brand" aria-label="Кванториум">к.</span><div class="breadcrumb">Кванториум <span class="muted">/</span> <b>Моя башня</b></div><div class="resources" aria-label="Ресурсы"><div class="resource" title="Монеты: постройка и найм"><span class="symbol">●</span><div><strong id="coins">280</strong><small>МОНЕТЫ</small></div></div><div class="resource" title="Знания: обучение и улучшения"><span class="symbol">✦</span><div><strong id="knowledge">0</strong><small>ЗНАНИЯ</small></div></div><div class="resource" title="Награды за выставки и совместные проекты"><span class="symbol">♜</span><div><strong id="trophies">0</strong><small>НАГРАДЫ</small></div></div></div><button class="icon-btn" data-action="nav" data-view="help" aria-label="Как играть">?</button></header>
 <main class="page"><div id="alerts"></div><div class="page-heading"><div><p class="eyebrow">Место, где рождаются открытия</p><h1>Ваш кванториум</h1></div><span class="heading-note">✧ <span id="chapter-label">Глава 1 из 6</span></span></div><div class="layout"><section class="tower-stage" aria-label="Башня кванториума"><div class="stage-bar"><span id="floor-total">3 этажа · 1 направление</span><div class="controls" aria-label="Скорость игры"><button data-action="pause" id="pause" aria-label="Пауза">Ⅱ</button><button data-action="speed" data-value="1" id="speed1" class="on">1×</button><button data-action="speed" data-value="2" id="speed2">2×</button></div></div><button class="roof" data-action="nav" data-view="build"><span class="plus">＋</span><b>Место для новой идеи</b><small id="roof-price">Построить новый квантум</small></button><div class="tower" id="tower"></div><div class="ground-caption">⌖ Научная улица, 1 · Ваш город открытий</div></section><aside class="rail" id="rail" aria-label="Цели и события"></aside></div><p class="footer-note">Прогресс сохраняется на этом устройстве. Учитесь, пробуйте и делайте перерывы.</p></main></div>
 <nav class="mobile-nav" aria-label="Навигация"><button data-action="nav" data-view="tower" class="active"><span>▥</span>Башня</button><button data-action="nav" data-view="build"><span>⊞</span>Строить</button><button data-action="nav" data-view="staff"><span>♧</span>Команда</button><button data-action="nav" data-view="projects"><span>⚑</span>Проекты</button><button data-action="nav" data-view="settings"><span>⚙</span>Ещё</button></nav>`;
}
function floorHTML(f, index) {
  const l = lab(f.id),
    status = floorState(state, f),
    labels = {
      teacher: "Нужен преподаватель",
      waiting: "Набираем группу",
      learning: "Идёт занятие",
      paused: "Занятие на паузе",
      ready: "Проект готов",
    };
  return `<article class="floor" data-floor-card="${f.id}"><div class="floor-top"><div class="floor-name"><span class="floor-number">${index + 3}</span><b>${esc(l.name)}</b><span class="level">ур. ${f.level}</span></div><span class="status ${status}">${labels[status]}</span></div><button class="room" data-action="lab" data-id="${f.id}" aria-label="Открыть ${esc(l.name)}">${roomArt(f.id)}<span class="room-label"><span>${l.icon}</span>${esc(l.short.toUpperCase())}</span><span class="actors" aria-hidden="true">${activeTeachers(
    state,
    f,
  )
    .map(
      (t, i) =>
        `<span class="person teacher" style="--delay:-${i * 0.8}s">${sprite(i % 2, status === "learning")}</span>`,
    )
    .join(
      "",
    )}${Array.from({ length: Math.min(f.students, 5) }, (_, i) => `<span class="person" style="--delay:-${i * 0.6}s">${sprite(2 + (i % 2), status === "learning")}</span>`).join("")}</span>${status === "ready" ? '<span class="room-cta">✦ Защитить проект</span>' : status === "teacher" ? '<span class="room-cta">＋ Назначить</span>' : ""}</button><div class="floor-bottom"><span>♧ <strong>${f.students}/${capacity(f)}</strong> учеников</span><span>${status === "learning" ? `<strong data-lesson="${f.id}">${time(f.lesson)}</strong>` : `${f.projects} проектов`}</span><span><strong>${f.teachers.length}/3</strong> преподавателей</span></div>${f.lesson > 0 ? `<div class="mini-progress"><i data-floor-progress="${f.id}" style="width:${(1 - f.lesson / f.lessonTotal) * 100}%"></i></div>` : ""}</article>`;
}
function render() {
  document.body.classList.toggle("no-motion", !state.settings.motion);
  $("#coins").textContent = fmt(state.coins);
  $("#knowledge").textContent = fmt(state.knowledge);
  $("#trophies").textContent = fmt(state.trophies);
  $("#floor-total").textContent =
    `${state.floors.length + 2} этажа · ${state.floors.length} из 10 направлений`;
  $("#chapter-label").textContent =
    state.chapter >= 6
      ? "Кампания завершена"
      : `Глава ${state.chapter + 1} из 6`;
  $("#roof-price").textContent =
    state.floors.length === 10
      ? "Все направления открыты"
      : `Новое направление · ${fmt(floorCost(state))} монет`;
  $("#pause").textContent = state.settings.paused ? "▶" : "Ⅱ";
  $("#pause").setAttribute(
    "aria-label",
    state.settings.paused ? "Продолжить игру" : "Пауза",
  );
  $("#speed1").classList.toggle("on", state.settings.speed === 1);
  $("#speed2").classList.toggle("on", state.settings.speed === 2);
  $("#alerts").innerHTML =
    (saveError
      ? `<div class="save-error">${esc(saveError)} <button class="btn ghost" data-action="nav" data-view="settings">Настройки</button></div>`
      : "") +
    (state.settings.paused
      ? '<div class="paused-banner">Игра на паузе. Нажмите ▶, когда будете готовы.</div>'
      : "");
  const signature =
    JSON.stringify(
      state.floors.map((f) => [
        f.id,
        f.level,
        f.students,
        f.teachers,
        activeTeachers(state, f).length,
        f.ready,
        floorState(state, f),
        f.projects,
      ]),
    ) + state.newbies.length;
  if (signature !== worldSignature) {
    const focus =
      document.activeElement?.closest("[data-floor-card]")?.dataset.floorCard;
    worldSignature = signature;
    $("#tower").innerHTML =
      [...state.floors]
        .reverse()
        .map((f) => floorHTML(f, state.floors.indexOf(f)))
        .join("") +
      `<article class="floor service"><div class="floor-top"><div class="floor-name"><span class="floor-number">2</span><b>Кабинет директора</b></div><span class="status">Центр управления</span></div><button class="room" data-action="nav" data-view="staff" aria-label="Преподаватели">${roomArt("director")}<span class="actors service-actors"><span class="person teacher">${sprite(1, true)}</span></span><span class="room-label">♧ Команда преподавателей</span><span class="room-cta">${teacherList(state).length ? teacherList(state).length + " в команде" : "Нанять первого"}</span></button></article><article class="floor service"><div class="floor-top"><div class="floor-name"><span class="floor-number">1</span><b>Ресепшн</b></div><span class="status">${state.newbies.length ? state.newbies.length + " ждут помощи" : "Добро пожаловать"}</span></div><button class="room" data-action="nav" data-view="reception" aria-label="Ресепшн и новые ученики">${roomArt("reception")}<span class="actors service-actors">${state.newbies.map((n, i) => `<span class="person">${sprite(2 + (i % 2), true)}</span>`).join("")}</span><span class="room-label">☀ Большие открытия начинаются здесь</span>${state.newbies.length ? '<span class="room-cta">? Помочь новенькому</span>' : ""}</button></article>`;
    if (focus && !$("#modal").open)
      $(`[data-floor-card="${focus}"] .room`)?.focus({ preventScroll: true });
  }
  const railKey = JSON.stringify([
    chapterProgress(state),
    state.chapter,
    state.log[0],
    teacherList(state).length,
    state.newbies.length,
    totalProjects(state),
    state.collection.length,
  ]);
  if (railKey !== railSignature) {
    railSignature = railKey;
    renderRail();
  }
  updateClocks();
}
function renderRail() {
  const c = CHAPTERS[state.chapter],
    p = chapterProgress(state);
  $("#rail").innerHTML =
    `<section class="card chapter-card"><div class="chapter-top"><span class="chapter-number">${c ? `ГЛАВА ${String(state.chapter + 1).padStart(2, "0")} / 06` : "ВСЕ ШЕСТЬ ГЛАВ ПРОЙДЕНЫ"}</span><span class="chapter-icon">${c ? "⚑" : "✧"}</span></div><h2>${c ? c.title : "Кванториум будущего"}</h2><p>${c ? c.text : "Вы создали большой научный центр. Продолжайте проекты и соберите все открытия в коллекции."}</p>${c ? `<div class="goals">${p.items.map((i) => `<div class="goal"><span class="check ${i.value >= i.need ? "done" : ""}">${i.value >= i.need ? "✓" : ""}</span>${i.label}<span class="count">${Math.min(i.value, i.need)}/${i.need}</span></div>`).join("")}</div><div class="reward-row">Награда <b>● ${fmt(c.coins)}</b><b>✦ ${fmt(c.knowledge)}</b></div>${p.complete ? button("Завершить главу", "claimChapter", "", "primary full") : button(teacherList(state).length === 0 ? "Найти преподавателя" : "К целям главы", "guide", "", "secondary full")}` : button("Коллекция открытий", "nav", 'data-view="collection"', "secondary full")}</section><div class="quick-stat"><div><strong>${totalProjects(state)}</strong><small>ПРОЕКТОВ ВЫПОЛНЕНО</small></div><div><strong>${Math.round(incomeRate(state))}<span style="font-size:12px"> / мин</span></strong><small>ДОХОД ЦЕНТРА</small></div></div><section class="card activity-card"><h2>Жизнь кванториума</h2><div class="activity-list">${state.newbies.length ? `<div class="activity-item"><span class="activity-icon">?</span><div><b>${state.newbies.length} новеньких ждут помощи</b><button class="btn ghost" data-action="nav" data-view="reception">Заглянуть на ресепшн</button></div></div>` : ""}${(state
      .log.length
      ? state.log.slice(0, 3)
      : [
          { text: "IT-квантум готов к первому занятию", at: 0 },
          { text: "Алина ждёт собеседования", at: 0 },
        ]
    )
      .map(
        (l, i) =>
          `<div class="activity-item"><span class="activity-icon">${["✦", "♧", "◈"][i]}</span><div><b>${esc(l.text)}</b><small>${time(l.at)} · время в игре</small></div></div>`,
      )
      .join(
        "",
      )}</div><button class="btn ghost" style="margin-top:15px" data-action="nav" data-view="journal">Весь журнал</button></section><section class="card quote-card"><span class="quote-symbol">“</span><p>Самое интересное открытие — то, которое ты сделал сам.</p><b>Маленький шаг. Большая идея.</b></section>`;
}
function updateClocks() {
  document.querySelectorAll("[data-lesson]").forEach((e) => {
    let f = state.floors.find((f) => f.id === e.dataset.lesson);
    if (f) e.textContent = time(f.lesson);
  });
  document.querySelectorAll("[data-floor-progress]").forEach((e) => {
    let f = state.floors.find((f) => f.id === e.dataset.floorProgress);
    if (f) e.style.width = (1 - f.lesson / f.lessonTotal) * 100 + "%";
  });
  document
    .querySelectorAll("[data-training]")
    .forEach(
      (e) =>
        (e.textContent = time(
          state.teachers[e.dataset.training]?.training?.left || 0,
        )),
    );
  document
    .querySelectorAll("[data-comp]")
    .forEach(
      (e) =>
        (e.textContent = time(
          state.competitions.find((c) => c.floor === e.dataset.comp)?.left || 0,
        )),
    );
  document
    .querySelectorAll("[data-joint]")
    .forEach((e) => (e.textContent = time(state.joint?.left || 0)));
}
function modal(title, body, eyebrow = "КВАНТОРИУМ") {
  const d = $("#modal");
  d.innerHTML = `<header class="modal-head"><div><p class="eyebrow">${eyebrow}</p><h2 id="modal-title">${title}</h2></div><button class="icon-btn" data-action="close" aria-label="Закрыть окно">×</button></header><div class="modal-body">${body}</div>`;
  if (!d.open) d.showModal();
}
function closeModal() {
  game = null;
  modalView = null;
  $("#modal").close();
  lastTick = performance.now();
  save();
}
function show(view, param = null) {
  game = null;
  modalView = { view, param };
  drawModal();
}
function drawModal() {
  if (!modalView) return;
  const { view, param } = modalView;
  const f = state.floors.find((f) => f.id === param);
  switch (view) {
    case "build":
      modal(
        "Место для новой идеи",
        `<p class="modal-intro">Каждое направление открывает свои проекты. Преподаватели появятся среди кандидатов после постройки.</p><div class="modal-grid">${LABS.map(
          (l) => {
            let built = state.floors.some((f) => f.id === l.id),
              locked = totalProjects(state) < l.unlock;
            return `<article class="lab-option ${locked ? "locked" : ""}" style="--lab-color:${l.color}"><div class="lab-icon">${l.icon}</div><h3>${l.name}</h3><p>${l.short}</p>${button(built ? "✓ Уже построен" : locked ? `${l.unlock} проектов для открытия` : `Построить · ● ${fmt(floorCost(state))}`, "build", `data-id="${l.id}"`, built || locked ? "secondary" : "primary", built || locked)}</article>`;
          },
        ).join("")}</div>`,
        "СТРОИТЕЛЬСТВО",
      );
      break;
    case "staff":
      renderStaff();
      break;
    case "lab":
      if (f) renderLab(f);
      break;
    case "projects":
      renderProjects();
      break;
    case "collection":
      modal(
        "Коллекция открытий",
        `<p class="modal-intro">${state.collection.length} из 30 открытий. В каждом направлении три проекта: алгоритм, связи и маршрут. Они чередуются после завершения.</p><div class="collection-grid">${LABS.flatMap(
          (l) =>
            ["Алгоритм", "Связи", "Маршрут"].map((v, i) => {
              const done = state.collection.includes(l.id + ":" + i);
              return `<div class="collection-item ${done ? "" : "locked"}"><span>${done ? l.icon : "◇"}</span><b>${l.name}</b><span style="font-size:12px;margin-top:6px">${v} ${done ? "✓" : "· ещё впереди"}</span></div>`;
            }),
        ).join("")}</div>`,
        "МУЗЕЙ ВАШИХ ИДЕЙ",
      );
      break;
    case "journal":
      modal(
        "Журнал кванториума",
        state.log.length
          ? state.log
              .map(
                (l) =>
                  `<div class="journal-item"><time>${time(l.at)}</time><span>${esc(l.text)}</span></div>`,
              )
              .join("")
          : '<div class="empty">Первая страница пока чистая. Начните с преподавателя!</div>',
        "СОБЫТИЯ",
      );
      break;
    case "reception":
      modal(
        "Поможем новеньким",
        `<p class="modal-intro">Покажите ученику дорогу в нужный квантум. За помощь — 25 монет и 10 знаний. Если группа занята, можно вернуться позже.</p><div class="reception-list">${state.newbies.length ? state.newbies.map((n) => `<article class="staff-card"><div class="staff-card-top"><div class="avatar sprite-avatar">${sprite(2)}</div><div><h3>${esc(n.name)}</h3><p>Ищет ${lab(n.target).name}</p></div></div>${button("Проводить на занятие", "escort-start", `data-id="${esc(n.id)}"`, "primary")}</article>`).join("") : '<div class="empty"><span class="big-icon">☀</span>Все нашли свои лаборатории.<br>Новые ученики скоро придут.</div>'}</div>`,
        "РЕСЕПШН",
      );
      break;
    case "settings":
      renderSettings();
      break;
    case "help":
      modal(
        "Как растить кванториум",
        `<div class="game-instruction">Постройте научный центр с десятью направлениями и пройдите шесть глав. После финала можно продолжать играть.</div>${[
          [
            "01",
            "Соберите команду",
            "В разделе «Преподаватели» наймите специалиста. Его профильный навык определяет скорость занятий.",
          ],
          [
            "02",
            "Дождитесь группы",
            "Раз в 12 игровых секунд приходит ученик. Полная группа начинает занятие автоматически, если есть преподаватель.",
          ],
          [
            "03",
            "Защитите проект",
            "Нажмите на готовую лабораторию и решите тематическое задание. Ошибки не штрафуются. Во время мини-игры время центра остановлено.",
          ],
          [
            "04",
            "Развивайте центр",
            "Монеты нужны для найма и строительства, знания — для улучшений и обучения. Цели главы дают дополнительные ресурсы.",
          ],
          [
            "05",
            "Подготовьте выставку",
            "Каждый третий проект добавляет участника в команду. Команда из двух учеников уже может участвовать в выставке.",
          ],
        ]
          .map(
            ([n, t, d]) =>
              `<h3 class="section-title">${n} · ${t}</h3><p class="modal-intro">${d}</p>`,
          )
          .join(
            "",
          )}<div class="info-box">Сохранение работает только в этом браузере. Экспортируйте копию в настройках. За время отсутствия учитывается до двух часов обычного игрового времени; проекты сами не завершаются.</div>`,
        "ПАМЯТКА ДИРЕКТОРА",
      );
      break;
  }
}
function renderStaff() {
  modal(
    "Люди, которые вдохновляют",
    `<p class="modal-intro">До трёх преподавателей на квантум. Навык ускоряет занятия и приносит доход. Во время повышения квалификации преподаватель временно не работает.</p><h3 class="section-title">Ваша команда <span class="pill">${teacherList(state).length} преподавателей</span></h3>${
      teacherList(state)
        .map((t) => {
          let home = state.floors.find((f) => f.teachers.includes(t.id));
          return `<article class="staff-card"><div class="staff-card-top"><div class="avatar sprite-avatar">${sprite(0)}</div><div><h3>${esc(t.name)}</h3><p>${lab(home.id).name} · ${t.training ? `Обучение: <b data-training="${t.id}">${time(t.training.left)}</b>` : "Работает"}</p></div></div><div class="skill-tags">${Object.entries(
            t.skills,
          )
            .map(
              ([id, n]) =>
                `<span class="skill-tag">${lab(id).name} · ${n}/10</span>`,
            )
            .join(
              "",
            )}</div><div class="action-row">${button(t.skills[home.id] === 10 ? "Навык 10/10" : `Обучить · ✦ ${30 * t.skills[home.id]}`, "train", `data-id="${t.id}"`, "secondary small", !!t.training || t.skills[home.id] === 10)}${button("Перевести", "move-dialog", `data-id="${t.id}"`, "secondary small", !!t.training)}${button("Уволить", "fire-dialog", `data-id="${t.id}"`, "ghost small", !!t.training)}</div></article>`;
        })
        .join("") ||
      '<div class="empty">Первое занятие начинается с хорошего преподавателя.<br>Кандидат уже ждёт ниже.</div>'
    }<h3 class="section-title">Кандидаты <span class="pill">${state.candidates.length} / 5</span></h3>${
      state.candidates
        .map(
          (t) =>
            `<article class="staff-card"><div class="staff-card-top"><div class="avatar sprite-avatar">${sprite(t.id === "candidate-first" ? 0 : 1)}</div><div><h3>${esc(t.name)}</h3><p>Найм: ● ${t.cost} · без регулярной платы</p></div></div><div class="skill-tags">${Object.entries(
              t.skills,
            )
              .map(
                ([id, n]) =>
                  `<span class="skill-tag">${lab(id).name} · ${n}/10</span>`,
              )
              .join(
                "",
              )}</div><div class="action-row"><select aria-label="Квантум для ${esc(t.name)}" id="assign-${esc(t.id)}">${
              state.floors
                .filter((f) => t.skills[f.id] && f.teachers.length < 3)
                .map(
                  (f) =>
                    `<option value="${f.id}">${lab(f.id).name} · ${f.teachers.length}/3</option>`,
                )
                .join("") || '<option value="">Нет подходящего места</option>'
            }</select>${button("Нанять", "hire", `data-id="${t.id}"`, "primary small")}${button("Отказать", "reject", `data-id="${t.id}"`, "ghost small")}</div></article>`,
        )
        .join("") ||
      '<div class="empty">Новые кандидаты приходят раз в 65 игровых секунд.</div>'
    }`,
    "ПРЕПОДАВАТЕЛИ",
  );
}
function renderLab(f) {
  const l = lab(f.id),
    status = floorState(state, f),
    cost = upgradeCost(f);
  modal(
    l.name,
    `<div class="lab-detail-art">${roomArt(f.id)}</div><div class="detail-stats"><div><b>${f.students}/${capacity(f)}</b><span>учеников</span></div><div><b>${f.teachers.length}/3</b><span>преподавателей</span></div><div><b>${f.projects}</b><span>проектов</span></div></div>${status === "ready" ? `<div class="info-box">Группа готова представить проект. Решите задание и получите монеты и знания.</div>${button("✦ Защитить проект", "game-start", `data-id="${f.id}"`, "primary full")}` : status === "teacher" ? `<div class="info-box">Для занятия нужен преподаватель с навыком этого направления.</div>${button("Найти преподавателя", "nav", 'data-view="staff"', "primary full")}` : status === "learning" || status === "paused" ? `<div class="info-box">${status === "paused" ? "Занятие ждёт возвращения преподавателя." : "Ученики работают над проектом."} Осталось <b data-lesson="${f.id}">${time(f.lesson)}</b>.</div>` : '<div class="info-box">Группа набирается автоматически. Когда все места заполнятся, начнётся занятие.</div>'}<h3 class="section-title">Развитие лаборатории <span class="pill">Уровень ${f.level}/3</span></h3><p class="modal-intro">Улучшение добавляет два места и увеличивает награду за каждый проект. Реконструкцию можно начать между занятиями.</p>${f.level < 3 ? button(`Улучшить · ● ${cost.coins} + ✦ ${cost.knowledge}`, "upgrade", `data-id="${f.id}"`, "secondary full", f.lesson > 0 || f.ready) : '<span class="pill">✓ Максимальный уровень</span>'}${f.level >= 2 ? `<h3 class="section-title">Специализация</h3>${f.branch ? `<div class="info-box">${f.branch === "speed" ? "Быстрый старт: занятия на 25% короче." : "Качество проектов: +45 монет за каждый проект."} Специализация выбрана для этой лаборатории.</div>` : `<p class="modal-intro">Выберите один постоянный бонус. Бесплатно.</p><div class="split">${button("Быстрый старт · −25% времени", "branch", `data-id="${f.id}" data-value="speed"`, "secondary")}${button("Качество · +45 монет", "branch", `data-id="${f.id}" data-value="quality"`, "secondary")}</div>`}` : ""}<h3 class="section-title">Команда учеников <span class="pill">${f.team}/5</span></h3><p class="modal-intro">Каждый третий завершённый проект открывает нового участника команды. Следующий — через ${3 - (f.projects % 3)} проектов.</p>${button("Выставки и совместные проекты", "nav", 'data-view="projects"', "secondary full")}`,
    l.short.toUpperCase(),
  );
}
function renderProjects() {
  modal(
    "Большие идеи — вместе",
    `<p class="modal-intro">Каждый третий проект добавляет участника в команду. Выставки дают награды без случайного проигрыша: нужная сила команды известна заранее.</p>${state.floors
      .map((f) => {
        const l = lab(f.id),
          c = state.competitions.find((c) => c.floor === f.id),
          power = f.team * 10 + bestSkill(state, f) * 3;
        return `<article class="staff-card"><div class="staff-card-top"><span class="chapter-icon">${l.icon}</span><div><h3>${l.name}</h3><p>${f.team}/5 участников · сила команды ${power}</p></div></div>${
          c
            ? `<div class="info-box">Команда на выставке. До результата: <b data-comp="${f.id}">${time(c.left)}</b>. Награда: ${c.reward}.</div>`
            : f.team < 2
              ? '<p class="subtle">Нужно два участника — завершите шесть проектов в этом направлении.</p>'
              : `<div class="action-row">${[
                  ["Городская", 25, 1],
                  ["Региональная", 45, 2],
                  ["Всероссийская", 65, 3],
                ]
                  .map(([name, need, reward], i) =>
                    button(
                      `${name} · ♜ ${reward}${power < need ? " · сила " + need : ""}`,
                      "compete",
                      `data-id="${f.id}" data-level="${i}"`,
                      "secondary small",
                      power < need,
                    ),
                  )
                  .join("")}</div>`
        }</article>`;
      })
      .join(
        "",
      )}<h3 class="section-title">Межквантумный проект</h3><article class="staff-card"><div class="staff-card-top"><span class="chapter-icon">❋</span><div><h3>Умная теплица</h3><p>IT + Биоквантум + Хайтек</p></div></div><p class="modal-intro">Программа управляет датчиками, инженеры собирают устройство, а биологи создают условия для растений. Выполните хотя бы один обычный проект в каждом из трёх направлений.</p>${state.joint ? `<div class="info-box">Совместная работа идёт: <b data-joint>${time(state.joint.left)}</b></div>` : button("Начать · ✦ 180 знаний", "joint", "", "primary", !["it", "bio", "hi"].every((id) => state.floors.some((f) => f.id === id && f.projects > 0)))}<p class="subtle" style="margin-top:12px">3 минуты · награда: ● 600 · ✦ 150 · ♜ 2</p></article>`,
    "ПРОЕКТЫ И ВЫСТАВКИ",
  );
}
function renderSettings() {
  modal(
    "В своём ритме",
    `<div class="setting-row"><div><b>Звуки действий</b><small>Короткие звуки без фоновой музыки</small></div><button class="toggle ${state.settings.sound ? "on" : ""}" role="switch" aria-checked="${state.settings.sound}" aria-label="Звуки действий" data-action="setting" data-key="sound"></button></div><div class="setting-row"><div><b>Анимации</b><small>Движение персонажей и эффекты награды</small></div><button class="toggle ${state.settings.motion ? "on" : ""}" role="switch" aria-checked="${state.settings.motion}" aria-label="Анимации" data-action="setting" data-key="motion"></button></div><h3 class="section-title">Ваш прогресс</h3><p class="modal-intro">Сохраняется автоматически в этом браузере каждые 5 секунд и после действий. Копия позволит перенести игру на другое устройство.</p><div class="action-row">${button("Экспорт сохранения", "export", "", "primary")}${button("Импорт копии", "import", "", "secondary")}</div><input class="file-input" id="import-file" type="file" accept="application/json,.json"><div class="info-box">За время отсутствия учитываются доход и занятия за период до двух часов. Защита проектов остаётся за вами. Включённая пауза останавливает и офлайн-прогресс.</div><div class="action-row">${button("Как играть", "nav", 'data-view="help"', "secondary")}${button("Коллекция", "nav", 'data-view="collection"', "secondary")}${button("Журнал", "nav", 'data-view="journal"', "secondary")}</div><h3 class="section-title">Начать новую историю</h3><p class="modal-intro">Сброс удалит текущий прогресс в этом браузере. Сначала можно экспортировать копию.</p>${button("Начать заново", "reset-dialog", "", "danger")}<p class="subtle" style="margin-top:25px">Кванториум · версия 1.0<br>Одиночная игра. Без покупок, рекламы и обязательных ежедневных входов.</p>${window.QUANTORIUM_STANDALONE ? '<p class="subtle">Весь код и графика встроены в этот HTML-файл.</p>' : window.location.protocol === "file:" ? '<p class="subtle">Весь код — в файлах game.js, engine.js, app.js и tasks.js рядом с index.html.</p>' : '<a class="btn secondary full" href="source.zip" download>Скачать HTML, CSS и JS</a>'}`,
    "НАСТРОЙКИ",
  );
}
function perform(type, p = {}, refresh = true) {
  const r = act(state, type, p);
  if (!r.ok) {
    toast(r.error, true);
    return r;
  }
  sound(!!r.reward);
  if (r.reward) {
    confetti();
    toast(`+${r.reward.coins} монет · +${r.reward.knowledge} знаний`);
  }
  save();
  render();
  if (refresh && modalView && !game) drawModal();
  return r;
}
function guide() {
  if (!teacherList(state).length) return show("staff");
  const ready = state.floors.find((f) => f.ready);
  if (ready) return show("lab", ready.id);
  const c = CHAPTERS[state.chapter];
  if (c?.need.joint && !state.jointDone) return show("projects");
  if (c?.need.trophies > state.trophies) return show("projects");
  if (c?.need.floors > state.floors.length) return show("build");
  show("lab", state.floors[0].id);
}
const shuffle = (arr) => {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
function startGame(id) {
  const f = state.floors.find((x) => x.id === id);
  if (!f?.ready) {
    toast("Сначала дождитесь завершения занятия", true);
    return;
  }
  const variant = f.projects % 3;
  let task = TASKS[lab(id).name];
  game = {
    kind: ["sequence", "pairs", "route"][variant],
    floor: id,
    task,
    progress: 0,
    order: shuffle([0, 1, 2, 3]),
    selected: null,
    matched: [],
    status: "Пробуйте спокойно: ошибки не уменьшают награду.",
    done: false,
    program: [],
    pos: 20,
    target: 4,
    walls: [7, 12, 17],
    running: false,
  };
  if (LABS.findIndex((l) => l.id === id) % 2) {
    game.pos = 24;
    game.start = 24;
    game.target = 0;
    game.walls = [6, 7, 8, 16, 17];
  } else game.start = 20;
  modalView = null;
  drawGame();
}
function drawGame() {
  if (!game) return;
  const g = game;
  if (g.kind === "result") return;
  let body = "",
    title = "",
    l = lab(g.floor);
  if (g.done) {
    title = "Ещё одно открытие!";
    body = `<div class="victory"><div class="medallion">${l.icon}</div><h3>Получилось!</h3><p>Вы помогли команде разобраться с задачей.<br>Проект готов к выставке.</p><div class="reward-big"><span>● ${110 + 30 * (state.floors.find((f) => f.id === g.floor).level - 1) + (state.floors.find((f) => f.id === g.floor).branch === "quality" ? 45 : 0)}</span><span>✦ ${35 + state.floors.find((f) => f.id === g.floor).level * 10}</span></div>${button("Завершить проект и забрать награду", "game-claim", "", "primary full")}<p class="subtle">Можно сделать перерыв. Прогресс сохранится.</p></div>`;
  } else if (g.kind === "sequence") {
    title = g.task.title;
    body = `<div class="game-instruction">${esc(g.task.hint)}<br><strong>Нажимайте шаги в правильном порядке.</strong></div>${progress(g.progress, 4)}<div class="game-status" role="status">${esc(g.status)} · ${g.progress}/4</div><div class="game-buttons">${g.order.map((i) => `<button class="game-card ${i < g.progress ? "correct" : ""}" data-action="sequence" data-index="${i}" ${i < g.progress ? "disabled" : ""}>${i < g.progress ? "✓ " : ""}${esc(g.task.steps[i])}</button>`).join("")}</div>`;
  } else if (g.kind === "pairs") {
    title = g.task.pair_title;
    body = `<div class="game-instruction">Выберите понятие слева, затем подходящее описание справа. Соберите четыре пары.</div>${progress(g.matched.length, 4)}<div class="game-status" role="status">${esc(g.status)}</div><div class="pairs"><div>${g.task.pairs.map((p, i) => `<button class="game-card ${g.matched.includes(i) ? "correct" : g.selected === i ? "selected" : ""}" data-action="pair-left" data-index="${i}" ${g.matched.includes(i) ? "disabled" : ""}>${esc(p[0])}</button>`).join("")}</div><div>${g.order.map((i) => `<button class="game-card ${g.matched.includes(i) ? "correct" : ""}" data-action="pair-right" data-index="${i}" ${g.matched.includes(i) ? "disabled" : ""}>${esc(g.task.pairs[i][1])}</button>`).join("")}</div></div>`;
  } else if (g.kind === "route") {
    const titles = {
      it: "Программа для робота",
      bio: "Доставка образца",
      robo: "Маршрут манипулятора",
      vr: "Навигация в виртуальном мире",
      nano: "Доставка материала",
      hi: "Логистика мастерской",
      media: "Маршрут съёмочной группы",
      auto: "Автономный автомобиль",
      geo: "Маршрут экспедиции",
      design: "Путь пользователя",
    };
    title = titles[g.floor];
    body = `<div class="game-instruction">Составьте программу движения от <strong>◉</strong> к <strong>★</strong>. Серые клетки — препятствия. Добавьте стрелки, затем нажмите «Запустить». Не больше 16 команд.</div><div class="grid-game" role="img" aria-label="Поле пять на пять. Робот: строка ${Math.floor(g.pos / 5) + 1}, столбец ${(g.pos % 5) + 1}. Цель: строка ${Math.floor(g.target / 5) + 1}, столбец ${(g.target % 5) + 1}. Препятствия: ${g.walls.map((n) => `${Math.floor(n / 5) + 1},${(n % 5) + 1}`).join("; ")}">${Array.from({ length: 25 }, (_, i) => `<div class="grid-cell ${g.walls.includes(i) ? "wall" : i === g.pos ? "bot" : i === g.target ? "target" : ""}">${i === g.pos ? "◉" : i === g.target ? "★" : g.walls.includes(i) ? "▧" : ""}</div>`).join("")}</div><div class="program" aria-label="Программа движения">${g.program.length ? g.program.map((d) => ({ up: "↑", down: "↓", left: "←", right: "→" })[d]).join(" ") : "<small>Здесь появится ваша программа</small>"}</div><div class="arrow-controls">${[
      ["left", "←"],
      ["up", "↑"],
      ["down", "↓"],
      ["right", "→"],
    ]
      .map(([d, a]) =>
        button(
          a,
          "route-add",
          `data-dir="${d}" aria-label="${{ left: "Влево", right: "Вправо", up: "Вверх", down: "Вниз" }[d]}"`,
          "secondary",
          g.running || g.program.length >= 16,
        ),
      )
      .join(
        "",
      )}</div><div class="game-status" role="status">${esc(g.status)}</div><div class="action-row">${button(g.running ? "Выполняется…" : "▶ Запустить", "route-run", "", "primary", g.running || !g.program.length)}${button("Убрать шаг", "route-undo", "", "secondary", g.running || !g.program.length)}${button("Сначала", "route-reset", "", "secondary", g.running)}</div><p class="keyboard-hint">Можно использовать стрелки клавиатуры.</p>`;
  }
  modal(
    title,
    body +
      (!g.done
        ? `<div style="margin-top:24px">${button("Вернуться позже", "close", "", "ghost")}</div>`
        : ""),
    `${l.name.toUpperCase()} · ${["sequence", "pairs", "route"].indexOf(g.kind) + 1}/3`,
  );
}
async function runRoute() {
  const g = game;
  if (!g || g.kind !== "route" || g.running || !g.program.length) return;
  g.running = true;
  g.pos = g.start;
  g.status = "Программа выполняется…";
  drawGame();
  for (const dir of g.program) {
    await new Promise((r) => setTimeout(r, state.settings.motion ? 300 : 60));
    if (game !== g) return;
    let next = g.pos + { left: -1, right: 1, up: -5, down: 5 }[dir];
    if (
      next < 0 ||
      next >= 25 ||
      (dir === "left" && g.pos % 5 === 0) ||
      (dir === "right" && g.pos % 5 === 4) ||
      g.walls.includes(next)
    ) {
      g.running = false;
      g.status =
        "Препятствие! Попробуйте изменить программу. Начальная точка восстановлена.";
      g.pos = g.start;
      drawGame();
      return;
    }
    g.pos = next;
    drawGame();
  }
  g.running = false;
  if (g.pos === g.target) {
    g.done = true;
    sound(true);
    confetti();
  } else
    g.status =
      "Пока не дошли до звезды. Добавьте или измените команды и запустите программу снова.";
  drawGame();
}
function startEscort(id) {
  const n = state.newbies.find((n) => n.id === id),
    f = state.floors.find((f) => f.id === n?.target);
  if (!f || f.students >= capacity(f) || f.lesson > 0 || f.ready) {
    toast("В нужной лаборатории пока нет мест. Завершите её проект.", true);
    return;
  }
  game = {
    kind: "escort",
    id,
    target: n.target,
    level: 0,
    name: n.name,
    x: 82,
    followX: 90,
    held: null,
    lastStep: -Infinity,
  };
  modalView = null;
  drawEscort();
  escortLoop(game);
}
function drawEscort() {
  let g = game;
  if (!g || g.kind !== "escort") return;
  const target = state.floors.findIndex((f) => f.id === g.target) + 2;
  const levels = [
    "Ресепшн",
    "Кабинет директора",
    ...state.floors.map((f) => lab(f.id).name),
  ];
  const currentId =
    g.level === 0
      ? "reception"
      : g.level === 1
        ? "director"
        : state.floors[g.level - 2].id;
  modal(
    "Покажем дорогу",
    `<div class="game-instruction">${esc(g.name)} ищет <b>${lab(g.target).name}</b>. Подойдите к лестнице слева, поднимитесь на нужный этаж и проводите ученика в середину комнаты.</div><div class="escort-current"><b>${g.level + 1} этаж · ${levels[g.level]}</b><span class="pill">Цель: ${target + 1} этаж</span></div><div class="escort-scene">${roomArt(currentId)}<div class="stair-zone"><span>↑</span><span>ЛЕСТНИЦА</span><span>↓</span></div><div class="escort-npc follower" style="left:${g.followX}%">${sprite(2, !!g.held)}</div><div class="escort-npc player" style="left:${g.x}%">${sprite(1, !!g.held)}<span>Вы</span></div></div><div class="game-status" id="escort-status" role="status">${g.level === target ? "Вы на нужном этаже. Пройдите к середине комнаты." : "Лестница находится слева."}</div><div class="dpad" aria-label="Управление сопровождением">${button("↑", "escort-control", 'data-dir="up" aria-label="Этаж выше"', "secondary dpad-up")}${button("←", "escort-control", 'data-dir="left" aria-label="Идти влево"', "secondary dpad-left")}${button("↓", "escort-control", 'data-dir="down" aria-label="Этаж ниже"', "secondary dpad-down")}${button("→", "escort-control", 'data-dir="right" aria-label="Идти вправо"', "secondary dpad-right")}</div><p class="keyboard-hint">Удерживайте кнопки или стрелки клавиатуры. Escape — вернуться позже.</p>`,
    "СОПРОВОЖДЕНИЕ",
  );
}
function escortStep(g, dir, dt) {
  if (game !== g) return;
  const speed = 35;
  if (dir === "left" || dir === "right") {
    g.x = Math.min(
      94,
      Math.max(7, g.x + (dir === "left" ? -1 : 1) * speed * dt),
    );
  } else if (g.x > 19) {
    const e = $("#escort-status");
    if (e) e.textContent = "Сначала подойдите к лестнице слева.";
  } else if (performance.now() - g.lastStep > 420) {
    const next = Math.max(
      0,
      Math.min(state.floors.length + 1, g.level + (dir === "up" ? 1 : -1)),
    );
    if (next !== g.level) {
      g.level = next;
      g.x = 12;
      g.followX = 18;
      g.lastStep = performance.now();
      g.held = null;
      drawEscort();
    }
  }
  const target = state.floors.findIndex((f) => f.id === g.target) + 2;
  if (g.level === target && g.x >= 49 && g.x <= 70) {
    let r = perform("escort", { id: g.id, floor: g.target }, false);
    if (r.ok) {
      closeModal();
      toast("Ученик нашёл лабораторию. Спасибо за помощь!");
    }
  }
}
function escortLoop(g) {
  let prev = performance.now();
  function frame(now) {
    if (game !== g) return;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (g.held) escortStep(g, g.held, dt);
    if (game !== g) return;
    g.followX += (Math.min(95, g.x + 9) - g.followX) * Math.min(1, dt * 9);
    const player = $(".escort-npc.player"),
      follower = $(".escort-npc.follower");
    if (player) player.style.left = g.x + "%";
    if (follower) follower.style.left = g.followX + "%";
    document
      .querySelectorAll(".escort-npc .sprite")
      .forEach((e) => e.classList.toggle("sprite-walk", !!g.held));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function download(name, text) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function handleAction(e) {
  const b = e.target.closest("[data-action]");
  if (!b || b.disabled) return;
  const d = b.dataset,
    id = d.id;
  switch (d.action) {
    case "nav":
      if (d.view === "tower") {
        closeModal();
        window.scrollTo({
          top: 0,
          behavior: state.settings.motion ? "smooth" : "instant",
        });
      } else show(d.view);
      break;
    case "close":
      closeModal();
      break;
    case "guide":
      guide();
      break;
    case "pause":
      perform(
        "settings",
        { key: "paused", value: !state.settings.paused },
        false,
      );
      break;
    case "speed":
      perform("settings", { key: "speed", value: Number(d.value) }, false);
      break;
    case "setting":
      perform("settings", { key: d.key, value: !state.settings[d.key] });
      if (d.key === "sound") sound();
      break;
    case "lab":
      show("lab", id);
      break;
    case "build":
      if (perform("build", { id }, false).ok) {
        worldSignature = "";
        closeModal();
        render();
        document
          .querySelector(`[data-floor-card="${id}"]`)
          ?.classList.add("just-built");
        document.querySelector(`[data-floor-card="${id}"]`)?.scrollIntoView({
          behavior: state.settings.motion ? "smooth" : "instant",
          block: "center",
        });
        toast("Новая лаборатория открыта! Наймите преподавателя.");
        confetti();
      }
      break;
    case "hire": {
      let floor = document.getElementById("assign-" + id)?.value;
      if (perform("hire", { id, floor }).ok)
        toast("Добро пожаловать в команду!");
      break;
    }
    case "reject":
      perform("reject", { id });
      break;
    case "train":
      if (perform("train", { id }).ok)
        toast("Обучение займёт 90 игровых секунд");
      break;
    case "move-dialog": {
      const t = state.teachers[id];
      if (!t) break;
      modalView = null;
      modal(
        "Перевести преподавателя",
        `<p class="modal-intro">${esc(t.name)}: выберите новое направление.</p><div class="game-buttons">${
          state.floors
            .filter((f) => t.skills[f.id] && !f.teachers.includes(id))
            .map((f) =>
              button(
                `${lab(f.id).name} · ${f.teachers.length}/3`,
                "move",
                `data-id="${id}" data-floor="${f.id}"`,
                "secondary",
                f.teachers.length >= 3,
              ),
            )
            .join("") ||
          '<div class="empty">Пока нет другого подходящего квантума.</div>'
        }</div>`,
      );
      break;
    }
    case "move":
      if (perform("move", { id, floor: d.floor }, false).ok) show("staff");
      break;
    case "fire-dialog":
      modalView = null;
      modal(
        "Завершить сотрудничество?",
        `<p class="modal-intro">${esc(state.teachers[id]?.name || "Преподаватель")} покинет центр. Плата за найм не возвращается. Занятие без профильного преподавателя приостановится.</p><div class="action-row">${button("Уволить", "fire", `data-id="${id}"`, "danger")}${button("Оставить в команде", "nav", 'data-view="staff"', "secondary")}</div>`,
      );
      break;
    case "fire":
      if (perform("fire", { id }, false).ok) show("staff");
      break;
    case "upgrade":
      if (perform("upgrade", { floor: id }).ok) {
        toast("Лаборатория стала больше!");
        confetti();
      }
      break;
    case "branch":
      modalView = null;
      modal(
        "Выбрать специализацию?",
        `<p class="modal-intro">${d.value === "speed" ? "Занятия станут на 25% короче." : "Каждый проект будет приносить на 45 монет больше."} Бонус постоянный: после выбора поменять его нельзя.</p><div class="action-row">${button("Выбрать", "branch-confirm", `data-id="${id}" data-value="${d.value}"`)}${button("Назад", "lab", `data-id="${id}"`, "secondary")}</div>`,
      );
      break;
    case "branch-confirm":
      if (perform("branch", { floor: id, value: d.value }, false).ok)
        show("lab", id);
      break;
    case "compete":
      if (perform("competition", { floor: id, level: Number(d.level) }).ok)
        toast("Команда отправилась на выставку");
      break;
    case "joint":
      if (perform("joint").ok)
        toast("Три направления начали совместную работу");
      break;
    case "claimChapter":
      if (perform("claimChapter", {}, false).ok && state.chapter === 6) {
        modalView = null;
        modal(
          "Кванториум будущего",
          `<div class="victory"><div class="medallion">✧</div><h3>Большая выставка открыта!</h3><p>Десять направлений. Сорок проектов. Сотни маленьких открытий.<br>Вы создали место, где любопытство становится знанием.</p>${button("Продолжить в свободном режиме", "close", "", "primary full")}${button("Посмотреть коллекцию", "nav", 'data-view="collection"', "secondary full")}</div>`,
          "КАМПАНИЯ ЗАВЕРШЕНА",
        );
      }
      break;
    case "game-start":
      startGame(id);
      break;
    case "sequence":
      if (game?.kind === "sequence" && !game.done) {
        let i = Number(d.index);
        if (i === game.progress) {
          game.progress++;
          game.status = "Верно! Какой шаг следующий?";
          sound();
          if (game.progress === 4) {
            game.done = true;
            sound(true);
            confetti();
          }
        } else game.status = "Сначала: " + game.task.steps[game.progress];
        drawGame();
      }
      break;
    case "pair-left":
      if (
        game?.kind === "pairs" &&
        !game.done &&
        !game.matched.includes(Number(d.index))
      ) {
        game.selected = Number(d.index);
        game.status = "Теперь выберите описание справа.";
        drawGame();
      }
      break;
    case "pair-right":
      if (game?.kind === "pairs" && !game.done) {
        let i = Number(d.index);
        if (game.matched.includes(i)) break;
        if (game.selected === null)
          game.status = "Сначала выберите карточку слева.";
        else if (i === game.selected) {
          game.matched.push(i);
          game.selected = null;
          game.status = "Пара найдена!";
          sound();
          if (game.matched.length === 4) {
            game.done = true;
            sound(true);
            confetti();
          }
        } else game.status = "Это другое понятие. Попробуйте ещё раз.";
        drawGame();
      }
      break;
    case "route-add":
      if (
        game?.kind === "route" &&
        !game.running &&
        game.program.length < 16 &&
        ["up", "down", "left", "right"].includes(d.dir)
      ) {
        game.program.push(d.dir);
        drawGame();
      }
      break;
    case "route-undo":
      if (game?.kind === "route" && !game.running) {
        game.program.pop();
        drawGame();
      }
      break;
    case "route-reset":
      if (game?.kind === "route" && !game.running) {
        game.program = [];
        game.pos = game.start;
        game.status = "Новая попытка. Найдите путь вокруг препятствий.";
        drawGame();
      }
      break;
    case "route-run":
      runRoute();
      break;
    case "game-claim":
      if (game?.done && game.kind !== "result") {
        let floor = game.floor;
        let r = perform("complete", { floor }, false);
        if (r.ok) {
          game = { kind: "result" };
          modalView = null;
          modal(
            "Проект в вашей коллекции",
            `<div class="victory"><div class="medallion">✓</div><h3>Отличная работа!</h3><p>Ученики завершили занятие.<br>Лаборатория готова принять новую группу.</p><div class="reward-big"><span>● +${r.reward.coins}</span><span>✦ +${r.reward.knowledge}</span></div>${button("Вернуться к кванториуму", "close", "", "primary full")}</div>`,
            "ОТКРЫТИЕ СОХРАНЕНО",
          );
        }
      }
      break;
    case "escort-start":
      startEscort(id);
      break;
    case "escort-control":
      if (game?.kind === "escort") escortStep(game, d.dir, 0.25);
      break;
    case "export":
      download(
        "Кванториум-сохранение.json",
        JSON.stringify({ ...state, savedAt: Date.now() }, null, 2),
      );
      toast("Копия сохранения подготовлена");
      break;
    case "import":
      $("#import-file")?.click();
      break;
    case "import-confirm":
      if (importPending) {
        state = importPending;
        importPending = null;
        state.savedAt = Date.now();
        saveBlocked = false;
        saveError = "";
        game = null;
        worldSignature = "";
        railSignature = "";
        lastTick = performance.now();
        save();
        render();
        show("settings");
        toast("Прогресс восстановлен");
      }
      break;
    case "reset-dialog":
      modalView = null;
      modal(
        "Начать с чистого листа?",
        `<p class="modal-intro">Все этажи, преподаватели, проекты и ресурсы этой игры будут удалены. Экспортированная копия останется у вас.</p><div class="action-row">${button("Да, новая игра", "reset-confirm", "", "danger")}${button("Нет, продолжить", "nav", 'data-view="settings"', "secondary")}</div>`,
      );
      break;
    case "reset-confirm":
      state = initialState();
      saveBlocked = false;
      saveError = "";
      worldSignature = "";
      railSignature = "";
      game = null;
      importPending = null;
      save();
      closeModal();
      render();
      toast("Новая история начинается с первого преподавателя");
      break;
  }
}
document.addEventListener("click", (e) => {
  try {
    handleAction(e);
  } catch (error) {
    console.error(error);
    toast("Действие не удалось. Прогресс сохранён; попробуйте ещё раз.", true);
  }
});
$("#modal").addEventListener("cancel", (e) => {
  e.preventDefault();
  closeModal();
});
$("#modal").addEventListener("click", (e) => {
  if (e.target === $("#modal")) {
    const r = e.target.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      closeModal();
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.id !== "import-file") return;
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 150000) throw Error("Файл слишком большой");
    importPending = validateSave(JSON.parse(await file.text()));
    modalView = null;
    modal(
      "Восстановить эту игру?",
      `<p class="modal-intro">В копии: ${importPending.floors.length} направлений, ${totalProjects(importPending)} проектов, ${fmt(importPending.coins)} монет. Текущий прогресс будет заменён.</p><div class="action-row">${button("Восстановить", "import-confirm")}${button("Отмена", "nav", 'data-view="settings"', "secondary")}</div>`,
    );
  } catch (error) {
    importPending = null;
    toast(error.message || "Не удалось прочитать файл", true);
  }
});
document.addEventListener("keydown", (e) => {
  if (game?.kind === "route" && !game.running && !game.done) {
    const dirs = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    if (dirs[e.key]) {
      e.preventDefault();
      if (game.program.length < 16) {
        game.program.push(dirs[e.key]);
        drawGame();
      }
    }
  }
});
window.addEventListener("pagehide", save);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) save();
});
// Another tab owns the newer save. Stop this tab instead of silently overwriting it.
window.addEventListener("storage", (e) => {
  if (e.key !== KEY || !e.newValue) return;
  saveBlocked = true;
  state.settings.paused = true;
  saveError =
    "Игра изменена в другой вкладке. Закройте эту вкладку или обновите страницу, чтобы загрузить актуальный прогресс.";
  render();
});
shell();
render();
let lastTransitions = "";
setInterval(() => {
  const now = performance.now(),
    dt = (now - lastTick) / 1000;
  lastTick = now;
  if (!state.settings.paused && !game && !saveBlocked)
    advance(state, dt * state.settings.speed);
  render();
  const transitions = JSON.stringify([
    state.candidates.length,
    state.floors.map((f) => [floorState(state, f), f.team, f.level]),
    state.competitions.length,
    state.jointDone,
    state.stats.trained,
  ]);
  if (transitions !== lastTransitions) {
    lastTransitions = transitions;
    if (modalView && ["lab", "staff", "projects"].includes(modalView.view)) {
      const active = document.activeElement;
      const focusKey = active?.dataset.action,
        focusID = active?.dataset.id;
      drawModal();
      if (focusKey)
        Array.from($("#modal").querySelectorAll("[data-action]"))
          .find(
            (e) => e.dataset.action === focusKey && e.dataset.id === focusID,
          )
          ?.focus({ preventScroll: true });
    }
  }
  saveTimer += dt;
  if (saveTimer >= 5) {
    saveTimer = 0;
    save();
  }
}, 1000);
if (offline)
  setTimeout(
    () =>
      toast(
        `С возвращением! За ваше отсутствие: +${fmt(offline.coins)} монет. Занятия и обучение тоже продолжились.`,
      ),
    500,
  );
// Optional agent interface: read state or open the same panel used by the player.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const tools = [
    {
      name: "read_quantorium",
      title: "Состояние кванториума",
      description:
        "Read resources, laboratories and current campaign goals without changing the game.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => ({
        coins: Math.floor(state.coins),
        knowledge: state.knowledge,
        trophies: state.trophies,
        chapter: state.chapter + 1,
        floors: state.floors.map((f) => ({
          id: f.id,
          name: lab(f.id).name,
          state: floorState(state, f),
          students: f.students,
          projects: f.projects,
        })),
        goals: chapterProgress(state),
      }),
    },
    {
      name: "open_quantorium_panel",
      title: "Открыть раздел игры",
      description:
        "Open a game panel without buying, hiring or awarding anything.",
      inputSchema: {
        type: "object",
        properties: {
          panel: {
            type: "string",
            enum: [
              "build",
              "staff",
              "projects",
              "collection",
              "settings",
              "help",
            ],
          },
        },
        required: ["panel"],
        additionalProperties: false,
      },
      execute: ({ panel }) => {
        if (
          ![
            "build",
            "staff",
            "projects",
            "collection",
            "settings",
            "help",
          ].includes(panel)
        )
          throw Error("Unknown panel");
        if (game) throw Error("Finish or close the current mini-game first");
        show(panel);
        return { opened: panel };
      },
    },
  ];
  for (const t of tools) {
    try {
      Promise.resolve(
        document.modelContext.registerTool(t, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
  }
  window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}

// Pointer capture prevents a stuck movement button when a finger leaves the D-pad.
document.addEventListener("pointerdown", (e) => {
  const b = e.target.closest('[data-action="escort-control"]');
  if (b && game?.kind === "escort") {
    game.held = b.dataset.dir;
    b.setPointerCapture?.(e.pointerId);
  }
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  document.addEventListener(type, () => {
    if (game?.kind === "escort") game.held = null;
  });
document.addEventListener("keydown", (e) => {
  if (game?.kind !== "escort") return;
  const dirs = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
  };
  if (dirs[e.key]) {
    e.preventDefault();
    game.held = dirs[e.key];
  }
});
document.addEventListener("keyup", (e) => {
  if (game?.kind === "escort" && e.key.startsWith("Arrow")) game.held = null;
});
window.addEventListener("blur", () => {
  if (game?.kind === "escort") game.held = null;
});
