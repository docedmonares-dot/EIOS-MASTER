CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(80) NOT NULL CHECK (
        role IN (
            'Super Admin',
            'Admin',
            'Supervisor',
            'Enumerator',
            'Analyst',
            'Viewer'
        )
    ),
    status VARCHAR(40) DEFAULT 'Active' CHECK (
        status IN (
            'Active',
            'Inactive',
            'Suspended',
            'Archived'
        )
    ),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);