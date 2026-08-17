const REQUIRED_WORKSHEETS = [
    "Metadata",
    "National Summary",
    "Prov Sum",
    "PSGC",
    "Notes",
    "Coding Structure",
];

const REQUIRED_PSGC_COLUMNS = [
    "10-digit PSGC",
    "Name",
    "Correspondence Code",
    "Geographic Level",
    "Old names",
    "City Class",
    "Income Classification",
    "Urban / Rural",
    "2024 Population",
    "Status",
];

const ALLOWED_GEOGRAPHIC_LEVELS = new Set([
    "Reg",
    "Prov",
    "City",
    "Mun",
    "Bgy",
    "SubMun",
]);

function normalizeHeader(value) {
    return String(value ?? "")
        .replace(/\r?\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeHeaderForMatch(value) {
    return normalizeHeader(value)
        .replace(/\([^)]*\)/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function createIssue({
    code,
    severity = "error",
    message,
    sheetName = null,
    rowNumber = null,
    columnName = null,
    value = null,
    metadata = {},
}) {
    return {
        code,
        severity,
        message,
        sheet_name: sheetName,
        row_number: rowNumber,
        column_name: columnName,
        value,
        metadata,
    };
}

function findHeaderIndex(headers, requiredColumn) {
    const requiredNormalized =
        normalizeHeaderForMatch(requiredColumn);

    return headers.findIndex((header) => {
        const normalizedHeader =
            normalizeHeaderForMatch(header);

        return (
            normalizedHeader === requiredNormalized ||
            normalizedHeader.startsWith(
                requiredNormalized
            )
        );
    });
}

function buildColumnIndex(headers) {
    return REQUIRED_PSGC_COLUMNS.reduce(
        (columnIndex, columnName) => {
            columnIndex[columnName] =
                findHeaderIndex(
                    headers,
                    columnName
                );

            return columnIndex;
        },
        {}
    );
}

function validateRequiredWorksheets(
    workbookData,
    issues
) {
    const availableSheets =
        workbookData?.workbook?.sheet_names ||
        [];

    REQUIRED_WORKSHEETS.forEach(
        (sheetName) => {
            if (
                !availableSheets.includes(
                    sheetName
                )
            ) {
                issues.push(
                    createIssue({
                        code:
                            "PSGC_REQUIRED_WORKSHEET_MISSING",
                        message:
                            `Required worksheet "${sheetName}" is missing.`,
                        sheetName,
                    })
                );
            }
        }
    );

    const duplicateSheetNames =
        availableSheets.filter(
            (sheetName, index) =>
                availableSheets.indexOf(
                    sheetName
                ) !== index
        );

    [
        ...new Set(
            duplicateSheetNames
        ),
    ].forEach((sheetName) => {
        issues.push(
            createIssue({
                code:
                    "PSGC_DUPLICATE_WORKSHEET_NAME",
                message:
                    `Worksheet name "${sheetName}" appears more than once.`,
                sheetName,
            })
        );
    });
}

function validatePsgcHeaders(
    psgcSheet,
    issues
) {
    if (!psgcSheet) {
        return null;
    }

    const rows =
        psgcSheet.rows || [];

    if (rows.length === 0) {
        issues.push(
            createIssue({
                code:
                    "PSGC_WORKSHEET_EMPTY",
                message:
                    'The "PSGC" worksheet contains no rows.',
                sheetName: "PSGC",
            })
        );

        return null;
    }

    const headers =
        rows[0].map(normalizeHeader);

    const columnIndex =
        buildColumnIndex(headers);

    REQUIRED_PSGC_COLUMNS.forEach(
        (columnName) => {
            if (
                columnIndex[
                    columnName
                ] === -1
            ) {
                issues.push(
                    createIssue({
                        code:
                            "PSGC_REQUIRED_COLUMN_MISSING",
                        message:
                            `Required PSGC column "${columnName}" is missing.`,
                        sheetName: "PSGC",
                        rowNumber: 1,
                        columnName,
                    })
                );
            }
        }
    );

    return {
        headers,
        columnIndex,
    };
}

function readCell(
    row,
    columnIndex,
    columnName
) {
    const index =
        columnIndex[columnName];

    if (
        index === undefined ||
        index < 0
    ) {
        return null;
    }

    return row[index] ?? null;
}

function normalizePsgcCode(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/\.0$/, "")
        .trim();
}

function validatePsgcRows({
    psgcSheet,
    columnIndex,
    issues,
}) {
    const rows =
        psgcSheet.rows || [];

    const seenCodes = new Map();

    rows.slice(1).forEach(
        (row, rowOffset) => {
            const rowNumber =
                rowOffset + 2;

            const psgcCode =
                normalizePsgcCode(
                    readCell(
                        row,
                        columnIndex,
                        "10-digit PSGC"
                    )
                );

            const name = String(
                readCell(
                    row,
                    columnIndex,
                    "Name"
                ) ?? ""
            ).trim();

            const geographicLevel =
                String(
                    readCell(
                        row,
                        columnIndex,
                        "Geographic Level"
                    ) ?? ""
                ).trim();

            if (!psgcCode) {
                issues.push(
                    createIssue({
                        code:
                            "PSGC_CODE_REQUIRED",
                        message:
                            "A PSGC record has no 10-digit PSGC code.",
                        sheetName: "PSGC",
                        rowNumber,
                        columnName:
                            "10-digit PSGC",
                    })
                );
            } else {
                if (
                    !/^\d{10}$/.test(
                        psgcCode
                    )
                ) {
                    issues.push(
                        createIssue({
                            code:
                                "PSGC_CODE_FORMAT_INVALID",
                            message:
                                `PSGC code "${psgcCode}" must contain exactly 10 digits.`,
                            sheetName:
                                "PSGC",
                            rowNumber,
                            columnName:
                                "10-digit PSGC",
                            value:
                                psgcCode,
                        })
                    );
                }

                if (
                    seenCodes.has(
                        psgcCode
                    )
                ) {
                    issues.push(
                        createIssue({
                            code:
                                "PSGC_CODE_DUPLICATE",
                            message:
                                `PSGC code "${psgcCode}" appears more than once.`,
                            sheetName:
                                "PSGC",
                            rowNumber,
                            columnName:
                                "10-digit PSGC",
                            value:
                                psgcCode,
                            metadata: {
                                first_row_number:
                                    seenCodes.get(
                                        psgcCode
                                    ),
                            },
                        })
                    );
                } else {
                    seenCodes.set(
                        psgcCode,
                        rowNumber
                    );
                }
            }

            if (!name) {
                issues.push(
                    createIssue({
                        code:
                            "PSGC_NAME_REQUIRED",
                        message:
                            "A PSGC record has no official name.",
                        sheetName: "PSGC",
                        rowNumber,
                        columnName: "Name",
                    })
                );
            }

const isSpecialAdministrativeContainer =
    (
        psgcCode === "0990100000" &&
        name
            .toLowerCase()
            .includes("not a province")
    ) ||
    (
        psgcCode === "1999900000" &&
        name
            .toLowerCase()
            .includes(
                "special geographic area"
            )
    );

if (
    !geographicLevel &&
    !isSpecialAdministrativeContainer
) {
    issues.push(
        createIssue({
            code:
                "PSGC_GEOGRAPHIC_LEVEL_REQUIRED",
            message:
                "A PSGC record has no geographic level.",
            sheetName: "PSGC",
            rowNumber,
            columnName:
                "Geographic Level",
        })
    );
} else if (
    !geographicLevel &&
    isSpecialAdministrativeContainer
) {
    issues.push(
        createIssue({
            code:
                "PSGC_SPECIAL_ADMINISTRATIVE_CONTAINER",
            severity: "warning",
            message:
                `"${name}" is a recognized special administrative container without a standard PSGC geographic level.`,
            sheetName: "PSGC",
            rowNumber,
            columnName:
                "Geographic Level",
            value: psgcCode,
        })
    );
} else if (
    !ALLOWED_GEOGRAPHIC_LEVELS.has(
        geographicLevel
    )
) {
                issues.push(
                    createIssue({
                        code:
                            "PSGC_GEOGRAPHIC_LEVEL_UNKNOWN",
                        severity:
                            "warning",
                        message:
                            `Geographic level "${geographicLevel}" is not currently recognized by the importer.`,
                        sheetName: "PSGC",
                        rowNumber,
                        columnName:
                            "Geographic Level",
                        value:
                            geographicLevel,
                    })
                );
            }
        }
    );

    return {
        data_row_count:
            Math.max(
                rows.length - 1,
                0
            ),
        unique_psgc_code_count:
            seenCodes.size,
    };
}

function validatePsgcWorkbook(
    workbookData
) {
    if (!workbookData) {
        throw new Error(
            "PSGC workbook data is required for validation."
        );
    }

    const issues = [];

    validateRequiredWorksheets(
        workbookData,
        issues
    );

    const headerResult =
        validatePsgcHeaders(
            workbookData.psgc_sheet,
            issues
        );

    let rowSummary = {
        data_row_count: 0,
        unique_psgc_code_count: 0,
    };

    if (
        workbookData.psgc_sheet &&
        headerResult &&
        !Object.values(
            headerResult.columnIndex
        ).includes(-1)
    ) {
        rowSummary =
            validatePsgcRows({
                psgcSheet:
                    workbookData.psgc_sheet,
                columnIndex:
                    headerResult.columnIndex,
                issues,
            });
    }

    const errors = issues.filter(
        (issue) =>
            issue.severity === "error"
    );

    const warnings = issues.filter(
        (issue) =>
            issue.severity === "warning"
    );

    return {
        valid:
            errors.length === 0,

        errors,
        warnings,

        summary: {
            workbook_sheet_count:
                workbookData.workbook
                    ?.sheet_count || 0,

            required_sheet_count:
                REQUIRED_WORKSHEETS.length,

            psgc_data_row_count:
                rowSummary.data_row_count,

            unique_psgc_code_count:
                rowSummary
                    .unique_psgc_code_count,

            error_count:
                errors.length,

            warning_count:
                warnings.length,
        },

        schema: headerResult
            ? {
                headers:
                    headerResult.headers,

                column_index:
                    headerResult.columnIndex,
            }
            : null,
    };
}

module.exports = {
    REQUIRED_WORKSHEETS,
    REQUIRED_PSGC_COLUMNS,
    ALLOWED_GEOGRAPHIC_LEVELS,
    validatePsgcWorkbook,
};