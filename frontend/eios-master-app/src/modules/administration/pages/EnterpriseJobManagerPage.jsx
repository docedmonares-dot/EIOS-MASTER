import { useCallback, useEffect, useState } from "react";

import MainLayout from "../../../layouts/MainLayout";

import {
  getEnterpriseJobSummary,
  getEnterpriseJobTypes,
  getRecentEnterpriseJobs,
} from "../../../services/enterpriseJobService";

export default function EnterpriseJobManagerPage() {
  const [summary, setSummary] = useState({
    running_jobs: 0,
    queued_jobs: 0,
    completed_today: 0,
    failed_jobs: 0,
    total_jobs: 0,
    active_workers: 0,
    unhealthy_workers: 0,
    total_workers: 0,
    active_job_types: 0,
    executive_integration: "Checking",
  });

  const [jobTypes, setJobTypes] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadEnterpriseJobs = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [
        summaryData,
        jobTypesData,
        recentJobsData,
      ] = await Promise.all([
        getEnterpriseJobSummary(),
        getEnterpriseJobTypes(),
        getRecentEnterpriseJobs(20),
      ]);

      setSummary({
        running_jobs: summaryData?.running_jobs ?? 0,
        queued_jobs: summaryData?.queued_jobs ?? 0,
        completed_today: summaryData?.completed_today ?? 0,
        failed_jobs: summaryData?.failed_jobs ?? 0,
        total_jobs: summaryData?.total_jobs ?? 0,
        active_workers: summaryData?.active_workers ?? 0,
        unhealthy_workers:
          summaryData?.unhealthy_workers ?? 0,
        total_workers: summaryData?.total_workers ?? 0,
        active_job_types:
          summaryData?.active_job_types ?? 0,
        executive_integration:
          summaryData?.executive_integration ||
          "Connected",
      });

      setJobTypes(jobTypesData || []);
      setRecentJobs(recentJobsData || []);
    } catch (error) {
      console.error(
        "Enterprise Job Manager loading failed:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to load Enterprise Job Manager."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnterpriseJobs();
  }, [loadEnterpriseJobs]);

  return (
    <MainLayout>
      <section className="enterprise-job-page">
        <div className="enterprise-job-header">
          <div>
            <span>Book VIII · Title II</span>

            <h1>Enterprise Job Manager</h1>

            <p>
              Monitor registered background job types, queue status,
              worker readiness, progress, and auditable processing
              activity across enterprise services.
            </p>
          </div>

          <button
            type="button"
            onClick={loadEnterpriseJobs}
            disabled={loading}
            className="enterprise-job-test-button"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {errorMessage && (
          <div className="enterprise-job-state enterprise-job-state--error">
            {errorMessage}
          </div>
        )}

        <div className="enterprise-job-summary">
          <article>
            <span>Running Jobs</span>
            <strong>
              {loading ? "..." : summary.running_jobs}
            </strong>
          </article>

          <article>
            <span>Queued Jobs</span>
            <strong>
              {loading ? "..." : summary.queued_jobs}
            </strong>
          </article>

          <article>
            <span>Completed Today</span>
            <strong>
              {loading ? "..." : summary.completed_today}
            </strong>
          </article>

          <article>
            <span>Failed Jobs</span>
            <strong>
              {loading ? "..." : summary.failed_jobs}
            </strong>
          </article>

          <article>
            <span>Active Workers</span>
            <strong>
              {loading ? "..." : summary.active_workers}
            </strong>
          </article>

          <article>
            <span>Active Job Types</span>
            <strong>
              {loading ? "..." : summary.active_job_types}
            </strong>
          </article>

          <article>
            <span>Total Jobs</span>
            <strong>
              {loading ? "..." : summary.total_jobs}
            </strong>
          </article>

          <article>
            <span>Executive Integration</span>
            <strong className="enterprise-job-connected">
              {loading
                ? "Checking"
                : summary.executive_integration}
            </strong>
          </article>
        </div>

        <section className="enterprise-job-panel">
          <div className="enterprise-job-panel__header">
            <div>
              <span>Job Types</span>
              <h2>Registered Processing Capabilities</h2>
            </div>

            <strong>
              {loading ? "..." : `${jobTypes.length} active`}
            </strong>
          </div>

          {loading ? (
            <div className="enterprise-job-state">
              Loading job types...
            </div>
          ) : jobTypes.length === 0 ? (
            <div className="enterprise-job-state">
              No active enterprise job types were found.
            </div>
          ) : (
            <div className="enterprise-job-types-grid">
              {jobTypes.map((jobType) => (
                <article
                  key={jobType.job_type_id}
                  className="enterprise-job-type-card"
                >
                  <span>{jobType.job_category}</span>

                  <h3>{jobType.job_type_name}</h3>

                  <p>{jobType.description}</p>

                  <div className="enterprise-job-type-card__meta">
                    <small>
                      Priority: {jobType.default_priority}
                    </small>

                    <small>
                      Attempts: {jobType.default_max_attempts}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="enterprise-job-panel">
          <div className="enterprise-job-panel__header">
            <div>
              <span>Recent Activity</span>
              <h2>Recent Enterprise Jobs</h2>
            </div>

            <strong>
              {loading ? "..." : `${recentJobs.length} records`}
            </strong>
          </div>

          {loading ? (
            <div className="enterprise-job-state">
              Loading recent jobs...
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="enterprise-job-state">
              No enterprise jobs have been created yet.
            </div>
          ) : (
            <div className="enterprise-job-table-wrapper">
              <table className="enterprise-job-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Priority</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job.enterprise_job_id}>
                      <td>
                        <strong>{job.job_name}</strong>

                        {job.job_description && (
                          <span>{job.job_description}</span>
                        )}
                      </td>

                      <td>{job.job_type_name}</td>

                      <td>{job.job_status}</td>

                      <td>
                        {Number(
                          job.progress_percentage || 0
                        ).toFixed(0)}
                        %
                      </td>

                      <td>{job.priority}</td>

                      <td>
                        {job.created_at
                          ? new Date(
                              job.created_at
                            ).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </MainLayout>
  );
}
