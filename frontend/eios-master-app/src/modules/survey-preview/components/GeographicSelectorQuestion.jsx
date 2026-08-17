import "./GeographicSelectorQuestion.css";
import GeographicSelectorControl from "../../survey-engine/runtime/GeographicSelectorControl";

export default function GeographicSelectorQuestion(props) {
  return (
    <div className="geographic-selector-question">
      <GeographicSelectorControl {...props} />
    </div>
  );
}
