import React, { useState } from "react";
import { TextField, Button, Paper, Typography, Box } from "@mui/material";
import axios from "axios";

const AddSensorForm = ({ onSensorAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("https://iot-sensor-collector.onrender.com/register_sensor", formData);
      setMessage(res.data.message);
      setFormData({ name: "", type: "", location: "" });
      onSensorAdded(); // refresh sensor list in parent
    } catch (error) {
      console.error("Error registering sensor:", error);
      setMessage("Error registering sensor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ padding: 3, marginBottom: 3 }}>
      <Typography variant="h6" gutterBottom>
        🆕 Register New Sensor
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label="Sensor Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <TextField
          label="Sensor Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        />
        <TextField
          label="Sensor Location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
        />
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register Sensor"}
        </Button>
        {message && (
          <Typography
            variant="body2"
            color={message.includes("Error") ? "error" : "success.main"}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default AddSensorForm;
