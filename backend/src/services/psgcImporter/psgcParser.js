function normalizeText(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const normalizedValue =
        String(value)
            .replace(/\s+/g, " ")
            .trim();

    return normalizedValue || null;
}

function normalizeCode(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const normalizedValue =
        String(value)
            .replace(/\.0$/, "")
            .replace(/\s+/g, "")
            .trim();

    return normalizedValue || null;
}

function normalizeInteger(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const normalizedValue =
        String(value)
            .replace(/,/g, "")
            .trim();

    const parsedValue =
        Number.parseInt(
            normalizedValue,
            10
        );

    return Number.isNaN(parsedValue)
        ? null
        : parsedValue;
}

function normalizeStatus(value) {
    const normalizedValue =
        normalizeText(value);

    if (!normalizedValue) {
        return "Active";
    }

    return normalizedValue;
}

function determineEnterpriseType(
    geographicLevel,
    cityClass
) {
    const level =
        normalizeText(
            geographicLevel
        );

    const city =
        normalizeText(
            cityClass
        );

    if (!level) {
        return null;
    }

    switch (level) {
        case "Reg":
            return {
                type_code: "REGION",
                hierarchy_level: 1,
            };

        case "Prov":
            return {
                type_code: "PROVINCE",
                hierarchy_level: 2,
            };

        case "Mun":
            return {
                type_code: "MUNICIPALITY",
                hierarchy_level: 3,
            };

        case "City": {
            const normalizedCityClass =
                String(city || "")
                    .trim()
                    .toUpperCase();

            if (
                normalizedCityClass === "HUC"
            ) {
                return {
                    type_code:
                        "HIGHLY_URBANIZED_CITY",
                    hierarchy_level: 2,
                };
            }

            if (
                normalizedCityClass === "ICC"
            ) {
                return {
                    type_code:
                        "INDEPENDENT_COMPONENT_CITY",
                    hierarchy_level: 2,
                };
            }

            return {
                type_code:
                    "COMPONENT_CITY",
                hierarchy_level: 3,
            };
        }

        case "Bgy":
            return {
                type_code: "BARANGAY",
                hierarchy_level: 4,
            };

        case "SubMun":
            return {
                type_code:
                    "SUB_MUNICIPALITY",
                hierarchy_level: 4,
            };

        default:
            return {
                type_code:
                    level.toUpperCase(),
                hierarchy_level: null,
            };
    }
}

function readCell(
    row,
    columnIndex,
    columnName
) {
    const index =
        columnIndex?.[
            columnName
        ];

    if (
        index === undefined ||
        index < 0
    ) {
        return null;
    }

    return row?.[index] ?? null;
}

function parsePsgcRow({
    row,
    rowNumber,
    columnIndex,
}) {
    const psgcCode =
        normalizeCode(
            readCell(
                row,
                columnIndex,
                "10-digit PSGC"
            )
        );

    const unitName =
        normalizeText(
            readCell(
                row,
                columnIndex,
                "Name"
            )
        );

    const geographicLevel =
        normalizeText(
            readCell(
                row,
                columnIndex,
                "Geographic Level"
            )
        );

    const cityClass =
        normalizeText(
            readCell(
                row,
                columnIndex,
                "City Class"
            )
        );

    const isSpecialAdministrativeContainer =
        psgcCode === "0990100000" ||
        psgcCode === "1999900000";

    const enterpriseType =
        isSpecialAdministrativeContainer
            ? {
                type_code:
                    "SPECIAL_ADMINISTRATIVE_AREA",
                hierarchy_level: 2,
            }
            : determineEnterpriseType(
                geographicLevel,
                cityClass
            );

    return {
        source_row_number:
            rowNumber,

        psgc_code:
            psgcCode,

        correspondence_code:
            normalizeCode(
                readCell(
                    row,
                    columnIndex,
                    "Correspondence Code"
                )
            ),

        unit_name:
            unitName,

        old_names:
            normalizeText(
                readCell(
                    row,
                    columnIndex,
                    "Old names"
                )
            ),

        geographic_level_code:
            geographicLevel,

        enterprise_type_code:
            enterpriseType
                ?.type_code ||
            null,

        hierarchy_level:
            enterpriseType
                ?.hierarchy_level ??
            null,

        city_class:
            cityClass,

        income_classification:
            normalizeText(
                readCell(
                    row,
                    columnIndex,
                    "Income Classification"
                )
            ),

        urban_rural_classification:
            normalizeText(
                readCell(
                    row,
                    columnIndex,
                    "Urban / Rural"
                )
            ),

        population_2024:
            normalizeInteger(
                readCell(
                    row,
                    columnIndex,
                    "2024 Population"
                )
            ),

        status:
            normalizeStatus(
                readCell(
                    row,
                    columnIndex,
                    "Status"
                )
            ),

        metadata: {
            source_sheet:
                "PSGC",

            source_row_number:
                rowNumber,

            is_special_administrative_container:
                isSpecialAdministrativeContainer,
        },
    };
}

function parsePsgcWorksheet({
    workbookData,
    validationReport,
}) {
    if (!workbookData?.psgc_sheet) {
        const error = new Error(
            'The "PSGC" worksheet is required for parsing.'
        );

        error.code =
            "PSGC_WORKSHEET_REQUIRED";

        error.statusCode = 422;

        throw error;
    }

    if (!validationReport?.schema) {
        const error = new Error(
            "A validated PSGC schema is required before parsing."
        );

        error.code =
            "PSGC_VALIDATED_SCHEMA_REQUIRED";

        error.statusCode = 422;

        throw error;
    }

    if (
        validationReport.valid !== true
    ) {
        const error = new Error(
            "The PSGC workbook failed validation and cannot be parsed."
        );

        error.code =
            "PSGC_WORKBOOK_VALIDATION_FAILED";

        error.statusCode = 422;

        error.validationReport =
            validationReport;

        throw error;
    }

    const rows =
        workbookData.psgc_sheet
            .rows || [];

    const columnIndex =
        validationReport.schema
            .column_index;

    const records = rows
        .slice(1)
        .map(
            (
                row,
                rowOffset
            ) =>
                parsePsgcRow({
                    row,
                    rowNumber:
                        rowOffset + 2,
                    columnIndex,
                })
        )
        .filter(
            (record) =>
                record.psgc_code &&
                record.unit_name &&
                record.enterprise_type_code
        );

    const recordsByLevel =
        records.reduce(
            (
                groups,
                record
            ) => {
                const level =
                    record
                        .enterprise_type_code ||
                    "UNKNOWN";

                if (!groups[level]) {
                    groups[level] = [];
                }

                groups[level].push(
                    record
                );

                return groups;
            },
            {}
        );

    const highlyUrbanizedCityCount =
        recordsByLevel
            .HIGHLY_URBANIZED_CITY
            ?.length || 0;

    const independentComponentCityCount =
        recordsByLevel
            .INDEPENDENT_COMPONENT_CITY
            ?.length || 0;

    const componentCityCount =
        recordsByLevel
            .COMPONENT_CITY
            ?.length || 0;

    return {
        records,

        records_by_level:
            recordsByLevel,

        summary: {
            parsed_record_count:
                records.length,

            region_count:
                recordsByLevel.REGION
                    ?.length || 0,

            province_count:
                recordsByLevel.PROVINCE
                    ?.length || 0,

            highly_urbanized_city_count:
                highlyUrbanizedCityCount,

            independent_component_city_count:
                independentComponentCityCount,

            component_city_count:
                componentCityCount,

            total_city_count:
                highlyUrbanizedCityCount +
                independentComponentCityCount +
                componentCityCount,

            municipality_count:
                recordsByLevel.MUNICIPALITY
                    ?.length || 0,

            barangay_count:
                recordsByLevel.BARANGAY
                    ?.length || 0,

            sub_municipality_count:
                recordsByLevel
                    .SUB_MUNICIPALITY
                    ?.length || 0,

            special_administrative_area_count:
                recordsByLevel
                    .SPECIAL_ADMINISTRATIVE_AREA
                    ?.length || 0,
        },
    };
}

module.exports = {
    determineEnterpriseType,
    parsePsgcWorksheet,
};