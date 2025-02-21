import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Graficas = () => {
  // Definir los datos de la gráfica
  const data = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'], // Ejes X
    datasets: [
      {
        label: 'Datos emg', // Título de la línea
        data: [30, 70, 50, 80, 90], // Datos para los puntos de la línea
        borderColor: 'rgb(75, 192, 192)', // Color de la línea
        tension: 0.1, // Curvatura de la línea
        fill: false, // No llenar bajo la línea
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Permite que el tamaño sea controlado por el contenedor
  };

  return (
    <div style={{ width: '80%', height: '400px' }}>
      <h2>DATOS</h2>
      <Line data={data} options={options} />
    </div>
  );
}

export default Graficas
