`Input` is the text field — single-line or `multiline` textarea, with label, leading icon, hint, and error states.

```jsx
<Input label="Имя" placeholder="Мария Ивановна Соколова" icon="user" />
<Input label="Источник" placeholder="Ссылка на архив" icon="link" hint="Будет привязан к утверждению" />
<Input label="Дата рождения" defaultValue="1928" error="Конфликт: 1928 или 1930" />
<Input label="Биография" multiline rows={4} placeholder="Markdown-история…" />
```

Focus turns the border evergreen with a gold focus halo. Errors turn it terracotta and surface a `triangle-alert` glyph.
