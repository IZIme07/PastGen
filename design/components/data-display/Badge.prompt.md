`Badge` is the status/category pill; `Avatar` is the person portrait. Together they label people and the trust level of facts.

```jsx
<Badge tone="confirmed" icon="shield-check">Подтверждено</Badge>
<Badge tone="conflict" icon="triangle-alert">Конфликт дат</Badge>
<Badge tone="hypothesis" dot>Гипотеза ИИ</Badge>
<Badge tone="brand">Отцовская линия</Badge>

<Avatar name="Мария Соколова" size={48} ring="var(--conf-confirmed)" />
<Avatar name="Иван Соколов" deceased />
<Avatar name="Анна" src="/photos/anna.jpg" />
```

Confidence tones (`confirmed` / `probable` / `inferred` / `hypothesis`) and `conflict` are the brand's signature semantics — reach for them on claims, not generic success/error.
