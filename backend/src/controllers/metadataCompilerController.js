const {
    compileForPreview,
    compileForPublication,
} = require(
    "../services/metadataCompiler"
);

exports.compilePreview = async (
    req,
    res
) => {
    try {
        const { surveyId } = req.params;

        const result =
            await compileForPreview(
                surveyId
            );

        return res.json({
            success: true,
            message:
                "Survey metadata compiled successfully for preview.",
            data: result,
        });
    } catch (error) {
        console.error(
            "METADATA PREVIEW COMPILATION ERROR:",
            error
        );

        return res
            .status(
                error.statusCode || 500
            )
            .json({
                success: false,
                message:
                    error.message ||
                    "Unable to compile survey metadata.",
                code:
                    error.code || null,
                validation:
                    error.validationReport ||
                    null,
            });
    }
};

exports.compilePublication = async (
    req,
    res
) => {
    try {
        const { surveyId } = req.params;

        const result =
            await compileForPublication(
                surveyId
            );

        return res.json({
            success: true,
            message:
                "Survey metadata is valid and ready for publication.",
            data: result,
        });
    } catch (error) {
        console.error(
            "METADATA PUBLICATION COMPILATION ERROR:",
            error
        );

        return res
            .status(
                error.statusCode || 500
            )
            .json({
                success: false,
                message:
                    error.message ||
                    "Unable to compile survey metadata for publication.",
                code:
                    error.code || null,
                validation:
                    error.validationReport ||
                    null,
            });
    }
};