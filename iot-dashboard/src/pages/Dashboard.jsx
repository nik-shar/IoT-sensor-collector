import React, { useState, useEffect, useMemo } from "react";
import { getSensors, getSensorData } from "../api/api";
import AddSensorForm from "../components/AddSensorForm";
import DataSimulator from "../components/DataSimulator";
import SensorSelector from "../components/SensorSelector";
import SensorGraph from "../components/SensorGraph";
import SensorTable from "../components/SensorTable";
import SystemStatus from "../components/SystemStatus";
import axios from "axios";
import {
  Switch,
  Button,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Dashboard = () => {
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [data, setData] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().subtract(1, "hour"));
  const [endDate, setEndDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openDeleteSensor, setOpenDeleteSensor] = useState(false);

  const loadSensors = async () => {
    try {
      const res = await getSensors();
      setSensors(res.data);
      if (res.data.length > 0 && !selectedSensor) {
        setSelectedSensor(res.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching sensors:", err);
    }
  };

  const loadData = async (sensorId, start = null, end = null) => {
    if (!sensorId) return;
    setLoading(true);
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
    } finally {
      setLoading(false);
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
    if (selectedSensor) loadData(selectedSensor, startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate(dayjs().subtract(1, "hour"));
    setEndDate(dayjs());
    if (selectedSensor) loadData(selectedSensor);
  };

  const handleOpenDeleteDialog = () => {
    if (!selectedSensor) {
      alert("Please select a sensor first!");
      return;
    }
    setOpenConfirm(true);
  };

  const handleConfirmDeleteRange = async () => {
    setOpenConfirm(false);
    try {
      await axios.delete("http://127.0.0.1:8000/delete_data_range", {
        params: {
          sensor_id: selectedSensor,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });
      alert("✅ Data within selected range deleted successfully!");
      loadData(selectedSensor);
    } catch (err) {
      console.error("Error deleting data range:", err);
      alert("❌ Failed to delete data in range.");
    }
  };

  const handleOpenDeleteSensorDialog = () => {
    if (!selectedSensor) {
      alert("Please select a sensor to delete!");
      return;
    }
    setOpenDeleteSensor(true);
  };

  const handleConfirmDeleteSensor = async () => {
    setOpenDeleteSensor(false);
    try {
      await axios.delete(`http://127.0.0.1:8000/delete_sensor/${selectedSensor}`);
      alert("🗑️ Sensor deleted successfully!");
      setSelectedSensor(null);
      setData([]);
      await loadSensors();
    } catch (err) {
      console.error("Error deleting sensor:", err);
      alert("❌ Failed to delete sensor.");
    }
  };

  const selectedSensorObj = sensors.find((s) => s.id === selectedSensor);

  const stats = useMemo(() => {
    if (!data.length) return { avg: "-", min: "-", max: "-" };
    const values = data.map((d) => d.value);
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    const min = Math.min(...values).toFixed(2);
    const max = Math.max(...values).toFixed(2);
    return { avg, min, max };
  }, [data]);

  const exportToCSV = (rows, filename) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]).join(",");
    const values = rows.map((r) => Object.values(r).join(",")).join("\n");
    const blob = new Blob([`${headers}\n${values}`], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, `${filename}.csv`);
  };

  const exportToPDF = (rows, filename) => {
    if (!rows.length) return;

    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.text(`Sensor Data Report: ${filename}`, 14, 15);

      // Prepare data
      const tableColumn = Object.keys(rows[0]);
      const tableRows = rows.map((r) => tableColumn.map((key) => r[key]));

      // Generate the table
      autoTable(doc, {
        startY: 25,
        head: [tableColumn],
        body: tableRows,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [66, 165, 245] },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const date = new Date().toLocaleString();
      doc.setFontSize(10);
      doc.text(`Generated on: ${date}`, 14, doc.internal.pageSize.height - 10);

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("❌ Failed to export PDF. Check console for details.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📡 IoT Sensor Dashboard</h2>
      <SystemStatus />
      <AddSensorForm onSensorAdded={loadSensors} />
      <DataSimulator
        sensors={sensors}
        onDataSent={() => loadData(selectedSensor)}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
        <SensorSelector
          sensors={sensors}
          selectedSensor={selectedSensor}
          onChange={setSelectedSensor}
        />
        <Button
          variant="contained"
          color="error"
          onClick={handleOpenDeleteSensorDialog}
          disabled={!selectedSensor}
        >
          Delete Sensor
        </Button>
      </Box>

      {selectedSensorObj && (
        <Card sx={{ mt: 2, mb: 2, boxShadow: 2, p: 1 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h6">🔍 Sensor Information</Typography>
                <Typography>
                  <b>Name:</b> {selectedSensorObj.name}
                </Typography>
                <Typography>
                  <b>Type:</b> {selectedSensorObj.type}
                </Typography>
                <Typography>
                  <b>Location:</b> {selectedSensorObj.location}
                </Typography>
              </Box>
              <Box sx={{ width: 220, height: 100 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.slice(-10)}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#42a5f5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
            <Divider sx={{ mt: 2, mb: 1 }} />
            <Stack direction="row" spacing={4} justifyContent="center">
              <Typography>
                🟢 <b>Average:</b> {stats.avg}
              </Typography>
              <Typography>
                🔻 <b>Min:</b> {stats.min}
              </Typography>
              <Typography>
                🔺 <b>Max:</b> {stats.max}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            marginTop: 2,
            flexWrap: "wrap",
          }}
        >
          <DateTimePicker
            label="Start Date & Time"
            value={startDate}
            onChange={setStartDate}
            renderInput={(p) => <TextField {...p} />}
          />
          <DateTimePicker
            label="End Date & Time"
            value={endDate}
            onChange={setEndDate}
            renderInput={(p) => <TextField {...p} />}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleFilter}
            disabled={!selectedSensor}
          >
            Apply Filter
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearFilter}
            disabled={!selectedSensor}
          >
            Clear Filter
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleOpenDeleteDialog}
            disabled={!selectedSensor}
          >
            Delete Data in Range
          </Button>
        </Box>
      </LocalizationProvider>

      {/* Delete Data Dialog */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>🗑️ Confirm Data Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete all data for sensor ID {selectedSensor} between{" "}
            <b>{startDate.format("YYYY-MM-DD HH:mm:ss")}</b> and{" "}
            <b>{endDate.format("YYYY-MM-DD HH:mm:ss")}</b>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDeleteRange}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Sensor Dialog */}
      <Dialog open={openDeleteSensor} onClose={() => setOpenDeleteSensor(false)}>
        <DialogTitle>🧨 Delete Sensor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the sensor{" "}
            <b>{selectedSensorObj?.name}</b>? This will remove{" "}
            <b>all associated data readings</b> permanently.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteSensor(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDeleteSensor}
          >
            Delete Sensor
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          marginTop: 3,
          marginBottom: 2,
        }}
      >
        <Typography>Auto Refresh:</Typography>
        <Switch
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
          color="primary"
        />
        <Chip
          label={autoRefresh ? "🟢 LIVE" : "🔴 PAUSED"}
          color={autoRefresh ? "success" : "error"}
          variant="outlined"
          sx={{ fontWeight: "bold" }}
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
          <Typography color="text.secondary">
            Last updated: {lastUpdated}
          </Typography>
        )}
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 200,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() =>
                exportToCSV(data, selectedSensorObj?.name || "sensor_data")
              }
              disabled={!data.length}
            >
              📥 Export CSV
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() =>
                exportToPDF(data, selectedSensorObj?.name || "sensor_data")
              }
              disabled={!data.length}
            >
              🧾 Export PDF
            </Button>
          </Box>

          <SensorGraph data={data} />
          <Box mt={3}>
            <SensorTable
              data={data}
              selectedSensor={selectedSensor}
              onDataDeleted={() => loadData(selectedSensor)}
            />
          </Box>
        </>
      )}
    </div>
  );
};

export default Dashboard;
