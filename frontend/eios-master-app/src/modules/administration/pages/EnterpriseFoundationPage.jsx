import { useEffect, useState } from "react";

import MainLayout from "../../../layouts/MainLayout";
import {
  getEnterprisePrinciples,
  getEnterpriseProfile,
  getEnterpriseSettings,
  updateEnterpriseSetting,
} from "../../../services/enterpriseFoundationService";

export default function EnterpriseFoundationPage() {
  const [profile, setProfile] = useState(null);
  const [principles, setPrinciples] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingSettingId, setEditingSettingId] = useState(null);
  const [settingValue, setSettingValue] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  function beginEditing(setting) {
    setEditingSettingId(setting.setting_id);
    setSettingValue(setting.setting_value ?? "");
    setChangeReason("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  function cancelEditing() {
    setEditingSettingId(null);
    setSettingValue("");
    setChangeReason("");
  }

  async function saveSetting(setting) {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await updateEnterpriseSetting(
        setting.setting_id,
        settingValue,
        changeReason
      );

      setSettings((currentSettings) =>
        currentSettings.map((item) =>
          item.setting_id === setting.setting_id
            ? {
                ...item,
                setting_value: result.data.setting_value,
              }
            : item
        )
      );
      setSuccessMessage(result.message);
      cancelEditing();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to update enterprise setting."
      );
    } finally {
      setSaving(false);
    }
  }

  function renderSettingControl(setting) {
    const allowedValues = Array.isArray(setting.allowed_values)
      ? setting.allowed_values
      : [];

    if (setting.value_type === "boolean") {
      return (
        <select
          value={settingValue}
          onChange={(event) => setSettingValue(event.target.value)}
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      );
    }

    if (allowedValues.length > 0) {
      return (
        <select
          value={settingValue}
          onChange={(event) => setSettingValue(event.target.value)}
        >
          {allowedValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      );
    }

    const inputType =
      setting.value_type === "integer" ||
      setting.value_type === "decimal"
        ? "number"
        : setting.value_type === "date"
          ? "date"
          : setting.value_type === "datetime"
            ? "datetime-local"
            : "text";

    return (
      <input
        type={inputType}
        value={settingValue}
        min={setting.validation_rules?.minimum}
        max={setting.validation_rules?.maximum}
        step={setting.value_type === "integer" ? "1" : undefined}
        onChange={(event) => setSettingValue(event.target.value)}
      />
    );
  }

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

        {!loading && successMessage && (
          <div className="enterprise-foundation-state enterprise-foundation-state--success">
            {successMessage}
          </div>
        )}

        {!loading && (
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

                    {editingSettingId === setting.setting_id ? (
                      <div className="enterprise-setting-editor">
                        {renderSettingControl(setting)}

                        <input
                          type="text"
                          value={changeReason}
                          placeholder="Reason for this change"
                          onChange={(event) => setChangeReason(event.target.value)}
                        />

                        <div className="enterprise-setting-editor__actions">
                          <button
                            type="button"
                            onClick={() => saveSetting(setting)}
                            disabled={saving || !changeReason.trim()}
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className="enterprise-setting-editor__cancel"
                            onClick={cancelEditing}
                            disabled={saving}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="enterprise-setting-row__value">
                        <strong>{setting.setting_value}</strong>
                        {setting.is_editable && (
                          <button
                            type="button"
                            onClick={() => beginEditing(setting)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
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
