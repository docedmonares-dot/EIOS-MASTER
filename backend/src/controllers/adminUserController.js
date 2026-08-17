const pool = require("../config/database");
const bcrypt = require("bcrypt");

function cleanText(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const cleaned = String(value).trim();

    return cleaned || null;
}

function normalizeEmail(value) {
    const email = cleanText(value);

    return email ? email.toLowerCase() : null;
}

function normalizeUsername(value) {
    const username = cleanText(value);

    return username ? username.toLowerCase() : null;
}

function normalizeRoleCode(value) {
    const roleCode = cleanText(value);

    return roleCode
        ? roleCode.toUpperCase().replace(/\s+/g, "_")
        : null;
}

async function recordAuthenticationLog(
    client,
    {
        userId = null,
        username = null,
        email = null,
        eventType,
        success = true,
        req,
        details = {},
    }
) {
    await client.query(
        `
        INSERT INTO authentication_logs (
            user_id,
            username,
            email,
            event_type,
            success,
            ip_address,
            user_agent,
            details_json,
            occurred_at
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8::jsonb,
            NOW()
        )
        `,
        [
            userId,
            username,
            email,
            eventType,
            success,
            req?.ip || null,
            req?.headers?.["user-agent"] || null,
            JSON.stringify(details),
        ]
    );
}

/* =========================================================
   GET ALL USERS
========================================================= */

exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                u.user_id,
                u.username,
                u.full_name,
                u.email,
                u.role AS legacy_role,
                u.status,
                u.created_at,
                u.updated_at,
                u.last_login_at,
                u.failed_login_attempts,
                u.locked_until,
                u.password_changed_at,
                u.must_change_password,

                primary_role.role_id,
                primary_role.role_code,
                primary_role.role_name,

                COALESCE(all_roles.roles, '[]'::json) AS roles

            FROM users AS u

            LEFT JOIN LATERAL (
                SELECT
                    r.role_id,
                    r.role_code,
                    r.role_name
                FROM user_roles AS ur
                INNER JOIN roles AS r
                    ON r.role_id = ur.role_id
                WHERE ur.user_id = u.user_id
                  AND ur.revoked_at IS NULL
                  AND r.is_active = TRUE
                ORDER BY
                    ur.is_primary DESC,
                    ur.assigned_at ASC
                LIMIT 1
            ) AS primary_role
                ON TRUE

            LEFT JOIN LATERAL (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'role_id', r.role_id,
                        'role_code', r.role_code,
                        'role_name', r.role_name,
                        'is_primary', ur.is_primary
                    )
                    ORDER BY ur.is_primary DESC, r.role_name
                ) AS roles
                FROM user_roles AS ur
                INNER JOIN roles AS r
                    ON r.role_id = ur.role_id
                WHERE ur.user_id = u.user_id
                  AND ur.revoked_at IS NULL
                  AND r.is_active = TRUE
            ) AS all_roles
                ON TRUE

            WHERE u.deleted_at IS NULL

            ORDER BY
                u.full_name ASC,
                u.created_at DESC
            `
        );

        return res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("GET USERS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load enterprise users.",
            error: error.message,
        });
    }
};

/* =========================================================
   CREATE USER
========================================================= */

exports.createUser = async (req, res) => {
    const client = await pool.connect();

    try {
        const username = normalizeUsername(req.body?.username);
        const fullName = cleanText(req.body?.full_name);
        const email = normalizeEmail(req.body?.email);
        const password = String(req.body?.password || "");
        const roleCode = normalizeRoleCode(req.body?.role);

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required.",
            });
        }

        if (!fullName) {
            return res.status(400).json({
                success: false,
                message: "Full name is required.",
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "The temporary password must contain at least eight characters.",
            });
        }

        if (!roleCode) {
            return res.status(400).json({
                success: false,
                message: "Primary role is required.",
            });
        }

        await client.query("BEGIN");

        const duplicateResult = await client.query(
            `
            SELECT user_id
            FROM users
            WHERE deleted_at IS NULL
              AND (
                    LOWER(email) = LOWER($1)
                 OR LOWER(username) = LOWER($2)
              )
            LIMIT 1
            `,
            [email, username]
        );

        if (duplicateResult.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message:
                    "The username or email address is already being used.",
            });
        }

        const roleResult = await client.query(
            `
            SELECT
                role_id,
                role_code,
                role_name
            FROM roles
            WHERE role_code = $1
              AND is_active = TRUE
            LIMIT 1
            `,
            [roleCode]
        );

        if (roleResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "The selected enterprise role was not found.",
            });
        }

        const selectedRole = roleResult.rows[0];
        const passwordHash = await bcrypt.hash(password, 12);
        const createdBy = req.user?.user_id || null;

        const userResult = await client.query(
            `
            INSERT INTO users (
                username,
                full_name,
                email,
                password_hash,
                role,
                status,
                failed_login_attempts,
                must_change_password,
                password_changed_at,
                created_at,
                updated_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                'active',
                0,
                TRUE,
                NOW(),
                NOW(),
                NOW()
            )
            RETURNING
                user_id,
                username,
                full_name,
                email,
                status,
                created_at
            `,
            [
                username,
                fullName,
                email,
                passwordHash,
                selectedRole.role_code,
            ]
        );

        const createdUser = userResult.rows[0];

        await client.query(
            `
            INSERT INTO user_roles (
                user_id,
                role_id,
                is_primary,
                assigned_at,
                assigned_by
            )
            VALUES (
                $1,
                $2,
                TRUE,
                NOW(),
                $3
            )
            `,
            [
                createdUser.user_id,
                selectedRole.role_id,
                createdBy,
            ]
        );

        await client.query(
            `
            INSERT INTO password_history (
                user_id,
                password_hash,
                changed_at,
                changed_by
            )
            VALUES (
                $1,
                $2,
                NOW(),
                $3
            )
            `,
            [
                createdUser.user_id,
                passwordHash,
                createdBy,
            ]
        );

        await recordAuthenticationLog(client, {
            userId: createdUser.user_id,
            username,
            email,
            eventType: "USER_CREATED",
            success: true,
            req,
            details: {
                created_by: createdBy,
                primary_role: selectedRole.role_code,
            },
        });

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "User account created successfully.",
            data: {
                ...createdUser,
                role_id: selectedRole.role_id,
                role_code: selectedRole.role_code,
                role_name: selectedRole.role_name,
                must_change_password: true,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("CREATE USER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create the user account.",
            error: error.message,
        });
    } finally {
        client.release();
    }
};

/* =========================================================
   UPDATE USER
========================================================= */

exports.updateUser = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = cleanText(req.params?.id);
        const username = normalizeUsername(req.body?.username);
        const fullName = cleanText(req.body?.full_name);
        const email = normalizeEmail(req.body?.email);
        const status = cleanText(req.body?.status)?.toLowerCase();
        const roleCode = normalizeRoleCode(req.body?.role);

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required.",
            });
        }

        await client.query("BEGIN");

        const existingResult = await client.query(
            `
            SELECT
                user_id,
                username,
                full_name,
                email,
                status
            FROM users
            WHERE user_id = $1
              AND deleted_at IS NULL
            LIMIT 1
            `,
            [userId]
        );

        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "User account was not found.",
            });
        }

        const existingUser = existingResult.rows[0];

        const nextUsername = username || existingUser.username;
        const nextFullName = fullName || existingUser.full_name;
        const nextEmail = email || existingUser.email;
        const nextStatus = status || existingUser.status;

        const allowedStatuses = [
            "active",
            "disabled",
            "suspended",
            "locked",
            "archived",
        ];

        if (!allowedStatuses.includes(nextStatus)) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "The selected account status is invalid.",
            });
        }

        const duplicateResult = await client.query(
            `
            SELECT user_id
            FROM users
            WHERE user_id <> $1
              AND deleted_at IS NULL
              AND (
                    LOWER(email) = LOWER($2)
                 OR LOWER(username) = LOWER($3)
              )
            LIMIT 1
            `,
            [userId, nextEmail, nextUsername]
        );

        if (duplicateResult.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message:
                    "The username or email address is already being used.",
            });
        }

        let selectedRole = null;

        if (roleCode) {
            const roleResult = await client.query(
                `
                SELECT
                    role_id,
                    role_code,
                    role_name
                FROM roles
                WHERE role_code = $1
                  AND is_active = TRUE
                LIMIT 1
                `,
                [roleCode]
            );

            if (roleResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        "The selected enterprise role was not found.",
                });
            }

            selectedRole = roleResult.rows[0];
        }

const updateResult = await client.query(
    `
    UPDATE users
    SET
        username = $1,
        full_name = $2,
        email = $3,
        role = COALESCE($4::varchar, role),
        status = $5::varchar,
        locked_until = CASE
            WHEN $5::varchar = 'locked'
                THEN COALESCE(
                    locked_until,
                    NOW() + INTERVAL '30 minutes'
                )
            ELSE NULL
        END,
        failed_login_attempts = CASE
            WHEN $5::varchar = 'active' THEN 0
            ELSE failed_login_attempts
        END,
        updated_at = NOW()
    WHERE user_id = $6
      AND deleted_at IS NULL
    RETURNING
        user_id,
        username,
        full_name,
        email,
        status,
        updated_at
    `,
    [
        nextUsername,
        nextFullName,
        nextEmail,
        selectedRole?.role_code || null,
        nextStatus,
        userId,
    ]
);
        if (selectedRole) {
            await client.query(
                `
                UPDATE user_roles
                SET
                    is_primary = FALSE
                WHERE user_id = $1
                  AND revoked_at IS NULL
                `,
                [userId]
            );

            await client.query(
                `
                INSERT INTO user_roles (
                    user_id,
                    role_id,
                    is_primary,
                    assigned_at,
                    assigned_by
                )
                VALUES (
                    $1,
                    $2,
                    TRUE,
                    NOW(),
                    $3
                )
                ON CONFLICT DO NOTHING
                `,
                [
                    userId,
                    selectedRole.role_id,
                    req.user?.user_id || null,
                ]
            );

            await client.query(
                `
                UPDATE user_roles
                SET
                    is_primary = TRUE,
                    revoked_at = NULL
                WHERE user_id = $1
                  AND role_id = $2
                `,
                [userId, selectedRole.role_id]
            );
        }

        await recordAuthenticationLog(client, {
            userId,
            username: nextUsername,
            email: nextEmail,
            eventType: "USER_UPDATED",
            success: true,
            req,
            details: {
                updated_by: req.user?.user_id || null,
                status: nextStatus,
                role: selectedRole?.role_code || null,
            },
        });

        await client.query("COMMIT");

        return res.json({
            success: true,
            message: "User account updated successfully.",
            data: {
                ...updateResult.rows[0],
                role_id: selectedRole?.role_id || null,
                role_code: selectedRole?.role_code || null,
                role_name: selectedRole?.role_name || null,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("UPDATE USER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update the user account.",
            error: error.message,
        });
    } finally {
        client.release();
    }
};

/* =========================================================
   RESET USER PASSWORD
========================================================= */

exports.resetPassword = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId =
            cleanText(req.params?.id);

        const temporaryPassword =
            String(
                req.body?.temporary_password ||
                ""
            );

        const requestedBy =
            req.user?.user_id || null;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message:
                    "User ID is required."
            });
        }

        if (
            temporaryPassword.length < 8
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "The temporary password must contain at least eight characters."
            });
        }

        await client.query("BEGIN");

        const userResult =
            await client.query(
                `
                SELECT
                    user_id,
                    username,
                    full_name,
                    email,
                    status
                FROM users
                WHERE user_id = $1
                  AND deleted_at IS NULL
                LIMIT 1
                `,
                [userId]
            );

        if (
            userResult.rows.length === 0
        ) {
            await client.query(
                "ROLLBACK"
            );

            return res.status(404).json({
                success: false,
                message:
                    "User account was not found."
            });
        }

        const user =
            userResult.rows[0];

        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                12
            );

        await client.query(
            `
            UPDATE users
            SET
                password_hash = $1,
                must_change_password = TRUE,
                password_changed_at = NOW(),
                failed_login_attempts = 0,
                locked_until = NULL,
                updated_at = NOW()
            WHERE user_id = $2
            `,
            [
                passwordHash,
                userId
            ]
        );

        await client.query(
            `
            INSERT INTO password_history
            (
                user_id,
                password_hash,
                changed_at,
                changed_by
            )
            VALUES
            (
                $1,
                $2,
                NOW(),
                $3
            )
            `,
            [
                userId,
                passwordHash,
                requestedBy
            ]
        );

        await client.query(
            `
            UPDATE user_sessions
            SET revoked_at = NOW()
            WHERE user_id = $1
              AND revoked_at IS NULL
            `,
            [userId]
        );

        await recordAuthenticationLog(
            client,
            {
                userId,
                username:
                    user.username,
                email:
                    user.email,
                eventType:
                    "PASSWORD_RESET",
                success: true,
                req,
                details: {
                    reset_by:
                        requestedBy,
                    must_change_password:
                        true
                }
            }
        );

        await client.query("COMMIT");

        return res.json({
            success: true,
            message:
                "Temporary password reset successfully. The user must change the password on next login."
        });

    } catch (error) {

        try {
            await client.query(
                "ROLLBACK"
            );
        } catch (
            rollbackError
        ) {
            console.error(
                rollbackError
            );
        }

        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to reset the user password.",
            error:
                error.message
        });

    } finally {
        client.release();
    }
};

/* =========================================================
   ARCHIVE USER
========================================================= */

exports.deleteUser = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = cleanText(req.params?.id);
        const requestedBy = req.user?.user_id || null;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required.",
            });
        }

        if (requestedBy === userId) {
            return res.status(400).json({
                success: false,
                message:
                    "You cannot archive your own active administrator account.",
            });
        }

        await client.query("BEGIN");

        const userResult = await client.query(
            `
            UPDATE users
            SET
                status = 'archived',
                deleted_at = NOW(),
                updated_at = NOW()
            WHERE user_id = $1
              AND deleted_at IS NULL
            RETURNING
                user_id,
                username,
                full_name,
                email
            `,
            [userId]
        );

        if (userResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "User account was not found.",
            });
        }

        const archivedUser = userResult.rows[0];

        await client.query(
            `
            UPDATE user_roles
            SET revoked_at = NOW()
            WHERE user_id = $1
              AND revoked_at IS NULL
            `,
            [userId]
        );

        await client.query(
            `
            UPDATE user_sessions
            SET revoked_at = NOW()
            WHERE user_id = $1
              AND revoked_at IS NULL
            `,
            [userId]
        );

        await recordAuthenticationLog(client, {
            userId,
            username: archivedUser.username,
            email: archivedUser.email,
            eventType: "USER_ARCHIVED",
            success: true,
            req,
            details: {
                archived_by: requestedBy,
            },
        });

        await client.query("COMMIT");

        return res.json({
            success: true,
            message: "User account archived successfully.",
            data: archivedUser,
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("ARCHIVE USER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to archive the user account.",
            error: error.message,
        });
    } finally {
        client.release();
    }
};