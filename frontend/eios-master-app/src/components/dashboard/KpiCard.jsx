export default function KpiCard({
  title,
  value,
  description,
}) {
  return (
    <article className="kpi-card">
      <p className="kpi-card__title">{title}</p>

      <h2 className="kpi-card__value">{value}</h2>

      <p className="kpi-card__description">
        {description}
      </p>
    </article>
  );
}