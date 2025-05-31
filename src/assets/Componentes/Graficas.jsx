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
import DisplaySensor from "./DisplaySensor.jsx"; // Importa el componente DisplaySensor


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

  
  const [successEmg, setSuccessEmg] = useState("");
  const [errorEmg, setErrorEmg] = useState("");

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

  // Controlar inicio y detención de la captura EMG
  const capEmg = async (value) => {
    setErrorEmg(""); // Limpiar mensajes anteriores
    setSuccessEmg("");

    try {
      if (value === true) {
        let nombre2 = prompt("Ingresa el nombre del paciente:");
        if (nombre2 === null) {
          alert("Proceso cancelado.");
          return;
        }
        nombre2 = nombre2.trim().toUpperCase();

        if (nombre2 === "") {
          alert("Ingresa un nombre válido.");
          return;
        }

        let sesion = prompt("Ingresa el número de sesión:");
        if (sesion === null) {
          alert("Proceso cancelado.");
          return;
        }

        sesion = Number(sesion);
        if (isNaN(sesion) || sesion < 1) {
          alert("El número de sesión debe ser un valor numérico mayor o igual a 1.");
          return;
        }
        let curp = prompt("Ingresa tu curp: ");
        if (curp === null) {
          alert("Proceso cancelado.");
          return;
        }
        curp = curp.trim().toUpperCase();

        if (curp === "") {
          alert("Ingresa una curp válida.");
          return;
        }

        if (!nombre2 || !sesion || !curp) {
          setErrorEmg("El nombre, la curp y el número de sesión son obligatorios");
          setTimeout(() => setErrorEmg(""), 2000);
          alert("El nombre, curp y el número de sesión son obligatorios.");
          return;
        }

        const observaciones = prompt("Ingresa las observaciones");
        if (observaciones === null) {
          alert("Proceso cancelado.");
          return;
        }
        if (!observaciones) {
          setErrorEmg("Las observaciones son obligatorias");
          setTimeout(() => setErrorEmg(""), 2000);
          return;
        }

        const response = await fetch(`http://localhost:5000/start_emg_capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: nombre2,
            sesion: sesion,
            curp: curp,
            observaciones: observaciones,
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          setErrorEmg(data.error || "Error al buscar al paciente.");
          setTimeout(() => setErrorEmg(""), 2000);
          return;
        }

        if (data.exists) {
          setSuccessEmg("Paciente encontrado");
          setTimeout(() => setSuccessEmg(""), 2000);
        } else {
          setErrorEmg("Paciente no encontrado, por favor, agrégalo");
          setTimeout(() => setErrorEmg(""), 2000);
        }

        console.log("Respuesta del servidor: ", data);
      }

      if (value === false) {
        const respons = await fetch(`http://localhost:5000/stop_emg_capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            valor: value,
          }),
        });
        const data = await respons.json();

        if (data.message) {
          setSuccessEmg("Captura EMG detenida");
          setTimeout(() => setSuccessEmg(""), 2000);
        } else {
          setErrorEmg("Error al detener la captura.");
          setTimeout(() => setErrorEmg(""), 2000);
        }

        console.log("Respuesta del servidor: ", data);
      }
    } catch (error) {
      setErrorEmg(`Error al capturar datos: ${error.message}`);
      setTimeout(() => setErrorEmg(""), 2000);
      console.error("Error al capturar datos: ", error);
    }
  };

  return (
    <div className="contenedor-gn">
      
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
      <div className="botones">
        <button onClick={() => capEmg(true)} className="capturar">Capturar EMG</button>
        <button onClick={() => capEmg(false)} className="detener">Detener captura</button>
        {errorEmg && <p className="errorm" style={{ color: "red" }}>{errorEmg}</p>}
        {successEmg && <p className="successm" style={{ color: "green" }}>{successEmg}</p>}
      </div>
      <DisplaySensor/>
      
      
      
    </div>
    
    
  );
};

export default Graficas;

