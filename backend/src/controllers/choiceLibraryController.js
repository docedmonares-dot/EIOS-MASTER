const pool = require("../config/database");

function cleanText(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const cleanedValue =
        String(value).trim();

    return cleanedValue || null;
}

/* =========================================================
   GET CHOICE LISTS
========================================================= */

exports.getChoiceLists = async (
    req,
    res
) => {
    try {
        const categoryCode =
            cleanText(
                req.query?.category_code
            );

        const includeInactive =
            String(
                req.query?.include_inactive ||
                ""
            ).toLowerCase() === "true";

        const values = [];
        const conditions = [];

        if (!includeInactive) {
            conditions.push(
                "list.is_active = TRUE"
            );
        }

        if (categoryCode) {
            values.push(
                categoryCode.toUpperCase()
            );

            conditions.push(
                `list.category_code = $${values.length}`
            );
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(
                    " AND "
                )}`
                : "";

        const result =
            await pool.query(
                `
                SELECT
                    list.choice_list_id,
                    list.choice_list_code,
                    list.choice_list_name,
                    list.description,
                    list.category_code,
                    list.source_type,
                    list.source_table,
                    list.source_value_field,
                    list.source_label_field,
                    list.source_filter_json,
                    list.allow_other_option,
                    list.allow_none_option,
                    list.allow_refuse_option,
                    list.is_system_list,
                    list.is_active,
                    list.created_at,
                    list.updated_at,

                    COUNT(
                        item.choice_item_id
                    ) FILTER (
                        WHERE item.is_active = TRUE
                    )::INTEGER
                        AS active_item_count,

                    COUNT(
                        item.choice_item_id
                    )::INTEGER
                        AS total_item_count
                FROM question_choice_lists
                    AS list
                LEFT JOIN question_choice_items
                    AS item
                    ON item.choice_list_id =
                       list.choice_list_id
                ${whereClause}
                GROUP BY
                    list.choice_list_id
                ORDER BY
                    list.category_code,
                    list.choice_list_name
                `,
                values
            );

        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error(
            "GET CHOICE LISTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load the enterprise choice lists.",
            error: error.message
        });
    }
};

/* =========================================================
   GET ONE CHOICE LIST WITH ITEMS
========================================================= */

exports.getChoiceListById = async (
    req,
    res
) => {
    try {
        const choiceListId =
            cleanText(
                req.params.choiceListId
            );

        if (!choiceListId) {
            return res.status(400).json({
                success: false,
                message:
                    "Choice list ID is required."
            });
        }

        const listResult =
            await pool.query(
                `
                SELECT
                    choice_list_id,
                    choice_list_code,
                    choice_list_name,
                    description,
                    category_code,
                    source_type,
                    source_table,
                    source_value_field,
                    source_label_field,
                    source_filter_json,
                    allow_other_option,
                    allow_none_option,
                    allow_refuse_option,
                    is_system_list,
                    is_active,
                    created_at,
                    updated_at
                FROM question_choice_lists
                WHERE choice_list_id = $1
                LIMIT 1
                `,
                [choiceListId]
            );

        if (
            listResult.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Choice list was not found."
            });
        }

        const itemsResult =
            await pool.query(
                `
                SELECT
                    choice_item_id,
                    choice_list_id,
                    parent_choice_item_id,
                    choice_code,
                    choice_value,
                    display_label,
                    short_label,
                    description,
                    sort_order,
                    is_default,
                    is_exclusive,
                    is_other_option,
                    is_none_option,
                    is_refuse_option,
                    is_active,
                    effective_from,
                    effective_until,
                    metadata_json,
                    created_at,
                    updated_at
                FROM question_choice_items
                WHERE choice_list_id = $1
                ORDER BY
                    sort_order,
                    display_label
                `,
                [choiceListId]
            );

        return res.json({
            success: true,
            data: {
                choice_list:
                    listResult.rows[0],

                items:
                    itemsResult.rows
            }
        });
    } catch (error) {
        console.error(
            "GET CHOICE LIST ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load the enterprise choice list.",
            error: error.message
        });
    }
};

/* =========================================================
   CREATE CHOICE LIST
========================================================= */

exports.createChoiceList = async (
    req,
    res
) => {
    try {
        const choiceListCode =
            cleanText(
                req.body?.choice_list_code
            );

        const choiceListName =
            cleanText(
                req.body?.choice_list_name
            );

        const categoryCode =
            cleanText(
                req.body?.category_code
            ) || "CUSTOM";

        const sourceType =
            cleanText(
                req.body?.source_type
            ) || "Manual";

        if (!choiceListCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Choice list code is required."
            });
        }

        if (!choiceListName) {
            return res.status(400).json({
                success: false,
                message:
                    "Choice list name is required."
            });
        }

        const normalizedCode =
            choiceListCode
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]+/g,
                    "_"
                )
                .replace(
                    /^_+|_+$/g,
                    ""
                );

        const normalizedCategory =
            categoryCode
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]+/g,
                    "_"
                )
                .replace(
                    /^_+|_+$/g,
                    ""
                );

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const result =
            await pool.query(
                `
                INSERT INTO question_choice_lists (
                    choice_list_code,
                    choice_list_name,
                    description,
                    category_code,
                    source_type,
                    source_table,
                    source_value_field,
                    source_label_field,
                    source_filter_json,
                    allow_other_option,
                    allow_none_option,
                    allow_refuse_option,
                    is_system_list,
                    is_active,
                    created_by,
                    updated_by
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9::jsonb,
                    $10,
                    $11,
                    $12,
                    $13,
                    $14,
                    $15,
                    $15
                )
                RETURNING *
                `,
                [
                    normalizedCode,
                    choiceListName,
                    cleanText(
                        req.body?.description
                    ),
                    normalizedCategory,
                    sourceType,
                    cleanText(
                        req.body?.source_table
                    ),
                    cleanText(
                        req.body
                            ?.source_value_field
                    ),
                    cleanText(
                        req.body
                            ?.source_label_field
                    ),
                    JSON.stringify(
                        req.body
                            ?.source_filter_json ||
                        {}
                    ),
                    Boolean(
                        req.body
                            ?.allow_other_option
                    ),
                    Boolean(
                        req.body
                            ?.allow_none_option
                    ),
                    Boolean(
                        req.body
                            ?.allow_refuse_option
                    ),
                    Boolean(
                        req.body
                            ?.is_system_list
                    ),
                    req.body?.is_active !==
                    undefined
                        ? Boolean(
                            req.body.is_active
                        )
                        : true,
                    requestedBy
                ]
            );

        return res.status(201).json({
            success: true,
            message:
                "Choice list created successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error(
            "CREATE CHOICE LIST ERROR:",
            error
        );

        if (
            error.code === "23505"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "The choice list code already exists.",
                error: error.message
            });
        }

        if (
            error.code === "23514"
        ) {
            return res.status(422).json({
                success: false,
                message:
                    "One or more choice list values are invalid.",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to create the enterprise choice list.",
            error: error.message
        });
    }
};

/* =========================================================
   CREATE CHOICE ITEM
========================================================= */

exports.createChoiceItem = async (
    req,
    res
) => {
    try {
        const choiceListId =
            cleanText(
                req.params.choiceListId
            );

        const choiceCode =
            cleanText(
                req.body?.choice_code
            );

        const displayLabel =
            cleanText(
                req.body?.display_label
            );

        if (!choiceListId) {
            return res.status(400).json({
                success: false,
                message:
                    "Choice list ID is required."
            });
        }

        if (!choiceCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Choice code is required."
            });
        }

        if (!displayLabel) {
            return res.status(400).json({
                success: false,
                message:
                    "Display label is required."
            });
        }

        const normalizedCode =
            choiceCode
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]+/g,
                    "_"
                )
                .replace(
                    /^_+|_+$/g,
                    ""
                );

        const choiceValue =
            cleanText(
                req.body?.choice_value
            ) || normalizedCode;

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const listResult =
            await pool.query(
                `
                SELECT choice_list_id
                FROM question_choice_lists
                WHERE choice_list_id = $1
                  AND is_active = TRUE
                LIMIT 1
                `,
                [choiceListId]
            );

        if (
            listResult.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Active choice list was not found."
            });
        }

        const result =
            await pool.query(
                `
                INSERT INTO question_choice_items (
                    choice_list_id,
                    parent_choice_item_id,
                    choice_code,
                    choice_value,
                    display_label,
                    short_label,
                    description,
                    sort_order,
                    is_default,
                    is_exclusive,
                    is_other_option,
                    is_none_option,
                    is_refuse_option,
                    is_active,
                    effective_from,
                    effective_until,
                    metadata_json,
                    created_by,
                    updated_by
                )
                VALUES (
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
                    $13,
                    $14,
                    $15,
                    $16,
                    $17::jsonb,
                    $18,
                    $18
                )
                RETURNING *
                `,
                [
                    choiceListId,
                    cleanText(
                        req.body
                            ?.parent_choice_item_id
                    ),
                    normalizedCode,
                    choiceValue,
                    displayLabel,
                    cleanText(
                        req.body?.short_label
                    ),
                    cleanText(
                        req.body?.description
                    ),
                    Number(
                        req.body?.sort_order
                    ) || 0,
                    Boolean(
                        req.body?.is_default
                    ),
                    Boolean(
                        req.body?.is_exclusive
                    ),
                    Boolean(
                        req.body
                            ?.is_other_option
                    ),
                    Boolean(
                        req.body
                            ?.is_none_option
                    ),
                    Boolean(
                        req.body
                            ?.is_refuse_option
                    ),
                    req.body?.is_active !==
                    undefined
                        ? Boolean(
                            req.body.is_active
                        )
                        : true,
                    req.body
                        ?.effective_from ||
                    null,
                    req.body
                        ?.effective_until ||
                    null,
                    JSON.stringify(
                        req.body?.metadata_json ||
                        {}
                    ),
                    requestedBy
                ]
            );

        return res.status(201).json({
            success: true,
            message:
                "Choice item created successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error(
            "CREATE CHOICE ITEM ERROR:",
            error
        );

        if (
            error.code === "23505"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "The choice code already exists in this choice list.",
                error: error.message
            });
        }

        if (
            error.code === "23503"
        ) {
            return res.status(422).json({
                success: false,
                message:
                    "The selected parent choice item is invalid.",
                error: error.message
            });
        }

        if (
            error.code === "23514"
        ) {
            return res.status(422).json({
                success: false,
                message:
                    "One or more choice item values are invalid.",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to create the choice item.",
            error: error.message
        });
    }
};

/* =========================================================
   UPDATE CHOICE ITEM
========================================================= */

exports.updateChoiceItem = async (
    req,
    res
) => {
    try {
        const choiceItemId =
            cleanText(
                req.params.choiceItemId
            );

        if (!choiceItemId) {
            return res.status(400).json({
                success: false,
                message:
                    "Choice item ID is required."
            });
        }

        const existingResult =
            await pool.query(
                `
                SELECT *
                FROM question_choice_items
                WHERE choice_item_id = $1
                LIMIT 1
                `,
                [choiceItemId]
            );

        if (
            existingResult.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Choice item was not found."
            });
        }

        const existingItem =
            existingResult.rows[0];

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const requestedCode =
            cleanText(
                req.body?.choice_code
            );

        const normalizedCode =
            requestedCode
                ? requestedCode
                    .toUpperCase()
                    .replace(
                        /[^A-Z0-9]+/g,
                        "_"
                    )
                    .replace(
                        /^_+|_+$/g,
                        ""
                    )
                : existingItem.choice_code;

        const result =
            await pool.query(
                `
                UPDATE question_choice_items
                SET
                    parent_choice_item_id = $1,
                    choice_code = $2,
                    choice_value = $3,
                    display_label = $4,
                    short_label = $5,
                    description = $6,
                    sort_order = $7,
                    is_default = $8,
                    is_exclusive = $9,
                    is_other_option = $10,
                    is_none_option = $11,
                    is_refuse_option = $12,
                    is_active = $13,
                    effective_from = $14,
                    effective_until = $15,
                    metadata_json = $16::jsonb,
                    updated_by = $17
                WHERE choice_item_id = $18
                RETURNING *
                `,
                [
                    req.body
                        ?.parent_choice_item_id !==
                    undefined
                        ? cleanText(
                            req.body
                                .parent_choice_item_id
                        )
                        : existingItem
                            .parent_choice_item_id,

                    normalizedCode,

                    cleanText(
                        req.body?.choice_value
                    ) ||
                    existingItem.choice_value,

                    cleanText(
                        req.body?.display_label
                    ) ||
                    existingItem.display_label,

                    req.body?.short_label !==
                    undefined
                        ? cleanText(
                            req.body.short_label
                        )
                        : existingItem.short_label,

                    req.body?.description !==
                    undefined
                        ? cleanText(
                            req.body.description
                        )
                        : existingItem.description,

                    req.body?.sort_order !==
                    undefined
                        ? Number(
                            req.body.sort_order
                        )
                        : existingItem.sort_order,

                    req.body?.is_default !==
                    undefined
                        ? Boolean(
                            req.body.is_default
                        )
                        : existingItem.is_default,

                    req.body?.is_exclusive !==
                    undefined
                        ? Boolean(
                            req.body.is_exclusive
                        )
                        : existingItem.is_exclusive,

                    req.body?.is_other_option !==
                    undefined
                        ? Boolean(
                            req.body
                                .is_other_option
                        )
                        : existingItem
                            .is_other_option,

                    req.body?.is_none_option !==
                    undefined
                        ? Boolean(
                            req.body
                                .is_none_option
                        )
                        : existingItem
                            .is_none_option,

                    req.body?.is_refuse_option !==
                    undefined
                        ? Boolean(
                            req.body
                                .is_refuse_option
                        )
                        : existingItem
                            .is_refuse_option,

                    req.body?.is_active !==
                    undefined
                        ? Boolean(
                            req.body.is_active
                        )
                        : existingItem.is_active,

                    req.body?.effective_from !==
                    undefined
                        ? req.body.effective_from
                        : existingItem
                            .effective_from,

                    req.body?.effective_until !==
                    undefined
                        ? req.body.effective_until
                        : existingItem
                            .effective_until,

                    JSON.stringify(
                        req.body?.metadata_json !==
                        undefined
                            ? req.body
                                .metadata_json
                            : existingItem
                                .metadata_json ||
                              {}
                    ),

                    requestedBy,
                    choiceItemId
                ]
            );

        return res.json({
            success: true,
            message:
                "Choice item updated successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error(
            "UPDATE CHOICE ITEM ERROR:",
            error
        );

        if (
            error.code === "23505"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "The choice code already exists in this choice list.",
                error: error.message
            });
        }

        if (
            error.code === "23503" ||
            error.code === "23514"
        ) {
            return res.status(422).json({
                success: false,
                message:
                    "One or more choice item values are invalid.",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to update the choice item.",
            error: error.message
        });
    }
};

/* =========================================================
   DEACTIVATE CHOICE ITEM
========================================================= */

exports.deactivateChoiceItem = async (
    req,
    res
) => {
    try {
        const choiceItemId =
            cleanText(
                req.params.choiceItemId
            );

        if (!choiceItemId) {
            return res.status(400).json({
                success: false,
                message:
                    "Choice item ID is required."
            });
        }

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const result =
            await pool.query(
                `
                UPDATE question_choice_items
                SET
                    is_active = FALSE,
                    updated_by = $1
                WHERE choice_item_id = $2
                  AND is_active = TRUE
                RETURNING *
                `,
                [
                    requestedBy,
                    choiceItemId
                ]
            );

        if (
            result.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Active choice item was not found."
            });
        }

        return res.json({
            success: true,
            message:
                "Choice item deactivated successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error(
            "DEACTIVATE CHOICE ITEM ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to deactivate the choice item.",
            error: error.message
        });
    }
};

/* =========================================================
   DEACTIVATE CHOICE ITEM
========================================================= */

exports.deactivateChoiceItem = async (
    req,
    res
) => {
    try {
        const choiceItemId =
            cleanText(
                req.params.choiceItemId
            );

        if (!choiceItemId) {
            return res.status(400).json({
                success: false,
                message:
                    "Choice item ID is required."
            });
        }

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const result =
            await pool.query(
                `
                UPDATE question_choice_items
                SET
                    is_active = FALSE,
                    updated_by = $1
                WHERE choice_item_id = $2
                  AND is_active = TRUE
                RETURNING *
                `,
                [
                    requestedBy,
                    choiceItemId
                ]
            );

        if (
            result.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Active choice item was not found."
            });
        }

        return res.json({
            success: true,
            message:
                "Choice item deactivated successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error(
            "DEACTIVATE CHOICE ITEM ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to deactivate the choice item.",
            error: error.message
        });
    }
};

/* =========================================================
   UPDATE CHOICE LIST
========================================================= */

exports.updateChoiceList = async (
    req,
    res
) => {
    try {
        const choiceListId =
            cleanText(
                req.params.choiceListId
            );

        if (!choiceListId) {
            return res.status(400).json({
                success: false,
                message:
                    "Choice list ID is required."
            });
        }

        const existingResult =
            await pool.query(
                `
                SELECT *
                FROM question_choice_lists
                WHERE choice_list_id = $1
                LIMIT 1
                `,
                [choiceListId]
            );

        if (
            existingResult.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Choice list was not found."
            });
        }

        const existingList =
            existingResult.rows[0];

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const requestedCode =
            cleanText(
                req.body?.choice_list_code
            );

        const normalizedCode =
            requestedCode
                ? requestedCode
                    .toUpperCase()
                    .replace(
                        /[^A-Z0-9]+/g,
                        "_"
                    )
                    .replace(
                        /^_+|_+$/g,
                        ""
                    )
                : existingList
                    .choice_list_code;

        const requestedCategory =
            cleanText(
                req.body?.category_code
            );

        const normalizedCategory =
            requestedCategory
                ? requestedCategory
                    .toUpperCase()
                    .replace(
                        /[^A-Z0-9]+/g,
                        "_"
                    )
                    .replace(
                        /^_+|_+$/g,
                        ""
                    )
                : existingList
                    .category_code;

        const result =
            await pool.query(
                `
                UPDATE question_choice_lists
                SET
                    choice_list_code = $1,
                    choice_list_name = $2,
                    description = $3,
                    category_code = $4,
                    source_type = $5,
                    source_table = $6,
                    source_value_field = $7,
                    source_label_field = $8,
                    source_filter_json = $9::jsonb,
                    allow_other_option = $10,
                    allow_none_option = $11,
                    allow_refuse_option = $12,
                    is_system_list = $13,
                    is_active = $14,
                    updated_by = $15,
                    updated_at = NOW()
                WHERE choice_list_id = $16
                RETURNING *
                `,
                [
                    normalizedCode,

                    cleanText(
                        req.body
                            ?.choice_list_name
                    ) ||
                    existingList
                        .choice_list_name,

                    req.body?.description !==
                    undefined
                        ? cleanText(
                            req.body.description
                        )
                        : existingList
                            .description,

                    normalizedCategory,

                    cleanText(
                        req.body?.source_type
                    ) ||
                    existingList.source_type,

                    req.body?.source_table !==
                    undefined
                        ? cleanText(
                            req.body.source_table
                        )
                        : existingList
                            .source_table,

                    req.body
                        ?.source_value_field !==
                    undefined
                        ? cleanText(
                            req.body
                                .source_value_field
                        )
                        : existingList
                            .source_value_field,

                    req.body
                        ?.source_label_field !==
                    undefined
                        ? cleanText(
                            req.body
                                .source_label_field
                        )
                        : existingList
                            .source_label_field,

                    JSON.stringify(
                        req.body
                            ?.source_filter_json !==
                        undefined
                            ? req.body
                                .source_filter_json
                            : existingList
                                .source_filter_json ||
                              {}
                    ),

                    req.body
                        ?.allow_other_option !==
                    undefined
                        ? Boolean(
                            req.body
                                .allow_other_option
                        )
                        : existingList
                            .allow_other_option,

                    req.body
                        ?.allow_none_option !==
                    undefined
                        ? Boolean(
                            req.body
                                .allow_none_option
                        )
                        : existingList
                            .allow_none_option,

                    req.body
                        ?.allow_refuse_option !==
                    undefined
                        ? Boolean(
                            req.body
                                .allow_refuse_option
                        )
                        : existingList
                            .allow_refuse_option,

                    req.body?.is_system_list !==
                    undefined
                        ? Boolean(
                            req.body
                                .is_system_list
                        )
                        : existingList
                            .is_system_list,

                    req.body?.is_active !==
                    undefined
                        ? Boolean(
                            req.body.is_active
                        )
                        : existingList
                            .is_active,

                    requestedBy,
                    choiceListId
                ]
            );

        return res.json({
            success: true,
            message:
                "Choice list updated successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error(
            "UPDATE CHOICE LIST ERROR:",
            error
        );

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message:
                    "The choice list code already exists.",
                error: error.message
            });
        }

        if (error.code === "23514") {
            return res.status(422).json({
                success: false,
                message:
                    "One or more choice list values are invalid.",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to update the choice list.",
            error: error.message
        });
    }
};

/* =========================================================
   DEACTIVATE CHOICE LIST
========================================================= */

exports.deactivateChoiceList = async (
    req,
    res
) => {
    try {
        const choiceListId =
            cleanText(
                req.params.choiceListId
            );

        if (!choiceListId) {
            return res.status(400).json({
                success: false,
                message:
                    "Choice list ID is required."
            });
        }

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const result =
            await pool.query(
                `
                UPDATE question_choice_lists
                SET
                    is_active = FALSE,
                    updated_by = $1,
                    updated_at = NOW()
                WHERE choice_list_id = $2
                  AND is_active = TRUE
                RETURNING *
                `,
                [
                    requestedBy,
                    choiceListId
                ]
            );

        if (
            result.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Active choice list was not found."
            });
        }

        return res.json({
            success: true,
            message:
                "Choice list deactivated successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error(
            "DEACTIVATE CHOICE LIST ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to deactivate the choice list.",
            error: error.message
        });
    }
};

/* =========================================================
   REORDER CHOICE ITEMS
========================================================= */

exports.reorderChoiceItems = async (
    req,
    res
) => {
    const client =
        await pool.connect();

    try {
        const choiceListId =
            cleanText(
                req.params.choiceListId
            );

        const items =
            Array.isArray(
                req.body?.items
            )
                ? req.body.items
                : [];

        if (!choiceListId) {
            return res.status(400).json({
                success: false,
                message:
                    "Choice list ID is required."
            });
        }

        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one choice item is required."
            });
        }

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        await client.query("BEGIN");

        const listResult =
            await client.query(
                `
                SELECT choice_list_id
                FROM question_choice_lists
                WHERE choice_list_id = $1
                LIMIT 1
                `,
                [choiceListId]
            );

        if (
            listResult.rows.length === 0
        ) {
            await client.query(
                "ROLLBACK"
            );

            return res.status(404).json({
                success: false,
                message:
                    "Choice list was not found."
            });
        }

        for (
            let index = 0;
            index < items.length;
            index += 1
        ) {
            const item =
                items[index];

            const choiceItemId =
                cleanText(
                    item?.choice_item_id
                );

            const sortOrder =
                Number(
                    item?.sort_order
                );

            if (
                !choiceItemId ||
                !Number.isInteger(
                    sortOrder
                ) ||
                sortOrder < 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Every item must have a valid choice_item_id and non-negative sort_order."
                });
            }

            const updateResult =
                await client.query(
                    `
                    UPDATE question_choice_items
                    SET
                        sort_order = $1,
                        updated_by = $2
                    WHERE choice_item_id = $3
                      AND choice_list_id = $4
                    RETURNING choice_item_id
                    `,
                    [
                        sortOrder,
                        requestedBy,
                        choiceItemId,
                        choiceListId
                    ]
                );

            if (
                updateResult.rows.length ===
                0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    success: false,
                    message:
                        "One or more choice items were not found in the selected list."
                });
            }
        }

        const reorderedResult =
            await client.query(
                `
                SELECT
                    choice_item_id,
                    choice_code,
                    display_label,
                    sort_order,
                    is_active
                FROM question_choice_items
                WHERE choice_list_id = $1
                ORDER BY
                    sort_order,
                    display_label
                `,
                [choiceListId]
            );

        await client.query("COMMIT");

        return res.json({
            success: true,
            message:
                "Choice items reordered successfully.",
            data:
                reorderedResult.rows
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "REORDER CHOICE ITEMS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to reorder the choice items.",
            error: error.message
        });
    } finally {
        client.release();
    }
};