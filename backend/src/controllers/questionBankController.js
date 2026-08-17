const pool = require("../config/database");

const ALLOWED_QUESTION_STATUSES = new Set([
  "Active",
  "Inactive",
  "Draft",
  "Archived",
]);

function getAuthenticatedUserId(req) {
  return req.user?.user_id || null;
}

function requireCreateFields(payload) {
  const requiredFields = [
    "question_code",
    "question_text",
    "question_type",
  ];

  const missingFields = requiredFields.filter((fieldName) => {
    const value = payload[fieldName];

    return (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    );
  });

  if (missingFields.length > 0) {
    const error = new Error(
      `Missing required fields: ${missingFields.join(", ")}.`
    );

    error.statusCode = 400;
    throw error;
  }
}

function validateQuestionStatus(questionStatus) {
  if (
    questionStatus !== undefined &&
    questionStatus !== null &&
    !ALLOWED_QUESTION_STATUSES.has(questionStatus)
  ) {
    const error = new Error(
      "Question status must be Active, Inactive, Draft, or Archived."
    );

    error.statusCode = 400;
    throw error;
  }
}

function normalizeJsonValue(value, fallbackValue) {
  if (value === undefined || value === null) {
    return fallbackValue;
  }

  return value;
}

function sendControllerError(res, error, context) {
  console.error(`${context}:`, error);

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message:
        "A Question Bank record already uses the supplied unique value.",
      detail: error.detail,
    });
  }

  if (error.code === "23503") {
    return res.status(400).json({
      success: false,
      message:
        "The supplied Question Type, Category, Choice List, or related identifier does not exist.",
      detail: error.detail,
    });
  }

  if (error.code === "23514") {
    return res.status(400).json({
      success: false,
      message:
        "The Question Bank record violates a database validation rule.",
      detail: error.detail,
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.statusCode && error.statusCode < 500
        ? error.message
        : "An unexpected Question Bank error occurred.",
    error:
      process.env.NODE_ENV === "production"
        ? undefined
        : error.message,
  });
}

/* =========================================================
   ENTERPRISE QUESTION BANK
========================================================= */

exports.getAllQuestions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        q.*,

        c.category_name,
        c.category_code,

        qt.type_code AS question_type_code,
        qt.type_name AS question_type_name,

        qcl.choice_list_code,
        qcl.choice_list_name

      FROM question_bank q

      LEFT JOIN question_categories c
        ON q.question_category_id = c.category_id

      LEFT JOIN question_types qt
        ON q.question_type_id = qt.question_type_id

      LEFT JOIN question_choice_lists qcl
        ON q.choice_list_id = qcl.choice_list_id

      ORDER BY
        q.question_code ASC,
        q.created_at ASC
    `);

    return res.json(result.rows);
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Loading Enterprise Question Bank"
    );
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        q.*,

        c.category_name,
        c.category_code,

        qt.type_code AS question_type_code,
        qt.type_name AS question_type_name,

        qcl.choice_list_code,
        qcl.choice_list_name

      FROM question_bank q

      LEFT JOIN question_categories c
        ON q.question_category_id = c.category_id

      LEFT JOIN question_types qt
        ON q.question_type_id = qt.question_type_id

      LEFT JOIN question_choice_lists qcl
        ON q.choice_list_id = qcl.choice_list_id

      WHERE q.question_id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Enterprise Question not found.",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Loading Enterprise Question"
    );
  }
};

exports.createQuestion = async (req, res) => {
  try {
    requireCreateFields(req.body);
    validateQuestionStatus(req.body.question_status);

    const authenticatedUserId =
      getAuthenticatedUserId(req);

    const {
      question_code,
      question_text,
      question_type,
      question_group = null,
      question_module = null,
      question_category_id = null,
      question_description = null,
      question_status = "Draft",
      required_flag = false,
      options_json = [],
      metadata_json = {},
      question_type_id = null,
      variable_name = null,
      help_text = null,
      placeholder_text = null,
      default_value_json = {},
      validation_rules_json = [],
      appearance_json = {},
      logic_enabled = false,
      calculation_expression = null,
      is_sensitive = false,
      is_personally_identifiable = false,
      choice_list_id = null,
    } = req.body;

    const normalizedVariableName =
      typeof variable_name === "string" &&
      variable_name.trim()
        ? variable_name.trim()
        : null;

    const result = await pool.query(
      `
      INSERT INTO question_bank
      (
        question_code,
        question_text,
        question_type,
        question_group,
        question_module,
        question_category_id,
        question_description,
        question_status,
        required_flag,
        options_json,
        metadata_json,
        created_by,
        created_at,
        updated_by,
        updated_at,
        question_type_id,
        variable_name,
        help_text,
        placeholder_text,
        default_value_json,
        validation_rules_json,
        appearance_json,
        logic_enabled,
        calculation_expression,
        is_sensitive,
        is_personally_identifiable,
        choice_list_id
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        CURRENT_TIMESTAMP,
        $13,
        CURRENT_TIMESTAMP,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19,
        $20,
        $21,
        $22,
        $23,
        $24,
        $25
      )
      RETURNING *
      `,
      [
        question_code.trim(),
        question_text.trim(),
        question_type.trim(),
        question_group,
        question_module,
        question_category_id,
        question_description,
        question_status,
        Boolean(required_flag),
        normalizeJsonValue(options_json, []),
        normalizeJsonValue(metadata_json, {}),
        authenticatedUserId,
        authenticatedUserId,
        question_type_id,
        normalizedVariableName,
        help_text,
        placeholder_text,
        normalizeJsonValue(default_value_json, {}),
        normalizeJsonValue(
          validation_rules_json,
          []
        ),
        normalizeJsonValue(
          appearance_json,
          {}
        ),
        Boolean(logic_enabled),
        calculation_expression,
        Boolean(is_sensitive),
        Boolean(
          is_personally_identifiable
        ),
        choice_list_id,
      ]
    );

    return res.status(201).json({
      success: true,
      message:
        "Enterprise Question created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Creating Enterprise Question"
    );
  }
};

exports.updateQuestion = async (req, res) => {
  try {
  console.log(
  "UPDATE QUESTION BODY:",
  JSON.stringify(req.body, null, 2)
);  
    validateQuestionStatus(req.body.question_status);

    const authenticatedUserId =
      getAuthenticatedUserId(req);

    const existingResult = await pool.query(
      `
      SELECT *
      FROM question_bank
      WHERE question_id = $1
      `,
      [req.params.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Enterprise Question not found.",
      });
    }

    const existingQuestion =
      existingResult.rows[0];

    const {
      question_code =
        existingQuestion.question_code,

      question_text =
        existingQuestion.question_text,

      question_type =
        existingQuestion.question_type,

      question_group =
        existingQuestion.question_group,

      question_module =
        existingQuestion.question_module,

      question_category_id =
        existingQuestion.question_category_id,

      question_description =
        existingQuestion.question_description,

      question_status =
        existingQuestion.question_status,

      required_flag =
        existingQuestion.required_flag,

      options_json =
        existingQuestion.options_json,

      metadata_json =
        existingQuestion.metadata_json,

      question_type_id =
        existingQuestion.question_type_id,

      variable_name =
        existingQuestion.variable_name,

      help_text =
        existingQuestion.help_text,

      placeholder_text =
        existingQuestion.placeholder_text,

      default_value_json =
        existingQuestion.default_value_json,

      validation_rules_json =
        existingQuestion.validation_rules_json,

      appearance_json =
        existingQuestion.appearance_json,

      logic_enabled =
        existingQuestion.logic_enabled,

      calculation_expression =
        existingQuestion.calculation_expression,

      is_sensitive =
        existingQuestion.is_sensitive,

      is_personally_identifiable =
        existingQuestion.is_personally_identifiable,

      choice_list_id =
        existingQuestion.choice_list_id,
    } = req.body;

    requireCreateFields({
      question_code,
      question_text,
      question_type,
    });

    const result = await pool.query(
      `
      UPDATE question_bank
      SET
        question_code = $1,
        question_text = $2,
        question_type = $3,
        question_group = $4,
        question_module = $5,
        question_category_id = $6,
        question_description = $7,
        question_status = $8,
        required_flag = $9,
        options_json = $10,
        metadata_json = $11,
        updated_by = $12,
        updated_at = CURRENT_TIMESTAMP,
        question_type_id = $13,
        variable_name = $14,
        help_text = $15,
        placeholder_text = $16,
        default_value_json = $17,
        validation_rules_json = $18,
        appearance_json = $19,
        logic_enabled = $20,
        calculation_expression = $21,
        is_sensitive = $22,
        is_personally_identifiable = $23,
        choice_list_id = $24

      WHERE question_id = $25

      RETURNING *
      `,
      [
        question_code.trim(),
        question_text.trim(),
        question_type.trim(),
        question_group,
        question_module,
        question_category_id,
        question_description,
        question_status,
        Boolean(required_flag),
        normalizeJsonValue(options_json, []),
        normalizeJsonValue(metadata_json, {}),
        authenticatedUserId,
        question_type_id,
        variable_name,
        help_text,
        placeholder_text,
        normalizeJsonValue(default_value_json, {}),
        normalizeJsonValue(
          validation_rules_json,
          []
        ),
        normalizeJsonValue(
          appearance_json,
          {}
        ),
        Boolean(logic_enabled),
        calculation_expression,
        Boolean(is_sensitive),
        Boolean(
          is_personally_identifiable
        ),
        choice_list_id,
        req.params.id,
      ]
    );

    return res.json({
      success: true,
      message:
        "Enterprise Question updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Updating Enterprise Question"
    );
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM question_bank
      WHERE question_id = $1
      RETURNING *
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Enterprise Question not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Enterprise Question deleted successfully.",
      data: result.rows[0],
      deleted: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This Enterprise Question is already used by another survey or enterprise record and cannot be deleted.",
        detail: error.detail,
      });
    }

    return sendControllerError(
      res,
      error,
      "Deleting Enterprise Question"
    );
  }
};