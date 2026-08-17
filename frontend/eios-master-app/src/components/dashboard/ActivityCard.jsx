import {
  CheckCircle2,
  Clock3,
} from "lucide-react";

const activities = [
  {
    title: "Survey Deployment Approved",
    description:
      "National Governance Survey - Wave 3",
    time: "5 minutes ago",
    status: "success",
  },
  {
    title: "Enumerator Synced",
    description:
      "146 interviews synchronized",
    time: "12 minutes ago",
    status: "success",
  },
  {
    title: "Project Created",
    description:
      "Mindanao Pilot Project",
    time: "32 minutes ago",
    status: "pending",
  },
  {
    title: "Deployment Scheduled",
    description:
      "Region X Field Operations",
    time: "1 hour ago",
    status: "pending",
  },
];

export default function ActivityCard() {
  return (
    <div className="activity-card">

      <div className="activity-card__header">
        <h3>Recent Activity</h3>
      </div>

      <div className="activity-list">

        {activities.map((item, index) => (
          <div
            key={index}
            className="activity-item"
          >
            <div className="activity-icon">

              {item.status === "success" ? (
                <CheckCircle2
                  size={20}
                  strokeWidth={2}
                />
              ) : (
                <Clock3
                  size={20}
                  strokeWidth={2}
                />
              )}

            </div>

            <div className="activity-content">

              <strong>
                {item.title}
              </strong>

              <p>
                {item.description}
              </p>

              <span>
                {item.time}
              </span>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}