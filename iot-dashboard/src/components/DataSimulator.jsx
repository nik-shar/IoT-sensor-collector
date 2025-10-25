import React, { useState } from "react";
import { TextField, Button, Paper, Typography, Box, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import axios from "axios";

const DataSimulator = ({ sensors, onDataSent }) => {
  const [formData, setFormData] = useState({
    sensor_id: "",
    data_type: "",
    value: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sensor_id || !formData.data_type || !formData.value) {
      setMessage("All fields are required!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("https://iot-sensor-collector.onrender.com/submit_data", {
        ...formData,
        value: parseFloat(formData.value),
        timestamp: new Date().toISOString(),
      });
      setMessage(res.data.message);
      setFormData({ ...formData, value: "" });
      onDataSent(); // refresh chart/table
    } catch (error) {
      console.error("Error submitting data:", error);
      setMessage("Failed to send data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ padding: 3, marginTop: 3, marginBottom: 3 }}>
      <Typography variant="h6" gutterBottom>
        ⚙️ Data Upload Simulator
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <FormControl fullWidth>
          <InputLabel>Select Sensor</InputLabel>
          <Select
            name="sensor_id"
            value={formData.sensor_id}
            onChange={handleChange}
            required
          >
            {sensors.map((sensor) => (
              <MenuItem key={sensor.id} value={sensor.id}>
                {sensor.name} ({sensor.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Data Type (e.g. temperature, humidity)"
          name="data_type"
          value={formData.data_type}
          onChange={handleChange}
          required
        />

        <TextField
          label="Value"
          name="value"
          type="number"
          value={formData.value}
          onChange={handleChange}
          required
        />

        <Button
          variant="contained"
          color="secondary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Data"}
        </Button>

        {message && (
          <Typography
            variant="body2"
            color={message.includes("Failed") ? "error" : "success.main"}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default DataSimulator;
