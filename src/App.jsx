import React from 'react'

const App = () => {
  return (
    <>
    <form>
      <h2>Nombre del paciente</h2>
      <input type ='text'></input>
      <h2>Número de sesión</h2>
      <input type ='text'></input>
      <h2>Observaciones</h2>
      <textarea></textarea>
      <button>Guardar</button>
    </form>
    <button>Capturar EMG</button>
    <button>Detener captura</button>
    </>

  )
}

export default App
