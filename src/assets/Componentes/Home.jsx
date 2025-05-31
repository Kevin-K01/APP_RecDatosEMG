import "../styles_css/Home.css"
import { Link } from 'react-router-dom';



const Home = () => {
  return (
    <div className='home'>
      <div className='principal'>
        
        <div className="bienvenida">
          <p >En Myorehaby, combinamos innovación tecnológica con atención a la salud para apoyar la rehabilitación de personas con hemiplejia.</p>
          <p>Utilizando el brazalete Myo Armband, ofrecemos un sistema inteligente de monitoreo de señales musculares (EMG) que permite dar seguimiento al progreso del paciente en tiempo real.</p>
          <p>Nuestro objetivo es facilitar terapias más precisas, personalizadas y accesibles.</p>
          <p>¡Explora cómo la tecnología puede mejorar tu recuperación día a día!</p>
        </div>
        <div className="titulos">
          <h1>Bienvenido a Myorehaby</h1>
          <h2 className="subtitulo">-- Tecnología al servicio de tu rehabilitación --</h2>
        </div>

        
        
      </div>
      <div className="btn-login-registro">
        <Link to="/Iniciosesion" className="login">Inicio de sesión</Link>
        <Link to="/DatosUser" className="registro">Registro</Link>
        </div>
        <Link to="/Recuperacion_contracena" className="recuperacion-contracena">Recuperacion de contraseña</Link>
      
      
      
    </div>
  )
}

export default Home
