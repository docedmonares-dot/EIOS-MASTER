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

const {
    buildHierarchy,
} = require(
    "./src/services/psgcImporter/hierarchyBuilder"
);

async function runTest() {
    const workbookPath =
        process.argv[2];

    if (!workbookPath) {
        throw new Error(
            "Provide the complete PSGC workbook path."
        );
    }

    console.log(
        "\n[1/4] Opening PSGC workbook..."
    );

    const workbookData =
        await readPsgcWorkbook(
            path.resolve(workbookPath)
        );

    console.log(
        "Workbook opened successfully."
    );

    console.log(
        "Worksheets:",
        workbookData.workbook.sheet_names
    );

    console.log(
        "\n[2/4] Validating workbook..."
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
        console.error(
            "\nValidation errors:"
        );

        console.error(
            JSON.stringify(
                validationReport.errors.slice(
                    0,
                    20
                ),
                null,
                2
            )
        );

        process.exitCode = 1;
        return;
    }

    console.log(
        "\n[3/4] Parsing PSGC records..."
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
        "\n[4/4] Building hierarchy..."
    );

    const hierarchy =
        buildHierarchy(
            parsedWorkbook
        );

         const sourceRows =
        workbookData.psgc_sheet?.rows || [];

    const columnIndex =
        validationReport.schema
            ?.column_index || {};

    const cityClassColumn =
        columnIndex["City Class"];

    const geographicLevelColumn =
        columnIndex[
            "Geographic Level"
        ];

    const cityClassValues =
        sourceRows
            .slice(1)
            .filter(
                (row) =>
                    String(
                        row[
                            geographicLevelColumn
                        ] ?? ""
                    ).trim() === "City"
            )
            .map(
                (row) =>
                    String(
                        row[
                            cityClassColumn
                        ] ?? ""
                    ).trim()
            )
            .filter(Boolean);

    const uniqueCityClasses =
        [
            ...new Set(
                cityClassValues
            ),
        ].sort();

    const orphanNodes =
        hierarchy.nodes.filter(
            (node) =>
                node.parent_psgc_code !==
                    "PH" &&
                !hierarchy.nodeMap.has(
                    node.parent_psgc_code
                )
        );

    console.log(
        "\nDiagnostic: City Class values"
    );

    console.log(
        JSON.stringify(
            uniqueCityClasses,
            null,
            2
        )
    );

    console.log(
        "\nDiagnostic: First 30 orphan nodes"
    );

    console.log(
        JSON.stringify(
            orphanNodes
                .slice(0, 30)
                .map((node) => ({
                    psgc_code:
                        node.psgc_code,

                    unit_name:
                        node.unit_name,

                    geographic_level_code:
                        node
                            .geographic_level_code,

                    enterprise_type_code:
                        node
                            .enterprise_type_code,

                    calculated_parent_code:
                        node
                            .parent_psgc_code,
                })),
            null,
            2
        )
    );   

    const orphanCount =
        hierarchy.nodes.filter(
            (node) =>
                node.parent_psgc_code !==
                    "PH" &&
                !hierarchy.nodeMap.has(
                    node.parent_psgc_code
                )
        ).length;

    console.log(
        JSON.stringify(
            {
                total_nodes:
                    hierarchy.statistics
                        .total_nodes,

                root_count:
                    hierarchy.statistics
                        .root_count,

                orphan_count:
                    orphanCount,

                workbook_fingerprint:
                    workbookData.source
                        .workbook_fingerprint ||
                    null,
            },
            null,
            2
        )
    );

    console.log(
        "\nPSGC importer pipeline test completed successfully."
    );
}

runTest().catch((error) => {
    console.error(
        "\nPSGC IMPORTER TEST FAILED:"
    );

    console.error(error);

    process.exitCode = 1;
});