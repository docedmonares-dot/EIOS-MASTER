const pool = require("../config/database");

/*
=========================================================
ENTERPRISE ADMIN DASHBOARD
=========================================================
*/

exports.getDashboardSummary = async (req, res) => {

    const client = await pool.connect();

    try {

        const [

            surveys,
            responses,
            users,
            enumerators,
            supervisors,
            operationsManagers,
            statisticians,
            executives,
            qa

        ] = await Promise.all([

            client.query(
                `SELECT COUNT(*) FROM surveys`
            ),

            client.query(
                `SELECT COUNT(*) FROM survey_responses`
            ),

            client.query(
                `
                SELECT COUNT(*)
                FROM users
                WHERE deleted_at IS NULL
                `
            ),

            client.query(
                `
                SELECT COUNT(DISTINCT ur.user_id)

                FROM user_roles ur

                INNER JOIN roles r
                    ON ur.role_id = r.role_id

                WHERE
                    ur.revoked_at IS NULL
                    AND r.role_code = 'ENUMERATOR'
                `
            ),

            client.query(
                `
                SELECT COUNT(DISTINCT ur.user_id)

                FROM user_roles ur

                INNER JOIN roles r
                    ON ur.role_id = r.role_id

                WHERE
                    ur.revoked_at IS NULL
                    AND r.role_code = 'SUPERVISOR'
                `
            ),

            client.query(
                `
                SELECT COUNT(DISTINCT ur.user_id)

                FROM user_roles ur

                INNER JOIN roles r
                    ON ur.role_id = r.role_id

                WHERE
                    ur.revoked_at IS NULL
                    AND r.role_code = 'OPERATIONS_MANAGER'
                `
            ),

            client.query(
                `
                SELECT COUNT(DISTINCT ur.user_id)

                FROM user_roles ur

                INNER JOIN roles r
                    ON ur.role_id = r.role_id

                WHERE
                    ur.revoked_at IS NULL
                    AND r.role_code = 'STATISTICIAN'
                `
            ),

            client.query(
                `
                SELECT COUNT(DISTINCT ur.user_id)

                FROM user_roles ur

                INNER JOIN roles r
                    ON ur.role_id = r.role_id

                WHERE
                    ur.revoked_at IS NULL
                    AND r.role_code = 'EXECUTIVE'
                `
            ),

            client.query(
                `
                SELECT COUNT(DISTINCT ur.user_id)

                FROM user_roles ur

                INNER JOIN roles r
                    ON ur.role_id = r.role_id

                WHERE
                    ur.revoked_at IS NULL
                    AND r.role_code = 'QUALITY_ASSURANCE'
                `
            )

        ]);

        return res.json({

            success: true,

            data: {

                total_surveys:
                    Number(surveys.rows[0].count),

                total_responses:
                    Number(responses.rows[0].count),

                total_users:
                    Number(users.rows[0].count),

                users_by_role: {

                    enumerators:
                        Number(enumerators.rows[0].count),

                    supervisors:
                        Number(supervisors.rows[0].count),

                    operations_managers:
                        Number(operationsManagers.rows[0].count),

                    statisticians:
                        Number(statisticians.rows[0].count),

                    executives:
                        Number(executives.rows[0].count),

                    quality_assurance:
                        Number(qa.rows[0].count)

                }

            }

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    } finally {

        client.release();

    }

};