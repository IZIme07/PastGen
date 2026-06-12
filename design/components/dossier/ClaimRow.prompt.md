`ClaimRow`, `PersonCard`, and `ProposalCard` are PastGen's domain composites — built from Avatar, ConfidenceMeter, SourceChip, Badge and Button.

```jsx
<ClaimRow
  label="Дата рождения" value="1928, Тула" confidence={70}
  sources={[{ type: "story", label: "Рассказ бабушки" }, { type: "document", label: "Архивная справка" }]}
  alternatives={2}
  conflict="1928 или 1930"
/>

<PersonCard
  name="Мария Ивановна Соколова" lifespan="1928–2009"
  role="Бабушка · отцовская линия" confidence={76} selected
/>

<ProposalCard
  kind="add_fact" title="Дата рождения → 1928"
  detail="ИИ извлёк дату из свидетельства о рождении при импорте скана."
  confidence={88}
  sources={[{ type: "document", label: "Свидетельство о рождении" }]}
  conflict="Конфликтует с подписью на фото (1930)"
  onAccept={...} onDefer={...} onReject={...}
/>
```

`ProposalCard` is the update-layer primitive: AI proposes, the user accepts/defers/rejects — proposals are never auto-applied. `ClaimRow` and `PersonCard` make uncertainty visible without alarming the user.
