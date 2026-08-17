const pool = require("../config/database");

const ALLOWED_LOGIC_STATUSES = new Set([
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
    "question_id",
    "condition_json",
    "action_json",
  ];

  const missingFields = requiredFields.filter(
    (fieldName) =>
      payload[fieldName] === undefined ||
      payload[fieldName] === null
  );

  if (missingFields.length > 0) {
    const error = new Error(
      `Missing required fields: ${missingFields.join(", ")}.`
    );

    error.statusCode = 400;
    throw error;
  }
}

function validateLogicStatus(logicStatus) {
  if (
    logicStatus !== undefined &&
    logicStatus !== null &&
    !ALLOWED_LOGIC_STATUSES.has(logicStatus)
  ) {
    const error = new Error(
      "Logic status must be Active, Inactive, Draft, or Archived."
    );

    error.statusCode = 400;
    throw error;
  }
}

function normalizeJsonValue(value, fallbackValue) {
  const normalizedValue =
    value === undefined || value === null
      ? fallbackValue
      : value;

  return JSON.stringify(normalizedValue);
}

function sendControllerError(res, error, context) {
  console.error(`${context}:`, error);

  if (error.code === "23503") {
    return res.status(400).json({
      success: false,
      message:
        "The supplied Question ID or related identifier does not exist.",
      detail: error.detail,
    });
  }

  if (error.code === "23514") {
    return res.status(400).json({
      success: false,
      message:
        "The Question Logic record violates a database validation rule.",
      detail: error.detail,
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.statusCode && error.statusCode < 500
        ? error.message
        : "An unexpected Question Logic error occurred.",
    error:
      process.env.NODE_ENV === "production"
        ? undefined
        : error.message,
  });
}

/* =========================================================
   QUESTION LOGIC
========================================================= */

exports.getAllQuestionLogic = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ql.*,
        qb.question_code,
        qb.question_text,
        qb.question_type
      FROM question_logic ql
      INNER JOIN question_bank qb
        ON qb.question_id = ql.question_id
      ORDER BY
        qb.question_code,
        ql.created_at,
        ql.logic_id
    `);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Unable to load Question Logic records"
    );
  }
};

exports.getQuestionLogicById = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        ql.*,
        qb.question_code,
        qb.question_text,
        qb.question_type
      FROM question_logic ql
      INNER JOIN question_bank qb
        ON qb.question_id = ql.question_id
      WHERE ql.logic_id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Question Logic record not found.",
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Unable to load Question Logic record"
    );
  }
};

exports.getQuestionLogicByQuestionId = async (
  req,
  res
) => {
  try {
    const result = await pool.query(
      `
      SELECT
        ql.*,
        qb.question_code,
        qb.question_text,
        qb.question_type
      FROM question_logic ql
      INNER JOIN question_bank qb
        ON qb.question_id = ql.question_id
      WHERE ql.question_id = $1
      ORDER BY
        ql.created_at,
        ql.logic_id
      `,
      [req.params.questionId]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Unable to load Question Logic for question"
    );
  }
};

exports.createQuestionLogic = async (req, res) => {
  try {
    requireCreateFields(req.body);

    const {
      question_id,
      logic_name = null,
      condition_json,
      action_json,
      affected_questions_json = [],
      logic_status = "Active",
    } = req.body;

    validateLogicStatus(logic_status);

    const authenticatedUserId =
      getAuthenticatedUserId(req);

    const result = await pool.query(
      `
      INSERT INTO question_logic
      (
        question_id,
        logic_name,
        condition_json,
        action_json,
        affected_questions_json,
        logic_status,
        created_by,
        created_at,
        updated_by,
        updated_at
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
        CURRENT_TIMESTAMP,
        $8,
        CURRENT_TIMESTAMP
      )
      RETURNING *
      `,
      [
        question_id,
        logic_name,
        normalizeJsonValue(
          condition_json,
          {}
        ),
        normalizeJsonValue(
          action_json,
          {}
        ),
        normalizeJsonValue(
          affected_questions_json,
          []
        ),
        logic_status,
        authenticatedUserId,
        authenticatedUserId,
      ]
    );

    return res.status(201).json({
      success: true,
      message:
        "Question Logic created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Unable to create Question Logic"
    );
  }
};

exports.updateQuestionLogic = async (req, res) => {
  try {
    const existingResult = await pool.query(
      `
      SELECT *
      FROM question_logic
      WHERE logic_id = $1
      `,
      [req.params.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Question Logic record not found.",
      });
    }

    const existingLogic =
      existingResult.rows[0];

    const {
      question_id =
        existingLogic.question_id,

      logic_name =
        existingLogic.logic_name,

      condition_json =
        existingLogic.condition_json,

      action_json =
        existingLogic.action_json,

      affected_questions_json =
        existingLogic.affected_questions_json,

      logic_status =
        existingLogic.logic_status,
    } = req.body;

    validateLogicStatus(logic_status);

    const authenticatedUserId =
      getAuthenticatedUserId(req);

    const result = await pool.query(
      `
      UPDATE question_logic
      SET
        question_id = $1,
        logic_name = $2,
        condition_json = $3,
        action_json = $4,
        affected_questions_json = $5,
        logic_status = $6,
        updated_by = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE logic_id = $8
      RETURNING *
      `,
      [
        question_id,
        logic_name,
        normalizeJsonValue(
          condition_json,
          {}
        ),
        normalizeJsonValue(
          action_json,
          {}
        ),
        normalizeJsonValue(
          affected_questions_json,
          []
        ),
        logic_status,
        authenticatedUserId,
        req.params.id,
      ]
    );

    return res.json({
      success: true,
      message:
        "Question Logic updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Unable to update Question Logic"
    );
  }
};

exports.deleteQuestionLogic = async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM question_logic
      WHERE logic_id = $1
      RETURNING *
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Question Logic record not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Question Logic deleted successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Unable to delete Question Logic"
    );
  }
};