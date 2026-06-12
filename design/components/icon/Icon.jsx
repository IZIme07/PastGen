const { useRef, useLayoutEffect } = React;

/**
 * Icon — renders a Lucide icon by name.
 * Lucide (MIT) is loaded from CDN in the host page; this primitive wraps a
 * <span> and injects the SVG in an effect so React never manages the SVG
 * children (no reconciliation conflict). Stroke icons inherit currentColor.
 */
export function Icon({ name, size = 18, stroke = 1.75, className = "", style = {}, title }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    const L = window.lucide;
    if (!L) {
      // Graceful fallback marker if the CDN script hasn't loaded.
      el.setAttribute("data-icon-pending", name);
      return;
    }
    const holder = document.createElement("i");
    holder.setAttribute("data-lucide", name);
    el.appendChild(holder);
    try {
      L.createIcons({
        attrs: {
          width: size,
          height: size,
          "stroke-width": stroke,
          ...(title ? { "aria-label": title, role: "img" } : { "aria-hidden": "true" }),
        },
        root: el,
      });
    } catch (e) {
      /* unknown icon name — leave empty */
    }
  }, [name, size, stroke, title]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flex: "0 0 auto",
        color: "currentColor",
        ...style,
      }}
    />
  );
}
