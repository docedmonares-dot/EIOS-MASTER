import "./EEUICard.css";

export default function EEUICard({
  children,
  title = "",
  subtitle = "",
  icon: Icon = null,
  actions = null,
  footer = null,
  padding = "medium",
  elevation = "small",
  selected = false,
  interactive = false,
  className = "",
  ...cardProps
}) {
  const classes = [
    "eeui-card",
    `eeui-card--padding-${padding}`,
    `eeui-card--elevation-${elevation}`,
    selected ? "eeui-card--selected" : "",
    interactive ? "eeui-card--interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={classes}
      {...cardProps}
    >
      {(title || subtitle || Icon || actions) && (
        <header className="eeui-card__header">
          <div className="eeui-card__identity">
            {Icon && (
              <div className="eeui-card__icon">
                <Icon size={20} aria-hidden="true" />
              </div>
            )}

            <div>
              {title && (
                <h3 className="eeui-card__title">
                  {title}
                </h3>
              )}

              {subtitle && (
                <p className="eeui-card__subtitle">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="eeui-card__actions">
              {actions}
            </div>
          )}
        </header>
      )}

      <div className="eeui-card__body">
        {children}
      </div>

      {footer && (
        <footer className="eeui-card__footer">
          {footer}
        </footer>
      )}
    </article>
  );
}