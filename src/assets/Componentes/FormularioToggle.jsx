import '../styles_css/formulario.css';
function FormularioToggle() {

    return (
        <div className="contenedorregistro">
        <form className='formulario'>
            <h2>Agregar paciente</h2>
            <label>Nombre</label>
            <input
                type="text"
                placeholder="Ingresa un nombre"
                name="nombre"
            />
            <label>CURP</label>
            <input
                type="text"
                name="curp"
                placeholder="Ingresa la CURP"
            />
        
        
            <label>Dirección</label>
            <input
                type="text"
                name="observaciones"
                placeholder="Ingresa la dirección"
            />
    
        
            <label>Email</label>
            <input
                type="email"
                name="contacto"
                placeholder="Ingresa el correo electrónico"
            />
        
        
            <label>Teléfono</label>
            <input
                type="tel"
                name="telefono"
                placeholder="Ingresa el teléfono"
            />
        
        
            <label>Extremidad Afectada</label>
            <div className="contenedor-select">
                <select
                name="Extremidad_Afectada"
                >
                <option value="">Selecciona...</option>
                <option value="Miembro Superior Derecho">Miembro superior derecho</option>
                <option value="Miembro Superior Izquierdo">Miembro superior izquierdo</option>
                </select>
            </div>
            <button>Agregar</button>
        </form>
        </div>
    );
}

export default FormularioToggle;
