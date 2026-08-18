require('dotenv').config();

const express = require('express');
const LGUAIEngine = require('./src/services/lguAIEngine');
const pool = require('./src/config/db');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const metadataCompilerRoutes = require(
    "./src/routes/metadataCompiler"
);

const app = express();
const allowedOrigins = String(
    process.env.CORS_ALLOWED_ORIGINS ||
    "http://localhost:5173"
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const choiceLibraryRoutes = require(
    "./src/routes/choiceLibrary"
);

/* ======================
   BASIC ROUTE
====================== */
app.get('/', (req, res) => {
    res.send('EIOS API is running 🟢');
});

/* ======================
   MIDDLEWARE
====================== */
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error("Origin is not allowed by CORS policy."));
    },
    credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));

/* ======================
   STATIC + ROUTES
====================== */
app.use(express.static(path.join(__dirname, 'src/public')));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/admin-users', require('./src/routes/adminUser'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use(
    '/api/enterprise-foundation',
    require('./src/routes/enterpriseFoundation')
);

app.use(
    '/api/geographic-master',
    require('./src/routes/geographicMaster')
);

app.use(
    '/api/enterprise-jobs',
    require('./src/routes/enterpriseJobs')
);

app.use(
    '/api/survey-engine',
    require('./src/routes/surveyEngine')
);

app.use(
    '/api/questionnaire-designer',
    require('./src/routes/questionnaireDesigner')
);

app.use(
    "/api/metadata-compiler",
    metadataCompilerRoutes
);

app.use(
    "/api/question-bank",
    require("./src/routes/questionBank")
);

app.use(
  "/api/question-logic",
  require("./src/routes/questionLogic")
);

app.use(
    "/api/question-types",
    require("./src/routes/questionTypes")
);

app.use(
    "/api/question-categories",
    require("./src/routes/questionCategories")
);

app.use(
    "/api/choice-library",
    choiceLibraryRoutes
);

app.use(
    "/api/offline-responses",
    require("./src/routes/offlineResponses")
);

app.use(
    "/api/survey-versions",
    require("./src/routes/surveyVersions")
);

app.use(
    "/api/survey-deployments",
    require("./src/routes/surveyDeployments")
);

app.use(
    "/api/deployment-personnel",
    require("./src/routes/deploymentPersonnel")
);

app.use(
    "/api/enumerators",
    require("./src/routes/enumerators")
);

app.use(
    "/api/area-assignments",
    require("./src/routes/areaAssignments")
);

app.use(
    "/api/survey-responses",
    require("./src/routes/surveyResponses")
);

app.use(
    "/api/analytics",
    require("./src/routes/analytics")
);

app.use(
    "/api/data-exports",
    require("./src/routes/dataExports")
);

app.use(
    "/api/field-map",
    require("./src/routes/fieldMap")
);

app.use(
    "/api/system-health",
    require("./src/routes/systemHealth")
);

app.use(
    "/api/gps-validations",
    require("./src/routes/gpsValidations")
);

app.use(
    "/api/notifications",
    require("./src/routes/notifications")
);

/* ======================
   MEMORY STORES
====================== */
let enumerators = {};
let barangayStats = {};
let heatmapData = {};

let supervisorAI = {
    riskZones: {},
    alerts: [],
    efficiency: {}
};

/* ======================
   DB TEST
====================== */
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: "DB WORKING",
            time: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ======================
   AI ENDPOINT
====================== */
app.get('/api/admin/lgu-ai', (req, res) => {
    const ai = LGUAIEngine.analyze(enumerators, barangayStats);
    res.json(ai || {});
});

/* ======================
   GPS LOGGER
====================== */
async function saveGPSLog(data) {
    const userId = data?.user_id || null;
    const enumeratorId = data?.enumerator_id || null;

    const latitude = Number(data?.latitude);
    const longitude = Number(data?.longitude);

    const accuracy =
        data?.accuracy !== null &&
        data?.accuracy !== undefined
            ? Number(data.accuracy)
            : null;

    const altitude =
        data?.altitude !== null &&
        data?.altitude !== undefined
            ? Number(data.altitude)
            : null;

    const altitudeAccuracy =
        data?.altitude_accuracy !== null &&
        data?.altitude_accuracy !== undefined
            ? Number(data.altitude_accuracy)
            : null;

    const heading =
        data?.heading !== null &&
        data?.heading !== undefined
            ? Number(data.heading)
            : null;

    const speed =
        data?.speed !== null &&
        data?.speed !== undefined
            ? Number(data.speed)
            : null;

    const status = data?.status || "active";
    const role = data?.role || null;
    const source = data?.source || "unknown";
    const isOffline = Boolean(data?.is_offline);

    const capturedAt =
        data?.captured_at ||
        new Date().toISOString();

    const regionCode =
        data?.region_code || null;

    const provinceCode =
        data?.province_code || null;

    const municipalityCode =
        data?.municipality_code || null;

    const barangayCode =
        data?.barangay_code || null;

    const batteryLevel =
        data?.battery_level !== null &&
        data?.battery_level !== undefined
            ? Number(data.battery_level)
            : null;

    const networkType =
        data?.network_type || null;

    const deviceId =
        data?.device_id || null;

    if (
        !userId ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        throw new Error(
            "Invalid GPS payload."
        );
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(
            `
            INSERT INTO gps_logs (
                user_id,
                enumerator_id,
                latitude,
                longitude,
                accuracy,
                altitude,
                altitude_accuracy,
                heading,
                speed,
                status,
                role,
                source,
                is_offline,
                captured_at,
                region_code,
                province_code,
                municipality_code,
                barangay_code,
                battery_level,
                network_type,
                device_id
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20,
                $21
            )
            `,
            [
                userId,
                enumeratorId,
                latitude,
                longitude,
                accuracy,
                altitude,
                altitudeAccuracy,
                heading,
                speed,
                status,
                role,
                source,
                isOffline,
                capturedAt,
                regionCode,
                provinceCode,
                municipalityCode,
                barangayCode,
                batteryLevel,
                networkType,
                deviceId
            ]
        );

        await client.query(
            `
            INSERT INTO gps_current_locations (
                user_id,
                enumerator_id,
                latitude,
                longitude,
                accuracy,
                altitude,
                altitude_accuracy,
                heading,
                speed,
                status,
                role,
                source,
                is_offline,
                captured_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14, NOW()
            )
            ON CONFLICT (user_id)
            DO UPDATE SET
                enumerator_id =
                    EXCLUDED.enumerator_id,
                latitude =
                    EXCLUDED.latitude,
                longitude =
                    EXCLUDED.longitude,
                accuracy =
                    EXCLUDED.accuracy,
                altitude =
                    EXCLUDED.altitude,
                altitude_accuracy =
                    EXCLUDED.altitude_accuracy,
                heading =
                    EXCLUDED.heading,
                speed =
                    EXCLUDED.speed,
                status =
                    EXCLUDED.status,
                role =
                    EXCLUDED.role,
                source =
                    EXCLUDED.source,
                is_offline =
                    EXCLUDED.is_offline,
                captured_at =
                    EXCLUDED.captured_at,
                updated_at =
                    NOW()
            `,
            [
                userId,
                enumeratorId,
                latitude,
                longitude,
                accuracy,
                altitude,
                altitudeAccuracy,
                heading,
                speed,
                status,
                role,
                source,
                isOffline,
                capturedAt
            ]
        );

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/* ======================
   SERVER + SOCKET
====================== */
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

/* ======================
   SOCKET ENGINE
====================== */
io.on('connection', (socket) => {

    console.log('Client connected:', socket.id);

socket.on("gps-update", async (data) => {

    console.log("GPS UPDATE RECEIVED:", data);

    try {
        if (
            !data?.user_id ||
            data?.latitude === undefined ||
            data?.longitude === undefined
        ) {
            console.log("GPS UPDATE REJECTED — MISSING REQUIRED DATA:", data);
            return;
        }

            const brgy = data.barangay || "UNKNOWN";

await saveGPSLog(data);
            if (!barangayStats[brgy]) {
                barangayStats[brgy] = { total: 0, active: 0, offline: 0 };
            }

            if (!heatmapData[brgy]) {
                heatmapData[brgy] = { points: [], intensity: 0 };
            }

            enumerators[data.user_id] = {
                lat: data.latitude,
                lng: data.longitude,
                status: "moving",
                lastSeen: Date.now(),
                barangay: brgy
            };

            heatmapData[brgy].points.push([
                data.latitude,
                data.longitude,
                0.6
            ]);

            if (heatmapData[brgy].points.length > 100) {
                heatmapData[brgy].points.shift();
            }

            Object.keys(heatmapData).forEach(b => {

                const total = barangayStats[b]?.total || 1;
                const points = heatmapData[b]?.points?.length || 0;

                const ratio = total > 0 ? points / total : 0;

                heatmapData[b].intensity = Number.isFinite(ratio) ? ratio : 0;
            });

            barangayStats[brgy].active =
                Object.values(enumerators || {})
                    .filter(e => e && (e.status === "moving" || e.status === "active"))
                    .length;

            io.emit("supervisor-update", enumerators);
            io.emit("barangay-intelligence", barangayStats);
            io.emit("heatmap-intelligence", heatmapData);

        } catch (err) {
            console.error("GPS SOCKET ERROR:", err.message);
        }
    });

    socket.on("enumerator-heartbeat", (data) => {

        if (!data?.user_id) return;

        if (!enumerators[data.user_id]) {
            enumerators[data.user_id] = {};
        }

        enumerators[data.user_id].status = "active";
        enumerators[data.user_id].lastSeen = Date.now();

        io.emit("supervisor-update", enumerators);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

/* ======================
   AI LOOP
====================== */
setInterval(() => {

    const now = Date.now();

    let activeCount = 0;
    let idleCount = 0;
    let offlineCount = 0;
    let alerts = [];

    for (const id in (enumerators || {})) {

        const e = enumerators?.[id];
        if (!e?.lastSeen) continue;

        const diff = now - e.lastSeen;

        if (diff > 60000) {
            e.status = "offline";
            offlineCount++;

            alerts.push({
                type: "OFFLINE",
                user: id,
                message: "Enumerator inactive > 60s"
            });

        } else if (diff > 30000) {
            e.status = "idle";
            idleCount++;

        } else {
            activeCount++;
        }
    }

    supervisorAI.alerts = alerts;
    supervisorAI.summary = {
        active: activeCount,
        idle: idleCount,
        offline: offlineCount
    };

    const ai = LGUAIEngine.analyze(enumerators, barangayStats);

    io.emit("lgu-ai-update", ai || {});
    io.emit("supervisor-ai-update", supervisorAI);
    io.emit("supervisor-update", enumerators);

}, 10000);

/* ======================
   ANALYTICS
====================== */
app.get('/api/admin/analytics', (req, res) => {
    res.json({
        total_enumerators: Object.keys(enumerators).length,
        active: Object.values(enumerators).filter(e => e?.status === "active").length,
        moving: Object.values(enumerators).filter(e => e?.status === "moving").length,
        offline: Object.values(enumerators).filter(e => e?.status === "offline").length
    });
});

/* ======================
   START SERVER (ONLY ONCE)
====================== */
const PORT = process.env.PORT || 5050;

server.listen(PORT, "0.0.0.0", () => {
    console.log("EIOS API running on port " + PORT);
});
