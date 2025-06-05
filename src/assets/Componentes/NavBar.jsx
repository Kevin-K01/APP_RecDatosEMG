import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../Context/AuthContext';

const NavBar = () => {
  const { usuario } = useContext(AuthContext);
  const sesionIniciada = !!usuario;
  const inicialUsuario = usuario?.nombre?.charAt(0).toUpperCase() || 'U';

  const links = [
    { name: 'Inicio', href: '/ResumenInicio' },
    { name: 'Ejercicios', href: '/Graficas' },
    { name: 'Análisis', href: '/Dashboard' },
  ];

  if (sesionIniciada) {
    links.push({
      name: <div className="Perfil">{inicialUsuario}</div>,
      href: '/Perfil',
      className: 'link-perfil',
    });
  }

  return (
    <nav className="navbar">
      <img src="/myobrazaleteblnc.png" className="imgmyoprincipal" alt="Logo Myorehaby" />
      <Link to="/" className="inicio">
        <p className="titulo">MYOREHABY</p>
      </Link>
      <div className="secciones">
        {links.map((link, i) => (
          <div className="links" key={i}>
            <Link to={link.href} className={link.className || ''}>
              {link.name}
            </Link>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default NavBar;


