import "./ElectionResearchControls.css";

function resolveCandidates(question) {
  const choices =
    question?.choice_list?.choices ||
    question?.choice_list?.options ||
    question?.options ||
    [];

  return choices
    .filter((choice) => choice.is_active !== false)
    .map((choice, index) => ({
      candidate_id:
        choice.option_code ||
        choice.choice_code ||
        choice.option_value ||
        choice.value ||
        choice.choice_id,
      label:
        choice.option_label ||
        choice.choice_label ||
        choice.label ||
        String(
          choice.option_value ||
            choice.value ||
            "Candidate"
        ),
      sort_order: Number(
        choice.sort_order ??
          choice.display_order ??
          index
      ),
      is_undecided:
        choice.is_none_option === true ||
        String(
          choice.option_code ||
            choice.choice_code ||
            ""
        ).toUpperCase() === "UNDECIDED",
    }))
    .sort(
      (left, right) =>
        left.sort_order - right.sort_order
    );
}

function NumericChoice({
  name,
  value,
  options,
  onChange,
  disabled = false,
}) {
  return (
    <div className="election-rating-options">
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={disabled}
            onChange={() =>
              onChange(option.value)
            }
          />
          <span>
            {option.value} — {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

const awarenessOptions = [
  { value: 1, label: "Aware" },
  { value: 2, label: "Not aware" },
];

const satisfactionOptions = [
  { value: 1, label: "Satisfied" },
  { value: 2, label: "Neutral" },
  { value: 3, label: "Not satisfied" },
];

const trustOptions = [
  { value: 1, label: "Trust" },
  { value: 2, label: "Neutral" },
  { value: 3, label: "Distrust" },
];

export function CandidateEvaluationControl({
  question,
  value,
  onChange,
}) {
  const candidates = resolveCandidates(question).filter(
    (candidate) => !candidate.is_undecided
  );
  const currentValue =
    value && typeof value === "object"
      ? value
      : {};
  const candidateAnswers =
    currentValue.candidates || {};

  function updateCandidate(
    candidateId,
    dimension,
    numericValue
  ) {
    const previous =
      candidateAnswers[candidateId] || {};
    const notAware =
      dimension === "awareness" &&
      numericValue === 2;
    const nextCandidate = {
      ...previous,
      candidate_label:
        candidates.find(
          (candidate) =>
            candidate.candidate_id ===
            candidateId
        )?.label || candidateId,
      [dimension]: numericValue,
    };

    if (notAware) {
      nextCandidate.satisfaction = 2;
      nextCandidate.trust = 2;
      nextCandidate.auto_assigned_from_not_aware =
        true;
    } else if (
      dimension === "awareness" &&
      numericValue === 1
    ) {
      nextCandidate.auto_assigned_from_not_aware =
        false;

      if (
        previous.auto_assigned_from_not_aware
      ) {
        delete nextCandidate.satisfaction;
        delete nextCandidate.trust;
      }
    }

    onChange({
      schema: "eios.candidate-evaluation.v1",
      position_code:
        (question?.settings || question?.settings_json)
          ?.election_position?.position_code ||
        null,
      candidates: {
        ...candidateAnswers,
        [candidateId]: nextCandidate,
      },
    });
  }

  if (candidates.length === 0) {
    return (
      <div className="preview-question__unsupported">
        No candidate roster is configured.
      </div>
    );
  }

  return (
    <div className="candidate-evaluation-control">
      {candidates.map((candidate) => {
        const answer =
          candidateAnswers[
            candidate.candidate_id
          ] || {};
        const notAware =
          answer.awareness === 2;

        return (
          <article key={candidate.candidate_id}>
            <h4>{candidate.label}</h4>

            <div className="candidate-evaluation-grid">
              <section>
                <strong>Awareness</strong>
                <NumericChoice
                  name={`${question.questionnaire_item_id}-${candidate.candidate_id}-awareness`}
                  value={answer.awareness}
                  options={awarenessOptions}
                  onChange={(nextValue) =>
                    updateCandidate(
                      candidate.candidate_id,
                      "awareness",
                      nextValue
                    )
                  }
                />
              </section>

              <section>
                <strong>Satisfaction</strong>
                <NumericChoice
                  name={`${question.questionnaire_item_id}-${candidate.candidate_id}-satisfaction`}
                  value={answer.satisfaction}
                  options={satisfactionOptions}
                  disabled={notAware}
                  onChange={(nextValue) =>
                    updateCandidate(
                      candidate.candidate_id,
                      "satisfaction",
                      nextValue
                    )
                  }
                />
              </section>

              <section>
                <strong>Trust</strong>
                <NumericChoice
                  name={`${question.questionnaire_item_id}-${candidate.candidate_id}-trust`}
                  value={answer.trust}
                  options={trustOptions}
                  disabled={notAware}
                  onChange={(nextValue) =>
                    updateCandidate(
                      candidate.candidate_id,
                      "trust",
                      nextValue
                    )
                  }
                />
              </section>
            </div>

            {notAware && (
              <p className="candidate-evaluation-derived">
                Satisfaction and trust were
                automatically coded as 2 — Neutral.
              </p>
            )}

            {answer.awareness === 1 &&
              (!answer.satisfaction ||
                !answer.trust) && (
                <p
                  className="candidate-evaluation-required"
                  role="alert"
                >
                  Satisfaction and trust are required
                  for an aware candidate.
                </p>
              )}
          </article>
        );
      })}
    </div>
  );
}

export function BallotSelectorControl({
  question,
  value,
  onChange,
  contextResponses = {},
}) {
  const settings =
    (question?.settings || question?.settings_json)
      ?.election_position || {};
  const evaluationVariable =
    settings.evaluation_variable;
  const evaluation =
    contextResponses[evaluationVariable] || {};
  const evaluationCandidates =
    evaluation.candidates || {};
  const minSelections = Number(
    settings.min_selections ?? 1
  );
  const maxSelections = Number(
    settings.max_selections ?? 1
  );
  const multiple = maxSelections > 1;
  const selectedValues = Array.isArray(
    value?.selected_candidate_ids
  )
    ? value.selected_candidate_ids
    : Array.isArray(value)
      ? value
      : typeof value === "string" && value
        ? [value]
        : [];
  const allCandidates = resolveCandidates(
    question
  );
  const ratedCandidates = allCandidates.filter(
    (candidate) => !candidate.is_undecided
  );
  const evaluationComplete =
    !evaluationVariable ||
    ratedCandidates.every((candidate) => {
      const rating =
        evaluationCandidates[
          candidate.candidate_id
        ];

      return (
        [1, 2].includes(rating?.awareness) &&
        [1, 2, 3].includes(
          rating?.satisfaction
        ) &&
        [1, 2, 3].includes(rating?.trust)
      );
    });
  const candidates = allCandidates.filter((candidate) => {
    if (candidate.is_undecided) {
      return maxSelections === 1;
    }

    return (
      evaluationCandidates[
        candidate.candidate_id
      ]?.awareness !== 2
    );
  });
  const distrustedSelections = selectedValues
    .map((candidateId) => {
      const candidate = allCandidates.find(
        (candidateOption) =>
          candidateOption.candidate_id === candidateId
      );

      if (
        !candidate ||
        candidate.is_undecided ||
        evaluationCandidates[candidateId]?.trust !== 3
      ) {
        return null;
      }

      return candidate;
    })
    .filter(Boolean);

  function toggleCandidate(candidate) {
    if (!multiple) {
      onChange({
        schema: "eios.ballot-selection.v1",
        position_code:
          settings.position_code || null,
        selected_candidate_ids: [
          candidate.candidate_id,
        ],
        selected_candidates: [
          {
            candidate_id:
              candidate.candidate_id,
            candidate_label: candidate.label,
          },
        ],
        max_selections: 1,
      });
      return;
    }

    const alreadySelected =
      selectedValues.includes(
        candidate.candidate_id
      );
    const nextValues = alreadySelected
      ? selectedValues.filter(
          (candidateId) =>
            candidateId !==
            candidate.candidate_id
        )
      : selectedValues.length < maxSelections
        ? [
            ...selectedValues,
            candidate.candidate_id,
          ]
        : selectedValues;

    onChange({
      schema: "eios.ballot-selection.v1",
      position_code:
        settings.position_code || null,
      selected_candidate_ids: nextValues,
      selected_candidates: nextValues.map(
        (candidateId) => {
          const selectedCandidate =
            candidates.find(
              (candidateOption) =>
                candidateOption.candidate_id ===
                candidateId
            );

          return {
            candidate_id: candidateId,
            candidate_label:
              selectedCandidate?.label ||
              candidateId,
          };
        }
      ),
      max_selections: maxSelections,
    });
  }

  const normalizedSelected = selectedValues;

  if (!evaluationComplete) {
    return (
      <div
        className="ballot-selector-locked"
        role="alert"
      >
        Complete Awareness, Satisfaction, and Trust
        for every candidate in this position before
        proceeding to the ballot choice.
      </div>
    );
  }

  return (
    <div className="ballot-selector-control">
      <p>
        Select at least {minSelections} and no
        more than {maxSelections}.
      </p>

      {candidates.length === 0 ? (
        <div className="preview-question__unsupported">
          No aware candidates are available for
          this ballot position.
        </div>
      ) : (
        <div className="preview-question__options">
          {candidates.map((candidate) => (
            <label key={candidate.candidate_id}>
              <input
                type={
                  multiple ? "checkbox" : "radio"
                }
                name={
                  question.questionnaire_item_id
                }
                checked={
                  normalizedSelected.includes(
                    candidate.candidate_id
                  )
                }
                disabled={
                  multiple &&
                  !normalizedSelected.includes(
                    candidate.candidate_id
                  ) &&
                  normalizedSelected.length >=
                    maxSelections
                }
                onChange={() =>
                  toggleCandidate(candidate)
                }
              />
              <span>{candidate.label}</span>
            </label>
          ))}
        </div>
      )}

      <strong className="ballot-selector-count">
        Selected: {normalizedSelected.length} / {maxSelections}
        {multiple && (
          <span>
            {" · "}Remaining: {Math.max(
              maxSelections - normalizedSelected.length,
              0
            )}
          </span>
        )}
      </strong>

      {distrustedSelections.length > 0 && (
        <div className="ballot-trust-conflict" role="alert">
          <strong>Trust-rating conflict</strong>
          <p>
            {distrustedSelections
              .map((candidate) => candidate.label)
              .join(", ")} {distrustedSelections.length === 1 ? "was" : "were"}
            rated 3 — Distrust in the AST section.
          </p>
          <p>
            Return to the Awareness, Satisfaction, and Trust section and
            revise the trust rating, or change the ballot preference before
            proceeding.
          </p>
        </div>
      )}
    </div>
  );
}
