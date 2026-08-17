import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import LoginPage from "../modules/authentication/pages/LoginPage";
import ChangePasswordPage from "../modules/authentication/pages/ChangePasswordPage";
import SplashScreen from "../modules/authentication/pages/SplashScreen";
import ProtectedRoute from "../modules/authentication/routes/ProtectedRoute";

import DashboardPage from "../modules/dashboard/pages/DashboardPage";

import AdministrationDashboardPage from "../modules/administration/pages/AdministrationDashboardPage";
import EnterpriseFoundationPage from "../modules/administration/pages/EnterpriseFoundationPage";
import GeographicMasterPage from "../modules/administration/pages/GeographicMasterPage";
import EnterpriseJobManagerPage from "../modules/administration/pages/EnterpriseJobManagerPage";
import UserAdministrationPage from "../modules/administration/pages/UserAdministrationPage";

import FieldEnumeratorWorkspacePage from "../modules/field-operations/pages/FieldEnumeratorWorkspacePage";
import DeploymentOperationsPage from "../modules/field-operations/pages/DeploymentOperationsPage";
import AnalyticsWorkspacePage from "../modules/analytics/pages/AnalyticsWorkspacePage";
import GisIntelligencePage from "../modules/gis/pages/GisIntelligencePage";

import EnterpriseQuestionEditorPage from "../modules/enterprise-question-editor/pages/EnterpriseQuestionEditorPage";

import SurveyEnginePage from "../modules/survey-engine/pages/SurveyEnginePage";
import QuestionnaireDesignerPage from "../modules/survey-engine/pages/QuestionnaireDesignerPage";
import FieldInterviewRuntimePage from "../modules/field-operations/pages/FieldInterviewRuntimePage";
import {
  SurveyPreviewPage,
} from "../modules/survey-preview";

import EEUIPlaygroundPage from "../eeui/playground/EEUIPlaygroundPage";

import {
  SurveyStudioHomePage,
} from "../studios";

const ADMIN_ROLES = [
  "ADMIN",
];

const ENUMERATOR_ROLES = [
  "ENUMERATOR",
];

function ModulePage({
  title,
  description,
}) {
  return (
    <MainLayout>
      <section>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
    </MainLayout>
  );
}

function ProtectedModule({
  children,
  allowedRoles = [],
}) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {children}
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            PUBLIC ROUTES
        ====================================================== */}

        <Route
          path="/"
          element={<SplashScreen />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/change-password"
          element={
            <ProtectedModule>
              <ChangePasswordPage />
            </ProtectedModule>
          }
        />

<Route
  path="/enumerator/interview/:deploymentId"
  element={
    <ProtectedModule allowedRoles={ENUMERATOR_ROLES}>
      <FieldInterviewRuntimePage />
    </ProtectedModule>
  }
/>

        {/* =====================================================
            MAIN DASHBOARD
        ====================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedModule>
              <DashboardPage />
            </ProtectedModule>
          }
        />

        {/* =====================================================
            PROJECTS
        ====================================================== */}

        <Route
          path="/projects"
          element={
            <ProtectedModule>
              <ModulePage
                title="Projects"
                description="Manage enterprise projects, research programs, and operational initiatives."
              />
            </ProtectedModule>
          }
        />

        {/* =====================================================
            SURVEY AND CENSUS DESIGN STUDIO
        ====================================================== */}

        <Route
          path="/survey-builder"
          element={
            <ProtectedModule>
              <SurveyEnginePage />
            </ProtectedModule>
          }
        />

        <Route
          path="/survey-builder/:surveyId/designer"
          element={
            <ProtectedModule>
              <QuestionnaireDesignerPage />
            </ProtectedModule>
          }
        />

        <Route
          path="/survey-builder/:surveyId/preview"
          element={
            <ProtectedModule>
              <SurveyPreviewPage />
            </ProtectedModule>
          }
        />

        <Route
          path="/survey-studio"
          element={
            <ProtectedModule>
              <SurveyStudioHomePage />
            </ProtectedModule>
          }
        />

        <Route
          path="/enterprise-question-editor"
          element={
            <ProtectedModule allowedRoles={ADMIN_ROLES}>
              <EnterpriseQuestionEditorPage />
            </ProtectedModule>
          }
        />

        {/* =====================================================
            FIELD OPERATIONS
        ====================================================== */}

        <Route
          path="/deployment"
          element={
            <ProtectedModule>
              <DeploymentOperationsPage title="Operations Control" />
            </ProtectedModule>
          }
        />

        <Route
          path="/enumerator"
          element={
            <ProtectedModule allowedRoles={ENUMERATOR_ROLES}>
              <FieldEnumeratorWorkspacePage />
            </ProtectedModule>
          }
        />

        <Route
          path="/supervisor"
          element={
            <ProtectedModule>
              <DeploymentOperationsPage title="Supervisor Field Operations" />
            </ProtectedModule>
          }
        />

        {/* =====================================================
            ANALYTICS AND GIS
        ====================================================== */}

        <Route
          path="/analytics"
          element={
            <ProtectedModule>
              <AnalyticsWorkspacePage />
            </ProtectedModule>
          }
        />

        <Route
          path="/gis"
          element={
            <ProtectedModule>
              <GisIntelligencePage />
            </ProtectedModule>
          }
        />

        <Route
          path="/repository"
          element={
            <ProtectedModule>
              <ModulePage
                title="Repository"
                description="Manage documents, datasets, reports, instruments, and enterprise records."
              />
            </ProtectedModule>
          }
        />

        {/* =====================================================
            ADMINISTRATION — ADMIN ONLY
        ====================================================== */}

        <Route
          path="/administration"
          element={
            <ProtectedModule allowedRoles={ADMIN_ROLES}>
              <AdministrationDashboardPage />
            </ProtectedModule>
          }
        />

        <Route
          path="/administration/enterprise-foundation"
          element={
            <ProtectedModule allowedRoles={ADMIN_ROLES}>
              <EnterpriseFoundationPage />
            </ProtectedModule>
          }
        />

        <Route
          path="/administration/users"
          element={
            <ProtectedModule allowedRoles={ADMIN_ROLES}>
              <UserAdministrationPage />
            </ProtectedModule>
          }
        />

        <Route
          path="/administration/geography"
          element={
            <ProtectedModule allowedRoles={ADMIN_ROLES}>
              <GeographicMasterPage />
            </ProtectedModule>
          }
        />

        <Route
          path="/administration/enterprise-jobs"
          element={
            <ProtectedModule allowedRoles={ADMIN_ROLES}>
              <EnterpriseJobManagerPage />
            </ProtectedModule>
          }
        />

        {/* =====================================================
            EEUI DEVELOPMENT — ADMIN ONLY
        ====================================================== */}

        <Route
          path="/eeui-playground"
          element={
            <ProtectedModule allowedRoles={ADMIN_ROLES}>
              <EEUIPlaygroundPage />
            </ProtectedModule>
          }
        />

        {/* =====================================================
            FALLBACK — MUST ALWAYS BE LAST
        ====================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
