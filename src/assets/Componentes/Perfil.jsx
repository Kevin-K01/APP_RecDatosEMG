import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../Context/AuthContext"; // Ajusta la ruta según tu estructura

const Perfil = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const cerrarSesion = () => {
    logout();   // Esto elimina localStorage y limpia el estado global de usuario
    navigate("/");
  };

  return (
    <div>
      <button onClick={cerrarSesion} className="btn-cerrar-sesion">
        Cerrar sesión
      </button>
    </div>
  );
};

export default Perfil;
