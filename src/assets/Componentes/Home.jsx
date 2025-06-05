import "../styles_css/Home.css"
import { Link } from 'react-router-dom';

const Home = () => {
  
  const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
  const sesionIniciada = !!usuarioGuardado;




  return (
    <div className='home'>
      <div className='principal'>
        
        <div className="bienvenida">
          <p >“Myorehaby utiliza tecnología avanzada para apoyar la rehabilitación de personas con hemiplejía”</p>
          <p>“Con el brazalete Myo Armband, monitoreamos señales musculares en tiempo real, facilitando terapias más personalizadas, precisas y accesibles.”</p>
          <p>¡Explora cómo la tecnología puede mejorar tu recuperación día a día!</p>
        </div>
        <div className="titulos">
          <h1>Bienvenido a Myorehaby</h1>
          <h2 className="subtitulo">-- Tecnología al servicio de tu rehabilitación --</h2>
        </div>

        
        
      </div>
      {!sesionIniciada && (
        <div className="btn-login-registro">
          <Link to="/Iniciosesion" className="login">
            Inicio de sesión
          </Link>
          <Link to="/DatosUser" className="registro">
            Registro
          </Link>
        </div>
      )}

      
      
      
    </div>
  )
}

export default Home
