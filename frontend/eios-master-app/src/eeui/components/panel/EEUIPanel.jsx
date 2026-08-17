import "./EEUIPanel.css";

export default function EEUIPanel({
  title = "",
  subtitle = "",
  children,
  headerActions = null,
  footer = null,
  collapsible = false,
  collapsed = false,
  bordered = true,
  className = "",
  ...props
}) {
  const classes = [
    "eeui-panel",
    bordered ? "eeui-panel--bordered" : "",
    collapsed ? "eeui-panel--collapsed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={classes}
      data-collapsible={collapsible || undefined}
      {...props}
    >
      {(title || subtitle || headerActions) && (
        <header className="eeui-panel__header">
          <div className="eeui-panel__identity">
            {title && (
              <h2 className="eeui-panel__title">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="eeui-panel__subtitle">
                {subtitle}
              </p>
            )}
          </div>

          {headerActions && (
            <div className="eeui-panel__actions">
              {headerActions}
            </div>
          )}
        </header>
      )}

      {!collapsed && (
        <div className="eeui-panel__body">
          {children}
        </div>
      )}

      {!collapsed && footer && (
        <footer className="eeui-panel__footer">
          {footer}
        </footer>
      )}
    </section>
  );
}
