import React, { useState, useEffect } from "react";
import { getSensors, getSensorData } from "../api/api";
import AddSensorForm from "../components/AddSensorForm";
import DataSimulator from "../components/DataSimulator";
import SensorSelector from "../components/SensorSelector";
import SensorGraph from "../components/SensorGraph";
import SensorTable from "../components/SensorTable";
import { Switch, Button, Typography, Box, TextField } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const Dashboard = () => {
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [data, setData] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().subtract(1, "hour"));
  const [endDate, setEndDate] = useState(dayjs());

  const loadSensors = async () => {
    try {
      const res = await getSensors();
      setSensors(res.data);
    } catch (err) {
      console.error("Error fetching sensors:", err);
    }
  };

  const loadData = async (sensorId, start = null, end = null) => {
    if (!sensorId) return;
    try {
      const params = { sensor_id: sensorId };
      if (start) params.start = start.toISOString();
      if (end) params.end = end.toISOString();

      const res = await getSensorData(params);
      setData(Array.isArray(res.data) ? res.data : []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching data:", err);
      setData([]);
    }
  };

  useEffect(() => {
    loadSensors();
  }, []);

  useEffect(() => {
    let interval;
    if (selectedSensor && autoRefresh) {
      loadData(selectedSensor);
      interval = setInterval(() => loadData(selectedSensor), 5000);
    }
    return () => clearInterval(interval);
  }, [selectedSensor, autoRefresh]);

  const handleManualRefresh = () => {
    if (selectedSensor) loadData(selectedSensor);
  };

  const handleFilter = () => {
    if (selectedSensor) {
      loadData(selectedSensor, startDate, endDate);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📡 IoT Sensor Dashboard</h2>

      {/* Sensor Registration Form */}
      <AddSensorForm onSensorAdded={loadSensors} />

      {/* Data Upload Simulator */}
      <DataSimulator sensors={sensors} onDataSent={() => loadData(selectedSensor)} />

      {/* Sensor Selection */}
      <SensorSelector
        sensors={sensors}
        selectedSensor={selectedSensor}
        onChange={setSelectedSensor}
      />

      {/* Date Range Filter */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, marginTop: 2 }}>
          <DateTimePicker
            label="Start Date & Time"
            value={startDate}
            onChange={setStartDate}
            renderInput={(params) => <TextField {...params} />}
          />
          <DateTimePicker
            label="End Date & Time"
            value={endDate}
            onChange={setEndDate}
            renderInput={(params) => <TextField {...params} />}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleFilter}
            disabled={!selectedSensor}
          >
            Apply Filter
          </Button>
        </Box>
      </LocalizationProvider>

      {/* Auto Refresh Controls */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, marginTop: 2 }}>
        <Typography variant="body1">Auto Refresh:</Typography>
        <Switch
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
          color="primary"
        />
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleManualRefresh}
          disabled={!selectedSensor}
        >
          Refresh Now
        </Button>
        {lastUpdated && (
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdated}
          </Typography>
        )}
      </Box>

      {/* Graph and Table */}
      <SensorGraph data={data} />
      <div style={{ marginTop: 30 }}>
        <SensorTable data={data} />
      </div>
    </div>
  );
};

export default Dashboard;
