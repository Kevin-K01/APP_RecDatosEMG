import { useState } from "react";
import "../styles_css/formulario.css";

const DatosUser = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contrasena: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const isEmpty = (str) => !str || str.trim() === "";  //verifica si el campo esta vacio
  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const { nombre, email, contrasena } = formData;
    if ([nombre, email, contrasena].some(isEmpty)) {
      setError("Todos los campos son obligatorios.");
      setTimeout(() => setError(""), 2000);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000//add_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, contrasena }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Error al agregar usuario");
        setTimeout(() => setError(""), 2000);
        return;
      }
      else{
        setSuccess("Usuario agregado exitosamente");
        setTimeout(() => setSuccess(""), 2000);
        setFormData({ nombre: "", email: "", contrasena: "" });
      }

      
    }
    catch (error) {
      console.error("Error al enviar los datos:", error);
    }
  };


  return (
  <>
    <div className="contenedorregistro">
      <div className="formulario">
        <form onSubmit={handleAdd}>
          <h1 className="tituloform">Registro</h1>
          <label>Nombre completo</label>
          <input
            type="text"
            placeholder="Ingresa un nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
          />
          
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Ingresa el correo electrónico"
            value={formData.email}
            onChange={handleChange}
          />
          
          
          <label>Contraseña</label>
          <input
            type="password"
            name="contrasena"
            placeholder="Ingresa una contraseña"
            value={formData.contrasena}
            onChange={handleChange}
          />
        <button className="btn-registro-usuario"type="submit">Registrarme</button>
        
        <p>¿Ya tienes cuenta? <a className='links-rc' href="/Iniciosesion">Iniciar sesión</a></p>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
        </form>
      </div>
    </div>
  </>
    
    

  );
};

export default DatosUser;


