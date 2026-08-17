import {
  ChevronLeft,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import MainLayout from "../../../layouts/MainLayout";

import {
  PreviewRenderer,
} from "../components";

import {
  usePreviewRenderer,
} from "../hooks";

import "../styles/preview.css";

export default function SurveyPreviewPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const {
    form,
    manifest,
    validation,

    sections,
    activeSection,
    activeSectionIndex,

    responses,

    loading,
    errorMessage,

    canGoPrevious,
    canGoNext,
    progressPercent,

    updateResponse,
    goToSection,
    goPrevious,
    goNext,
    reload,
  } = usePreviewRenderer(surveyId);

  return (
    <MainLayout>
      <section className="survey-preview-page">
        <header className="survey-preview-page__toolbar">
          <div>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/survey-builder/${surveyId}/designer`
                )
              }
            >
              <ChevronLeft size={17} />
              Back to Designer
            </button>

            <div>
              <span>
                EIOS Runtime Preview
              </span>

              <h1>
                {form?.form_name ||
                  "Survey Preview"}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={reload}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Recompile Preview
          </button>
        </header>

        {loading ? (
          <div className="survey-preview-page__loading">
            <LoaderCircle size={30} />

            <strong>
              Compiling preview...
            </strong>

            <span>
              The Preview Engine is loading
              the latest compiled form package.
            </span>
          </div>
        ) : errorMessage ? (
          <div className="enterprise-foundation-state enterprise-foundation-state--error">
            {errorMessage}
          </div>
        ) : (
          <PreviewRenderer
            form={form}
            manifest={manifest}
            validation={validation}
            sections={sections}
            activeSection={
              activeSection
            }
            activeSectionIndex={
              activeSectionIndex
            }
            responses={responses}
            canGoPrevious={
              canGoPrevious
            }
            canGoNext={canGoNext}
            progressPercent={
              progressPercent
            }
            onResponseChange={
              updateResponse
            }
            onPrevious={goPrevious}
            onNext={goNext}
            onGoToSection={
              goToSection
            }
          />
        )}
      </section>
    </MainLayout>
  );
}