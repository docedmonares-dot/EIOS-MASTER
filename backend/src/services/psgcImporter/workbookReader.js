const {
    openWorkbook,
    buildWorkbookMetadata,
} = require("../workbook");

const REQUIRED_SHEET_NAME = "PSGC";

/**
 * Reads the official PSA PSGC workbook through the
 * EIOS Enterprise Workbook Engine.
 *
 * This adapter preserves the data contract expected by
 * the existing PSGC validator and parser.
 */
async function readPsgcWorkbook(filePath) {
    const enterpriseWorkbook =
        await openWorkbook(filePath);

    const sheetNames =
        enterpriseWorkbook.workbook
            ?.worksheet_names || [];

    if (
        !sheetNames.includes(
            REQUIRED_SHEET_NAME
        )
    ) {
        const error = new Error(
            `Required worksheet "${REQUIRED_SHEET_NAME}" was not found.`
        );

        error.code =
            "PSGC_WORKSHEET_MISSING";

        error.statusCode = 422;

        error.availableSheets =
            sheetNames;

        throw error;
    }

    const workbookMetadata =
        buildWorkbookMetadata(
            enterpriseWorkbook
        );

    return {
        source: {
            ...enterpriseWorkbook.source,

            workbook_fingerprint:
                workbookMetadata.integrity
                    ?.workbook_fingerprint ||
                null,
        },

        workbook: {
            sheet_names:
                sheetNames,

            sheet_count:
                enterpriseWorkbook.workbook
                    ?.worksheet_count || 0,

            creator:
                enterpriseWorkbook.workbook
                    ?.creator || null,

            title:
                enterpriseWorkbook.workbook
                    ?.title || null,

            subject:
                enterpriseWorkbook.workbook
                    ?.subject || null,

            company:
                enterpriseWorkbook.workbook
                    ?.company || null,

            created_at:
                enterpriseWorkbook.workbook
                    ?.created_at || null,

            modified_at:
                enterpriseWorkbook.workbook
                    ?.modified_at || null,
        },

        worksheets:
            enterpriseWorkbook.worksheets ||
            {},

        psgc_sheet:
            enterpriseWorkbook.worksheets?.[
                REQUIRED_SHEET_NAME
            ] || null,

        metadata:
            workbookMetadata,

        runtime: {
            adapter:
                "EIOS PSGC Workbook Adapter",

            adapter_version:
                "1.0.0",

            workbook_engine:
                enterpriseWorkbook.runtime
                    ?.engine ||
                "EIOS Enterprise Workbook Engine",

            workbook_engine_version:
                enterpriseWorkbook.runtime
                    ?.engine_version ||
                "1.0.0",

            library:
                enterpriseWorkbook.runtime
                    ?.library ||
                "exceljs",
        },
    };
}

module.exports = {
    REQUIRED_SHEET_NAME,
    readPsgcWorkbook,
};