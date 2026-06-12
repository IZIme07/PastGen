import { Icon } from "../icon/Icon.jsx";
const { useState } = React;

/**
 * Input — text field with optional label, leading icon, hint, and error.
 * Also supports a textarea via `multiline`.
 */
export function Input({
  label,
  value,
  defaultValue,
  placeholder,
  icon,
  hint,
  error,
  type = "text",
  multiline = false,
  rows = 3,
  disabled = false,
  onChange,
  id,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const fieldId = id || (label ? `pg-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  const borderColor = error
    ? "var(--danger)"
    : focused
    ? "var(--brand)"
    : "var(--border-default)";

  const fieldStyle = {
    width: "100%",
    font: "var(--text-ui-body)",
    color: "var(--text-strong)",
    background: disabled ? "var(--paper-1)" : "var(--surface-card)",
    border: `1px solid ${borderColor}`,
    borderRadius: "var(--radius-sm)",
    padding: multiline ? "10px 12px" : icon ? "0 12px 0 38px" : "0 12px",
    height: multiline ? undefined : 38,
    minHeight: multiline ? rows * 22 + 20 : undefined,
    boxShadow: focused ? "var(--shadow-focus)" : "none",
    outline: "none",
    transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
    resize: multiline ? "vertical" : undefined,
    fontFamily: "var(--font-sans)",
  };

  const sharedProps = {
    id: fieldId,
    value,
    defaultValue,
    placeholder,
    disabled,
    onChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: fieldStyle,
    ...rest,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && (
        <label htmlFor={fieldId} style={{
          font: "var(--w-medium) 13px/1.3 var(--font-sans)",
          color: "var(--text-body)",
        }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex" }}>
        {icon && !multiline && (
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: focused ? "var(--brand)" : "var(--text-faint)", pointerEvents: "none",
            display: "inline-flex",
          }}>
            <Icon name={icon} size={17} />
          </span>
        )}
        {multiline
          ? <textarea rows={rows} {...sharedProps} />
          : <input type={type} {...sharedProps} />}
      </div>
      {(hint || error) && (
        <span style={{
          font: "var(--text-ui-small)",
          color: error ? "var(--danger)" : "var(--text-muted)",
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          {error && <Icon name="triangle-alert" size={13} />}
          {error || hint}
        </span>
      )}
    </div>
  );
}
