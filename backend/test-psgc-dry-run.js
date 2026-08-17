const path = require("path");

const {
    readPsgcWorkbook,
} = require(
    "./src/services/psgcImporter/workbookReader"
);

const {
    validatePsgcWorkbook,
} = require(
    "./src/services/psgcImporter/worksheetValidator"
);

const {
    parsePsgcWorksheet,
} = require(
    "./src/services/psgcImporter/psgcParser"
);

const hierarchyBuilderPath =
    require.resolve(
        "./src/services/psgcImporter/hierarchyBuilder"
    );

delete require.cache[
    hierarchyBuilderPath
];

const {
    buildHierarchy,
    determineParentCode,
} = require(
    hierarchyBuilderPath
);

const {
    synchronizeGeographicHierarchy,
} = require(
    "./src/services/masterData/masterDataSynchronizer"
);

async function runDryRun() {
    const workbookPath =
        process.argv[2];

    if (!workbookPath) {
        throw new Error(
            "Provide the complete PSGC workbook path."
        );
    }

    console.log(
        "\n[1/5] Opening workbook..."
    );

    const workbookData =
        await readPsgcWorkbook(
            path.resolve(workbookPath)
        );

    console.log(
        "Workbook opened."
    );

    console.log(
        "\n[2/5] Validating workbook..."
    );

    const validationReport =
        validatePsgcWorkbook(
            workbookData
        );

    console.log(
        JSON.stringify(
            validationReport.summary,
            null,
            2
        )
    );

    if (!validationReport.valid) {
        throw new Error(
            "Workbook validation failed."
        );
    }

    console.log(
        "\n[3/5] Parsing records..."
    );

    const parsedWorkbook =
        parsePsgcWorksheet({
            workbookData,
            validationReport,
        });

    console.log(
        JSON.stringify(
            parsedWorkbook.summary,
            null,
            2
        )
    );

    console.log(
        "\n[4/5] Building hierarchy..."
    );

const rawTondoRecord =
    parsedWorkbook.records.find(
        (record) =>
            record.psgc_code ===
            "1380601000"
    );

console.log(
    "\nHierarchy module diagnostic:"
);

console.log(
    JSON.stringify(
        {
            loaded_file:
                hierarchyBuilderPath,

            raw_record:
                rawTondoRecord,

            direct_parent_result:
                determineParentCode(
                    rawTondoRecord
                ),
        },
        null,
        2
    )
);

    const hierarchy =
        buildHierarchy(
            parsedWorkbook
        );

    console.log(
        JSON.stringify(
            hierarchy.statistics,
            null,
            2
        )
    );

    if (
        hierarchy.statistics
            .orphan_count !== 0
    ) {
        throw new Error(
            "Hierarchy still contains orphan nodes."
        );
    }

    /*
     * Critical integration check:
     * Tondo I/II must point to the City of Manila,
     * not to its own PSGC code.
     */
    const tondoRecord =
        hierarchy.nodeMap.get(
            "1380601000"
        );

    if (!tondoRecord) {
        throw new Error(
            "Tondo I/II was not found in the hierarchy."
        );
    }

    console.log(
        "\nHierarchy verification:"
    );

    console.log(
        JSON.stringify(
            {
                official_code:
                    tondoRecord.psgc_code,

                unit_name:
                    tondoRecord.unit_name,

                parent_psgc_code:
                    tondoRecord
                        .parent_psgc_code,
            },
            null,
            2
        )
    );

    if (
        tondoRecord
            .parent_psgc_code !==
        "1380600000"
    ) {
        throw new Error(
            `Tondo I/II has an incorrect parent: ${tondoRecord.parent_psgc_code}`
        );
    }

    console.log(
        "\n[5/5] Running database dry run..."
    );

    const report =
        await synchronizeGeographicHierarchy({
            hierarchy,

            sourceName:
                "Philippine Statistics Authority - PSGC",

            sourceVersion:
                "2026-Q2",

            workbookFingerprint:
                workbookData.source
                    .workbook_fingerprint,

            dryRun: true,

            retireMissing: false,

            onProgress: ({
                processed,
                total,
            }) => {
                if (
                    processed % 5000 === 0 ||
                    processed === total
                ) {
                    console.log(
                        `Processed ${processed} of ${total}`
                    );
                }
            },
        });

    console.log(
        "\nDRY-RUN RESULT"
    );

    console.log(
        JSON.stringify(
            {
                dataset:
                    report.dataset,

                source_version:
                    report.source_version,

                dry_run:
                    report.dry_run,

                total_source_records:
                    report.total_source_records,

                inserted_count:
                    report.inserted_count,

                updated_count:
                    report.updated_count,

                unchanged_count:
                    report.unchanged_count,

                superseded_count:
                    report.superseded_count,

                error_count:
                    report.error_count,

                duration_ms:
                    report.duration_ms,

                first_20_inserts:
                    report.inserted.slice(
                        0,
                        20
                    ),

                first_20_updates:
                    report.updated.slice(
                        0,
                        20
                    ),
            },
            null,
            2
        )
    );

    console.log(
        "\nDry run completed. No database changes were committed."
    );
}

runDryRun().catch(
    (error) => {
        console.error(
            "\nPSGC DRY RUN FAILED:"
        );

        console.error({
            name:
                error.name,

            code:
                error.code ||
                null,

            message:
                error.message,

            metadata:
                error.metadata ||
                null,
        });

        /*
         * Print only a compact report.
         * Do not print thousands of accumulated insert records.
         */
        if (
            error
                .synchronizationReport
        ) {
            const report =
                error
                    .synchronizationReport;

            console.error(
                "\nCompact synchronization report:"
            );

            console.error(
                JSON.stringify(
                    {
                        dataset:
                            report.dataset,

                        source_version:
                            report
                                .source_version,

                        dry_run:
                            report.dry_run,

                        total_source_records:
                            report
                                .total_source_records,

                        inserted_count:
                            report
                                .inserted_count,

                        updated_count:
                            report
                                .updated_count,

                        unchanged_count:
                            report
                                .unchanged_count,

                        superseded_count:
                            report
                                .superseded_count,

                        error_count:
                            report
                                .error_count,

                        errors:
                            report.errors,

                        last_5_processed_inserts:
                            report.inserted
                                .slice(-5),
                    },
                    null,
                    2
                )
            );
        }

        process.exitCode = 1;
    }
);