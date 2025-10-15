import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";


const SensorGraph = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <p style={{ textAlign: "center" }}>No data available for this sensor.</p>;
  }

  const safeData = data.map((d) => ({
    ...d,
    timestamp: d.timestamp || "N/A",
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={safeData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#1976d2" name="Sensor Value" />
      </LineChart>
    </ResponsiveContainer>
  );
};


export default SensorGraph;
