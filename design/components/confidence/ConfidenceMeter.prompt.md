`ConfidenceMeter` and `SourceChip` express PastGen's core idea: every fact is a verifiable claim with a trust level and cited provenance.

```jsx
<ConfidenceMeter value={95} showLabel />     {/* green ring */}
<ConfidenceMeter value={70} variant="bar" showLabel />
<ConfidenceMeter value={45} size={36} />
<ConfidenceMeter value={20} showLabel />     {/* grey "гипотеза" */}

<SourceChip type="document" label="Свидетельство о рождении" quality={90} />
<SourceChip type="photo" label="Подпись на обороте" />
<SourceChip type="audio" label="Рассказ бабушки" removable onRemove={...} />
```

The ring color/level is derived from the value (≥85 confirmed, ≥60 probable, ≥35 inferred, else hypothesis) — never pass a color. Always pair a claim's confidence with at least one SourceChip so uncertainty stays explainable.
