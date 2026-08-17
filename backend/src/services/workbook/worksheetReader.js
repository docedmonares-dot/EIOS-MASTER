function getWorksheet(
    workbookData,
    worksheetName
) {
    if (!workbookData) {
        throw new Error(
            "Workbook data is required."
        );
    }

    if (!worksheetName) {
        throw new Error(
            "Worksheet name is required."
        );
    }

    return (
        workbookData.worksheets?.[
            worksheetName
        ] || null
    );
}

function requireWorksheet(
    workbookData,
    worksheetName
) {
    const worksheet =
        getWorksheet(
            workbookData,
            worksheetName
        );

    if (!worksheet) {
        const error = new Error(
            `Worksheet "${worksheetName}" was not found.`
        );

        error.code =
            "WORKSHEET_NOT_FOUND";

        error.statusCode = 422;

        error.metadata = {
            worksheet_name:
                worksheetName,

            available_worksheets:
                workbookData?.workbook
                    ?.worksheet_names ||
                [],
        };

        throw error;
    }

    return worksheet;
}

function getWorksheetRows(
    workbookData,
    worksheetName
) {
    const worksheet =
        requireWorksheet(
            workbookData,
            worksheetName
        );

    return Array.isArray(
        worksheet.rows
    )
        ? worksheet.rows
        : [];
}

function getWorksheetHeaderRow(
    workbookData,
    worksheetName,
    rowNumber = 1
) {
    const rows =
        getWorksheetRows(
            workbookData,
            worksheetName
        );

    const index =
        Number(rowNumber) - 1;

    if (
        index < 0 ||
        index >= rows.length
    ) {
        return [];
    }

    return rows[index] || [];
}

function readWorksheetRange({
    workbookData,
    worksheetName,
    startRow = 1,
    endRow = null,
    startColumn = 1,
    endColumn = null,
}) {
    const rows =
        getWorksheetRows(
            workbookData,
            worksheetName
        );

    const normalizedStartRow =
        Math.max(
            Number(startRow) || 1,
            1
        );

    const normalizedEndRow =
        endRow === null
            ? rows.length
            : Math.min(
                Number(endRow) ||
                    rows.length,
                rows.length
            );

    const maximumColumnCount =
        rows.reduce(
            (maximum, row) =>
                Math.max(
                    maximum,
                    row.length
                ),
            0
        );

    const normalizedStartColumn =
        Math.max(
            Number(startColumn) || 1,
            1
        );

    const normalizedEndColumn =
        endColumn === null
            ? maximumColumnCount
            : Math.min(
                Number(endColumn) ||
                    maximumColumnCount,
                maximumColumnCount
            );

    return rows
        .slice(
            normalizedStartRow - 1,
            normalizedEndRow
        )
        .map((row) =>
            row.slice(
                normalizedStartColumn - 1,
                normalizedEndColumn
            )
        );
}

function findHeaderRow({
    workbookData,
    worksheetName,
    requiredHeaders = [],
    maximumRowsToScan = 20,
    normalizeHeader = (value) =>
        String(value ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase(),
}) {
    const rows =
        getWorksheetRows(
            workbookData,
            worksheetName
        );

    const normalizedRequiredHeaders =
        requiredHeaders
            .map(normalizeHeader)
            .filter(Boolean);

    if (
        normalizedRequiredHeaders.length ===
        0
    ) {
        return null;
    }

    const scanLimit =
        Math.min(
            rows.length,
            Math.max(
                Number(
                    maximumRowsToScan
                ) || 20,
                1
            )
        );

    for (
        let rowIndex = 0;
        rowIndex < scanLimit;
        rowIndex += 1
    ) {
        const row =
            rows[rowIndex] || [];

        const normalizedCells =
            row.map(
                normalizeHeader
            );

        const allHeadersFound =
            normalizedRequiredHeaders.every(
                (requiredHeader) =>
                    normalizedCells.some(
                        (cellValue) =>
                            cellValue ===
                                requiredHeader ||
                            cellValue.startsWith(
                                requiredHeader
                            )
                    )
            );

        if (allHeadersFound) {
            return {
                row_number:
                    rowIndex + 1,

                row,

                normalized_row:
                    normalizedCells,
            };
        }
    }

    return null;
}

module.exports = {
    getWorksheet,
    requireWorksheet,
    getWorksheetRows,
    getWorksheetHeaderRow,
    readWorksheetRange,
    findHeaderRow,
};