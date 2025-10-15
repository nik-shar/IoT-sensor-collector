import React from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography
} from "@mui/material";

const SensorTable = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ padding: 2, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          No data available for this sensor.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Sensor ID</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>Timestamp</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
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
  );
};

export default SensorTable;
