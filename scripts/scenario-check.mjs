// Сквозная проверка канонического сценария (спека §16) против работающего сервера.
// Запуск: node scripts/scenario-check.mjs http://localhost:PORT
const base = process.argv[2] ?? "http://localhost:18080";
const j = async (path, init) => {
  const res = await fetch(base + path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok && res.status !== 409) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
};
const assert = (cond, msg) => {
  if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1); }
  console.log(`ok: ${msg}`);
};

// 1. Импорт текста → источник сохраняется (без ИИ-ключа предложений нет).
const imp = await j("/api/import", {
  method: "POST",
  body: JSON.stringify({ text: "Бабушка рассказывала: Пётр Кузнецов родился в 1900 году в Туле." }),
});
assert(imp.source?.id, "импорт текста создаёт источник");

// 2. Создаём людей и предложение «добавить факт» — слой обновлений.
const father = await j("/api/persons", { method: "POST", body: JSON.stringify({ display_name: "Пётр Кузнецов" }) });
const child = await j("/api/persons", { method: "POST", body: JSON.stringify({ display_name: "Сын Кузнецов" }) });
const proposal = await j("/api/proposals", {
  method: "POST",
  body: JSON.stringify({
    kind: "add_claim", title: "Дата рождения Петра → 1900", confidence: 80,
    payload: { subject_id: father.id, claim_type: "birth_date", value: { year: 1900, place: "Тула" }, confidence: 80 },
    source_ids: [imp.source.id],
  }),
});
let pending = await j("/api/proposals?status=pending");
assert(pending.some((p) => p.id === proposal.id), "предложение появляется в слое обновлений");

// 3. Принимаем → утверждение появляется в досье, источник привязан.
await j(`/api/proposals/${proposal.id}/accept`, { method: "POST" });
const dossier = await j(`/api/persons/${father.id}`);
assert(dossier.claims.length === 1, "после принятия в досье появляется утверждение");
assert(dossier.claims[0].sources.length === 1, "источник привязан к утверждению");
assert(dossier.profile_confidence === 80, "уверенность профиля пересчитана");

// 4. Дерево/таймлайн видят год рождения.
let tree = await j("/api/tree");
assert(tree.persons.find((p) => p.id === father.id)?.birth_year === 1900, "дерево видит год рождения");

// 5. Сажаем противоречие: смерть отца 1950, рождение ребёнка 1955 + связь.
await j("/api/claims", { method: "POST", body: JSON.stringify({ subject_id: father.id, claim_type: "death_date", value: { year: 1950 }, confidence: 90 }) });
await j("/api/claims", { method: "POST", body: JSON.stringify({ subject_id: child.id, claim_type: "birth_date", value: { year: 1955 }, confidence: 90 }) });
await j("/api/relationships", { method: "POST", body: JSON.stringify({ a_id: father.id, b_id: child.id, type: "parent" }) });
const tasks = await j(`/api/tasks?person_id=${child.id}`);
assert(tasks.some((t) => t.origin === "born_after_parent_death"), "противоречие становится исследовательской задачей");

// 6. Повторное принятие — отклоняется (409).
const res = await fetch(`${base}/api/proposals/${proposal.id}/accept`, { method: "POST" });
assert(res.status === 409, "повторное принятие предложения отклоняется");

// 7. История пишется.
const history = await j("/api/history");
assert(history.some((h) => h.proposal_id === proposal.id), "применение записано в историю");

console.log("\nСценарий §16 пройден полностью.");
