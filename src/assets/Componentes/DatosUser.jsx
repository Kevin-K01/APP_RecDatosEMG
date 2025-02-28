import { useState,useEffect } from "react";
import Graficas from "./Graficas";

const DatosUser = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    sesion: "",
    curp: "",
    Extremidad_Afectada: "",
    observaciones: "",
  });

  const [allData, setAllData] = useState([]); // Estado para mantener todos los datos
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const[erroremg,setErrorEmg] = useState("");
  const[successemg,setSuccessEmg] = useState("");


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
    if (name === "sesion" && (value < 1 || !Number.isInteger(Number(value)))) {
      return;
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };


  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");  // Limpiar mensajes anteriores
    setSuccess(""); 
  
    const { nombre, sesion, curp, Extremidad_Afectada, observaciones } = formData;
    // Validación de campos vacíos
    if (!nombre || !sesion || !curp || !Extremidad_Afectada || !observaciones) {
      setError("Todos los campos son obligatorios.");
      setTimeout(() => setError(""), 2000);
      return;
    }
  
    const curpUpper = curp.trim().toUpperCase();
  
    try {
      const res = await fetch("http://localhost:5000/add_patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, curp: curpUpper }),
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
      setFormData({ nombre: "", sesion: "", curp: "", Extremidad_Afectada: "", observaciones: "" }); // Limpiar formulario
    } catch (err) {
      setError("No se pudo agregar el paciente.");
      setTimeout(() => setError(""), 2000);
      console.error(err);
    }
  };

  const capEmg = async(value) =>{
    setErrorEmg("");
    setSuccessEmg("");
    try{
      const response = await fetch("http://localhost:5000/receive",{
        method:"POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({value}),

      });

      const data = await response.json();
      console.log("Respuesta del servidor: ", data);
      
    }catch(error){
      console.error("Error al enviar datos: ", error);

    }
    
  }
  

    return (
      <div className="contenedor">
        <form onSubmit={handleAdd} className="formulario">
          <h1 className="tituloform">Recolección de datos EMG</h1>
          <label>Nombre del paciente</label>
          <input
            type="text"
            placeholder="ingresa un nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
          />
          <label>Número de sesión</label>
          <input
            type="number"
            name="sesion"
            placeholder="ingresa el numero de sesión"
            min="1"
            value={formData.sesion}
            onChange={handleChange}
          />
          <label>CURP</label>
          <input
          type='text'
          name="curp"
          placeholder ="ingresa la curp"
          value={formData.curp}
          onChange={handleChange}
          />

          <label>Extremidad Afectada</label>
          <select name="Extremidad_Afectada" value={formData.Extremidad_Afectada} onChange={handleChange}>
          <option value="">Selecciona...</option>
          <option value="Miembro Superior Derecho">Miembro superior derecho</option>
          <option value="Miembro Superior Isquierdo">Miembro superior izquierdo</option>
          </select>
          

          <label>Observaciones</label>
          <textarea
            name="observaciones"
            placeholder="ingresa las observaciones"
            value={formData.observaciones}
            onChange={handleChange}
          />

        <button type="submit">Agregar</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
      </form>
      
      

      <Graficas />

      <button onClick = {() => capEmg(true)} className="capturar">Capturar EMG</button>
      <button onClick = {() => capEmg(false)} className="detener">Detener captura</button>
    </div>
  );
};

export default DatosUser;

