import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, Typography, Box, CircularProgress } from "@mui/material";

const SystemStatus = () => {
  const [status, setStatus] = useState(null);

  const loadStatus = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/system_status");
      setStatus(res.data);
    } catch {
      setStatus({ status: "error" });
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return <CircularProgress />;

  return (
    <Card sx={{ mt: 3, mb: 2, p: 1, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6">🧰 System Health Monitor</Typography>
        <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
          <Typography>API: {status.status === "ok" ? "🟢 Online" : "🔴 Offline"}</Typography>
          <Typography>Sensors: {status.sensors}</Typography>
          <Typography>Data Points: {status.datapoints}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
