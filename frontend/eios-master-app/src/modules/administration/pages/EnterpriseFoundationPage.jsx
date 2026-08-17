import { useEffect, useState } from "react";

import MainLayout from "../../../layouts/MainLayout";
import {
  getEnterprisePrinciples,
  getEnterpriseProfile,
  getEnterpriseSettings,
} from "../../../services/enterpriseFoundationService";

export default function EnterpriseFoundationPage() {
  const [profile, setProfile] = useState(null);
  const [principles, setPrinciples] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadEnterpriseFoundation() {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          profileData,
          principlesData,
          settingsData,
        ] = await Promise.all([
          getEnterpriseProfile(),
          getEnterprisePrinciples(),
          getEnterpriseSettings(),
        ]);

        setProfile(profileData);
        setPrinciples(principlesData || []);
        setSettings(settingsData?.data || []);
      } catch (error) {
        console.error(
          "Enterprise foundation loading failed:",
          error
        );

        setErrorMessage(
          error.response?.data?.message ||
            error.message ||
            "Unable to load enterprise foundation."
        );
      } finally {
        setLoading(false);
      }
    }

    loadEnterpriseFoundation();
  }, []);

  return (
    <MainLayout>
      <section className="enterprise-foundation-page">
        <div className="enterprise-foundation-page__header">
          <span className="enterprise-foundation-page__overline">
            Book I
          </span>

          <h1>Enterprise Foundation</h1>

          <p>
            Manage the governing principles, institutional profile,
            and administrator-configurable defaults of EIOS.
          </p>
        </div>

        {loading && (
          <div className="enterprise-foundation-state">
            Loading enterprise foundation...
          </div>
        )}

        {!loading && errorMessage && (
          <div className="enterprise-foundation-state enterprise-foundation-state--error">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && (
          <>
            <section className="enterprise-foundation-card">
              <div className="enterprise-foundation-card__header">
                <div>
                  <span>Enterprise Profile</span>
                  <h2>Organization and Platform Identity</h2>
                </div>
              </div>

              {profile ? (
                <div className="enterprise-foundation-profile-grid">
                  <div>
                    <span>Organization</span>
                    <strong>{profile.organization_name}</strong>
                  </div>

                  <div>
                    <span>Platform</span>
                    <strong>{profile.platform_name}</strong>
                  </div>

                  <div>
                    <span>Country</span>
                    <strong>{profile.country_code}</strong>
                  </div>

                  <div>
                    <span>Time Zone</span>
                    <strong>{profile.timezone}</strong>
                  </div>
                </div>
              ) : (
                <p className="enterprise-foundation-empty">
                  No active enterprise profile has been configured yet.
                </p>
              )}
            </section>

            <section className="enterprise-foundation-card">
              <div className="enterprise-foundation-card__header">
                <div>
                  <span>Enterprise Principles</span>
                  <h2>Core EIOS Operating Doctrine</h2>
                </div>

                <strong>{principles.length} active</strong>
              </div>

              <div className="enterprise-principles-grid">
                {principles.map((principle) => (
                  <article
                    key={principle.principle_id}
                    className="enterprise-principle-item"
                  >
                    <span>
                      {principle.principle_code}
                    </span>

                    <h3>
                      {principle.principle_name}
                    </h3>

                    <p>
                      {principle.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="enterprise-foundation-card">
              <div className="enterprise-foundation-card__header">
                <div>
                  <span>Enterprise Settings</span>
                  <h2>Administrator-Controlled Defaults</h2>
                </div>

                <strong>{settings.length} settings</strong>
              </div>

              <div className="enterprise-settings-list">
                {settings.map((setting) => (
                  <div
                    key={setting.setting_id}
                    className="enterprise-setting-row"
                  >
                    <div>
                      <span>{setting.setting_group}</span>

                      <strong>
                        {setting.setting_label}
                      </strong>

                      <p>
                        {setting.setting_description}
                      </p>
                    </div>

                    <div className="enterprise-setting-row__value">
                      {setting.setting_value}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </section>
    </MainLayout>
  );
}