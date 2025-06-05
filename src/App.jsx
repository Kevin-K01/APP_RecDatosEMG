import DatosUser from './assets/Componentes/DatosUser.jsx'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import NavBar from './assets/Componentes/NavBar.jsx'
import Home from './assets/Componentes/Home.jsx'
import Graficas from './assets/Componentes/Graficas.jsx'
import Iniciosesion from './assets/Componentes/Iniciosesion.jsx'
import Dashboard from './assets/Componentes/Dashboard.jsx'
import Recuperarcontrasena from './assets/Componentes/Recuperarcontrasena.jsx'
import ResumenInicio from './assets/Componentes/ResumenInicio.jsx'
import Perfil from './assets/Componentes/Perfil.jsx'
import FormularioToggle from './assets/Componentes/FormularioToggle.jsx'
import { AuthProvider } from './Context/AuthContext.jsx';

const App = () => {
  return (
    <AuthProvider>
      <Router>
      <NavBar/>
        <Routes>
          <Route path = "/" element={<Home/>}/>
          <Route path = "/Graficas" element={<Graficas/>}/>
          <Route path = "/DatosUser" element={<DatosUser/>}/>
          <Route path = "/Dashboard" element={<Dashboard/>}/>
          <Route path = "/Iniciosesion" element={<Iniciosesion/>}/>
          <Route path = "/ResumenInicio" element={<ResumenInicio/>}/>
          <Route path = "/Recuperarcontrasena" element={<Recuperarcontrasena/>}/>
          <Route path = "/Perfil" element={<Perfil/>}/>
          <Route path = "/FormularioToggle" element={<FormularioToggle/>}/>
          <Route path = "*" element={<h1>404 Not Found</h1>}/>
        </Routes>
    </Router>
    </AuthProvider>
  );
};

export default App
