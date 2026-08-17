const {
    SUPPORTED_EXTENSIONS,
    normalizeCellValue,
    worksheetToMatrix,
    readWorksheetSummary,
    openWorkbook,
} = require("./workbookEngine");

const {
    getWorksheet,
    requireWorksheet,
    getWorksheetRows,
    getWorksheetHeaderRow,
    readWorksheetRange,
    findHeaderRow,
} = require("./worksheetReader");

const {
    createValidationIssue,
    validateWorkbookStructure,
    validateWorksheetHeaders,
    validateWorksheetRows,
    combineValidationReports,
} = require("./worksheetValidator");

const {
    createWorkbookFingerprint,
    buildWorkbookMetadata,
} = require("./workbookMetadata");

module.exports = {
    SUPPORTED_EXTENSIONS,

    normalizeCellValue,
    worksheetToMatrix,
    readWorksheetSummary,
    openWorkbook,

    getWorksheet,
    requireWorksheet,
    getWorksheetRows,
    getWorksheetHeaderRow,
    readWorksheetRange,
    findHeaderRow,

    createValidationIssue,
    validateWorkbookStructure,
    validateWorksheetHeaders,
    validateWorksheetRows,
    combineValidationReports,

    createWorkbookFingerprint,
    buildWorkbookMetadata,
};