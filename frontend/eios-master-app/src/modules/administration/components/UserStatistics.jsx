export default function UserStatistics({
  totalAccounts = 0,
  activeAccounts = 0,
  assignedRoles = 0,
}) {
  return (
    <div className="administration-dashboard-page__summary">
      <article>
        <span>Total Accounts</span>
        <strong>{totalAccounts}</strong>
      </article>

      <article>
        <span>Active Accounts</span>
        <strong>{activeAccounts}</strong>
      </article>

      <article>
        <span>Assigned Roles</span>
        <strong>{assignedRoles}</strong>
      </article>

      <article>
        <span>IAM Status</span>

        <strong className="administration-dashboard-page__online">
          Connected
        </strong>
      </article>
    </div>
  );
}