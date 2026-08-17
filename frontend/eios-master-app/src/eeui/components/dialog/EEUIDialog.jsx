import {
  useEffect,
  useId,
} from "react";

import {
  X,
} from "lucide-react";

import "./EEUIDialog.css";

export default function EEUIDialog({
  open = false,
  title = "",
  subtitle = "",
  children,
  footer = null,
  icon: Icon = null,
  size = "medium",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  onClose = null,
  className = "",
  ...dialogProps
}) {
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    if (!open || !closeOnEscape) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    closeOnEscape,
    onClose,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const classes = [
    "eeui-dialog",
    `eeui-dialog--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  function handleBackdropClick(event) {
    if (
      closeOnBackdrop &&
      event.target === event.currentTarget
    ) {
      onClose?.();
    }
  }

  return (
    <div
      className="eeui-dialog-backdrop"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <section
        className={classes}
        role="dialog"
        aria-modal="true"
        aria-labelledby={
          title ? titleId : undefined
        }
        aria-describedby={
          subtitle
            ? subtitleId
            : undefined
        }
        {...dialogProps}
      >
        {(title ||
          subtitle ||
          Icon ||
          showCloseButton) && (
          <header className="eeui-dialog__header">
            <div className="eeui-dialog__identity">
              {Icon && (
                <div className="eeui-dialog__icon">
                  <Icon
                    size={20}
                    aria-hidden="true"
                  />
                </div>
              )}

              <div>
                {title && (
                  <h2
                    id={titleId}
                    className="eeui-dialog__title"
                  >
                    {title}
                  </h2>
                )}

                {subtitle && (
                  <p
                    id={subtitleId}
                    className="eeui-dialog__subtitle"
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                className="eeui-dialog__close"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X
                  size={18}
                  aria-hidden="true"
                />
              </button>
            )}
          </header>
        )}

        <div className="eeui-dialog__body">
          {children}
        </div>

        {footer && (
          <footer className="eeui-dialog__footer">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}