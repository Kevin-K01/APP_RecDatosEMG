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
import "../Styles_css/Graficas.css"; // Importa el archivo CSS

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
const WINDOW_SIZE = 100; // Número de muestras a mostrar

const Graficas = () => {
  // Inicializar cada sensor con su propio array independiente
  const [emgData, setEmgData] = useState(
    Array.from({ length: NUM_SENSORS }, () => Array(WINDOW_SIZE).fill(0))
  );

  useEffect(() => {
    const handleEmgData = (data) => {
      setEmgData((prevData) =>
        prevData.map((sensorData, i) => [
          ...sensorData.slice(1), // Desplazar datos
          data.emg[i] || 0, // Agregar nueva muestra
        ])
      );
    };

    socket.on("emg_data", handleEmgData);

    return () => {
      socket.off("emg_data", handleEmgData);
    };
  }, []);

  return (
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
                  tension: 0.2, // Suaviza la línea un poco
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
  );
};

export default Graficas;

