import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Checkbox, Button, Box
} from "@mui/material";
import axios from "axios";

const SensorTable = ({ data, selectedSensor, onDataDeleted }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedSensor || selectedIds.length === 0) return;
    try {
      await axios.delete("https://iot-sensor-collector.onrender.com/delete_data", {
        data: { sensor_id: selectedSensor, data_ids: selectedIds },
      });
      onDataDeleted();
      setSelectedIds([]);
      alert("✅ Selected readings deleted successfully!");
    } catch (err) {
      console.error("Error deleting readings:", err);
      alert("❌ Failed to delete readings.");
    }
  };

  if (!data || data.length === 0)
    return <p style={{ textAlign: "center" }}>No data available for this sensor.</p>;

  return (
    <Paper>
      <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
        <Button
          variant="contained"
          color="error"
          disabled={selectedIds.length === 0}
          onClick={handleDeleteSelected}
        >
          Delete Selected ({selectedIds.length})
        </Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>ID</TableCell>
              <TableCell>Sensor ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleSelect(row.id)}
                  />
                </TableCell>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.sensor_id}</TableCell>
                <TableCell>{row.data_type}</TableCell>
                <TableCell>{row.value}</TableCell>
                <TableCell>{row.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default SensorTable;
