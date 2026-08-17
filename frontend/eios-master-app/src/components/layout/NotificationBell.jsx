import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getMyNotifications, markNotificationRead } from "../../services/notificationService";

function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [error, setError] = useState("");

    const loadNotifications = useCallback(async () => {
        try {
            const result = await getMyNotifications();
            setNotifications(Array.isArray(result?.data) ? result.data : []);
            setUnreadCount(Number(result?.unread_count || 0));
            setError("");
        } catch (loadError) {
            setError(loadError.message || "Unable to load notifications.");
        }
    }, []);

    useEffect(() => {
        loadNotifications();
        const timer = window.setInterval(loadNotifications, 30000);
        return () => window.clearInterval(timer);
    }, [loadNotifications]);

    async function markRead(notificationId) {
        try {
            await markNotificationRead(notificationId);
            await loadNotifications();
        } catch (readError) {
            setError(readError.message || "Unable to update notification.");
        }
    }

    return (
        <div className="eios-notification">
            <button
                type="button"
                className="eios-notification__button"
                aria-label="Open notifications"
                aria-expanded={isOpen}
                onClick={() => {
                    setIsOpen((current) => !current);
                    loadNotifications();
                }}
            >
                <span aria-hidden="true">🔔</span>

                {unreadCount > 0 && (
                    <span className="eios-notification__badge">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="eios-notification__panel">
                    <div className="eios-notification__header">
                        <strong>Notifications</strong>
                        <span>{unreadCount} unread</span>
                    </div>

                    <div className="eios-notification__list">
                        {error && (
                            <div className="eios-notification__item">
                                <strong>Notifications unavailable</strong>
                                <p>{error}</p>
                            </div>
                        )}
                        {!error && notifications.length === 0 && (
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
                                <small>{new Date(notification.created_at).toLocaleString()}</small>
                                {notification.action_path && (
                                    <Link to={notification.action_path} onClick={() => markRead(notification.notification_id)}>Open</Link>
                                )}
                                {notification.is_unread && !notification.action_path && (
                                    <button type="button" onClick={() => markRead(notification.notification_id)}>Mark read</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
