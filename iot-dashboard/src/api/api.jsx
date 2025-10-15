import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getSensors = () => API.get("/get_sensors");
export const getSensorData = (params) => API.get("/get_sensor_data", { params });
export const getLatestData = () => API.get("/latest_data");
