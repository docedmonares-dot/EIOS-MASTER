const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const pool = require("./src/config/database");
const { buildSurveyExport } = require("./src/services/surveyDataExportService");

async function run() {
    const surveyResult = await pool.query(
        `SELECT survey_id FROM survey_responses
         GROUP BY survey_id ORDER BY MAX(submitted_at) DESC LIMIT 1`
    );
    assert(surveyResult.rows[0]?.survey_id, "A synchronized survey response is required for the export contract test.");

    const data = await buildSurveyExport(surveyResult.rows[0].survey_id);
    assert(data.rows.length > 0, "Export must contain response rows.");
    assert(data.columns.some((column) => column.name === "respondent_code"), "Export must include governed respondent metadata.");

    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "eios-export-test-"));
    const source = path.join(directory, "data.json");
    const target = path.join(directory, "data.sav");
    fs.writeFileSync(source, JSON.stringify(data), "utf8");

    const python = path.join(__dirname, ".venv/Scripts/python.exe");
    execFileSync(python, [path.join(__dirname, "scripts/write-spss-sav.py"), source, target]);
    assert(fs.statSync(target).size > 0, "SPSS .sav export must be generated.");
    execFileSync(python, ["-c", "import pyreadstat,sys; df,meta=pyreadstat.read_sav(sys.argv[1]); assert len(df)>0", target]);

    fs.rmSync(directory, { recursive: true, force: true });
    console.log("Excel/SPSS data export contract passed.");
}

run()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
