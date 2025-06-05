import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';

const generarDatosEMG = () => Array.from({ length: 100 }, (_, i) => ({ tiempo: i, señal: Math.sin(i / 10) + Math.random() * 0.5 }));

const calcularFFT = (datos) => {
  return datos.map((d, i) => ({ frecuencia: i, magnitud: Math.abs(Math.sin(i / 10)) }));
};

const calcularRMS = (datos) => {
  const rms = Math.sqrt(datos.reduce((sum, val) => sum + val.señal ** 2, 0) / datos.length);
  return rms.toFixed(3);
};

const calcularArea = (datos) => {
  const area = datos.reduce((sum, val) => sum + Math.abs(val.señal), 0);
  return area.toFixed(2);
};

const detectarPicos = (datos) => {
  let picos = 0;
  for (let i = 1; i < datos.length - 1; i++) {
    if (datos[i].señal > datos[i - 1].señal && datos[i].señal > datos[i + 1].señal) {
      picos++;
    }
  }
  return picos;
};

const Dashboard = () => {
  const datosOriginales = [
    { sensor: 'Sensor 1', activaciones: 34 },
    { sensor: 'Sensor 2', activaciones: 28 },
    { sensor: 'Sensor 3', activaciones: 15 },
    { sensor: 'Sensor 4', activaciones: 42 },
    { sensor: 'Sensor 5', activaciones: 19 },
    { sensor: 'Sensor 6', activaciones: 9 },
    { sensor: 'Sensor 7', activaciones: 25 },
    { sensor: 'Sensor 8', activaciones: 31 },
  ];

  const [paciente, setPaciente] = useState('');
  const [sesion, setSesion] = useState('');
  const [archivoEMG, setArchivoEMG] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('ninguno');
  const datosEMG = useMemo(generarDatosEMG, []);

  const filtrarEMG = useMemo(() => {
    switch (tipoFiltro) {
      case 'media':
        return datosEMG.map((p, i, arr) => ({
          tiempo: p.tiempo,
          señal: ((arr[i - 1]?.señal || 0) + p.señal + (arr[i + 1]?.señal || 0)) / 3,
        }));
      case 'pasa_bajo':
        return datosEMG.map(p => ({ ...p, señal: p.señal > 1 ? 1 : p.señal }));
      case 'pasa_alto':
        return datosEMG.map(p => ({ ...p, señal: p.señal < 0.5 ? 0 : p.señal }));
      default:
        return datosEMG;
    }
  }, [datosEMG, tipoFiltro]);

  const exportarDatos = () => {
    const datos = JSON.stringify(filtrarEMG);
    const blob = new Blob([datos], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datos_emg.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const datosFFT = useMemo(() => calcularFFT(filtrarEMG), [filtrarEMG]);
  const rms = useMemo(() => calcularRMS(filtrarEMG), [filtrarEMG]);
  const area = useMemo(() => calcularArea(filtrarEMG), [filtrarEMG]);
  const picos = useMemo(() => detectarPicos(filtrarEMG), [filtrarEMG]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-center">📊 Dashboard EMG</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input type="search" className="p-2 border rounded" placeholder="Buscar paciente" value={paciente} onChange={(e) => setPaciente(e.target.value)} />
        <select className="p-2 border rounded" value={sesion} onChange={(e) => setSesion(e.target.value)}>
          <option value="">Seleccionar sesión</option>
          <option value="Sesion 1">Sesión 1</option>
          <option value="Sesion 2">Sesión 2</option>
        </select>
        <select className="p-2 border rounded" value={archivoEMG} onChange={(e) => setArchivoEMG(e.target.value)}>
          <option value="">Seleccionar archivo EMG</option>
          <option value="Archivo 1">Archivo 1</option>
          <option value="Archivo 2">Archivo 2</option>
        </select>
        <select className="p-2 border rounded" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
          <option value="ninguno">Sin filtro</option>
          <option value="media">Media móvil</option>
          <option value="pasa_bajo">Pasa-bajo</option>
          <option value="pasa_alto">Pasa-alto</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={exportarDatos}>Exportar datos</button>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Sensores activados</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={datosOriginales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sensor" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="activaciones" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold mb-2">Señal EMG sin filtro</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={datosEMG}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tiempo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="señal" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">Señal EMG filtrada ({tipoFiltro})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filtrarEMG}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tiempo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="señal" stroke="#387908" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Análisis de señal</h3>
        <p><strong>Área bajo la curva:</strong> {area}</p>
        <p><strong>RMS:</strong> {rms}</p>
        <p><strong>Eventos EMG (picos):</strong> {picos}</p>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Transformada Rápida de Fourier (FFT)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={datosFFT}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="frecuencia" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="magnitud" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
