`Button` is the primary action control; `IconButton` is its square icon-only sibling for toolbars and the mode rail.

```jsx
<Button variant="primary" icon="check">Принять</Button>
<Button variant="secondary">Отложить</Button>
<Button variant="ghost" icon="x">Отклонить</Button>
<Button variant="accent" icon="sparkles">Спросить ИИ</Button>
<Button variant="danger" size="sm">Удалить</Button>

<IconButton icon="git-fork" label="Дерево" active />
<IconButton icon="search" label="Поиск" variant="soft" />
```

Use `primary` for the single confirming action, `secondary`/`ghost` for alternatives, `accent` (brass) to invoke the AI genealogist, `danger` for destructive. Sizes sm/md/lg. Icons are Lucide names.
