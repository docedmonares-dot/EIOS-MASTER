const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const authorizationService = require("../services/security/authorizationService");

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error(
            "JWT_SECRET is missing from the backend .env file."
        );
    }

    return secret;
}
function normalizeRoleCode(value) {
    const normalized = String(value || "")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

    /*
     * Backward compatibility for routes that still use
     * the historical "Super Admin" role label.
     */
    return normalized === "SUPER_ADMIN"
        ? "ADMIN"
        : normalized;
}

/*
=========================================================
VERIFY TOKEN
=========================================================
*/

exports.verifyToken = async (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "No token provided."
        });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            success: false,
            message: "Invalid authorization format."
        });
    }

    try {

        const decodedUser = jwt.verify(
            token,
            getJwtSecret()
        );

        const userResult = await pool.query(
            `
            SELECT
                user_id,
                username,
                email,
                full_name,
                status,
                must_change_password,
                password_changed_at,
                deleted_at
            FROM users
            WHERE user_id = $1
            LIMIT 1
            `,
            [decodedUser.user_id]
        );

        const currentUser = userResult.rows[0];

        if (
            !currentUser ||
            currentUser.deleted_at ||
            currentUser.status !== "active"
        ) {
            return res.status(401).json({
                success: false,
                message: "This account is no longer active."
            });
        }

        const currentPasswordChangedAt = currentUser.password_changed_at
            ? new Date(currentUser.password_changed_at).toISOString()
            : null;

        if (
            (decodedUser.password_changed_at || null) !==
            currentPasswordChangedAt
        ) {
            return res.status(401).json({
                success: false,
                message: "This session was revoked after a password change."
            });
        }

        req.user = {
            ...decodedUser,
            ...currentUser
        };

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });

    }

};

/*
=========================================================
LEGACY ROLE CHECK
(Temporary for backward compatibility)
=========================================================
*/

exports.requireRole = (...roles) => {

    return async (req, res, next) => {

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });

        }

        const roleNames =
            await authorizationService.getUserRoles(
                req.user.user_id
            );

        const allowed =
            roleNames.some(role =>
                roles.some(r =>
                    normalizeRoleCode(r) === normalizeRoleCode(role.role_code)
                )
            );

        if (!allowed) {

            return res.status(403).json({
                success: false,
                message: "Access denied."
            });

        }

        next();

    };

};

/*
=========================================================
PERMISSION CHECK
=========================================================
*/

exports.requirePermission = function (permissionCode) {

    return async function (req, res, next) {

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });

        }

        const allowed =
            await authorizationService.hasPermission(
                req.user.user_id,
                permissionCode
            );

        if (!allowed) {

            return res.status(403).json({
                success: false,
                message: "Permission denied.",
                permission: permissionCode
            });

        }

        next();

    };

};

exports.requireAnyPermission = function (...permissionCodes) {

    return async function (req, res, next) {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const permissions = permissionCodes
            .flat()
            .filter(Boolean);

        const checks = await Promise.all(
            permissions.map((permissionCode) =>
                authorizationService.hasPermission(
                    req.user.user_id,
                    permissionCode
                )
            )
        );

        if (!checks.some(Boolean)) {
            return res.status(403).json({
                success: false,
                message: "Permission denied.",
                any_permission: permissions
            });
        }

        next();
    };
};
