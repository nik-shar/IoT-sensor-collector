import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const SensorSelector = ({ sensors, selectedSensor, onChange }) => (
  <FormControl fullWidth style={{ marginBottom: 20 }}>
    <InputLabel>Select Sensor</InputLabel>
    <Select value={selectedSensor || ""} onChange={(e) => onChange(e.target.value)}>
      {sensors.map((sensor) => (
        <MenuItem key={sensor.id} value={sensor.id}>
          {sensor.name} ({sensor.type})
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default SensorSelector;
