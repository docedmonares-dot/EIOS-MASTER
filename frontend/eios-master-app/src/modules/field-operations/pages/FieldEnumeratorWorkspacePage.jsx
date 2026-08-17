import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  CloudOff,
  LoaderCircle,
  MapPin,
  PlayCircle,
  RefreshCw,
  UserRound,
} from "lucide-react";

import MainLayout from "../../../layouts/MainLayout";
import { useAuth } from "../../authentication/context/AuthContext";
import {
  getMyDeploymentAssignments,
} from "../../../services/deploymentPersonnelService";

import {
  getOwnOfflineResponses,
  syncOwnOfflineResponse,
} from "../../../services/offlineResponseService";

import {
  getOwnAreaAssignments,
} from "../../../services/areaAssignmentService";
import { captureDeviceLocation } from "../../../utils/captureDeviceLocation";

export default function FieldEnumeratorWorkspacePage() {
  const { user } = useAuth();

  const navigate = useNavigate();

  const [
    assignmentData,
    setAssignmentData,
  ] = useState(null);

  const [
    loadingAssignment,
    setLoadingAssignment,
  ] = useState(true);

  const [
    assignmentError,
    setAssignmentError,
  ] = useState("");

  const [
    offlineResponses,
    setOfflineResponses,
  ] = useState([]);

  const [
    loadingOfflineResponses,
    setLoadingOfflineResponses,
  ] = useState(true);

  const [
    synchronizing,
    setSynchronizing,
  ] = useState(false);

  const syncLockRef = useRef(false);

  const [isOnline, setIsOnline] = useState(
    () => navigator.onLine
  );

  const [
    syncMessage,
    setSyncMessage,
  ] = useState("");

  const [
    syncError,
    setSyncError,
  ] = useState("");

  const [
    areaAssignments,
    setAreaAssignments,
  ] = useState([]);

  const [
    loadingAreaAssignments,
    setLoadingAreaAssignments,
  ] = useState(true);

  const [
    areaAssignmentError,
    setAreaAssignmentError,
  ] = useState("");

  const [gpsDiagnostic, setGpsDiagnostic] = useState({
    status: "idle",
  });

  async function checkGpsStatus() {
    setGpsDiagnostic({ status: "checking" });

    const result = await captureDeviceLocation({
      timeout: 15000,
      maximumAge: 0,
    });

    setGpsDiagnostic(result);
  }

  useEffect(() => {
    let mounted = true;

    async function loadAssignments() {
      try {
        setLoadingAssignment(true);
        setAssignmentError("");

        const result =
          await getMyDeploymentAssignments();

        if (!mounted) {
          return;
        }

        setAssignmentData(
          result || null
        );
      } catch (error) {
        console.error(
          "Enumerator assignment loading failed:",
          error
        );

        if (!mounted) {
          return;
        }

        setAssignmentError(
          error?.message ||
            "Unable to load your field assignment."
        );
      } finally {
        if (mounted) {
          setLoadingAssignment(false);
        }
      }
    }

    loadAssignments();

    return () => {
      mounted = false;
    };
  }, []);

  async function loadOfflineResponses() {
    try {
      setLoadingOfflineResponses(true);
      setSyncError("");

      const result =
        await getOwnOfflineResponses();

      setOfflineResponses(
        Array.isArray(result?.responses)
          ? result.responses
          : []
      );
    } catch (error) {
      console.error(
        "Offline response loading failed:",
        error
      );

      setSyncError(
        error?.message ||
          "Unable to load pending synchronization records."
      );
    } finally {
      setLoadingOfflineResponses(false);
    }
  }

  useEffect(() => {
    loadOfflineResponses();
  }, []);

  async function loadAreaAssignments() {
    try {
      setLoadingAreaAssignments(true);
      setAreaAssignmentError("");

      const result =
        await getOwnAreaAssignments();

      setAreaAssignments(
        Array.isArray(result?.assignments)
          ? result.assignments
          : []
      );
    } catch (error) {
      console.error(
        "Area assignment loading failed:",
        error
      );

      setAreaAssignmentError(
        error?.message ||
          "Unable to load your area assignment."
      );
    } finally {
      setLoadingAreaAssignments(false);
    }
  }

  useEffect(() => {
    loadAreaAssignments();
  }, []);

  const assignments =
    useMemo(
      () =>
        Array.isArray(
          assignmentData?.assignments
        )
          ? assignmentData.assignments
          : [],
      [assignmentData]
    );

  const activeAssignment =
    useMemo(
      () =>
        assignments.find(
          (assignment) =>
            assignment.assignment_status ===
              "Assigned" &&
            assignment.operational_status ===
              "Ready"
        ) ||
        assignments[0] ||
        null,
      [assignments]
    );

  const packageDeploymentId =
    activeAssignment
      ?.package_deployment_id ||
    null;

  const canStartInterview =
    Boolean(
      packageDeploymentId &&
        activeAssignment
          ?.deployment_package
    );

  const pendingResponses =
    useMemo(
      () =>
        offlineResponses.filter(
          (response) =>
            String(
              response?.sync_status || ""
            )
              .trim()
              .toLowerCase() !==
            "synced"
        ),
      [offlineResponses]
    );

  const pendingSyncCount =
    pendingResponses.length;

  const activeAreaAssignment =
    useMemo(
      () =>
        areaAssignments.find(
          (assignment) =>
            assignment.deployment_id ===
              activeAssignment
                ?.operational_deployment_id &&
            [
              "Assigned",
              "In Progress",
              "Completed",
            ].includes(
              assignment.assignment_status
            )
        ) ||
        areaAssignments[0] ||
        null,
      [
        areaAssignments,
        activeAssignment,
      ]
    );

  const quotaTarget =
    Number(
      activeAreaAssignment
        ?.quota_target || 0
    );

  const quotaCompleted =
    Number(
      activeAreaAssignment
        ?.quota_completed || 0
    );

  const quotaRemaining =
    Number(
      activeAreaAssignment
        ?.quota_remaining || 0
    );

  function startNextInterview() {
    if (!packageDeploymentId) {
      return;
    }

    navigate(
      `/enumerator/interview/${packageDeploymentId}`
    );
  }

  async function synchronizePendingResponses() {
    if (
      syncLockRef.current ||
      !navigator.onLine ||
      pendingResponses.length === 0
    ) {
      return;
    }

    try {
      syncLockRef.current = true;
      setSynchronizing(true);
      setSyncMessage("");
      setSyncError("");

      let syncedCount = 0;

      for (
        const response
        of pendingResponses
      ) {
        if (
          !response?.offline_response_id
        ) {
          continue;
        }

        await syncOwnOfflineResponse(
          response.offline_response_id
        );

        syncedCount += 1;
      }

      await loadOfflineResponses();
      await loadAreaAssignments();

      setSyncMessage(
        syncedCount === 1
          ? "1 interview synchronized successfully."
          : `${syncedCount} interviews synchronized successfully.`
      );
    } catch (error) {
      console.error(
        "Synchronization failed:",
        error
      );

      await loadOfflineResponses();
      await loadAreaAssignments();     

      setSyncError(
        error?.message ||
          "Unable to synchronize pending interviews."
      );
    } finally {
      syncLockRef.current = false;
      setSynchronizing(false);
    }
  }

  const automaticSyncRef = useRef(null);

  useEffect(() => {
    automaticSyncRef.current = synchronizePendingResponses;
  });

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      automaticSyncRef.current?.();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const retryTimer = window.setInterval(() => {
      if (navigator.onLine) {
        automaticSyncRef.current?.();
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.clearInterval(retryTimer);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || pendingSyncCount === 0) {
      return undefined;
    }

    const startupTimer = window.setTimeout(() => {
      automaticSyncRef.current?.();
    }, 1000);

    return () => window.clearTimeout(startupTimer);
  }, [isOnline, pendingSyncCount]);

  const displayName =
    user?.name ||
    user?.full_name ||
    user?.username ||
    "Field Enumerator";

  return (
    <MainLayout>
      <section
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          paddingBottom: "32px",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <span className="dashboard-overline">
            Field Operations
          </span>

          <h1
            style={{
              margin: "6px 0 8px",
              fontSize: "clamp(28px, 6vw, 42px)",
              lineHeight: 1.1,
            }}
          >
            Field Enumerator Workspace
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "16px",
              color: "#64748b",
            }}
          >
            Good day, {displayName}. Complete your assigned
            field mission and keep every interview safely
            synchronized.
          </p>
        </div>

        {assignmentError && (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              background: "#fef2f2",
              color: "#991b1b",
            }}
          >
            {assignmentError}
          </div>
        )}

        {areaAssignmentError && (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              background: "#fef2f2",
              color: "#991b1b",
            }}
          >
            {areaAssignmentError}
          </div>
        )}

        <article
          style={{
            padding: "20px",
            marginBottom: "18px",
            border: "1px solid #dbeafe",
            borderRadius: "16px",
            background: "#eff6ff",
          }}
        >
          <span
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Today&apos;s Mission
          </span>

          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "22px",
            }}
          >
            {loadingAssignment
              ? "Loading your assignment..."
              : activeAssignment?.deployment_name ||
                "No active assignment yet"}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#475569",
            }}
          >
            {activeAssignment ? (
              <>
                Role:{" "}
                <strong>
                  {activeAssignment.deployment_role ||
                    "Enumerator"}
                </strong>
                {" · "}
                Assignment:{" "}
                <strong>
                  {activeAssignment.assignment_status ||
                    "Assigned"}
                </strong>
                {" · "}
                Deployment:{" "}
                <strong>
                  {activeAssignment.operational_status ||
                    "Ready"}
                </strong>
                {" · "}
                Survey Package:{" "}
                <strong>
                  {activeAssignment.deployment_package?.version
                    ? `Version ${activeAssignment.deployment_package.version}`
                    : "Not available"}
                </strong>

                {activeAreaAssignment && (
                  <>
                    {" · "}
                    Area:{" "}
                    <strong>
                      {[
                        activeAreaAssignment.municipality,
                        activeAreaAssignment.barangay,
                      ]
                        .filter(Boolean)
                        .join(" / ") ||
                        "Not specified"}
                    </strong>
                  </>
                )}

              </>
            ) : loadingAssignment ? (
              "Checking your current field assignment..."
            ) : (
              "Your project, survey, area, target, schedule, and supervisor will appear here once an assignment is issued."
            )}
          </p>
        </article>

        <button
          type="button"
          disabled={!canStartInterview}
          onClick={startNextInterview}
          style={{
            width: "100%",
            minHeight: "64px",
            marginBottom: "18px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            border: 0,
            borderRadius: "16px",
            fontSize: "18px",
            fontWeight: 700,
            background: canStartInterview
              ? "#2563eb"
              : "#cbd5e1",
            color: canStartInterview
              ? "#ffffff"
              : "#475569",
            cursor: canStartInterview
              ? "pointer"
              : "not-allowed",
          }}
        >
          <PlayCircle size={25} />
          Start Next Interview
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <article
            style={{
              padding: "16px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              background: "#ffffff",
            }}
          >
            <ClipboardList size={22} />

            <span
              style={{
                display: "block",
                marginTop: "10px",
                color: "#64748b",
              }}
            >
              Target
            </span>

            <strong
              style={{
                display: "block",
                marginTop: "4px",
                fontSize: "26px",
              }}
            >
              {loadingAreaAssignments
                ? "..."
                : quotaTarget}
            </strong>
          </article>

          <article
            style={{
              padding: "16px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              background: "#ffffff",
            }}
          >
            <RefreshCw size={22} />

            <span
              style={{
                display: "block",
                marginTop: "10px",
                color: "#64748b",
              }}
            >
              Completed
            </span>

            <strong
              style={{
                display: "block",
                marginTop: "4px",
                fontSize: "26px",
              }}
            >
              {loadingAreaAssignments
                ? "..."
                : quotaCompleted}
            </strong>
          </article>

          <article
            style={{
              padding: "16px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              background: "#ffffff",
            }}
          >
            <CloudOff size={22} />

            <span
              style={{
                display: "block",
                marginTop: "10px",
                color: "#64748b",
              }}
            >
              Pending Sync
            </span>

            <strong
              style={{
                display: "block",
                marginTop: "4px",
                fontSize: "26px",
              }}
            >
{loadingOfflineResponses
                ? "..."
                : pendingSyncCount}
            </strong>
          </article>

          <article
            style={{
              padding: "16px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              background: "#ffffff",
            }}
          >
            <MapPin size={22} />

            <span
              style={{
                display: "block",
                marginTop: "10px",
                color: "#64748b",
              }}
            >
              Remaining
            </span>

            <strong
              style={{
                display: "block",
                marginTop: "4px",
                fontSize: "26px",
              }}
            >
              {loadingAreaAssignments
                ? "..."
                : quotaRemaining}
            </strong>
          </article>

        </div>

        {syncError && (
          <div
            style={{
              marginBottom: "14px",
              padding: "14px 16px",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              background: "#fef2f2",
              color: "#991b1b",
            }}
          >
            {syncError}
          </div>
        )}

        {syncMessage && (
          <div
            style={{
              marginBottom: "14px",
              padding: "14px 16px",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              background: "#f0fdf4",
              color: "#166534",
            }}
          >
            {syncMessage}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <button
            type="button"
            style={{
              minHeight: "58px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              border: "1px solid #cbd5e1",
              borderRadius: "14px",

              background: "#ffffff",
              color: "#0f172a",
              cursor: "default",
              fontWeight: 700,
            }}
          >
            <ClipboardList size={21} />
                My Assignments ({assignments.length})
          </button>

          <button
            type="button"
            onClick={checkGpsStatus}
            disabled={gpsDiagnostic.status === "checking"}
            style={{
              minHeight: "58px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              border: "1px solid #cbd5e1",
              borderRadius: "14px",
              background: "#ffffff",
              cursor:
                gpsDiagnostic.status === "checking"
                  ? "wait"
                  : "pointer",
              fontWeight: 700,
            }}
          >
            {gpsDiagnostic.status === "checking" ? (
              <LoaderCircle size={21} />
            ) : (
              <MapPin size={21} />
            )}
            {gpsDiagnostic.status === "checking"
              ? "Checking GPS..."
              : "GPS Status"}
          </button>

<div
  role="status"
  aria-live="polite"
  style={{
              minHeight: "58px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              border: "1px solid #cbd5e1",
              borderRadius: "14px",
background:
  pendingSyncCount > 0 &&
  !synchronizing
    ? "#ffffff"
    : "#f8fafc",
color:
  pendingSyncCount > 0 &&
  !synchronizing
    ? "#0f172a"
    : "#94a3b8",
fontWeight: 700,
            }}
          >
            <RefreshCw size={21} />
            {synchronizing
              ? "Synchronizing..."
              : !isOnline
                ? `Offline (${pendingSyncCount} pending)`
              : pendingSyncCount > 0
                ? `Automatic sync queued (${pendingSyncCount})`
                : "Automatically synchronized"}
          </div>

          <button
            type="button"
            style={{
              minHeight: "58px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              border: "1px solid #cbd5e1",
              borderRadius: "14px",
              background: "#ffffff",
              fontWeight: 700,
            }}
          >
            <UserRound size={21} />
            My Profile
          </button>
        </div>

        {gpsDiagnostic.status !== "idle" &&
          gpsDiagnostic.status !== "checking" && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: "14px",
                padding: "16px",
                border: `1px solid ${
                  gpsDiagnostic.status === "captured"
                    ? "#86efac"
                    : "#fbbf24"
                }`,
                borderRadius: "14px",
                background:
                  gpsDiagnostic.status === "captured"
                    ? "#f0fdf4"
                    : "#fffbeb",
                color:
                  gpsDiagnostic.status === "captured"
                    ? "#166534"
                    : "#92400e",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  fontWeight: 800,
                }}
              >
                {gpsDiagnostic.status === "captured" ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
                {gpsDiagnostic.status === "captured"
                  ? "GPS location available"
                  : "GPS location unavailable"}
              </div>

              {gpsDiagnostic.status === "captured" ? (
                <div style={{ marginTop: "9px", lineHeight: 1.6 }}>
                  <div>
                    Coordinates: {gpsDiagnostic.latitude.toFixed(6)}, {" "}
                    {gpsDiagnostic.longitude.toFixed(6)}
                  </div>
                  <div>
                    Accuracy: {Math.round(gpsDiagnostic.accuracy)} meters
                  </div>
                  <div>
                    Captured: {new Date(
                      gpsDiagnostic.captured_at
                    ).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: "9px", lineHeight: 1.6 }}>
                  <div>Reason: {gpsDiagnostic.reason}</div>
                  {!gpsDiagnostic.secure_context && (
                    <div>
                      Mobile browsers require production HTTPS for GPS.
                      The temporary local HTTP test may block location access.
                    </div>
                  )}
                  {gpsDiagnostic.reason === "PERMISSION_DENIED" && (
                    <div>
                      Allow Location for the EIOS site in browser settings,
                      then check again.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
      </section>
    </MainLayout>
  );
}
