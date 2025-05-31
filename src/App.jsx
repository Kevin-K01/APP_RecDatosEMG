import DatosUser from './assets/Componentes/DatosUser.jsx'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import NavBar from './assets/Componentes/NavBar.jsx'
import Home from './assets/Componentes/Home.jsx'
import Graficas from './assets/Componentes/Graficas.jsx'
import Iniciosesion from './assets/Componentes/Iniciosesion.jsx'
import Dashboard from './assets/Componentes/Dashboard.jsx'

const App = () => {
  return (
    <Router>
      <NavBar/>
        <Routes>
          <Route path = "/" element={<Home/>}/>
          <Route path = "/Graficas" element={<Graficas/>}/>
          <Route path = "/DatosUser" element={<DatosUser/>}/>
          <Route path = "/Dashboard" element={<Dashboard/>}/>
          <Route path = "/Iniciosesion" element={<Iniciosesion/>}/>
        </Routes>
    </Router>
  );
};

export default App
