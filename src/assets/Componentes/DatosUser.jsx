import { useState } from "react";
import Graficas from "./Graficas";

const DatosUser = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    sesion: "",
    observaciones: "",
  });

  const [allData, setAllData] = useState([]); // Estado para mantener todos los datos

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Evita valores negativos en "sesion"
    if (name === "sesion" && value < 0) {
      return;
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    console.log("Formulario enviado: ", formData);
    // Verificar que los campos no estén vacíos antes de agregar los datos
    if (formData.nombre && formData.sesion && formData.observaciones) {
        // Agregar los datos al estado y al localStorage solo si todos los campos están completos
        const newData = [...allData, formData];
        setAllData(newData);
        localStorage.setItem("formData", JSON.stringify(newData));
        setFormData({ nombre: "", sesion: "", observaciones: "" }); // Limpiar el formulario
      } 
  };

  const handleDownload = () => {
    
    if (allData.length === 0) {
        alert("No hay datos para descargar.");
        return;
      }
    // Crear el archivo CSV con los datos almacenados
    const csvRows = [];
    const headers = ["Nombre", "Sesión", "Observaciones"];
    csvRows.push(headers.join(",")); // Cabeceras del archivo CSV

    // Convertir los datos a filas CSV
    allData.forEach((row) => {
      const values = [row.nombre, row.sesion, row.observaciones];
      csvRows.push(values.join(","));
    });

    // Crear un blob CSV
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });

    // Crear un enlace para descargar el archivo CSV
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "datos_pacientes.csv";
    link.click(); // Simula el clic para descargar el archivo

     // Limpiar el localStorage después de descargar
     localStorage.removeItem("formData");

     // También limpiar el estado allData para que no quede en memoria
     setAllData([]);
  };

  

  return (
    <div className="contenedor">
      <form onSubmit={handleAdd} className="formulario">
        <h1 className="tituloform">Recolección de datos EMG</h1>
        <label>Nombre del paciente</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
        />
        <label>Número de sesión</label>
        <input
          type="number"
          name="sesion"
          min="1"
          value={formData.sesion}
          onChange={handleChange}
        />

        <label>Observaciones</label>
        <textarea
          name="observaciones"
          value={formData.observaciones}
          onChange={handleChange}
        />

        <button type="submit">Agregar</button>
        <button onClick={handleDownload} className="botondescargar">Descargar CSV</button>
      </form>
      

      <Graficas />

      <button className="capturar">Capturar EMG</button>
      <button className="detener">Detener captura</button>
    </div>
  );
};

export default DatosUser;

