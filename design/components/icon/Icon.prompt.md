`Icon` renders a Lucide stroke icon by kebab-case name — PastGen's single iconography primitive. Use it anywhere a glyph is needed; the host page must load the Lucide UMD CDN script.

```jsx
<Icon name="git-fork" size={20} />
<Icon name="map-pin" />
<Icon name="sparkles" size={16} stroke={1.5} title="AI assistant" />
```

Core PastGen icon vocabulary: `git-fork` (tree), `calendar-clock` (timeline), `map` (map), `user`/`users` (person/relations), `file-text` (document), `image` (photo), `mic` (voice note), `sparkles` (AI agent), `shield-check` (confirmed), `triangle-alert` (conflict), `check`, `x`, `plus`, `search`, `chevron-right`. Size 16 for inline UI, 18–20 for buttons, 22–24 for nav.
