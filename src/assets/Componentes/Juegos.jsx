import cohete from '../ImagenesJuegos/cohete.png';
import mano from '../ImagenesJuegos/mano.png';
import robot from '../ImagenesJuegos/robot.png';
import '../Styles_css/Juegos.css';
import { useState} from 'react';
import JuegoNave from './JuegoNave.jsx';
import JuegoObjetos from './JuegoObjetos.jsx';
import JuegoRobot from './JuegoRobot.jsx';
const Juegos = () => {

    const [juegoActual, setJuegoActual] = useState(null);
    const salirDelJuego = () => {
        setJuegoActual(null);
    };
    
    if (juegoActual === 'naves') return <JuegoNave salirDelJuego={salirDelJuego}/>;
    
    if (juegoActual === 'objetos') return <JuegoObjetos salirDelJuego={salirDelJuego}/>;
    
    if (juegoActual === 'robot') return <JuegoRobot salirDelJuego={salirDelJuego}/>;

    
return (
    <>
    <div className='juegos'>
        <h2>Selecciona un juego</h2>
        <div   className='space'>
            <img onClick={()=>setJuegoActual('naves')} src={cohete} className="juego-nave" />
            <p>Nave Espacial</p>
        </div>
        <div className='objetos'>
            <img onClick={()=>setJuegoActual('objetos')} src={mano} className="juego-objetos" />
            <p>Objetos</p>
        </div>
        <div  className='robot'>
            <img onClick={()=>setJuegoActual('robot')} src={robot} className="juego-robot" />
            <p>Robot</p>
        </div>
    </div>
        
    </>
    
  )
}

export default Juegos
