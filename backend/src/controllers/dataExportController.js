const ExcelJS = require("exceljs");
const fs = require("fs/promises");
const fsSync = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const { buildSurveyExport } = require("../services/surveyDataExportService");

const execFileAsync = promisify(execFile);

function fileStem(exportData) {
    return String(exportData.survey?.survey_code || "eios-survey")
        .replace(/[^A-Za-z0-9_-]/g, "_")
        .slice(0, 80);
}

exports.exportExcel = async (req, res) => {
    try {
        const exportData = await buildSurveyExport(req.params.surveyId);
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "EIOS Enterprise Platform";
        workbook.subject = "Governed survey data export";

        const dataSheet = workbook.addWorksheet("Data", { views: [{ state: "frozen", ySplit: 1 }] });
        dataSheet.columns = exportData.columns.map((column) => ({
            header: column.name,
            key: column.name,
            width: Math.min(Math.max(column.name.length + 2, 14), 40),
        }));
        exportData.rows.forEach((row) => dataSheet.addRow(row));
        dataSheet.getRow(1).font = { bold: true };
        dataSheet.autoFilter = { from: "A1", to: dataSheet.getRow(1).getCell(exportData.columns.length).address };

        const codebook = workbook.addWorksheet("Codebook");
        codebook.columns = [
            { header: "Variable", key: "variable", width: 34 },
            { header: "Variable Label", key: "label", width: 72 },
            { header: "Value Labels", key: "values", width: 72 },
        ];
        exportData.columns.forEach((column) => codebook.addRow({
            variable: column.name,
            label: column.label,
            values: column.valueLabels
                ? Object.entries(column.valueLabels).map(([value, label]) => `${value} = ${label}`).join("; ")
                : "",
        }));
        codebook.getRow(1).font = { bold: true };

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${fileStem(exportData)}.xlsx"`);
        return res.send(Buffer.from(buffer));
    } catch (error) {
        console.error("EXCEL EXPORT ERROR:", error);
        return res.status(error.status || 500).json({ success: false, message: error.message || "Unable to export Excel data." });
    }
};

exports.exportSpss = async (req, res) => {
    let temporaryDirectory = null;
    try {
        const exportData = await buildSurveyExport(req.params.surveyId);
        if (exportData.rows.length === 0) {
            return res.status(409).json({ success: false, message: "This survey has no synchronized responses to export." });
        }

        temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "eios-spss-"));
        const sourcePath = path.join(temporaryDirectory, "export.json");
        const outputPath = path.join(temporaryDirectory, `${fileStem(exportData)}.sav`);
        await fs.writeFile(sourcePath, JSON.stringify(exportData, (_key, value) => value instanceof Date ? value.toISOString() : value), "utf8");
        const localPython = path.join(__dirname, "../../.venv/Scripts/python.exe");
        const pythonExecutable = process.env.PYTHON_EXECUTABLE ||
            (fsSync.existsSync(localPython) ? localPython : "python");
        await execFileAsync(
            pythonExecutable,
            [path.join(__dirname, "../../scripts/write-spss-sav.py"), sourcePath, outputPath],
            { windowsHide: true, timeout: 120000 }
        );

        return res.download(outputPath, path.basename(outputPath), async () => {
            await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
        });
    } catch (error) {
        if (temporaryDirectory) await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
        console.error("SPSS EXPORT ERROR:", error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.code === "ENOENT"
                ? "The SPSS export runtime is unavailable. Install backend/requirements-export.txt and configure PYTHON_EXECUTABLE."
                : error.message || "Unable to export SPSS data."
        });
    }
};
