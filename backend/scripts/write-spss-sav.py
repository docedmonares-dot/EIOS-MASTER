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
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    else:
        frame[column] = frame[column].apply(
            lambda value: None if value is None else str(value)
        )

column_labels = {
    column["name"]: (column.get("label") or column["name"])[:255]
    for column in payload["columns"]
}
variable_value_labels = {
    column["name"]: {float(key) if str(key).replace(".", "", 1).isdigit() else key: label for key, label in column["valueLabels"].items()}
    for column in payload["columns"] if column.get("valueLabels")
}

pyreadstat.write_sav(
    frame,
    output_path,
    column_labels=column_labels,
    variable_value_labels=variable_value_labels,
    file_label="EIOS governed survey data export",
)
