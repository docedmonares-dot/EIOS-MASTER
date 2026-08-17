const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const SUPPORTED_EXTENSIONS = new Set([
    ".xlsx",
]);

function createWorkbookError({
    message,
    code,
    statusCode = 422,
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

function resolveWorkbookPath(filePath) {
    if (!filePath) {
        throw createWorkbookError({
            message:
                "Workbook file path is required.",
            code:
                "WORKBOOK_FILE_PATH_REQUIRED",
            statusCode: 400,
        });
    }

    const resolvedPath =
        path.resolve(filePath);

    if (!fs.existsSync(resolvedPath)) {
        throw createWorkbookError({
            message:
                `Workbook was not found: ${resolvedPath}`,
            code:
                "WORKBOOK_NOT_FOUND",
            statusCode: 404,
            metadata: {
                file_path:
                    resolvedPath,
            },
        });
    }

    const stats =
        fs.statSync(resolvedPath);

    if (!stats.isFile()) {
        throw createWorkbookError({
            message:
                "The supplied workbook path does not reference a file.",
            code:
                "WORKBOOK_PATH_NOT_FILE",
            metadata: {
                file_path:
                    resolvedPath,
            },
        });
    }

    const extension =
        path.extname(
            resolvedPath
        ).toLowerCase();

    if (
        !SUPPORTED_EXTENSIONS.has(
            extension
        )
    ) {
        throw createWorkbookError({
            message:
                `Unsupported workbook type "${extension || "unknown"}". Only .xlsx is currently supported.`,
            code:
                "WORKBOOK_TYPE_UNSUPPORTED",
            metadata: {
                extension,
                supported_extensions:
                    Array.from(
                        SUPPORTED_EXTENSIONS
                    ),
            },
        });
    }

    return {
        resolvedPath,
        stats,
        extension,
    };
}

function normalizeCellValue(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    if (
        value instanceof Date
    ) {
        return value.toISOString();
    }

    if (
        typeof value === "object"
    ) {
        if (
            Object.prototype.hasOwnProperty.call(
                value,
                "result"
            )
        ) {
            return normalizeCellValue(
                value.result
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(
                value,
                "text"
            )
        ) {
            return normalizeCellValue(
                value.text
            );
        }

        if (
            Array.isArray(
                value.richText
            )
        ) {
            const richTextValue =
                value.richText
                    .map(
                        (part) =>
                            part?.text || ""
                    )
                    .join("")
                    .trim();

            return (
                richTextValue ||
                null
            );
        }

        if (
            value.hyperlink &&
            value.text
        ) {
            return String(
                value.text
            ).trim() || null;
        }

        return value;
    }

    if (
        typeof value === "string"
    ) {
        const normalized =
            value.trim();

        return normalized || null;
    }

    return value;
}

function worksheetToMatrix(
    worksheet,
    {
        includeEmptyRows = false,
        includeEmptyCells = true,
    } = {}
) {
    if (!worksheet) {
        return [];
    }

    const rows = [];

    const maximumColumnCount =
        worksheet.columnCount || 0;

    worksheet.eachRow(
        {
            includeEmpty:
                includeEmptyRows,
        },
        (row) => {
            const rowValues = [];

            const upperColumnBound =
                includeEmptyCells
                    ? maximumColumnCount
                    : row.cellCount;

            for (
                let columnNumber = 1;
                columnNumber <=
                upperColumnBound;
                columnNumber += 1
            ) {
                rowValues.push(
                    normalizeCellValue(
                        row.getCell(
                            columnNumber
                        ).value
                    )
                );
            }

            const hasValue =
                rowValues.some(
                    (value) =>
                        value !== null &&
                        value !== undefined &&
                        String(
                            value
                        ).trim() !== ""
                );

            if (
                includeEmptyRows ||
                hasValue
            ) {
                rows.push(
                    rowValues
                );
            }
        }
    );

    return rows;
}

function readWorksheetSummary(
    worksheet
) {
    const rows =
        worksheetToMatrix(
            worksheet
        );

    return {
        sheet_name:
            worksheet.name,

        state:
            worksheet.state ||
            "visible",

        row_count:
            rows.length,

        column_count:
            rows.reduce(
                (
                    maximum,
                    row
                ) =>
                    Math.max(
                        maximum,
                        row.length
                    ),
                0
            ),

        actual_row_count:
            worksheet.actualRowCount ||
            0,

        actual_column_count:
            worksheet.actualColumnCount ||
            0,

        merged_range_count:
            worksheet.model
                ?.merges
                ?.length || 0,

        rows,
    };
}

/**
 * Opens an Excel workbook through the EIOS Enterprise
 * Workbook Engine.
 *
 * Business modules should use this service instead of
 * requiring ExcelJS directly.
 */
async function openWorkbook(
    filePath,
    options = {}
) {
    const {
        resolvedPath,
        stats,
        extension,
    } = resolveWorkbookPath(
        filePath
    );

    const workbook =
        new ExcelJS.Workbook();

    workbook.creator =
        options.creator ||
        "EIOS Enterprise Workbook Engine";

    try {
        await workbook.xlsx.readFile(
            resolvedPath
        );
    } catch (cause) {
        throw createWorkbookError({
            message:
                `Unable to read workbook: ${cause.message}`,
            code:
                "WORKBOOK_READ_FAILED",
            metadata: {
                file_path:
                    resolvedPath,
            },
            cause,
        });
    }

    const worksheetNames =
        workbook.worksheets.map(
            (worksheet) =>
                worksheet.name
        );

    const worksheets = {};

    workbook.worksheets.forEach(
        (worksheet) => {
            worksheets[
                worksheet.name
            ] =
                readWorksheetSummary(
                    worksheet
                );
        }
    );

    return {
        source: {
            file_path:
                resolvedPath,

            file_name:
                path.basename(
                    resolvedPath
                ),

            file_extension:
                extension,

            file_size_bytes:
                stats.size,

            last_modified_at:
                stats.mtime.toISOString(),
        },

        workbook: {
            worksheet_names:
                worksheetNames,

            worksheet_count:
                worksheetNames.length,

            creator:
                workbook.creator ||
                null,

            last_modified_by:
                workbook.lastModifiedBy ||
                null,

            created_at:
                workbook.created
                    ? new Date(
                        workbook.created
                    ).toISOString()
                    : null,

            modified_at:
                workbook.modified
                    ? new Date(
                        workbook.modified
                    ).toISOString()
                    : null,

            title:
                workbook.title ||
                null,

            subject:
                workbook.subject ||
                null,

            company:
                workbook.company ||
                null,

            manager:
                workbook.manager ||
                null,

            category:
                workbook.category ||
                null,

            description:
                workbook.description ||
                null,

            keywords:
                workbook.keywords ||
                null,

            calc_mode:
                workbook.calcProperties
                    ?.calcMode ||
                null,
        },

        worksheets,

        runtime: {
            engine:
                "EIOS Enterprise Workbook Engine",

            engine_version:
                "1.0.0",

            library:
                "exceljs",
        },
    };
}

module.exports = {
    SUPPORTED_EXTENSIONS,
    normalizeCellValue,
    worksheetToMatrix,
    readWorksheetSummary,
    openWorkbook,
};