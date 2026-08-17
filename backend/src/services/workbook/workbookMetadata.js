const crypto = require("crypto");

function createCanonicalValue(value) {
    if (Array.isArray(value)) {
        return value.map(
            createCanonicalValue
        );
    }

    if (
        value &&
        typeof value === "object" &&
        !(value instanceof Date)
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

function createWorkbookFingerprint(
    workbookData
) {
    if (!workbookData) {
        throw new Error(
            "Workbook data is required."
        );
    }

    const fingerprintSource = {
        source: {
            file_name:
                workbookData.source
                    ?.file_name ||
                null,

            file_extension:
                workbookData.source
                    ?.file_extension ||
                null,

            file_size_bytes:
                workbookData.source
                    ?.file_size_bytes ||
                null,
        },

        workbook: {
            worksheet_names:
                workbookData.workbook
                    ?.worksheet_names ||
                [],

            worksheet_count:
                workbookData.workbook
                    ?.worksheet_count ||
                0,

            creator:
                workbookData.workbook
                    ?.creator ||
                null,

            created_at:
                workbookData.workbook
                    ?.created_at ||
                null,

            modified_at:
                workbookData.workbook
                    ?.modified_at ||
                null,

            title:
                workbookData.workbook
                    ?.title ||
                null,

            subject:
                workbookData.workbook
                    ?.subject ||
                null,

            company:
                workbookData.workbook
                    ?.company ||
                null,

            category:
                workbookData.workbook
                    ?.category ||
                null,
        },

        worksheets:
            Object.values(
                workbookData.worksheets ||
                {}
            ).map(
                (worksheet) => ({
                    sheet_name:
                        worksheet.sheet_name,

                    state:
                        worksheet.state,

                    row_count:
                        worksheet.row_count,

                    column_count:
                        worksheet.column_count,

                    merged_range_count:
                        worksheet
                            .merged_range_count,

                    rows:
                        worksheet.rows,
                })
            ),
    };

    const canonicalJson =
        JSON.stringify(
            createCanonicalValue(
                fingerprintSource
            )
        );

    return crypto
        .createHash("sha256")
        .update(
            canonicalJson,
            "utf8"
        )
        .digest("hex");
}

function buildWorkbookMetadata(
    workbookData
) {
    if (!workbookData) {
        throw new Error(
            "Workbook data is required."
        );
    }

    const worksheets =
        Object.values(
            workbookData.worksheets ||
            {}
        );

    const totalRows =
        worksheets.reduce(
            (
                total,
                worksheet
            ) =>
                total +
                Number(
                    worksheet.row_count ||
                    0
                ),
            0
        );

    const totalColumns =
        worksheets.reduce(
            (
                total,
                worksheet
            ) =>
                total +
                Number(
                    worksheet.column_count ||
                    0
                ),
            0
        );

    const hiddenWorksheets =
        worksheets.filter(
            (worksheet) =>
                worksheet.state !==
                "visible"
        );

    const fingerprint =
        createWorkbookFingerprint(
            workbookData
        );

    return {
        source: {
            file_path:
                workbookData.source
                    ?.file_path ||
                null,

            file_name:
                workbookData.source
                    ?.file_name ||
                null,

            file_extension:
                workbookData.source
                    ?.file_extension ||
                null,

            file_size_bytes:
                workbookData.source
                    ?.file_size_bytes ||
                0,

            last_modified_at:
                workbookData.source
                    ?.last_modified_at ||
                null,
        },

        document: {
            title:
                workbookData.workbook
                    ?.title ||
                null,

            subject:
                workbookData.workbook
                    ?.subject ||
                null,

            description:
                workbookData.workbook
                    ?.description ||
                null,

            category:
                workbookData.workbook
                    ?.category ||
                null,

            keywords:
                workbookData.workbook
                    ?.keywords ||
                null,

            creator:
                workbookData.workbook
                    ?.creator ||
                null,

            last_modified_by:
                workbookData.workbook
                    ?.last_modified_by ||
                null,

            company:
                workbookData.workbook
                    ?.company ||
                null,

            manager:
                workbookData.workbook
                    ?.manager ||
                null,

            created_at:
                workbookData.workbook
                    ?.created_at ||
                null,

            modified_at:
                workbookData.workbook
                    ?.modified_at ||
                null,
        },

        workbook: {
            worksheet_count:
                worksheets.length,

            visible_worksheet_count:
                worksheets.length -
                hiddenWorksheets.length,

            hidden_worksheet_count:
                hiddenWorksheets.length,

            worksheet_names:
                worksheets.map(
                    (worksheet) =>
                        worksheet.sheet_name
                ),

            hidden_worksheet_names:
                hiddenWorksheets.map(
                    (worksheet) =>
                        worksheet.sheet_name
                ),

            total_row_count:
                totalRows,

            total_column_count:
                totalColumns,

            calculation_mode:
                workbookData.workbook
                    ?.calc_mode ||
                null,
        },

        engine: {
            name:
                workbookData.runtime
                    ?.engine ||
                "EIOS Enterprise Workbook Engine",

            version:
                workbookData.runtime
                    ?.engine_version ||
                "1.0.0",

            library:
                workbookData.runtime
                    ?.library ||
                "exceljs",
        },

        integrity: {
            fingerprint_algorithm:
                "SHA-256",

            workbook_fingerprint:
                fingerprint,
        },
    };
}

module.exports = {
    createWorkbookFingerprint,
    buildWorkbookMetadata,
};