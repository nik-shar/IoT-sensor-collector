import axios from "axios";

const API = axios.create({
  baseURL: "http://iot-sensor-collector.onrender.com",
});

export const getSensors = () => API.get("/get_sensors");
export const getSensorData = (params) => API.get("/get_sensor_data", { params });
export const getLatestData = () => API.get("/latest_data");
