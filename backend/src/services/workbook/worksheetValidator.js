function createValidationIssue({
    code,
    severity = "error",
    message,
    worksheetName = null,
    rowNumber = null,
    columnNumber = null,
    metadata = {},
}) {
    return {
        code,
        severity,
        message,
        worksheet_name:
            worksheetName,
        row_number:
            rowNumber,
        column_number:
            columnNumber,
        metadata,
    };
}

function normalizeText(value) {
    return String(
        value ?? ""
    )
        .replace(/\r?\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeForMatch(value) {
    return normalizeText(value)
        .toLowerCase();
}

function validateWorkbookStructure({
    workbookData,
    requiredWorksheets = [],
}) {
    if (!workbookData) {
        throw new Error(
            "Workbook data is required."
        );
    }

    const issues = [];

    const worksheetNames =
        workbookData.workbook
            ?.worksheet_names ||
        [];

    requiredWorksheets.forEach(
        (worksheetName) => {
            if (
                !worksheetNames.includes(
                    worksheetName
                )
            ) {
                issues.push(
                    createValidationIssue({
                        code:
                            "WORKSHEET_REQUIRED",
                        message:
                            `Required worksheet "${worksheetName}" is missing.`,
                        worksheetName,
                    })
                );
            }
        }
    );

    const errors =
        issues.filter(
            (issue) =>
                issue.severity ===
                "error"
        );

    const warnings =
        issues.filter(
            (issue) =>
                issue.severity ===
                "warning"
        );

    return {
        valid:
            errors.length === 0,

        errors,
        warnings,

        summary: {
            worksheet_count:
                worksheetNames.length,

            required_worksheet_count:
                requiredWorksheets.length,

            error_count:
                errors.length,

            warning_count:
                warnings.length,
        },
    };
}

function validateWorksheetHeaders({
    worksheet,
    requiredHeaders = [],
    headerRowNumber = 1,
    allowPartialMatch = true,
}) {
    if (!worksheet) {
        throw new Error(
            "Worksheet is required."
        );
    }

    const issues = [];

    const rows =
        Array.isArray(
            worksheet.rows
        )
            ? worksheet.rows
            : [];

    const rowIndex =
        Math.max(
            Number(
                headerRowNumber
            ) - 1,
            0
        );

    const headerRow =
        rows[rowIndex] || [];

    const normalizedHeaders =
        headerRow.map(
            normalizeForMatch
        );

    requiredHeaders.forEach(
        (requiredHeader) => {
            const normalizedRequired =
                normalizeForMatch(
                    requiredHeader
                );

            const found =
                normalizedHeaders.some(
                    (header) => {
                        if (
                            allowPartialMatch
                        ) {
                            return (
                                header ===
                                    normalizedRequired ||
                                header.startsWith(
                                    normalizedRequired
                                )
                            );
                        }

                        return (
                            header ===
                            normalizedRequired
                        );
                    }
                );

            if (!found) {
                issues.push(
                    createValidationIssue({
                        code:
                            "WORKSHEET_HEADER_REQUIRED",
                        message:
                            `Required header "${requiredHeader}" is missing.`,
                        worksheetName:
                            worksheet.sheet_name,
                        rowNumber:
                            headerRowNumber,
                        metadata: {
                            required_header:
                                requiredHeader,
                        },
                    })
                );
            }
        }
    );

    const errors =
        issues.filter(
            (issue) =>
                issue.severity ===
                "error"
        );

    return {
        valid:
            errors.length === 0,

        errors,

        warnings:
            issues.filter(
                (issue) =>
                    issue.severity ===
                    "warning"
            ),

        summary: {
            header_count:
                headerRow.length,

            required_header_count:
                requiredHeaders.length,

            error_count:
                errors.length,
        },

        normalized_headers:
            normalizedHeaders,
    };
}

function validateWorksheetRows({
    worksheet,
    minimumDataRows = 1,
    headerRowNumber = 1,
}) {
    if (!worksheet) {
        throw new Error(
            "Worksheet is required."
        );
    }

    const rows =
        Array.isArray(
            worksheet.rows
        )
            ? worksheet.rows
            : [];

    const dataRowCount =
        Math.max(
            rows.length -
                Number(
                    headerRowNumber
                ),
            0
        );

    const issues = [];

    if (
        dataRowCount <
        minimumDataRows
    ) {
        issues.push(
            createValidationIssue({
                code:
                    "WORKSHEET_DATA_ROWS_INSUFFICIENT",
                message:
                    `Worksheet "${worksheet.sheet_name}" contains ${dataRowCount} data rows; at least ${minimumDataRows} are required.`,
                worksheetName:
                    worksheet.sheet_name,
                metadata: {
                    data_row_count:
                        dataRowCount,

                    minimum_data_rows:
                        minimumDataRows,
                },
            })
        );
    }

    const errors =
        issues.filter(
            (issue) =>
                issue.severity ===
                "error"
        );

    return {
        valid:
            errors.length === 0,

        errors,

        warnings:
            issues.filter(
                (issue) =>
                    issue.severity ===
                    "warning"
            ),

        summary: {
            total_row_count:
                rows.length,

            header_row_number:
                headerRowNumber,

            data_row_count:
                dataRowCount,

            minimum_data_rows:
                minimumDataRows,

            error_count:
                errors.length,
        },
    };
}

function combineValidationReports(
    reports = []
) {
    const validReports =
        reports.filter(Boolean);

    const errors =
        validReports.flatMap(
            (report) =>
                report.errors || []
        );

    const warnings =
        validReports.flatMap(
            (report) =>
                report.warnings || []
        );

    return {
        valid:
            errors.length === 0,

        errors,
        warnings,

        summary: {
            report_count:
                validReports.length,

            error_count:
                errors.length,

            warning_count:
                warnings.length,
        },

        reports:
            validReports,
    };
}

module.exports = {
    createValidationIssue,
    validateWorkbookStructure,
    validateWorksheetHeaders,
    validateWorksheetRows,
    combineValidationReports,
};