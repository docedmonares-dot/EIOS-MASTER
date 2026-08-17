function regionCodeFrom(code) {
    return (
        code.substring(0, 2) +
        "00000000"
    );
}

function provinceCodeFrom(code) {
    return (
        code.substring(0, 5) +
        "00000"
    );
}

function cityMunicipalityCodeFrom(
    code
) {
    return (
        code.substring(0, 7) +
        "000"
    );
}

/**
 * Resolves the parent of a barangay or sub-municipality.
 *
 * Some PSGC child records end in "000". In those cases,
 * the normal calculation returns the record's own code.
 * We therefore move one level higher to the city or
 * municipality code.
 */
function determineLocalChildParentCode(
    code
) {
    const normalParentCode =
        cityMunicipalityCodeFrom(
            code
        );

    if (
        normalParentCode === code
    ) {
        return provinceCodeFrom(
            code
        );
    }

    return normalParentCode;
}

function determineParentCode(record) {
    const code =
        String(
            record?.psgc_code || ""
        ).trim();

    const typeCode =
        String(
            record
                ?.enterprise_type_code ||
            ""
        ).trim();

    if (
        !code ||
        code.length !== 10 ||
        !typeCode
    ) {
        return null;
    }

    /*
     * Pateros is the lone municipality of NCR.
     * It reports directly to the National Capital Region.
     */
    if (
        code === "1381701000" &&
        typeCode === "MUNICIPALITY"
    ) {
        return "1300000000";
    }

    switch (typeCode) {
        case "REGION":
            return "PH";

        case "PROVINCE":
            return regionCodeFrom(
                code
            );

        case "HIGHLY_URBANIZED_CITY":
        case "INDEPENDENT_COMPONENT_CITY":
            return regionCodeFrom(
                code
            );

        case "COMPONENT_CITY":
        case "MUNICIPALITY":
            return provinceCodeFrom(
                code
            );

        case "SUB_MUNICIPALITY":
        case "BARANGAY":
            return determineLocalChildParentCode(
                code
            );

        case "SPECIAL_ADMINISTRATIVE_AREA":
            return regionCodeFrom(
                code
            );

        default:
            return null;
    }
}

function buildHierarchy(
    parsedWorkbook
) {
    if (
        !Array.isArray(
            parsedWorkbook?.records
        )
    ) {
        const error = new Error(
            "Parsed PSGC records are required."
        );

        error.code =
            "PSGC_PARSED_RECORDS_REQUIRED";

        throw error;
    }

    const nodes =
        parsedWorkbook.records.map(
            (record) => ({
                ...record,

                parent_psgc_code:
                    determineParentCode(
                        record
                    ),

                children: [],
            })
        );

    const nodeMap = new Map();

    nodes.forEach((node) => {
        nodeMap.set(
            node.psgc_code,
            node
        );
    });

    const roots = [];
    const orphans = [];

    nodes.forEach((node) => {
        if (
            node.parent_psgc_code ===
            "PH"
        ) {
            roots.push(node);
            return;
        }

        if (
            !node.parent_psgc_code
        ) {
            orphans.push({
                node,
                reason:
                    "Parent code could not be determined.",
            });

            return;
        }

        const parent =
            nodeMap.get(
                node.parent_psgc_code
            );

        if (!parent) {
            orphans.push({
                node,
                reason:
                    "Calculated parent was not found.",
            });

            return;
        }

        parent.children.push(node);
    });

    return {
        roots,
        nodes,
        nodeMap,
        orphans,

        statistics: {
            total_nodes:
                nodes.length,

            root_count:
                roots.length,

            orphan_count:
                orphans.length,
        },
    };
}

module.exports = {
    determineParentCode,
    buildHierarchy,
};