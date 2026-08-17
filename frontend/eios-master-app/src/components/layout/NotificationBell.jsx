import { useState } from "react";

function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);

    const notifications = [
        {
            id: 1,
            title: "Welcome to EIOS",
            message: "Your enterprise session is active.",
            time: "Just now",
        },
        {
            id: 2,
            title: "System Ready",
            message: "All core modules are available.",
            time: "Today",
        },
    ];

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