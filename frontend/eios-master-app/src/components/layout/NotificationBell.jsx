import { useState } from "react";

function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);

    const notifications = [];

    return (
        <div className="eios-notification">
            <button
                type="button"
                className="eios-notification__button"
                aria-label="Open notifications"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
            >
                <span aria-hidden="true">🔔</span>

                {notifications.length > 0 && (
                    <span className="eios-notification__badge">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="eios-notification__panel">
                    <div className="eios-notification__header">
                        <strong>Notifications</strong>
                        <span>{notifications.length} new</span>
                    </div>

                    <div className="eios-notification__list">
                        {notifications.length === 0 && (
                            <div className="eios-notification__item">
                                <strong>No unread notifications</strong>
                                <p>Operational alerts will appear here when generated.</p>
                            </div>
                        )}
                        {notifications.map((notification) => (
                            <div
                                className="eios-notification__item"
                                key={notification.id}
                            >
                                <strong>{notification.title}</strong>
                                <p>{notification.message}</p>
                                <small>{notification.time}</small>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
