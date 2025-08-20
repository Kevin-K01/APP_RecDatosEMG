import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "../Styles_css/EspaciodJuego.css";
import musicaFondo from "../Music/exploration-chiptune-rpg-adventure-theme-336428.mp3";

import stars from "../ImagenesJuegos/stars.png";
import naveImg from "../ImagenesJuegos/nave.png";
import enemigoImg from "../ImagenesJuegos/enemigo.png";
import balaImg from "../ImagenesJuegos/bala.png";
import { io } from "socket.io-client";

const socket = io("http://127.0.0.1:5000"); // desarrollo

const JuegoNave = ({ salirDelJuego }) => {
  const [navePos, setNavePos] = useState({ x: 220, y: 480 });
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  const navePosRef = useRef(navePos);
  const balasRef = useRef([]);
  const enemiesRef = useRef([]);
  const lastShotRef = useRef(0);
  const lastMoveRef = useRef(0);
  const gameLoopRef = useRef(null);
  const canvasRef = useRef(null);
  const assetsRef = useRef({});
  const gameOverRef = useRef(false);
  const gameOverMsgRef = useRef("");
  const choqueRef = useRef(null);

  // 🔹 Audio
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(musicaFondo);
    audio.loop = true;
    audioRef.current = audio;
  }, []);

  const CANVAS_W = 500;
  const CANVAS_H = 600;
  const ENEMY_SIZE = 60;
  const SHIP_W = 60;
  const SHIP_H = 60;
  const BULLET_W = 15;
  const BULLET_H = 30;

  const VELOCIDAD_BALAS = 5;
  const VELOCIDAD_ENEMIGOS = 0.1;
  const SPAWN_MS = 5000;

  const generarEnemigosIniciales = () => [
    { id: 1, x: 10, y: 10 },
    { id: 2, x: 150, y: 10 },
    { id: 3, x: 280, y: 10 },
    { id: 4, x: 420, y: 10 },
  ];

  // precarga de imágenes
  useEffect(() => {
    const loadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });

    Promise.all([loadImage(stars), loadImage(naveImg), loadImage(enemigoImg), loadImage(balaImg)])
      .then(([starsImg, nave, enemigo, bala]) => {
        assetsRef.current = { starsImg, nave, enemigo, bala };
      });
  }, []);

  useEffect(() => { enemiesRef.current = generarEnemigosIniciales(); }, []);
  useEffect(() => { navePosRef.current = navePos; }, [navePos]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  // ======= Control por gestos =======
  useEffect(() => {
    const handlePoseData = (data) => {
      if (!running) return;
      const now = Date.now();

      if (["Fist", "Fingers Spread", "Wave Out", "Wave In"].includes(data.pose)) {
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

  // ======= Bucle principal canvas =======
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    const loop = () => {
      const { starsImg, nave, enemigo, bala } = assetsRef.current;
      if (!starsImg) { gameLoopRef.current = requestAnimationFrame(loop); return; }

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      if (showIntro) {
        ctx.drawImage(starsImg, 0, 0, CANVAS_W, CANVAS_H);
        ctx.drawImage(nave, 210, 300, SHIP_W * 1.5, SHIP_H * 1.5);
        ctx.fillStyle = "white";
        ctx.font = "32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Nave Espacial", CANVAS_W / 2, 250);
      } else {
        ctx.drawImage(starsImg, 0, 0, CANVAS_W, CANVAS_H);

        if (running) {
          // balas
          balasRef.current = balasRef.current.map(b => ({ ...b, y: b.y - VELOCIDAD_BALAS }))
            .filter(b => b.y > -BULLET_H);

          // enemigos y colisiones
          enemiesRef.current = enemiesRef.current.map(e => ({ ...e, y: e.y + VELOCIDAD_ENEMIGOS }))
            .filter(enemy => {
              let impactado = false;

              balasRef.current = balasRef.current.filter(b => {
                const hit = b.x < enemy.x + ENEMY_SIZE && b.x + BULLET_W > enemy.x &&
                            b.y < enemy.y + ENEMY_SIZE && b.y + BULLET_H > enemy.y;
                if (hit) { impactado = true; setScore(prev => prev + 1); return false; }
                return true;
              });

              // 🔹 Si hay choque, pausamos música
              if (!gameOverRef.current &&
                  ((enemy.y + ENEMY_SIZE >= navePosRef.current.y &&
                  enemy.x + ENEMY_SIZE > navePosRef.current.x &&
                  enemy.x < navePosRef.current.x + SHIP_W) ||
                  enemy.y >= CANVAS_H - ENEMY_SIZE)) {

                choqueRef.current = enemy;
                setRunning(false);
                setGameOver(true);
                gameOverRef.current = true;

                if (enemy.y + ENEMY_SIZE >= navePosRef.current.y) {
                  gameOverMsgRef.current = "¡Fin del juego! Un enemigo chocó con la nave.";
                } else {
                  gameOverMsgRef.current = "¡Fin del juego! Los enemigos llegaron abajo.";
                }

                // 🔹 Pausar música al perder
                if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();

                setTimeout(() => { choqueRef.current = null; }, 1000);
                return false;
              }

              return !impactado;
            });
        }

        // dibujar enemigos, balas, nave y mensaje fin de juego (igual que tu código anterior)...
        enemiesRef.current.forEach(e => {
          if (choqueRef.current && e.id === choqueRef.current.id) {
            ctx.save();
            ctx.drawImage(enemigo, e.x, e.y, ENEMY_SIZE, ENEMY_SIZE);
            ctx.globalCompositeOperation = "source-atop";
            ctx.fillStyle = "red";
            ctx.fillRect(e.x, e.y, ENEMY_SIZE, ENEMY_SIZE);
            ctx.restore();
          } else {
            ctx.drawImage(enemigo, e.x, e.y, ENEMY_SIZE, ENEMY_SIZE);
          }
        });

        balasRef.current.forEach(bu => ctx.drawImage(bala, bu.x, bu.y, BULLET_W, BULLET_H));

        if (choqueRef.current) {
          ctx.save();
          ctx.drawImage(nave, navePosRef.current.x, navePosRef.current.y, SHIP_W, SHIP_H);
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = "red";
          ctx.fillRect(navePosRef.current.x, navePosRef.current.y, SHIP_W, SHIP_H);
          ctx.restore();
        } else {
          ctx.drawImage(nave, navePosRef.current.x, navePosRef.current.y, SHIP_W, SHIP_H);
        }

        if (gameOverMsgRef.current) {
          ctx.fillStyle = "red";
          ctx.font = "24px Arial";
          ctx.textAlign = "center";

          const maxWidth = CANVAS_W - 20;
          const words = gameOverMsgRef.current.split(" ");
          let line = "";
          let y = CANVAS_H / 2 - 20;

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " ";
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              ctx.fillText(line, CANVAS_W / 2, y);
              line = words[n] + " ";
              y += 30;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, CANVAS_W / 2, y);
        }
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [showIntro, running, gameOver]);

  // spawn enemigos aleatorios
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      enemiesRef.current.push({
        id: Date.now(),
        x: Math.floor(Math.random() * (CANVAS_W - ENEMY_SIZE)),
        y: 5,
      });
    }, SPAWN_MS);
    return () => clearInterval(interval);
  }, [running]);

  // ======= Controles =======
  const disparar = () => {
    if (!running) return;
    const { x, y } = navePosRef.current;
    balasRef.current.push({ x: x + SHIP_W / 2 - BULLET_W / 2, y: y - 20 });
  };

  const moverNave = (dir) => {
    setNavePos(prev => {
      const step = 6;
      const maxX = CANVAS_W - SHIP_W;
      const maxY = CANVAS_H - SHIP_H;
      switch (dir) {
        case "left": return { ...prev, x: Math.max(0, prev.x - step) };
        case "right": return { ...prev, x: Math.min(maxX, prev.x + step) };
        case "up": return { ...prev, y: Math.max(0, prev.y - step) };
        case "down": return { ...prev, y: Math.min(maxY, prev.y + step) };
        default: return prev;
      }
    });
  };

  const iniciarJuego = () => {
    setShowIntro(false);
    setRunning(true);
    gameOverMsgRef.current = "";
    if (audioRef.current) audioRef.current.play().catch(() => {});
  };

  const pausarJuego = () => {
    setRunning(prev => {
      if (audioRef.current) {
        if (prev) audioRef.current.pause();
        else audioRef.current.play().catch(() => {});
      }
      return !prev;
    });
  };

  const reiniciarJuego = () => {
    setRunning(false);
    setGameOver(false);
    setNavePos({ x: 220, y: 480 });
    balasRef.current = [];
    enemiesRef.current = generarEnemigosIniciales();
    gameOverRef.current = false;
    gameOverMsgRef.current = "";
    choqueRef.current = null;
    setScore(0);
    setShowIntro(false);
    setRunning(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleSalir = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    salirDelJuego();
  };

  return (
    <div className="espacio-juegos">
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="canvas-juego" />
      <div className="marcador">Puntos: {score}</div>
      <div className="botones-juego">
        {showIntro ? (
          <button className="btn-juego" onClick={iniciarJuego}>Iniciar</button>
        ) : (
          <>
            <button className="btn-juego" onClick={pausarJuego}>
              {running ? "Pausar" : "Reanudar"}
            </button>
            <button className="btn-juego" onClick={reiniciarJuego}>Reiniciar</button>
          </>
        )}
        <button className="btn-juego" onClick={handleSalir}>Salir</button>
      </div>
    </div>
  );
};

JuegoNave.propTypes = { salirDelJuego: PropTypes.func.isRequired };
export default JuegoNave;
