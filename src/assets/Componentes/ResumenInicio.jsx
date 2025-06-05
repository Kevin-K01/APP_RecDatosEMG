import "../Styles_css/ResumenInicio.css";
import { useLocation } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../Context/AuthContext"; // ajusta ruta

const ResumenInicio = () => {
  const location = useLocation();
  const mensajeInicial = location.state?.mensaje || "";
  const [mensaje, setMensaje] = useState(mensajeInicial);

  const { usuario } = useContext(AuthContext);  // obtenemos usuario del contexto

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  return (
    <>
      <div>
        {mensaje && <div style={{ color: "#1a202c" }}>{mensaje}</div>}
        <div className="espacio-gen-inicio">
          <h1 className="tituloResumenInicio">
            Hola bienvenido {usuario?.nombre || "Usuario"}
          </h1>
          <div className="espacio-inicio">
            <h2>Actividad reciente</h2>
            <div className="Resumen-pacientes">
              <button className="pacientes">Paciente1</button>
              <button className="pacientes">Paciente2</button>
              <button className="pacientes">Paciente3</button>
            </div>
          </div>
          <div className="espacio-buscar-paciente">
            <input
              type="text"
              placeholder="Buscar paciente"
              className="input-buscar-paciente"
            />
            <button className="btn-buscar">Buscar</button>
            <a href="/FormularioToggle" className="link-agregar-paciente">
              Agregar
            </a>
          </div>
          <div className="espacio-estadisticas">
            <div className="graficas-inicio">
              <h2>Progreso del paciente</h2>
              <p>selecciona un paciente</p>
              <div className="grafica-datos-paciente"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResumenInicio;
