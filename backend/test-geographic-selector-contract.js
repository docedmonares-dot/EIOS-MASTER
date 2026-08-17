const assert = require("node:assert/strict");

const {
    buildCompiledPackage,
} = require("./src/services/metadataCompiler/packageBuilder");

const geographicType = {
    question_type_id: "type-geographic",
    type_code: "GEOGRAPHIC_SELECTOR",
    type_name: "Geographic Selector",
    category_group: "Location and Media",
    response_data_type: "json",
    renderer_component: "GeographicSelectorRenderer",
    preview_component: "GeographicSelectorPreview",
    supports_validation: true,
    supports_logic: true,
    supports_offline: true,
    default_settings_json: {
        country_code: "PH",
    },
    renderer_metadata_json: {
        answer_schema: "eios.geographic-selection.v1",
    },
};

const compiled = buildCompiledPackage({
    metadata: {
        survey: {
            survey_id: "survey-1",
            survey_code: "GEO_TEST",
            survey_name: "Geographic Test",
        },
        sections: [],
        resolvedItems: [
            {
                questionnaire_item_id: "item-any-id",
                item_source: "Survey Local",
                section_id: null,
                question_type: geographicType,
                question: {
                    local_question_id: "local-any-id",
                    question_code: "LOCATION_HOME",
                    variable_name: "home_location",
                    question_text: "Select home location",
                    question_type_id: "type-geographic",
                    required_flag: true,
                },
            },
        ],
    },
    validationReport: {
        valid: true,
        errors: [],
        warnings: [],
        summary: {},
    },
});

const question = compiled.sections[0].questions[0];

assert.equal(question.question_code, "LOCATION_HOME");
assert.equal(question.question_type.type_code, "GEOGRAPHIC_SELECTOR");
assert.equal(question.runtime.type_code, "GEOGRAPHIC_SELECTOR");
assert.equal(
    question.runtime.renderer_metadata.answer_schema,
    "eios.geographic-selection.v1"
);
assert.equal(compiled.indexes.variables.home_location.question_type, "GEOGRAPHIC_SELECTOR");
assert.equal(compiled.manifest.offline_ready, true);

console.log("Geographic selector compiler contract passed.");
