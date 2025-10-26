import axios from "axios";
import { useState, useEffect } from "react";
import { Card, CardContent, Typography, Button, Slider, Stack } from "@mui/material";

const API_BASE = "https://iot-sensor-collector.onrender.com";

export default function CollectionControl() {
  const [enabled, setEnabled] = useState(true);
  const [interval, setInterval] = useState(5);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/collection_status`);
      setEnabled(res.data.enabled);
      setInterval(res.data.interval);
    } catch (err) {
      console.error("Error fetching collection status:", err);
    }
  };

  const updateControl = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/collection_control`, {
        enabled,
        interval
      });
      alert("✅ Settings updated!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update control.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <Card sx={{ mt: 2, p: 2 }}>
      <CardContent>
        <Typography variant="h6">⚙️ Data Collection Control</Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Typography>Collection:</Typography>
          <Button
            variant={enabled ? "contained" : "outlined"}
            color={enabled ? "success" : "error"}
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? "ON" : "OFF"}
          </Button>
        </Stack>

        <Stack direction="column" sx={{ mt: 3 }}>
          <Typography gutterBottom>
            Frequency: {interval} seconds
          </Typography>
          <Slider
            min={1}
            max={60}
            step={1}
            value={interval}
            onChange={(e, val) => setInterval(val)}
            valueLabelDisplay="auto"
          />
        </Stack>

        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={updateControl}
          disabled={loading}
        >
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
