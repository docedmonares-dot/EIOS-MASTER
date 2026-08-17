import "./EEUIProgress.css";

export default function EEUIProgress({
  value = 0,
  label = "",
}) {
  return (
    <div className="eeui-progress">

      {label && (
        <div className="eeui-progress__label">
          {label}
        </div>
      )}

      <div className="eeui-progress__track">

        <div
          className="eeui-progress__fill"
          style={{
            width: `${value}%`,
          }}
        />

      </div>

    </div>
  );
}