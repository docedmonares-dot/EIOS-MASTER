const pool = require("../../config/database");

/*
=========================================================
    GET USER ROLES
=========================================================
*/

async function getUserRoles(userId) {

    const result = await pool.query(
        `
        SELECT
            r.role_id,
            r.role_code,
            r.role_name
        FROM user_roles ur
        INNER JOIN roles r
            ON ur.role_id = r.role_id
        WHERE ur.user_id = $1
          AND ur.revoked_at IS NULL
          AND r.is_active = TRUE
        ORDER BY ur.is_primary DESC,
                 r.role_name
        `,
        [userId]
    );

    return result.rows;
}

/*
=========================================================
    GET USER PERMISSIONS
=========================================================
*/

async function getUserPermissions(userId) {

    const result = await pool.query(
        `
        SELECT DISTINCT
            p.permission_code,
            p.permission_name
        FROM user_roles ur

        INNER JOIN role_permissions rp
            ON ur.role_id = rp.role_id

        INNER JOIN permissions p
            ON rp.permission_id = p.permission_id

        INNER JOIN roles r
            ON ur.role_id = r.role_id

        WHERE ur.user_id = $1
          AND ur.revoked_at IS NULL
          AND r.is_active = TRUE
          AND p.is_active = TRUE

        ORDER BY p.permission_code
        `,
        [userId]
    );

    return result.rows;
}

/*
=========================================================
    HAS ROLE
=========================================================
*/

async function hasRole(userId, roleCode) {

    const roles = await getUserRoles(userId);

    return roles.some(
        role => role.role_code === roleCode
    );
}

/*
=========================================================
    HAS PERMISSION
=========================================================
*/

async function hasPermission(userId, permissionCode) {

    const permissions =
        await getUserPermissions(userId);

    return permissions.some(
        permission =>
            permission.permission_code === permissionCode
    );
}

module.exports = {

    getUserRoles,

    getUserPermissions,

    hasRole,

    hasPermission

};