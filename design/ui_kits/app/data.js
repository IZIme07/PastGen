// Sample family archive for the PastGen UI kit — the Sokolov family, 3 generations.
// Russian content matches the product spec. Confidence + sources are first-class.
window.PG_DATA = (function () {
  const people = {
    ivan:    { id: "ivan",    name: "Иван Соколов",            lifespan: "1924–1991", born: "Тула",   role: "Прадед · отцовская линия", confidence: 92, deceased: true,  gen: 0, x: 0 },
    maria:   { id: "maria",   name: "Мария Соколова",          lifespan: "1928–2009", born: "Тула",   role: "Прабабушка · отцовская линия", confidence: 76, deceased: true, gen: 0, x: 1, conflict: true },
    nikolay: { id: "nikolay", name: "Николай Соколов",         lifespan: "1950",      born: "Москва", role: "Дед", confidence: 88, deceased: false, gen: 1, x: 0 },
    lidia:   { id: "lidia",   name: "Лидия Соколова",          lifespan: "1953",      born: "Калуга", role: "Бабушка · по браку", confidence: 64, deceased: false, gen: 1, x: 1 },
    anna:    { id: "anna",    name: "Анна Соколова",           lifespan: "1955",      born: "Москва", role: "Двоюродная бабушка", confidence: 70, deceased: false, gen: 1, x: 2 },
    dmitry:  { id: "dmitry",  name: "Дмитрий Соколов",         lifespan: "1978",      born: "Москва", role: "Отец", confidence: 95, deceased: false, gen: 2, x: 0 },
    elena:   { id: "elena",   name: "Елена Соколова",          lifespan: "1981",      born: "Москва", role: "Тётя", confidence: 90, deceased: false, gen: 2, x: 1 },
  };

  // Dossier detail for the focus person.
  const dossier = {
    maria: {
      name: "Мария Ивановна Соколова",
      altNames: "Мария Соколова (урожд. Громова)",
      lifespan: "1928 – 2009",
      confidence: 76,
      summary:
        "Мария родилась в Туле в период крупных социальных изменений. Семья оставалась в городе до эвакуации 1941 года, после чего след ведёт в Москву. Дата рождения остаётся спорной.",
      claims: [
        { label: "Рождение", value: "1928, Тула", confidence: 70, alternatives: 2, conflict: "1928 / 1930",
          sources: [{ type: "story", label: "Рассказ дочери" }, { type: "archive", label: "Метрическая книга" }] },
        { label: "Брак", value: "1949, Москва · Иван Соколов", confidence: 95,
          sources: [{ type: "document", label: "Свид. о браке" }] },
        { label: "Дети", value: "2 ребёнка — Николай, Анна", confidence: 90,
          sources: [{ type: "document", label: "Свид. о рождении ×2" }] },
        { label: "Смерть", value: "2009, место не подтверждено", confidence: 38, conflict: "Место не подтверждено",
          sources: [{ type: "comment", label: "Семейное свидетельство" }] },
      ],
      tasks: [
        "Проверить метрические книги Тулы (1928–1930)",
        "Найти эвакуационные списки 1941 года",
        "Уточнить место смерти",
      ],
    },
  };

  const proposals = [
    { id: "p1", kind: "add_fact", title: "Дата рождения → 1928", confidence: 88,
      detail: "ИИ извлёк дату из свидетельства о рождении при импорте скана.",
      sources: [{ type: "document", label: "Свидетельство о рождении" }],
      conflict: "Конфликтует с подписью на фото (1930)" },
    { id: "p2", kind: "add_person", title: "Новый человек — Громова П.", confidence: 54,
      detail: "В тексте письма упомянута «сестра Полина». Возможно, новая ветвь.",
      sources: [{ type: "letter", label: "Письмо 1947" }] },
    { id: "p3", kind: "link_photo", title: "Связать фото с событием «Брак, 1949»", confidence: 72,
      detail: "Распознан групповой портрет; одежда и формат соответствуют концу 1940-х.",
      sources: [{ type: "photo", label: "Групповой портрет" }] },
    { id: "p4", kind: "merge", title: "Объединить «М. Соколова» и «Мария Громова»", confidence: 81,
      detail: "Вероятный дубль: совпадают даты, место и дети.",
      sources: [{ type: "archive", label: "Архивная справка" }, { type: "story", label: "Рассказ" }] },
  ];

  const timeline = [
    { year: "1924", kind: "birth",    icon: "baby",          person: "Иван Соколов",   place: "Тула",   conf: 92, label: "Рождение" },
    { year: "1928", kind: "birth",    icon: "baby",          person: "Мария Громова",  place: "Тула",   conf: 70, label: "Рождение", conflict: true },
    { year: "1941", kind: "move",     icon: "footprints",    person: "Семья Соколовых",place: "Тула → Москва", conf: 60, label: "Эвакуация" },
    { year: "1949", kind: "marriage", icon: "heart",         person: "Иван × Мария",   place: "Москва", conf: 95, label: "Брак" },
    { year: "1950", kind: "birth",    icon: "baby",          person: "Николай Соколов",place: "Москва", conf: 88, label: "Рождение" },
    { year: "1991", kind: "death",    icon: "cross",         person: "Иван Соколов",   place: "Москва", conf: 90, label: "Смерть" },
    { year: "2009", kind: "death",    icon: "cross",         person: "Мария Соколова", place: "—",      conf: 38, label: "Смерть", conflict: true },
  ];

  const places = [
    { id: "tula",   name: "Тула",   top: "46%", left: "34%", count: 3, kind: "Рождения · ветвь" },
    { id: "moscow", name: "Москва", top: "38%", left: "44%", count: 5, kind: "Браки · проживание" },
    { id: "kaluga", name: "Калуга", top: "52%", left: "30%", count: 1, kind: "Рождение" },
  ];

  const branchColors = {
    paternal: "var(--evergreen-500)",
    maternal: "var(--brass-500)",
    married:  "var(--assist-500)",
  };

  // Which branch each person belongs to (drives node accent + bar colour).
  const branchOf = {
    ivan: "paternal", maria: "maternal", nikolay: "paternal", lidia: "married",
    anna: "paternal", dmitry: "paternal", elena: "paternal",
  };

  // Birth / death years (numeric) for the lifespan timeline. d:null = living.
  const years = {
    ivan:    { b: 1924, d: 1991 },
    maria:   { b: 1928, d: 2009, altB: 1930 }, // disputed birth year
    nikolay: { b: 1950, d: null },
    lidia:   { b: 1953, d: null },
    anna:    { b: 1955, d: null },
    dmitry:  { b: 1978, d: null },
    elena:   { b: 1981, d: null },
  };
  const PRESENT = 2025;

  // Relationship edges for the connection graph.
  const relationships = [
    { a: "ivan", b: "maria", type: "spouse" },
    { a: "ivan", b: "nikolay", type: "parent" }, { a: "maria", b: "nikolay", type: "parent" },
    { a: "ivan", b: "anna", type: "parent" },    { a: "maria", b: "anna", type: "parent" },
    { a: "nikolay", b: "lidia", type: "spouse" },
    { a: "nikolay", b: "dmitry", type: "parent" }, { a: "lidia", b: "dmitry", type: "parent" },
    { a: "nikolay", b: "elena", type: "parent" },  { a: "lidia", b: "elena", type: "parent" },
    { a: "nikolay", b: "anna", type: "sibling" },
  ];

  // Shared milestones drawn as vertical guides on the lifespan timeline.
  const eras = [
    { year: 1941, label: "Эвакуация", icon: "footprints", tint: "var(--brass-600)" },
    { year: 1949, label: "Брак", icon: "heart", tint: "var(--conflict-500)" },
  ];

  return { people, dossier, proposals, timeline, places, branchColors,
           branchOf, years, relationships, eras, PRESENT };
})();
