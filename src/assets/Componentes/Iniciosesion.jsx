import '../Styles_css/formulario.css';
import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../Context/AuthContext';  // Ajusta la ruta según tu estructura

const Iniciosesion = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // contexto

  const [formData, setFormData] = useState({
    usuario: "",
    contrasena: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEmpty = (str) => !str || str.trim() === "";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSesion = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const { usuario, contrasena } = formData;

    if ([usuario, contrasena].some(isEmpty)) {
      setError("Todos los campos son obligatorios.");
      setTimeout(() => setError(""), 2000);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/login", { // para que funcione en el servidor local
      //const response = await fetch("/api/login", {                //descomentar y comentar la anterior para que funcione en el servidor de producción
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Usuario o contraseña incorrectos");
        setTimeout(() => setError(""), 2000);
      } else {
        const data = await response.json();

        // Actualiza contexto y localStorage con el usuario completo
        login(data);

        navigate("/ResumenInicio", {
          state: { mensaje: "Inicio de sesión exitoso", nombre: data.nombre }
        });

        setFormData({
          usuario: "",
          contrasena: ""
        });
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("Error de conexión, intenta más tarde");
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    <div className="contenedor">
      <form onSubmit={handleSesion} className="formulario">
        <h1>Iniciar sesión</h1>
        <input
          type="text"
          placeholder="Usuario"
          name="usuario"
          value={formData.usuario}
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="Contraseña"
          name="contrasena"
          value={formData.contrasena}
          onChange={handleChange}
        />
        <button type="submit">Iniciar Sesión</button>
        <p>
          ¿No tienes cuenta? <Link className="links-rc" to="/DatosUser">Regístrate</Link>
        </p>
        <p>
          <Link className="links-rc" to="/Recuperarcontrasena">¿Olvidaste tu contraseña?</Link>
        </p>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
      </form>
    </div>
  );
};

export default Iniciosesion;
