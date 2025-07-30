import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import authService from "../services/api/authService";
import { Spinner } from "../components/Spinner";
import { Alert } from "../components/Alert";

const ProfilePage = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // For edit functionality (optional)
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await authService.getProfile();
        setProfile(data);
        setForm(data);
      } catch (err) {
        setError(t("profile.fetchError") || "Failed to fetch profile.");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [t]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setForm(profile);
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const updated = await authService.updateProfile(form); // you must implement this in your service!
      setProfile(updated);
      setIsEditing(false);
    } catch (err) {
      setError(t("profile.updateError") || "Failed to update profile.");
    }
    setLoading(false);
  };

  if (loading) return <Spinner />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">{t("profile.title") || "Profile"}</h1>
      {!isEditing ? (
        <>
          <div className="mb-2">
            <span className="font-semibold">{t("profile.name") || "Full Name"}: </span>
            {profile?.full_name || profile?.name || "-"}
          </div>
          <div className="mb-2">
            <span className="font-semibold">{t("profile.email") || "Email"}: </span>
            {profile?.email || "-"}
          </div>
          <div className="mb-2">
            <span className="font-semibold">{t("profile.location") || "Location"}: </span>
            {profile?.location || "-"}
          </div>
          <div className="mb-2">
            <span className="font-semibold">{t("profile.coordinates") || "Coordinates"}: </span>
            {profile?.coordinates
              ? `${profile.coordinates.latitude}, ${profile.coordinates.longitude}`
              : "-"}
          </div>
          {/* Optional edit button */}
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleEdit}
          >
            {t("profile.edit") || "Edit"}
          </button>
        </>
      ) : (
        <>
          <div className="mb-2">
            <label className="font-semibold">{t("profile.name") || "Full Name"}:</label>
            <input
              type="text"
              name="full_name"
              className="w-full border p-2 rounded"
              value={form.full_name || ""}
              onChange={handleChange}
            />
          </div>
          <div className="mb-2">
            <label className="font-semibold">{t("profile.email") || "Email"}:</label>
            <input
              type="email"
              name="email"
              className="w-full border p-2 rounded"
              value={form.email || ""}
              onChange={handleChange}
            />
          </div>
          <div className="mb-2">
            <label className="font-semibold">{t("profile.location") || "Location"}:</label>
            <input
              type="text"
              name="location"
              className="w-full border p-2 rounded"
              value={form.location || ""}
              onChange={handleChange}
            />
          </div>
          <div className="mb-2">
            <label className="font-semibold">{t("profile.coordinates") || "Coordinates"}:</label>
            <input
              type="text"
              name="coordinates"
              className="w-full border p-2 rounded"
              value={
                form.coordinates
                  ? `${form.coordinates.latitude}, ${form.coordinates.longitude}`
                  : ""
              }
              disabled
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={handleSave}
            >
              {t("profile.save") || "Save"}
            </button>
            <button
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              onClick={handleCancel}
            >
              {t("profile.cancel") || "Cancel"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;