import { useNavigate } from "react-router-dom";

export default function QuickActionCard({
  icon: Icon,
  title,
  description,
  actionLabel = "Launch",
  onClick,
  to,
}) {
  const navigate = useNavigate();

  function handleClick() {
    if (typeof onClick === "function") {
      onClick();
      return;
    }

    if (to) {
      navigate(to);
    }
  }

  return (
    <button
      type="button"
      className="quick-action-card"
      onClick={handleClick}
    >
      <div className="quick-action-card__icon-box">
        {Icon && (
          <Icon
            size={34}
            strokeWidth={1.8}
          />
        )}
      </div>

      <div className="quick-action-card__body">
        <h3 className="quick-action-card__title">
          {title}
        </h3>

        <p className="quick-action-card__description">
          {description}
        </p>
      </div>

      <div className="quick-action-card__footer">
        <span>{actionLabel}</span>
        <span>→</span>
      </div>
    </button>
  );
}