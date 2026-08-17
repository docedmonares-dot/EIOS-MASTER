const pool = require("../config/database");

exports.getMyNotifications = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                notification.notification_id,
                notification.notification_type,
                notification.severity,
                notification.title,
                notification.message,
                notification.action_path,
                notification.created_at,
                receipt.read_at,
                (receipt.read_at IS NULL) AS is_unread
            FROM enterprise_notifications notification
            LEFT JOIN enterprise_notification_receipts receipt
                ON receipt.notification_id = notification.notification_id
               AND receipt.user_id = $1
            WHERE
                (notification.expires_at IS NULL OR notification.expires_at > NOW())
                AND (
                    notification.target_permission_code IS NULL
                    OR EXISTS (
                        SELECT 1
                        FROM user_roles ur
                        JOIN role_permissions rp ON rp.role_id = ur.role_id
                        JOIN permissions permission ON permission.permission_id = rp.permission_id
                        WHERE ur.user_id = $1
                          AND ur.revoked_at IS NULL
                          AND permission.is_active = TRUE
                          AND permission.permission_code = notification.target_permission_code
                    )
                )
            ORDER BY (receipt.read_at IS NULL) DESC, notification.created_at DESC
            LIMIT 100
            `,
            [req.user.user_id]
        );

        return res.json({
            success: true,
            unread_count: result.rows.filter((item) => item.is_unread).length,
            data: result.rows
        });
    } catch (error) {
        console.error("NOTIFICATION LIST ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to load notifications." });
    }
};

exports.markRead = async (req, res) => {
    try {
        const result = await pool.query(
            `
            INSERT INTO enterprise_notification_receipts (notification_id, user_id)
            SELECT notification_id, $2
            FROM enterprise_notifications
            WHERE notification_id = $1
            ON CONFLICT (notification_id, user_id)
            DO UPDATE SET read_at = NOW()
            RETURNING notification_id, user_id, read_at
            `,
            [req.params.id, req.user.user_id]
        );

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: "Notification was not found." });
        }

        return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error("NOTIFICATION READ ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to update the notification." });
    }
};
