import { useState, useEffect } from "react";
import "../styles_css/formulario.css"; // Importa el archivo CSS


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


  return (
  <>
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
    </div>
  </>
    
    

  );
};

export default DatosUser;


