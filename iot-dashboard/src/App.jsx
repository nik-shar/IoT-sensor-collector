import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function MultiSensorCharts() {
  const [sensorData, setSensorData] = useState({});

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/latest_data");
        const json = await res.json();
        if (typeof json === "object") {
          setSensorData(json);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchAllData(); // initial call
    const interval = setInterval(fetchAllData, 3000); // refresh every 3s
    return () => clearInterval(interval);
  }, []);

  const sensorIds = Object.keys(sensorData);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Live Sensor Data Dashboard</h2>

      {sensorIds.length === 0 && <p>No sensor data yet...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sensorIds.map((id) => (
          <div key={id} className="border p-4 rounded-xl shadow-sm bg-white">
            <h3 className="text-lg font-medium mb-2">Sensor ID: {id}</h3>
            <LineChart width={500} height={300} data={sensorData[id]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </div>
        ))}
      </div>
    </div>
  );
}
