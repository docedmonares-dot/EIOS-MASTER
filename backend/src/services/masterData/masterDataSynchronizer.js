const pool = require(
    "../../config/database"
);

const DEFAULT_SOURCE_NAME =
    "Philippine Statistics Authority - PSGC";

function createSynchronizerError({
    message,
    code,
    statusCode = 500,
    metadata = {},
    cause = null,
}) {
    const error = new Error(message);

    error.code = code;
    error.statusCode = statusCode;
    error.metadata = metadata;

    if (cause) {
        error.cause = cause;
    }

    return error;
}

function normalizeText(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const normalized =
        String(value)
            .replace(/\s+/g, " ")
            .trim();

    return normalized || null;
}

function normalizeDatabaseStatus(
    value
) {
    const normalized =
        String(value || "")
            .trim()
            .toLowerCase();

    if (
        normalized === "inactive"
    ) {
        return "Inactive";
    }

    if (
        normalized === "superseded" ||
        normalized === "abolished" ||
        normalized === "deleted"
    ) {
        return "Superseded";
    }

    if (
        normalized === "archived"
    ) {
        return "Archived";
    }

    return "Active";
}

function createCanonicalValue(value) {
    if (Array.isArray(value)) {
        return value.map(
            createCanonicalValue
        );
    }

    if (
        value &&
        typeof value === "object"
    ) {
        return Object.keys(value)
            .sort()
            .reduce(
                (
                    normalizedObject,
                    key
                ) => {
                    normalizedObject[key] =
                        createCanonicalValue(
                            value[key]
                        );

                    return normalizedObject;
                },
                {}
            );
    }

    return value;
}

function canonicalJson(value) {
    return JSON.stringify(
        createCanonicalValue(
            value || {}
        )
    );
}

function valuesEqual(
    leftValue,
    rightValue
) {
    if (
        leftValue === null ||
        leftValue === undefined
    ) {
        return (
            rightValue === null ||
            rightValue === undefined
        );
    }

    if (
        typeof leftValue ===
            "object" ||
        typeof rightValue ===
            "object"
    ) {
        return (
            canonicalJson(leftValue) ===
            canonicalJson(rightValue)
        );
    }

    return (
        String(leftValue) ===
        String(rightValue)
    );
}

function buildRecordMetadata(
    record
) {
    return {
        dataset:
            "PSGC",

        psgc_code:
            record.psgc_code ||
            null,

        correspondence_code:
            record.correspondence_code ||
            null,

        geographic_level_code:
            record.geographic_level_code ||
            null,

        enterprise_type_code:
            record.enterprise_type_code ||
            null,

        old_names:
            record.old_names ||
            null,

        city_class:
            record.city_class ||
            null,

        income_classification:
            record
                .income_classification ||
            null,

        urban_rural_classification:
            record
                .urban_rural_classification ||
            null,

        population_2024:
            record.population_2024 ??
            null,

        parent_psgc_code:
            record.parent_psgc_code ||
            null,

        source_row_number:
            record.source_row_number ??
            null,

        source_metadata:
            record.metadata || {},
    };
}

function mapHierarchyRecord({
    record,
    countryId,
    geoUnitTypeId,
    parentGeoUnitId,
    sourceName,
    sourceVersion,
}) {
    return {
        country_id:
            countryId,

        geo_unit_type_id:
            geoUnitTypeId,

        parent_geo_unit_id:
            parentGeoUnitId,

        official_code:
            normalizeText(
                record.psgc_code
            ),

        local_code:
            normalizeText(
                record.correspondence_code
            ),

        unit_name:
            normalizeText(
                record.unit_name
            ),

        official_name:
            normalizeText(
                record.unit_name
            ),

        short_name:
            null,

        classification:
            normalizeText(
                record.city_class ||
                record
                    .income_classification
            ),

        hierarchy_level:
            Number(
                record.hierarchy_level
            ),

        status:
            normalizeDatabaseStatus(
                record.status
            ),

        is_official:
            true,

        is_operational:
            false,

        source_name:
            sourceName,

        source_version:
            sourceVersion,

        metadata_json:
            buildRecordMetadata(
                record
            ),
    };
}

function determineChangedFields({
    existingRecord,
    incomingRecord,
}) {
    const comparableFields = [
        "geo_unit_type_id",
        "parent_geo_unit_id",
        "local_code",
        "unit_name",
        "official_name",
        "short_name",
        "classification",
        "hierarchy_level",
        "status",
        "is_official",
        "is_operational",
        "source_name",
        "source_version",
        "metadata_json",
    ];

    return comparableFields.filter(
        (fieldName) =>
            !valuesEqual(
                existingRecord[
                    fieldName
                ],
                incomingRecord[
                    fieldName
                ]
            )
    );
}

async function loadPhilippinesCountry(
    client
) {
    const result =
        await client.query(
            `
            SELECT
                country_id,
                country_code,
                country_name,
                status
            FROM geo_countries
            WHERE country_code = 'PH'
            LIMIT 1
            `
        );

    if (
        result.rows.length === 0
    ) {
        throw createSynchronizerError({
            message:
                'The Philippines country record with country code "PH" was not found.',
            code:
                "MASTER_DATA_COUNTRY_NOT_FOUND",
            statusCode: 422,
        });
    }

    return result.rows[0];
}

async function loadGeographicTypes({
    client,
    countryId,
}) {
    const result =
        await client.query(
            `
            SELECT
                geo_unit_type_id,
                type_code,
                type_name,
                hierarchy_level,
                allows_children,
                is_active
            FROM geo_unit_types
            WHERE country_id = $1
              AND is_active = TRUE
            `,
            [countryId]
        );

    return new Map(
        result.rows.map(
            (record) => [
                record.type_code,
                record,
            ]
        )
    );
}

async function loadExistingUnits({
    client,
    countryId,
}) {
    const result =
        await client.query(
            `
            SELECT
                geo_unit_id,
                country_id,
                geo_unit_type_id,
                parent_geo_unit_id,
                official_code,
                local_code,
                unit_name,
                official_name,
                short_name,
                classification,
                hierarchy_level,
                status,
                is_official,
                is_operational,
                source_name,
                source_version,
                metadata_json,
                created_at,
                updated_at
            FROM geo_units
            WHERE country_id = $1
            ORDER BY
                hierarchy_level,
                official_code
            `,
            [countryId]
        );

    const recordsByOfficialCode =
        new Map();

    const duplicateOfficialCodes =
        [];

    result.rows.forEach(
        (record) => {
            const code =
                normalizeText(
                    record.official_code
                );

            if (!code) {
                return;
            }

            if (
                recordsByOfficialCode.has(
                    code
                )
            ) {
                duplicateOfficialCodes.push(
                    code
                );

                return;
            }

            recordsByOfficialCode.set(
                code,
                record
            );
        }
    );

    if (
        duplicateOfficialCodes.length >
        0
    ) {
        throw createSynchronizerError({
            message:
                "Duplicate geographic official codes exist in geo_units. Synchronization was stopped.",
            code:
                "MASTER_DATA_DUPLICATE_OFFICIAL_CODES",
            statusCode: 409,
            metadata: {
                duplicate_codes:
                    [
                        ...new Set(
                            duplicateOfficialCodes
                        ),
                    ],
            },
        });
    }

    return {
        records:
            result.rows,

        recordsByOfficialCode,
    };
}

async function insertGeographicUnit({
    client,
    record,
    actorUserId,
}) {
    const result =
        await client.query(
            `
            INSERT INTO geo_units (
                country_id,
                geo_unit_type_id,
                parent_geo_unit_id,
                official_code,
                local_code,
                unit_name,
                official_name,
                short_name,
                classification,
                hierarchy_level,
                status,
                is_official,
                is_operational,
                source_name,
                source_version,
                metadata_json,
                created_by,
                updated_by
            )
            VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8,
                $9, $10, $11, $12,
                $13, $14, $15, $16,
                $17, $18
            )
            RETURNING
                geo_unit_id,
                official_code
            `,
            [
                record.country_id,
                record.geo_unit_type_id,
                record.parent_geo_unit_id,
                record.official_code,
                record.local_code,
                record.unit_name,
                record.official_name,
                record.short_name,
                record.classification,
                record.hierarchy_level,
                record.status,
                record.is_official,
                record.is_operational,
                record.source_name,
                record.source_version,
                record.metadata_json,
                actorUserId || null,
                actorUserId || null,
            ]
        );

    return result.rows[0];
}

async function updateGeographicUnit({
    client,
    geoUnitId,
    record,
    actorUserId,
}) {
    await client.query(
        `
        UPDATE geo_units
        SET
            geo_unit_type_id = $2,
            parent_geo_unit_id = $3,
            local_code = $4,
            unit_name = $5,
            official_name = $6,
            short_name = $7,
            classification = $8,
            hierarchy_level = $9,
            status = $10,
            is_official = $11,
            is_operational = $12,
            source_name = $13,
            source_version = $14,
            metadata_json = $15,
            updated_by = $16,
            updated_at = NOW()
        WHERE geo_unit_id = $1
        `,
        [
            geoUnitId,
            record.geo_unit_type_id,
            record.parent_geo_unit_id,
            record.local_code,
            record.unit_name,
            record.official_name,
            record.short_name,
            record.classification,
            record.hierarchy_level,
            record.status,
            record.is_official,
            record.is_operational,
            record.source_name,
            record.source_version,
            record.metadata_json,
            actorUserId || null,
        ]
    );
}

async function supersedeMissingUnits({
    client,
    countryId,
    importedCodes,
    sourceName,
    sourceVersion,
    actorUserId,
    dryRun,
}) {
    const candidateResult =
        await client.query(
            `
            SELECT
                geo_unit_id,
                official_code,
                unit_name,
                status
            FROM geo_units
            WHERE country_id = $1
              AND is_official = TRUE
              AND official_code IS NOT NULL
              AND official_code <> 'PH'
              AND status = 'Active'
              AND source_name = $2
            `,
            [
                countryId,
                sourceName,
            ]
        );

    const missingUnits =
        candidateResult.rows.filter(
            (unit) =>
                !importedCodes.has(
                    unit.official_code
                )
        );

    if (
        !dryRun &&
        missingUnits.length > 0
    ) {
        const missingIds =
            missingUnits.map(
                (unit) =>
                    unit.geo_unit_id
            );

        await client.query(
            `
            UPDATE geo_units
            SET
                status = 'Superseded',
                source_version = $2,
                updated_by = $3,
                updated_at = NOW()
            WHERE geo_unit_id =
                ANY($1::uuid[])
            `,
            [
                missingIds,
                sourceVersion,
                actorUserId || null,
            ]
        );
    }

    return missingUnits;
}

/**
 * Synchronizes a complete geographic hierarchy with
 * the Enterprise Geographic Master.
 *
 * Safety defaults:
 * - dryRun defaults to true;
 * - missing records are not superseded unless
 *   retireMissing is explicitly enabled;
 * - all committed changes run in one transaction.
 */
async function synchronizeGeographicHierarchy({
    hierarchy,
    sourceName =
        DEFAULT_SOURCE_NAME,
    sourceVersion,
    workbookFingerprint = null,
    actorUserId = null,
    dryRun = true,
    retireMissing = false,
    onProgress = null,
}) {
    if (
        !Array.isArray(
            hierarchy?.nodes
        )
    ) {
        throw createSynchronizerError({
            message:
                "A valid geographic hierarchy is required.",
            code:
                "MASTER_DATA_HIERARCHY_REQUIRED",
            statusCode: 422,
        });
    }

    if (
        hierarchy.orphans?.length > 0
    ) {
        throw createSynchronizerError({
            message:
                "The geographic hierarchy contains orphan nodes. Synchronization was stopped.",
            code:
                "MASTER_DATA_HIERARCHY_HAS_ORPHANS",
            statusCode: 422,
            metadata: {
                orphan_count:
                    hierarchy.orphans
                        .length,
            },
        });
    }

    if (!sourceVersion) {
        throw createSynchronizerError({
            message:
                "Source version is required.",
            code:
                "MASTER_DATA_SOURCE_VERSION_REQUIRED",
            statusCode: 400,
        });
    }

    const startedAt =
        Date.now();

    const client =
        await pool.connect();

    const report = {
        dataset:
            "PSGC",

        source_name:
            sourceName,

        source_version:
            sourceVersion,

        workbook_fingerprint:
            workbookFingerprint,

        dry_run:
            Boolean(dryRun),

        retire_missing:
            Boolean(
                retireMissing
            ),

        total_source_records:
            hierarchy.nodes.length,

        inserted_count: 0,
        updated_count: 0,
        unchanged_count: 0,
        superseded_count: 0,
        error_count: 0,

        inserted: [],
        updated: [],
        unchanged: [],
        superseded: [],
        errors: [],

        started_at:
            new Date(
                startedAt
            ).toISOString(),

        completed_at: null,
        duration_ms: null,
    };

    try {
        await client.query("BEGIN");

        const country =
            await loadPhilippinesCountry(
                client
            );

        const typeMap =
            await loadGeographicTypes({
                client,
                countryId:
                    country.country_id,
            });

        const requiredTypeCodes =
            [
                ...new Set(
                    hierarchy.nodes.map(
                        (node) =>
                            node
                                .enterprise_type_code
                    )
                ),
            ];

        const missingTypeCodes =
            requiredTypeCodes.filter(
                (typeCode) =>
                    !typeMap.has(
                        typeCode
                    )
            );

        if (
            missingTypeCodes.length >
            0
        ) {
            throw createSynchronizerError({
                message:
                    "One or more geographic unit types are missing from geo_unit_types.",
                code:
                    "MASTER_DATA_UNIT_TYPES_MISSING",
                statusCode: 422,
                metadata: {
                    missing_type_codes:
                        missingTypeCodes,
                },
            });
        }

        const existing =
            await loadExistingUnits({
                client,
                countryId:
                    country.country_id,
            });

        const unitIdByCode =
            new Map();

        existing.recordsByOfficialCode.forEach(
            (
                record,
                officialCode
            ) => {
                unitIdByCode.set(
                    officialCode,
                    record.geo_unit_id
                );
            }
        );

        const countryRoot =
            existing
                .recordsByOfficialCode
                .get("PH");

        if (!countryRoot) {
            throw createSynchronizerError({
                message:
                    'The root geographic unit with official code "PH" was not found.',
                code:
                    "MASTER_DATA_COUNTRY_ROOT_NOT_FOUND",
                statusCode: 422,
            });
        }

        unitIdByCode.set(
            "PH",
            countryRoot.geo_unit_id
        );

        const sortedNodes =
            [...hierarchy.nodes].sort(
                (
                    leftNode,
                    rightNode
                ) => {
                    const levelDifference =
                        Number(
                            leftNode
                                .hierarchy_level
                        ) -
                        Number(
                            rightNode
                                .hierarchy_level
                        );

                    if (
                        levelDifference !== 0
                    ) {
                        return levelDifference;
                    }

                    return String(
                        leftNode.psgc_code
                    ).localeCompare(
                        String(
                            rightNode
                                .psgc_code
                        )
                    );
                }
            );

        for (
            let index = 0;
            index <
            sortedNodes.length;
            index += 1
        ) {
            const sourceRecord =
                sortedNodes[index];

            const parentCode =
                sourceRecord
                    .parent_psgc_code;

            const parentGeoUnitId =
                unitIdByCode.get(
                    parentCode
                );

            if (!parentGeoUnitId) {
                throw createSynchronizerError({
                    message:
                        `Parent geographic unit "${parentCode}" was not resolved for "${sourceRecord.unit_name}".`,
                    code:
                        "MASTER_DATA_PARENT_NOT_RESOLVED",
                    statusCode: 422,
                    metadata: {
                        official_code:
                            sourceRecord
                                .psgc_code,

                        parent_official_code:
                            parentCode,

                        unit_name:
                            sourceRecord
                                .unit_name,
                    },
                });
            }

            const typeRecord =
                typeMap.get(
                    sourceRecord
                        .enterprise_type_code
                );

            const incomingRecord =
                mapHierarchyRecord({
                    record:
                        sourceRecord,

                    countryId:
                        country.country_id,

                    geoUnitTypeId:
                        typeRecord
                            .geo_unit_type_id,

                    parentGeoUnitId,

                    sourceName,

                    sourceVersion,
                });

            const existingRecord =
                existing
                    .recordsByOfficialCode
                    .get(
                        sourceRecord
                            .psgc_code
                    );

            if (!existingRecord) {
                report.inserted_count +=
                    1;

                report.inserted.push({
                    official_code:
                        sourceRecord
                            .psgc_code,

                    unit_name:
                        sourceRecord
                            .unit_name,

                    type_code:
                        sourceRecord
                            .enterprise_type_code,

                    parent_official_code:
                        parentCode,
                });

                if (!dryRun) {
                    const insertedRecord =
                        await insertGeographicUnit({
                            client,
                            record:
                                incomingRecord,
                            actorUserId,
                        });

                    unitIdByCode.set(
                        sourceRecord
                            .psgc_code,
                        insertedRecord
                            .geo_unit_id
                    );

                    existing
                        .recordsByOfficialCode
                        .set(
                            sourceRecord
                                .psgc_code,
                            {
                                ...incomingRecord,

                                geo_unit_id:
                                    insertedRecord
                                        .geo_unit_id,
                            }
                        );
                } else {
                    /*
                     * A dry run has no real inserted UUID.
                     * Children can still be analyzed because
                     * their hierarchy was already validated.
                     */
                    unitIdByCode.set(
                        sourceRecord
                            .psgc_code,
                        `dry-run:${sourceRecord.psgc_code}`
                    );
                }
            } else {
                const changedFields =
                    determineChangedFields({
                        existingRecord,
                        incomingRecord,
                    });

                if (
                    changedFields.length ===
                    0
                ) {
                    report
                        .unchanged_count +=
                        1;

                    report.unchanged.push({
                        official_code:
                            sourceRecord
                                .psgc_code,

                        unit_name:
                            sourceRecord
                                .unit_name,
                    });
                } else {
                    report.updated_count +=
                        1;

                    report.updated.push({
                        official_code:
                            sourceRecord
                                .psgc_code,

                        unit_name:
                            sourceRecord
                                .unit_name,

                        changed_fields:
                            changedFields,
                    });

                    if (!dryRun) {
                        await updateGeographicUnit({
                            client,

                            geoUnitId:
                                existingRecord
                                    .geo_unit_id,

                            record:
                                incomingRecord,

                            actorUserId,
                        });
                    }
                }

                unitIdByCode.set(
                    sourceRecord.psgc_code,
                    existingRecord
                        .geo_unit_id
                );
            }

            if (
                typeof onProgress ===
                "function"
            ) {
                await onProgress({
                    processed:
                        index + 1,

                    total:
                        sortedNodes.length,

                    official_code:
                        sourceRecord
                            .psgc_code,

                    unit_name:
                        sourceRecord
                            .unit_name,

                    inserted_count:
                        report
                            .inserted_count,

                    updated_count:
                        report
                            .updated_count,

                    unchanged_count:
                        report
                            .unchanged_count,
                });
            }
        }

        if (retireMissing) {
            const importedCodes =
                new Set(
                    hierarchy.nodes.map(
                        (node) =>
                            node.psgc_code
                    )
                );

            const missingUnits =
                await supersedeMissingUnits({
                    client,

                    countryId:
                        country.country_id,

                    importedCodes,

                    sourceName,

                    sourceVersion,

                    actorUserId,

                    dryRun,
                });

            report.superseded_count =
                missingUnits.length;

            report.superseded =
                missingUnits.map(
                    (unit) => ({
                        geo_unit_id:
                            unit.geo_unit_id,

                        official_code:
                            unit.official_code,

                        unit_name:
                            unit.unit_name,
                    })
                );
        }

        if (dryRun) {
            await client.query(
                "ROLLBACK"
            );
        } else {
            await client.query(
                "COMMIT"
            );
        }

        const completedAt =
            Date.now();

        report.completed_at =
            new Date(
                completedAt
            ).toISOString();

        report.duration_ms =
            completedAt -
            startedAt;

        return report;
    } catch (error) {
        try {
            await client.query(
                "ROLLBACK"
            );
        } catch (
            rollbackError
        ) {
            console.error(
                "MASTER DATA ROLLBACK ERROR:",
                rollbackError
            );
        }

        report.error_count += 1;

        report.errors.push({
            code:
                error.code ||
                "MASTER_DATA_SYNC_FAILED",

            message:
                error.message,

            metadata:
                error.metadata || {},
        });

        error.synchronizationReport =
            report;

        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    synchronizeGeographicHierarchy,
};