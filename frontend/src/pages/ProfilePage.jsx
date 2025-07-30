import React, { useState, useEffect } from "react";
import {
  Container, Box, Card, CardContent, Typography,
  Button, TextField, CircularProgress, Alert
} from "@mui/material";
import authService from "../services/api/auth"; // adjust import as needed

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch profile helper
  const fetchProfile = async () => {
    try {
      const data = await authService.getProfile();
      setProfile(data);

      // Only updatable fields in form state
      setForm({
        full_name: data.full_name || "",
        location: data.location || "",
        email: data.email || "", // for display only, not for PATCH
      });
    } catch (err) {
      setError("Failed to fetch profile.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      // Only send PATCH fields allowed by backend
      const patchData = {
        full_name: form.full_name,
        location: form.location,
      };
      const updated = await authService.updateProfile(patchData);

      // Update UI and localStorage with most recently updated profile
      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setEditMode(false);
    } catch (err) {
      setError(
        err?.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not update profile."
      );
    }
    setLoading(false);
  };

  if (!profile)
    return (
      <Box sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );

  // Helper for coordinates display
  const coordinates =
    profile.coordinates
      ? `${profile.coordinates.lat}, ${profile.coordinates.lon}`
      : (profile.latitude && profile.longitude
          ? `${profile.latitude}, ${profile.longitude}`
          : "-"
        );

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ boxShadow: 5 }}>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {editMode ? (
            <>
              <TextField
                label="Full Name"
                name="full_name"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={form.full_name}
                onChange={handleChange}
              />
              <TextField
                label="Email"
                name="email"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={form.email}
                disabled // Email is not editable
              />
              <TextField
                label="Location"
                name="location"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={form.location}
                onChange={handleChange}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Save"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="h5" sx={{ mb: 2, textAlign: "center" }}>
                Profile
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <b>Name:</b> {profile.full_name}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <b>Email:</b> {profile.email}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <b>Location:</b> {profile.location}
              </Typography>
              <Typography sx={{ mb: 2 }}>
                <b>Coordinates:</b> {coordinates}
              </Typography>
              <Button
                variant="contained"
                onClick={() => setEditMode(true)}
                sx={{ mt: 2 }}
              >
                Edit Profile
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ProfilePage;