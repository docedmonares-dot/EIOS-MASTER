import json
import sys
import pandas as pd
import pyreadstat

source_path, output_path = sys.argv[1], sys.argv[2]
with open(source_path, "r", encoding="utf-8") as source:
    payload = json.load(source)

column_names = [column["name"] for column in payload["columns"]]
rows = [{name: row.get(name) for name in column_names} for row in payload["rows"]]
frame = pd.DataFrame(rows, columns=column_names)

for column in frame.columns:
    values = frame[column].dropna()
    if not values.empty and all(isinstance(value, (int, float, bool)) for value in values):
        frame[column] = pd.to_numeric(frame[column], errors="coerce").astype(float)
    else:
        frame[column] = frame[column].apply(
            lambda value: None if value is None else str(value)
        )

column_labels = {
    column["name"]: (column.get("label") or column["name"])[:255]
    for column in payload["columns"]
}
def numeric_label_key(value):
    normalized = str(value).strip().upper()
    if normalized in {"TRUE", "YES", "Y"}:
        return 1.0
    if normalized in {"FALSE", "NO", "N"}:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


variable_value_labels = {}
for column in payload["columns"]:
    labels = column.get("valueLabels") or {}
    if not labels:
        continue

    name = column["name"]
    numeric_column = pd.api.types.is_numeric_dtype(frame[name])
    normalized_labels = {}
    for key, label in labels.items():
        normalized_key = numeric_label_key(key) if numeric_column else str(key)
        if normalized_key is not None:
            normalized_labels[normalized_key] = label

    if normalized_labels:
        variable_value_labels[name] = normalized_labels

pyreadstat.write_sav(
    frame,
    output_path,
    column_labels=column_labels,
    variable_value_labels=variable_value_labels,
    file_label="EIOS governed survey data export",
)
