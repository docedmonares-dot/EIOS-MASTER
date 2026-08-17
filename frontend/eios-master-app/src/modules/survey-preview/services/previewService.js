import {
  compileSurveyPreview,
} from "../../../services/metadataCompilerService";

/**
 * Loads the compiled form package used by the Preview Engine.
 *
 * The Preview Engine must never read raw survey design tables
 * directly. It consumes only the Metadata Compiler output.
 */
export async function getCompiledSurveyPreview(
  surveyId
) {
  if (!surveyId) {
    throw new Error(
      "Survey ID is required."
    );
  }

  const compilationResult =
    await compileSurveyPreview(
      surveyId
    );

  const compiledPackage =
    compilationResult?.package ||
    null;

  if (!compiledPackage) {
    throw new Error(
      "The Metadata Compiler did not return a compiled form package."
    );
  }

  return {
    compiler:
      compilationResult?.compiler ||
      compiledPackage.compiler ||
      null,

    validation:
      compilationResult?.validation ||
      compiledPackage.validation ||
      null,

    package:
      compiledPackage,
  };
}