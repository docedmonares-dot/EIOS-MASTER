const authorizationService = require("../services/security/authorizationService");

/*
=========================================================
    REQUIRE PERMISSION
=========================================================
*/

exports.requirePermission = function (permissionCode) {

    return async function (req, res, next) {

        try {

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
                    required_permission: permissionCode
                });

            }

            next();

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Permission verification failed."
            });

        }

    };

};