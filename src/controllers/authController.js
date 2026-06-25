const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.healthCheck = async (req, res) => {
    try {
        res.json({
            module: 'Authentication',
            status: 'Ready'
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

	
        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
	      }

       const token = jwt.sign(
    {
        user_id: result.rows[0].user_id,
        email: result.rows[0].email,
        role: result.rows[0].role
    },
    process.env.JWT_SECRET,
    {
        expiresIn: '8h'
    }
);

return res.json({
    message: 'Login successful',
    token,
    user: {
        user_id: result.rows[0].user_id,
        full_name: result.rows[0].full_name,
        email: result.rows[0].email,
        role: result.rows[0].role
    }
});

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
};
exports.me = async (req, res) => {
    return res.json({
        message: 'Authenticated user',
        user: req.user
    });
};