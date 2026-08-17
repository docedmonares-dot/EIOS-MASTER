const {
    readSurveyMetadata,
} = require("./metadataReader");

const {
    resolveSurveyReferences,
} = require("./referenceResolver");

const {
    compileValidationReport,
} = require("./validationCompiler");

const {
    buildCompiledPackage,
} = require("./packageBuilder");

const {
    generateSchemaHash,
} = require("./schemaHasher");

/**
 * Compiles the current editable survey metadata into
 * a normalized, renderer-ready EIOS form package.
 *
 * This function does not publish or persist a version yet.
 * It produces an in-memory draft compilation result.
 */
async function compileSurveyMetadata(
    surveyId,
    options = {}
) {
    if (!surveyId) {
        throw new Error(
            "Survey ID is required."
        );
    }

    const {
        allowInvalid = true,
    } = options;

    const rawMetadata =
        await readSurveyMetadata(
            surveyId
        );

    if (!rawMetadata.survey) {
        const error = new Error(
            "Survey project was not found."
        );

        error.statusCode = 404;
        error.code = "SURVEY_NOT_FOUND";

        throw error;
    }

    const resolvedMetadata =
        resolveSurveyReferences(
            rawMetadata
        );

    const validationReport =
        compileValidationReport(
            resolvedMetadata
        );

    if (
        !allowInvalid &&
        !validationReport.valid
    ) {
        const error = new Error(
            "Survey metadata failed compilation validation."
        );

        error.statusCode = 422;
        error.code =
            "COMPILATION_VALIDATION_FAILED";
        error.validationReport =
            validationReport;

        throw error;
    }

    /*
     * Build once without the schema hash so the hash
     * is generated from the actual compiled structure.
     */
    const packageWithoutHash =
        buildCompiledPackage({
            metadata:
                resolvedMetadata,
            validationReport,
            schemaHash: null,
        });

    /*
     * Volatile compiler timestamps must not affect
     * the deterministic schema hash.
     */
    const hashSource = {
        ...packageWithoutHash,

        compiler: {
            ...packageWithoutHash.compiler,
            compiled_at: null,
        },

        manifest: {
            ...packageWithoutHash.manifest,
            schema_hash: null,
        },
    };

    const schemaHash =
        generateSchemaHash(
            hashSource
        );

    const compiledPackage =
        buildCompiledPackage({
            metadata:
                resolvedMetadata,
            validationReport,
            schemaHash,
        });

    return {
        success: true,

        compiler: {
            name:
                "EIOS Metadata Compiler",
            version: "1.0.0",
        },

        validation:
            validationReport,

        package:
            compiledPackage,
    };
}

/**
 * Strict compilation intended for publication.
 * Invalid instruments are rejected.
 */
async function compileForPublication(
    surveyId
) {
    return compileSurveyMetadata(
        surveyId,
        {
            allowInvalid: false,
        }
    );
}

/**
 * Permissive compilation intended for designer
 * previews and validation diagnostics.
 */
async function compileForPreview(
    surveyId
) {
    return compileSurveyMetadata(
        surveyId,
        {
            allowInvalid: true,
        }
    );
}

module.exports = {
    compileSurveyMetadata,
    compileForPreview,
    compileForPublication,
};