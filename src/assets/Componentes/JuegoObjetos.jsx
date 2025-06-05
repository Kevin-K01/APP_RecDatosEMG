import PropTypes from 'prop-types';
import '../Styles_css/EspaciodJuego.css';
const JuegoObjetos = ({ salirDelJuego }) => {
  return (
    <div className="espacio-juegos">
        <div className="botones-juego">
            <button className='btn-juego'>Iniciar</button>
            <button className='btn-juego'>Pausar</button>
            <button  className='btn-juego' onClick={salirDelJuego}>Salir</button>
        </div>
        
    </div>
  )
}
//  Validación del prop
JuegoObjetos.propTypes = {
  salirDelJuego: PropTypes.func.isRequired,
};
export default JuegoObjetos
