import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { io } from "socket.io-client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../Styles_css/Graficas.css";
import DisplaySensor from "./DisplaySensor.jsx";
import Juegos from "./Juegos.jsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const socket = io("http://127.0.0.1:5000");

const NUM_SENSORS = 8;
const WINDOW_SIZE = 100;

const Graficas = () => {
  const [emgData, setEmgData] = useState(
    Array.from({ length: NUM_SENSORS }, () => Array(WINDOW_SIZE).fill(0))
  );

    // Leer estado inicial desde localStorage (solo la primera vez)
    const [showCharts, setShowCharts] = useState(() => {
    const saved = localStorage.getItem("showCharts");
    return saved === null ? true : JSON.parse(saved);
  });

  // Guardar en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem("showCharts", JSON.stringify(showCharts));
  }, [showCharts]);

  const toggleCharts = () => {
    setShowCharts(!showCharts);
  };

  useEffect(() => {
    const handleEmgData = (data) => {
      setEmgData((prevData) =>
        prevData.map((sensorData, i) => [
          ...sensorData.slice(1),
          data.emg[i] || 0,
        ])
      );
    };

    socket.on("emg_data", handleEmgData);

    return () => {
      socket.off("emg_data", handleEmgData);
    };
  }, []);

  return (
    <div className={`contenedor-gn ${showCharts ? "con-graficas" : "sin-graficas"}`}>
      <button className="toggle-button" onClick={toggleCharts}>
        {showCharts ? "Ocultar Gráficas" : "Mostrar Gráficas"}
      </button>

      {showCharts && (
        <div className="grafica-container">
          {emgData.map((sensorData, index) => (
            <div key={index} className="grafica-item">
              <h3 className="grafica-title">Sensor {index + 1}</h3>
              <Line
                data={{
                  labels: Array(WINDOW_SIZE).fill(""),
                  datasets: [
                    {
                      label: `Sensor ${index + 1}`,
                      data: sensorData,
                      borderColor: "#1E88E5",
                      borderWidth: 2.5,
                      tension: 0.2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: false,
                  scales: {
                    y: {
                      min: -100,
                      max: 100,
                      ticks: { color: "#aaa" },
                    },
                    x: { display: false },
                  },
                  elements: { point: { radius: 0 } },
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          ))}
        </div>
      )}
      <Juegos />
      <DisplaySensor />
    </div>
  );
};

export default Graficas;

