import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function LiveChartPolling() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/latest_data");
        const json = await res.json();
        if (Array.isArray(json)) {
          setData(json);
        } else {
          console.error("Unexpected response:", json);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchAllData(); // initial call
    const interval = setInterval(fetchAllData, 3000); // every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Live Sensor Data (Polling)</h2>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} />
      </LineChart>
    </div>
  );
}
