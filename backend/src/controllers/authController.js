const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authorizationService = require(
    "../services/security/authorizationService"
);

/* =========================================================
   HEALTH CHECK
========================================================= */

exports.healthCheck = async (req, res) => {

    return res.json({

        success: true,

        module: "Authentication",

        status: "Ready"

    });

};

/* =========================================================
   LOGIN
========================================================= */

exports.login = async (req, res) => {

    const {

        username,
        email,
        password

    } = req.body;

    try {

        const loginId =
            username || email;

        if (!loginId || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Username/email and password are required."

            });

        }

        const result =
            await pool.query(

                `
                SELECT *

                FROM users

                WHERE
                    LOWER(username)=LOWER($1)
                    OR LOWER(email)=LOWER($1)

                LIMIT 1
                `,

                [loginId]

            );

        if (result.rows.length === 0) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid credentials."

            });

        }

        const user =
            result.rows[0];

        if (user.deleted_at) {

            return res.status(403).json({

                success: false,

                message:
                    "Account has been deactivated."

            });

        }

        if (user.status !== "active") {

            return res.status(403).json({

                success: false,

                message:
                    "Account is inactive."

            });

        }

        if (
            user.locked_until &&
            new Date(user.locked_until) > new Date()
        ) {

            return res.status(423).json({

                success: false,

                message:
                    "Account is temporarily locked."

            });

        }

        const passwordValid =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!passwordValid) {

            await pool.query(

                `
                UPDATE users

                SET

                    failed_login_attempts =
                        failed_login_attempts + 1

                WHERE user_id = $1
                `,

                [user.user_id]

            );

            return res.status(401).json({

                success: false,

                message:
                    "Invalid credentials."

            });

        }

        await pool.query(

            `
            UPDATE users

            SET

                failed_login_attempts = 0,

                last_login_at = NOW()

            WHERE user_id = $1
            `,

            [user.user_id]

        );

        const roles =
            await authorizationService.getUserRoles(
                user.user_id
            );

        const permissions =
            await authorizationService.getUserPermissions(
                user.user_id
            );

        const token =
            jwt.sign(

                {

                    user_id:
                        user.user_id,

                    username:
                        user.username,

                    email:
                        user.email,

                    role:
                        roles.length
                            ? roles[0].role_code
                            : null

                },

                process.env.JWT_SECRET,

                {

                    expiresIn: "8h"

                }

            );

        return res.json({

            success: true,

            message:
                "Login successful.",

            token,

            user: {

                user_id:
                    user.user_id,

                username:
                    user.username,

                full_name:
                    user.full_name,

                email:
                    user.email,

                role:
                    roles.length
                        ? roles[0].role_code
                        : null,

                roles,

                permissions,

                must_change_password:
                    user.must_change_password

            }

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

/* =========================================================
   REGISTER
========================================================= */

exports.register = async (req, res) => {

    try {

        return res.status(501).json({

            success: false,

            message:
                "Public registration is disabled. Users must be created by a System Administrator."

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

/* =========================================================
   CURRENT USER
========================================================= */

exports.me = async (req, res) => {

    try {

        const roles =
            await authorizationService.getUserRoles(
                req.user.user_id
            );

        const permissions =
            await authorizationService.getUserPermissions(
                req.user.user_id
            );

        return res.json({

            success: true,

            user: {

                ...req.user,

                roles,

                permissions

            }

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};