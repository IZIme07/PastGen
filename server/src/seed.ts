// Демо-данные: семья Соколовых из дизайн-системы (design/ui_kits/app/data.js).
// Запуск: npm run seed. Идемпотентен — пропускает, если люди уже есть.
import path from "node:path";
import { openDb } from "./db/index.js";
import * as persons from "./db/repos/persons.js";
import * as relationships from "./db/repos/relationships.js";
import * as claims from "./db/repos/claims.js";
import * as sources from "./db/repos/sources.js";
import * as places from "./db/repos/places.js";
import * as events from "./db/repos/events.js";
import * as proposals from "./db/repos/proposals.js";
import * as tasks from "./db/repos/tasks.js";
import { runChecks } from "./consistency/engine.js";

const dataDir = path.resolve(process.env.DATA_DIR ?? "./data");
const db = openDb(dataDir);

if (persons.list(db).length > 0) {
  console.log("База не пуста — сид пропущен.");
  process.exit(0);
}

const seed = db.transaction(() => {
  // Люди (роль/ветвь — в notes; годы жизни — отдельными утверждениями ниже).
  const ivan = persons.create(db, {
    display_name: "Иван Соколов", surname: "Соколов", given_name: "Иван", sex: "male",
    deceased: true, notes: "Прадед · отцовская линия · ветвь: paternal",
  });
  const maria = persons.create(db, {
    display_name: "Мария Ивановна Соколова", surname: "Соколова", given_name: "Мария",
    patronymic: "Ивановна", maiden_name: "Громова", alt_names: ["Мария Громова"],
    sex: "female", deceased: true, notes: "Прабабушка · отцовская линия · ветвь: maternal",
    bio_md:
      "Мария родилась в Туле в период крупных социальных изменений. Семья оставалась в городе до эвакуации 1941 года, после чего след ведёт в Москву. Дата рождения остаётся спорной.",
  });
  const nikolay = persons.create(db, {
    display_name: "Николай Соколов", surname: "Соколов", given_name: "Николай", sex: "male",
    notes: "Дед · ветвь: paternal",
  });
  const lidia = persons.create(db, {
    display_name: "Лидия Соколова", surname: "Соколова", given_name: "Лидия", sex: "female",
    notes: "Бабушка · по браку · ветвь: married",
  });
  const anna = persons.create(db, {
    display_name: "Анна Соколова", surname: "Соколова", given_name: "Анна", sex: "female",
    notes: "Двоюродная бабушка · ветвь: paternal",
  });
  const dmitry = persons.create(db, {
    display_name: "Дмитрий Соколов", surname: "Соколов", given_name: "Дмитрий", sex: "male",
    notes: "Отец · ветвь: paternal",
  });
  const elena = persons.create(db, {
    display_name: "Елена Соколова", surname: "Соколова", given_name: "Елена", sex: "female",
    notes: "Тётя · ветвь: paternal",
  });

  // Связи (a — родитель b для type=parent).
  const rel = (a: string, b: string, type: Parameters<typeof relationships.create>[1]["type"]) =>
    relationships.create(db, { a_id: a, b_id: b, type });
  rel(ivan.id, maria.id, "spouse");
  rel(ivan.id, nikolay.id, "parent"); rel(maria.id, nikolay.id, "parent");
  rel(ivan.id, anna.id, "parent");    rel(maria.id, anna.id, "parent");
  rel(nikolay.id, lidia.id, "spouse");
  rel(nikolay.id, dmitry.id, "parent"); rel(lidia.id, dmitry.id, "parent");
  rel(nikolay.id, elena.id, "parent");  rel(lidia.id, elena.id, "parent");
  rel(nikolay.id, anna.id, "sibling");

  // Источники.
  const srcStory = sources.create(db, { type: "story", title: "Рассказ дочери" });
  const srcMetric = sources.create(db, { type: "archive", title: "Метрическая книга" });
  const srcMarriage = sources.create(db, { type: "document", title: "Свидетельство о браке" });
  const srcBirths = sources.create(db, { type: "document", title: "Свидетельства о рождении ×2" });
  const srcComment = sources.create(db, { type: "comment", title: "Семейное свидетельство" });
  const srcLetter = sources.create(db, { type: "letter", title: "Письмо 1947" });
  const srcPhoto = sources.create(db, { type: "photo", title: "Групповой портрет" });
  const srcArchive = sources.create(db, { type: "archive", title: "Архивная справка" });
  const srcBirthScan = sources.create(db, { type: "document", title: "Свидетельство о рождении (скан)" });

  // Годы жизни.
  const year = (personId: string, type: "birth_date" | "death_date", y: number, conf: number, extra: Record<string, unknown> = {}) =>
    claims.create(db, {
      subject_type: "person", subject_id: personId, claim_type: type,
      value: { year: y, ...extra }, confidence: conf,
    });

  year(ivan.id, "birth_date", 1924, 92, { place: "Тула" });
  year(ivan.id, "death_date", 1991, 90, { place: "Москва" });
  year(nikolay.id, "birth_date", 1950, 88, { place: "Москва" });
  year(lidia.id, "birth_date", 1953, 64, { place: "Калуга" });
  year(anna.id, "birth_date", 1955, 70, { place: "Москва" });
  year(dmitry.id, "birth_date", 1978, 95, { place: "Москва" });
  year(elena.id, "birth_date", 1981, 90, { place: "Москва" });

  // Досье Марии: спорная дата рождения 1928/1930, брак, дети, смерть.
  const mariaBirth = claims.create(db, {
    subject_type: "person", subject_id: maria.id, claim_type: "birth_date",
    value: { year: 1928, place: "Тула" }, confidence: 70,
    conflict: true, conflict_note: "1928 / 1930",
  });
  claims.linkSource(db, mariaBirth.id, srcStory.id, null);
  claims.linkSource(db, mariaBirth.id, srcMetric.id, null);
  const mariaBirthAlt = claims.create(db, {
    subject_type: "person", subject_id: maria.id, claim_type: "birth_date",
    value: { year: 1930 }, confidence: 45, status: "alternative", parent_claim_id: mariaBirth.id,
  });
  claims.linkSource(db, mariaBirthAlt.id, srcPhoto.id, "подпись на обороте");

  const mariaMarriage = claims.create(db, {
    subject_type: "person", subject_id: maria.id, claim_type: "marriage",
    value: { year: 1949, place: "Москва", spouse: "Иван Соколов" }, confidence: 95,
  });
  claims.linkSource(db, mariaMarriage.id, srcMarriage.id, null);

  const mariaChildren = claims.create(db, {
    subject_type: "person", subject_id: maria.id, claim_type: "custom",
    value: { text: "2 ребёнка — Николай, Анна" }, confidence: 90,
  });
  claims.linkSource(db, mariaChildren.id, srcBirths.id, null);

  const mariaDeath = claims.create(db, {
    subject_type: "person", subject_id: maria.id, claim_type: "death_date",
    value: { year: 2009, place: null }, confidence: 38,
    conflict: true, conflict_note: "Место не подтверждено",
  });
  claims.linkSource(db, mariaDeath.id, srcComment.id, null);

  // Места (реальные координаты).
  const tula = places.create(db, { name: "Тула", lat: 54.193, lng: 37.617 });
  const moscow = places.create(db, { name: "Москва", lat: 55.755, lng: 37.617 });
  places.create(db, { name: "Калуга", lat: 54.513, lng: 36.261 });

  // События.
  events.create(db, {
    type: "move", date_from: "1941", description: "Эвакуация · Тула → Москва", confidence: 60,
    place_id: moscow.id,
    participants: [
      { person_id: ivan.id }, { person_id: maria.id },
    ],
  });
  events.create(db, {
    type: "marriage", date_from: "1949", description: "Брак · Иван × Мария", confidence: 95,
    place_id: moscow.id,
    participants: [{ person_id: ivan.id }, { person_id: maria.id }],
  });
  events.create(db, {
    type: "birth", date_from: "1928", description: "Рождение Марии (дата спорная)", confidence: 70,
    place_id: tula.id,
    participants: [{ person_id: maria.id }],
  });

  // Предложения слоя обновлений (из дизайн-макета ImportView).
  proposals.create(db, {
    kind: "update_claim",
    title: "Дата рождения → 1928",
    detail: "ИИ извлёк дату из свидетельства о рождении при импорте скана.",
    payload: { claim_id: mariaBirth.id, value: { year: 1928, place: "Тула" }, confidence: 88 },
    confidence: 88,
    conflict_note: "Конфликтует с подписью на фото (1930)",
    source_ids: [srcBirthScan.id],
    created_from: "import:demo",
  });
  proposals.create(db, {
    kind: "add_person",
    title: "Новый человек — Громова П.",
    detail: "В тексте письма упомянута «сестра Полина». Возможно, новая ветвь.",
    payload: {
      person: { display_name: "Полина Громова", surname: "Громова", given_name: "Полина", sex: "female" },
      relationship: { to_id: maria.id, type: "sibling" },
    },
    confidence: 54,
    source_ids: [srcLetter.id],
    created_from: "import:demo",
  });
  proposals.create(db, {
    kind: "add_event",
    title: "Связать фото с событием «Брак, 1949»",
    detail: "Распознан групповой портрет; одежда и формат соответствуют концу 1940-х.",
    payload: {
      event: {
        type: "photo", date_from: "1949", description: "Групповой портрет на свадьбе",
        participants: [{ person_id: ivan.id }, { person_id: maria.id }],
        place: { name: "Москва" },
      },
    },
    confidence: 72,
    source_ids: [srcPhoto.id],
    created_from: "import:demo",
  });
  proposals.create(db, {
    kind: "add_alternative",
    title: "Альтернативная дата рождения — 1930",
    detail: "Архивная справка даёт 1930 год; вероятный конфликт с метрической книгой.",
    payload: { claim_id: mariaBirth.id, value: { year: 1930 }, confidence: 60 },
    confidence: 81,
    source_ids: [srcArchive.id],
    created_from: "import:demo",
  });

  // Исследовательские задачи Марии.
  tasks.create(db, { title: "Проверить метрические книги Тулы (1928–1930)", person_id: maria.id });
  tasks.create(db, { title: "Найти эвакуационные списки 1941 года", person_id: maria.id });
  tasks.create(db, { title: "Уточнить место смерти", person_id: maria.id });

  runChecks(db, persons.list(db).map((p) => p.id));
});

seed();
console.log("Сид завершён: семья Соколовых (7 человек, источники, предложения, события).");
db.close();
