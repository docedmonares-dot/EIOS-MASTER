const crypto = require("crypto");

/**
 * Recursively sorts object keys so logically identical metadata
 * always produces the same serialized representation and hash.
 */
function sortValue(value) {
    if (Array.isArray(value)) {
        return value.map(sortValue);
    }

    if (
        value &&
        typeof value === "object" &&
        !(value instanceof Date)
    ) {
        return Object.keys(value)
            .sort()
            .reduce((sortedObject, key) => {
                sortedObject[key] = sortValue(value[key]);
                return sortedObject;
            }, {});
    }

    return value;
}

function createCanonicalJson(value) {
    return JSON.stringify(sortValue(value));
}

function generateSchemaHash(value) {
    const canonicalJson = createCanonicalJson(value);

    return crypto
        .createHash("sha256")
        .update(canonicalJson, "utf8")
        .digest("hex");
}

module.exports = {
    createCanonicalJson,
    generateSchemaHash
};