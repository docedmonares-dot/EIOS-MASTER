import "./EEUIWorkspace.css";

export default function EEUIWorkspace({
  title = "",
  subtitle = "",
  ribbon = null,
  explorer = null,
  canvas = null,
  inspector = null,
  statusBar = null,
  leftWidth = "280px",
  rightWidth = "320px",
  className = "",
  children = null,
  ...workspaceProps
}) {
  const classes = [
    "eeui-workspace",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const workspaceStyle = {
    "--eeui-workspace-left-width": leftWidth,
    "--eeui-workspace-right-width": rightWidth,
  };

  return (
    <section
      className={classes}
      style={workspaceStyle}
      {...workspaceProps}
    >
      {(title || subtitle) && (
        <header className="eeui-workspace__titlebar">
          <div>
            {title && (
              <h1 className="eeui-workspace__title">
                {title}
              </h1>
            )}

            {subtitle && (
              <p className="eeui-workspace__subtitle">
                {subtitle}
              </p>
            )}
          </div>
        </header>
      )}

      {ribbon && (
        <div className="eeui-workspace__ribbon">
          {ribbon}
        </div>
      )}

      <div className="eeui-workspace__body">
        {explorer && (
          <aside className="eeui-workspace__explorer">
            {explorer}
          </aside>
        )}

        <main className="eeui-workspace__canvas">
          {canvas || children}
        </main>

        {inspector && (
          <aside className="eeui-workspace__inspector">
            {inspector}
          </aside>
        )}
      </div>

      {statusBar && (
        <footer className="eeui-workspace__statusbar">
          {statusBar}
        </footer>
      )}
    </section>
  );
}