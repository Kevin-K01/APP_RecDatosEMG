import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import "../styles_css/brazalete.css";
import { io } from "socket.io-client";

const socket = io("http://127.0.0.1:5000");

const NUM_SENSORS = 8;
const WINDOW_SIZE = 100;

const DisplaySensor = () => {
    const [successEmg, setSuccessEmg] = useState("");
    const [errorEmg, setErrorEmg] = useState("");
    const [showModel3D, setShowModel3D] = useState(() => {
        const saved = localStorage.getItem("showModel3D");
        return saved === null ? true : JSON.parse(saved);
    });

    useEffect(() => {
        localStorage.setItem("showModel3D", JSON.stringify(showModel3D));
    }, [showModel3D]);

    const mountRef = useRef(null);
    let partes = useRef([]);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [emgData, setEmgData] = useState(Array.from({ length: NUM_SENSORS }, () => Array(WINDOW_SIZE).fill(0)));

    useEffect(() => {
        const handleEmgData = (data) => {
            setEmgData((prevData) =>
                prevData.map((sensorData, i) => [
                    ...sensorData.slice(1),
                    data.emg[i] || 0,
                ])
            );
        };

        socket.on("emg_data", handleEmgData);
        return () => {
            socket.off("emg_data", handleEmgData);
        };
    }, []);

    useEffect(() => {
        if (!modelLoaded) return;

        const sensorNames = [
            'sensor1', 'sensor2', 'sensor3', 'sensor4',
            'sensor5', 'sensor6', 'sensor7', 'sensor8'
        ];

        const absValues = emgData.map(sensorData =>
            Math.max(...sensorData.map(v => Math.abs(v)))
        );

        const sensorDataMap = sensorNames.map((name, index) => ({
            name,
            value: absValues[index] || 0
        }));

        const sensorActive = sensorDataMap.map((sensor, index) =>
            sensor.value >= 10 &&
            sensor.value === Math.max(...absValues) ? index : -1
        ).filter(index => index !== -1);

        Object.values(partes.current).forEach(partGroup => {
            if (!partGroup) return;
            partGroup.forEach(part => {
                if (part && part.material) {
                    part.material.emissive.setHex(0x000000);
                    part.material.emissiveIntensity = 0;
                }
            });
        });

        sensorActive.forEach(index => {
            const sensorName = sensorNames[index];
            const parts = partes.current[sensorName];
            if (parts) {
                parts.forEach(part => {
                    if (part && part.material) {
                        if (!part.userData.cloned) {
                            part.material = part.material.clone();
                            part.userData.cloned = true;
                        }
                        part.material.emissive.set("#38bdf8");
                        part.material.emissiveIntensity = 1.5;
                    }
                });
            }
        });
    }, [emgData, modelLoaded]);

    useEffect(() => {
        if (!showModel3D) return;

        const currentMount = mountRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            2,
            currentMount.clientWidth / currentMount.clientHeight,
            0.01,
            1000
        );

        scene.background = new THREE.Color("#a5b4c8");
        camera.position.set(-0.5, 0.9, -2);
        scene.add(camera);

        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        currentMount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const gltfLoader = new GLTFLoader();
        gltfLoader.load('/models/MODELOFINALMYOARMBAND.gltf',
            (gltf) => {
                const model = gltf.scene;
                scene.add(model);

                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);
                model.position.set(-0.02, -0.03, 0);

                const sensorPartsMap = {
                    sensor1: ['cara1', 'cara1-sup', 'cara1-inf'].map(name => scene.getObjectByName(name)),
                    sensor2: ['cara2', 'cara2-sup', 'cara2-inf'].map(name => scene.getObjectByName(name)),
                    sensor3: ['cara3', 'cara3-sup', 'cara3-inf'].map(name => scene.getObjectByName(name)),
                    sensor4: ['cara4', 'cara4-sup', 'cara4-inf'].map(name => scene.getObjectByName(name)),
                    sensor5: ['cara5', 'cara5-sup', 'cara5-inf'].map(name => scene.getObjectByName(name)),
                    sensor6: ['cara6', 'cara6-sup', 'cara6-inf'].map(name => scene.getObjectByName(name)),
                    sensor7: ['cara7', 'cara7-sup', 'cara7-inf'].map(name => scene.getObjectByName(name)),
                    sensor8: ['cara8', 'cara8-sup', 'cara8-inf'].map(name => scene.getObjectByName(name)),
                };

                partes.current = sensorPartsMap;
                controls.target.set(0, 0, 0);
                controls.update();
                setModelLoaded(true);
            },
            undefined,
            (error) => {
                console.error("Error al cargar modelo:", error);
            }
        );

        const animate = () => {
            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        return () => {
            renderer.dispose();
            controls.dispose();
            currentMount.removeChild(renderer.domElement);
        };
    }, [showModel3D]);

    const capEmg = async (value) => {
        setErrorEmg("");
        setSuccessEmg("");

        if (typeof value !== "boolean") {
            setErrorEmg("El valor debe ser true o false");
            setTimeout(() => setErrorEmg(""), 2000);
            return;
        }

        try {
            if (value) {
                let nombre2 = prompt("Ingresa el nombre del paciente:");
                if (nombre2 === null) return alert("Proceso cancelado.");
                nombre2 = nombre2.trim().toUpperCase();
                if (nombre2 === "") return alert("Ingresa un nombre válido.");

                let sesion = prompt("Ingresa el número de sesión:");
                if (sesion === null) return alert("Proceso cancelado.");
                sesion = Number(sesion);
                if (isNaN(sesion) || sesion < 1) return alert("El número de sesión debe ser numérico y mayor a 0.");

                let curp = prompt("Ingresa tu CURP:");
                if (curp === null) return alert("Proceso cancelado.");
                curp = curp.trim().toUpperCase();

                const observaciones = prompt("Ingresa las observaciones:");
                if (observaciones === null || observaciones.trim() === "") return alert("Las observaciones son obligatorias.");

                const response = await fetch(`http://localhost:5000/start_emg_capture`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombre: nombre2, sesion, curp, observaciones }),
                });

                const data = await response.json();
                if (!response.ok) {
                    setErrorEmg(data.error || "Error al buscar al paciente.");
                    setTimeout(() => setErrorEmg(""), 2000);
                    return;
                }

                if (data.exists) {
                    setSuccessEmg("Paciente encontrado");
                    setTimeout(() => setSuccessEmg(""), 2000);
                } else {
                    setErrorEmg("Paciente no encontrado, por favor, agrégalo");
                    setTimeout(() => setErrorEmg(""), 2000);
                }
            } else {
                const response = await fetch(`http://localhost:5000/stop_emg_capture`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ valor: value }),
                });

                const data = await response.json();
                if (data.message) {
                    setSuccessEmg("Captura EMG detenida");
                    setTimeout(() => setSuccessEmg(""), 2000);
                } else {
                    setErrorEmg("Error al detener la captura.");
                    setTimeout(() => setErrorEmg(""), 2000);
                }
            }
        } catch (error) {
            setErrorEmg(`Error al capturar o detener datos: ${error.message}`);
            setTimeout(() => setErrorEmg(""), 2000);
        }
    };

    return (
        <>
        <div className="contenedor3d-botones">
            
            <button onClick={() => setShowModel3D(prev => !prev)} className={`toggle3d ${showModel3D ? "con-modelo" : "sin-modelo"}`}>
                {showModel3D ? "Ocultar Modelo 3D" : "Mostrar Modelo 3D"}
            </button>
            <button onClick={() => capEmg(true)} className="capturar">Capturar EMG</button>
            <button onClick={() => capEmg(false)} className="detener">Detener captura</button>
            
            <div className="mensajes">
                {errorEmg && <p className="errorm" style={{ color: "red" }}>{errorEmg}</p>}
                {successEmg && <p className="successm" style={{ color: "green" }}>{successEmg}</p>}
            </div>

            {showModel3D && <div className="Container3D" ref={mountRef}></div>}
        
        </div>

        </>
    );
};

export default DisplaySensor;

