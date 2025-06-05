import PropTypes from 'prop-types';
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
        if (usuarioGuardado) setUsuario(usuarioGuardado);
    }, []);

    const login = (usuarioData) => {
        localStorage.setItem('usuario', JSON.stringify(usuarioData));
        setUsuario(usuarioData);
    };

    const logout = () => {
        localStorage.removeItem('usuario');
        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{ usuario, login, logout }}>
        {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
