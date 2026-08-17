class LGUAIEngine {

    static analyze(enumerators, barangayStats) {

        const riskZones = [];
        const efficiency = {};
        const predictions = [];
        const anomalies = [];
        const recommendations = [];

        const now = Date.now();

        /* ======================
           1. ENUMERATOR BEHAVIOR AI
        ====================== */
        Object.keys(enumerators || {}).forEach(id => {

            const e = enumerators[id];
            if (!e) return;

            const timeDiff = now - (e.lastSeen || now);

            let score = 100;
            let risk = "LOW";

            // inactivity patterns
            if (timeDiff > 60000) {
                score -= 60;
                risk = "HIGH";
            } else if (timeDiff > 30000) {
                score -= 30;
                risk = "MEDIUM";
            }

            // movement anomaly
            if (e.status === "idle") score -= 20;
            if (e.status === "offline") score -= 50;

            efficiency[id] = {
                score: Math.max(score, 0),
                riskLevel: risk,
                status: e.status,
                lastSeen: e.lastSeen
            };

            /* prediction */
            if (score < 40) {
                predictions.push({
                    type: "PREDICT_OFFLINE",
                    user: id,
                    probability: (100 - score) + "%"
                });
            }
        });

        /* ======================
           2. BARANGAY RISK ENGINE
        ====================== */
        Object.keys(barangayStats || {}).forEach(brgy => {

            const stats = barangayStats[brgy] || {};

            const active = stats.active || 0;
            const total = stats.total || 1;

            const coverage = active / total;

            let level = "LOW";

            if (coverage < 0.3) level = "CRITICAL";
            else if (coverage < 0.6) level = "MEDIUM";

            if (level === "CRITICAL") {
                riskZones.push({
                    barangay: brgy,
                    risk: level,
                    reason: "Very low field coverage"
                });

                recommendations.push({
                    action: "DEPLOY_BACKUP_TEAM",
                    target: brgy
                });
            }
        });

        /* ======================
           3. ANOMALY DETECTION
        ====================== */
        Object.keys(enumerators || {}).forEach(id => {

            const e = enumerators[id];
            if (!e) return;

            // repeated inactivity anomaly
            if (e.status === "offline" && e.lastSeen) {
                const diff = now - e.lastSeen;

                if (diff > 120000) {
                    anomalies.push({
                        type: "LONG_OFFLINE",
                        user: id,
                        severity: "HIGH"
                    });
                }
            }

            // fake GPS pattern detection (basic)
            if (e.lat === 0 && e.lng === 0) {
                anomalies.push({
                    type: "INVALID_GPS",
                    user: id,
                    severity: "CRITICAL"
                });
            }
        });

        /* ======================
           4. COMMAND AI RECOMMENDER
        ====================== */
        if (riskZones.length > 0) {
            recommendations.push({
                action: "ACTIVATE_FIELD_RECOVERY_MODE"
            });
        }

        if (anomalies.length > 3) {
            recommendations.push({
                action: "TRIGGER_SYSTEM_AUDIT"
            });
        }

        /* ======================
           5. FINAL OUTPUT
        ====================== */
        return {
            timestamp: new Date().toISOString(),
            efficiency,
            riskZones,
            predictions,
            anomalies,
            recommendations,
            systemHealth: {
                enumerators: Object.keys(enumerators || {}).length,
                barangays: Object.keys(barangayStats || {}).length
            }
        };
    }
}

module.exports = LGUAIEngine;