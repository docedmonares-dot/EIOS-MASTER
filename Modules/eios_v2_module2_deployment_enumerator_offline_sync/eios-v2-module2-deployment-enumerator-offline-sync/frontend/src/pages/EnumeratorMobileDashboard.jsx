import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EnumeratorAPI } from '../services/eiosModule2Api';
import { getAllRecords } from '../offline/indexedDbEngine';

export default function EnumeratorMobileDashboard() {
  const [quota, setQuota] = useState([]);
  const [offlineRecords, setOfflineRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  function normalizeQuotaResponse(response) {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.quotas)) {
      return response.quotas;
    }

    if (Array.isArray(response?.assignments)) {
      return response.assignments;
    }

    return [];
  }

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  const loadDashboard = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const results = await Promise.allSettled([
        EnumeratorAPI.quota(),
        getAllRecords('responses'),
      ]);

      const quotaResult = results[0];
      const offlineResult = results[1];

      if (quotaResult.status === 'fulfilled') {
        setQuota(normalizeQuotaResponse(quotaResult.value));
      } else {
        console.error('Unable to load enumerator quota:', quotaResult.reason);
        setQuota([]);
      }

      if (offlineResult.status === 'fulfilled') {
        setOfflineRecords(
          Array.isArray(offlineResult.value) ? offlineResult.value : []
        );
      } else {
        console.error(
          'Unable to load offline records:',
          offlineResult.reason
        );
        setOfflineRecords([]);
      }

      if (
        quotaResult.status === 'rejected' &&
        offlineResult.status === 'rejected'
      ) {
        setError(
          'The dashboard could not load your assignments or offline records. Please check the connection and try again.'
        );
      } else if (quotaResult.status === 'rejected') {
        setError(
          'Your offline records are available, but the assigned quota could not be loaded from the server.'
        );
      } else if (offlineResult.status === 'rejected') {
        setError(
          'Your assignment was loaded, but locally stored records could not be read.'
        );
      }

      setLastUpdated(new Date());
    } catch (loadError) {
      console.error('Enumerator dashboard loading error:', loadError);

      setError(
        'Something went wrong while loading the Enumerator Dashboard. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const offlineStatistics = useMemo(() => {
    return offlineRecords.reduce(
      (summary, record) => {
        const status = String(record?.sync_status || '')
          .trim()
          .toLowerCase();

        summary.total += 1;

        if (status === 'synced') {
          summary.synced += 1;
        } else if (status === 'failed') {
          summary.failed += 1;
          summary.unsynced += 1;
        } else {
          summary.unsynced += 1;
        }

        return summary;
      },
      {
        total: 0,
        synced: 0,
        unsynced: 0,
        failed: 0,
      }
    );
  }, [offlineRecords]);

  const quotaTotals = useMemo(() => {
    return quota.reduce(
      (totals, assignment) => {
        const target = toNumber(assignment?.quota_target);
        const completed = toNumber(assignment?.quota_completed);

        const remaining =
          assignment?.quota_remaining !== undefined &&
          assignment?.quota_remaining !== null
            ? toNumber(assignment.quota_remaining)
            : Math.max(target - completed, 0);

        totals.target += target;
        totals.completed += completed;
        totals.remaining += remaining;

        return totals;
      },
      {
        target: 0,
        completed: 0,
        remaining: 0,
      }
    );
  }, [quota]);

  function getAssignmentTitle(assignment) {
    const barangay =
      assignment?.barangay ||
      assignment?.barangay_name ||
      'Barangay not specified';

    const precinct =
      assignment?.precinct_cluster ||
      assignment?.precinct_cluster_name ||
      assignment?.purok ||
      assignment?.sitio;

    return precinct ? `${barangay} / ${precinct}` : barangay;
  }

  function getProjectType(assignment) {
    const projectType =
      assignment?.project_type ||
      assignment?.survey_type ||
      assignment?.deployment_type;

    return projectType ? String(projectType).toUpperCase() : null;
  }

  function formatDateTime(date) {
    if (!date) {
      return 'Not yet updated';
    }

    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  if (loading) {
    return (
      <div className="mobile-page">
        <h1>Enumerator Dashboard</h1>

        <div className="card">
          <p>Loading your field assignment and offline records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page">
      <div className="dashboard-heading">
        <div>
          <h1>Enumerator Dashboard</h1>
          <p>
            View your assigned area, field quota, and synchronization status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard({ isRefresh: true })}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="card dashboard-alert" role="alert">
          <strong>Dashboard Notice</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="cards">
        <div className="card">
          <small>Assignments</small>
          <b>{quota.length}</b>
        </div>

        <div className="card">
          <small>Total Target</small>
          <b>{quotaTotals.target}</b>
        </div>

        <div className="card">
          <small>Completed</small>
          <b>{quotaTotals.completed}</b>
        </div>

        <div className="card">
          <small>Remaining</small>
          <b>{quotaTotals.remaining}</b>
        </div>

        <div className="card">
          <small>Offline Records</small>
          <b>{offlineStatistics.total}</b>
        </div>

        <div className="card">
          <small>Unsynced</small>
          <b>{offlineStatistics.unsynced}</b>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>My Assigned Areas</h2>

        {quota.length === 0 ? (
          <div className="card">
            <h3>No active assignment</h3>
            <p>
              You do not currently have an assigned survey or census area.
              Please contact your supervisor.
            </p>
          </div>
        ) : (
          quota.map((assignment, index) => {
            const target = toNumber(assignment?.quota_target);
            const completed = toNumber(assignment?.quota_completed);

            const remaining =
              assignment?.quota_remaining !== undefined &&
              assignment?.quota_remaining !== null
                ? toNumber(assignment.quota_remaining)
                : Math.max(target - completed, 0);

            const projectType = getProjectType(assignment);

            const assignmentKey =
              assignment?.assignment_id ||
              assignment?.id ||
              `${assignment?.barangay || 'assignment'}-${index}`;

            return (
              <div className="card assignment-card" key={assignmentKey}>
                <div className="assignment-card-heading">
                  <div>
                    <h3>{getAssignmentTitle(assignment)}</h3>

                    {projectType && (
                      <span className="assignment-type">{projectType}</span>
                    )}
                  </div>

                  <span className="assignment-status">
                    {assignment?.assignment_status ||
                      assignment?.status ||
                      'Assigned'}
                  </span>
                </div>

                {assignment?.project_name && (
                  <p>
                    <strong>Project:</strong> {assignment.project_name}
                  </p>
                )}

                {assignment?.deployment_name && (
                  <p>
                    <strong>Deployment:</strong>{' '}
                    {assignment.deployment_name}
                  </p>
                )}

                {assignment?.supervisor_name && (
                  <p>
                    <strong>Supervisor:</strong>{' '}
                    {assignment.supervisor_name}
                  </p>
                )}

                {assignment?.psgc_code && (
                  <p>
                    <strong>PSGC Code:</strong> {assignment.psgc_code}
                  </p>
                )}

                <div className="assignment-quota">
                  <div>
                    <small>Target</small>
                    <strong>{target}</strong>
                  </div>

                  <div>
                    <small>Completed</small>
                    <strong>{completed}</strong>
                  </div>

                  <div>
                    <small>Remaining</small>
                    <strong>{remaining}</strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="card dashboard-footer-status">
        <small>Last updated</small>
        <strong>{formatDateTime(lastUpdated)}</strong>

        <small>Local synchronization</small>
        <strong>
          {offlineStatistics.unsynced === 0
            ? 'All local records are synced'
            : `${offlineStatistics.unsynced} record${
                offlineStatistics.unsynced === 1 ? '' : 's'
              } waiting for sync`}
        </strong>

        {offlineStatistics.failed > 0 && (
          <p>
            {offlineStatistics.failed} synchronization attempt
            {offlineStatistics.failed === 1 ? '' : 's'} failed and must be
            retried.
          </p>
        )}
      </div>
    </div>
  );
}