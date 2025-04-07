import { useState, useEffect } from "react";
import Graficas from "./Graficas";



const DatosUser = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    curp: "",
    Extremidad_Afectada: "",
    observaciones: "",
  });

  const [allData, setAllData] = useState([]); // Estado para mantener todos los datos
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [successEmg, setSuccessEmg] = useState("");
  const [errorEmg, setErrorEmg] = useState("");

  const [isVisible, setIsVisible] = useState(true); // Estado para mostrar/ocultar el formulario

  const toggleForm = () => {
    setIsVisible(!isVisible); // Cambia el estado de visibilidad
  };

  // Cargar datos desde el CSV almacenado localmente al iniciar
  useEffect(() => {
    const storedData = localStorage.getItem("formData");
    if (storedData) {
      setAllData(JSON.parse(storedData));
    } else {
      setAllData([]); // Si no hay datos, asegurarse de que el estado esté vacío
    }
  }, []);

  // Guardar datos en localStorage cada vez que `allData` cambie
  useEffect(() => {
    if (allData.length > 0) {
      localStorage.setItem("formData", JSON.stringify(allData));
    }
  }, [allData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(""); // Limpiar mensajes anteriores
    setSuccess("");

    const { nombre, curp, Extremidad_Afectada, observaciones } = formData;
    // Validación de campos vacíos
    if (!nombre || !curp || !Extremidad_Afectada || !observaciones) {
      setError("Todos los campos son obligatorios.");
      setTimeout(() => setError(""), 2000);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/add_patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, curp: curp.trim().toUpperCase() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Error al agregar el paciente.");
        setTimeout(() => setError(""), 2000);
        return;
      }

      const responseData = await res.json();
      setSuccess(responseData.message || "Paciente agregado correctamente.");
      setTimeout(() => setSuccess(""), 2000);
      setFormData({ nombre: "", curp: "", Extremidad_Afectada: "", observaciones: "" }); // Limpiar formulario
    } catch (err) {
      setError("No se pudo agregar el paciente.");
      setTimeout(() => setError(""), 2000);
      console.error(err);
    }
  };


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
    <div className="contenedor">
      
      
      <div className={`formulario ${isVisible ? 'show' : 'hide'}`}>
      
      
        <form onSubmit={handleAdd}>
          <h1 className="tituloform">Registro De Pacientes</h1>
          <label>Nombre del paciente</label>
          <input
            type="text"
            placeholder="Ingresa un nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
          />
          <label>CURP</label>
          <input
            type="text"
            name="curp"
            placeholder="Ingresa la CURP"
            value={formData.curp}
            onChange={handleChange}
          />

          <label>Extremidad Afectada</label>
          <select
            name="Extremidad_Afectada"
            value={formData.Extremidad_Afectada}
            onChange={handleChange}
          >
            <option value="">Selecciona...</option>
            <option value="Miembro Superior Derecho">Miembro superior derecho</option>
            <option value="Miembro Superior Izquierdo">Miembro superior izquierdo</option>
          </select>

          <label>Observaciones</label>
          <textarea
           name="observaciones"
            placeholder="Ingresa las observaciones"
            value={formData.observaciones}
            onChange={handleChange}
           />

          <button type="submit">Agregar</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
        </form>
        

      </div>
      <button  className="toggle-button" onClick={toggleForm}> {isVisible ? 'Ocultar' : 'Mostrar'}</button>
      

      <Graficas />
      
      <div className="botones">        
        <button onClick={() => capEmg(true)} className="capturar">Capturar EMG</button>
        <button onClick={() => capEmg(false)} className="detener">Detener captura</button>
        {errorEmg && <p className="errorm" style={{ color: "red" }}>{errorEmg}</p>}
        {successEmg && <p className="successm" style={{ color: "green" }}>{successEmg}</p>}

      </div>
      

      
    </div>
    
    

  );
};

export default DatosUser;


