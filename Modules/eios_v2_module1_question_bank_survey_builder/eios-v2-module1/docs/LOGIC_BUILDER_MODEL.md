# Logic Builder Model

Condition:
{
  "if": {
    "question_id": "CM-AWARE-A",
    "operator": "equals",
    "value": "Unaware"
  }
}

Action:
{
  "then": {
    "action": "hide"
  }
}

Affected:
[
  "CM-A-SAT",
  "CM-A-TRUST",
  "CM-A-TENACITY"
]

Operators:
equals, not_equals, contains, not_contains, greater_than, less_than, is_empty, is_not_empty

Actions:
show, hide, require, make_optional, skip_to, end_survey, calculate, flag_qc
