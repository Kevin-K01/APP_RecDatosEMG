import { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import '../Styles_css/EspaciodJuego.css';

import stars from '../ImagenesJuegos/stars.png';
import naveImg from '../ImagenesJuegos/nave.png';
import enemigoImg from '../ImagenesJuegos/enemigo.png';
import balaImg from '../ImagenesJuegos/bala.png';
import { io } from "socket.io-client";

const socket = io();   //descomentar para producción
//const socket = io("http://127.0.0.1:5000");  //comentar para producción

const JuegoNave = ({ salirDelJuego }) => {
  const [navePos, setNavePos] = useState({ x: 220, y: 480 });
  const [balas, setBalas] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const balasRef = useRef([]);
  const enemiesRef = useRef([]);
  const navePosRef = useRef(navePos);
  const lastShotRef = useRef(0);
  const lastMoveRef = useRef(0);

  const generarEnemigosIniciales = () => [
    { id: 1, x: 10, y: 10 },
    { id: 2, x: 150, y: 10 },
    { id: 3, x: 280, y: 10 },
    { id: 4, x: 420, y: 10 },
  ];

  useEffect(() => setEnemies(generarEnemigosIniciales()), []);
  useEffect(() => { navePosRef.current = navePos; }, [navePos]);

  // ===================== Pose control con cooldown =====================
  useEffect(() => {
    const handlePoseData = (data) => {
      if (!running) return;

      const now = Date.now();

      // Movimiento cada 90ms como máximo
      if (["Fist","Fingers Spread","Wave Out","Wave In"].includes(data.pose)) {
        if (now - lastMoveRef.current > 90) {
          switch (data.pose) {
            case "Fist": moverNave("up"); break;
            case "Fingers Spread": moverNave("down"); break;
            case "Wave Out": moverNave("right"); break;
            case "Wave In": moverNave("left"); break;
          }
          lastMoveRef.current = now;
        }
      }

      // Disparo cada 300ms como máximo
      if (data.pose === "Double Tap") {
        if (now - lastShotRef.current > 300) {
          disparar();
          lastShotRef.current = now;
        }
      }
    };

    socket.on("pose_data", handlePoseData);
    return () => socket.off("pose_data", handlePoseData);
  }, [running]);

  // ===================== EMG y enemigos =====================
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setBalas(prev => prev.map(bala => ({ ...bala, y: bala.y - 10 })).filter(bala => bala.y > -20));
    }, 50);
    return () => clearInterval(interval);
  }, [running]);

  const colision = (balaEl, enemyEl) => {
    if (!balaEl || !enemyEl) return false;
    const balaRect = balaEl.getBoundingClientRect();
    const enemyRect = enemyEl.getBoundingClientRect();
    return !(balaRect.right < enemyRect.left ||
              balaRect.left > enemyRect.right ||
              balaRect.bottom < enemyRect.top ||
              balaRect.top > enemyRect.bottom);
  };

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setEnemies(prevEnemies => {
        let nuevasBalas = [...balas];
        const enemigosActualizados = prevEnemies.filter((enemy, ei) => {
          let impactado = false;
          nuevasBalas = nuevasBalas.filter((bala, bi) => {
            if (colision(balasRef.current[bi], enemiesRef.current[ei])) {
              impactado = true;
              setScore(prev => prev + 1);
              return false;
            }
            return true;
          });

          if (!gameOver &&
              (enemy.y + 40 >= navePosRef.current.y && Math.abs(enemy.x - navePosRef.current.x) < 40 || enemy.y >= 500)) {
            setRunning(false);
            setGameOver(true);
            setTimeout(() => {
              reiniciarJuego();
              alert("¡Fin del juego!");
            }, 10);
            return false;
          }

          return !impactado;
        }).map(e => ({ ...e, y: e.y + 2 }));  //aceleracion de las naves

        setBalas(nuevasBalas);
        return enemigosActualizados;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [running, balas, gameOver]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setEnemies(prev => [...prev, { id: Date.now(), x: Math.floor(Math.random() * 470), y: 5 }]);
    }, 3000);
    return () => clearInterval(interval);
  }, [running]);

  // ===================== Control y disparo =====================
  const disparar = () => { 
    if (!running) return; 
    const { x, y } = navePosRef.current;
    setBalas(prev => [...prev, { x: x + 31, y: y - 20 }]); 
  };

  const moverNave = (dir) => { 
    setNavePos(prev => { 
      const step = 10; const maxX = 470; const maxY = 500;
      switch (dir) {
        case "left": return { ...prev, x: Math.max(0, prev.x - step) };
        case "right": return { ...prev, x: Math.min(maxX, prev.x + step) };
        case "up": return { ...prev, y: Math.max(0, prev.y - step) };
        case "down": return { ...prev, y: Math.min(maxY, prev.y + step) };
        default: return prev;
      }
    });
  };

  const iniciarJuego = () => setRunning(true);
  const pausarJuego = () => setRunning(false);
  const reiniciarJuego = () => {
    setRunning(false); setGameOver(false);
    setNavePos({ x: 220, y: 480 }); setBalas([]); setEnemies(generarEnemigosIniciales());
    setScore(0); setTimeout(() => setRunning(true), 100);
  };

  return (
    <div className="espacio-juegos">
      <img className="fondo-juego" src={stars} alt="estrellas" />
      <div className="marcador">Puntos: {score}</div>

      {enemies.map((enemy, i) => (
        <img key={enemy.id} ref={el => enemiesRef.current[i] = el} className="enemigo" src={enemigoImg} alt="enemigo" style={{ left: enemy.x, top: enemy.y }}/>
      ))}

      <img className="nave" src={naveImg} alt="nave" style={{ left: navePos.x, top: navePos.y }}/>

      {balas.map((bala, i) => (
        <img key={i} ref={el => balasRef.current[i] = el} className="bala" src={balaImg} alt="bala" style={{ left: bala.x, top: bala.y }}/>
      ))}

      <div className="botones-juego">
        <button className="btn-juego" onClick={iniciarJuego}>Iniciar</button>
        <button className="btn-juego" onClick={pausarJuego}>Pausar</button>
        <button className="btn-juego" onClick={reiniciarJuego}>Reiniciar</button>
        <button className="btn-juego" onClick={salirDelJuego}>Salir</button>
      </div>
    </div>
  );
};

JuegoNave.propTypes = { salirDelJuego: PropTypes.func.isRequired };
export default JuegoNave;

