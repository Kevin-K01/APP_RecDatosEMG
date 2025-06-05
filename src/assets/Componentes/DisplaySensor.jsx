import {useRef, useEffect, useState} from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import "../styles_css/brazalete.css"
import { io } from "socket.io-client";

const socket = io("http://127.0.0.1:5000");

const NUM_SENSORS = 8;
const WINDOW_SIZE = 100;


const DisplaySensor = () => {
    
    const [successEmg, setSuccessEmg] = useState("");
    const [errorEmg, setErrorEmg] = useState("");
    const mountRef = useRef(null);
    let partes = useRef([]);
    const [emgData,setEmgData] = useState(Array.from({ length: NUM_SENSORS }, () => Array(WINDOW_SIZE).fill(0)));
    useEffect(() => {
        const handleEmgData = (data) => {
            //console.log("Datos EMG recibidos:", data);
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

    // Controlar inicio y detención de la captura EMG
    const capEmg = async (value) => {
        setErrorEmg(""); // Limpiar mensajes anteriores
        setSuccessEmg("");

        try {
        if (value === true) {
            let nombre2 = prompt("Ingresa el nombre del paciente:");
            if (nombre2 === null) {
            alert("Proceso cancelado.");
            return;
            }
            nombre2 = nombre2.trim().toUpperCase();

            if (nombre2 === "") {
            alert("Ingresa un nombre válido.");
            return;
            }

            let sesion = prompt("Ingresa el número de sesión:");
            if (sesion === null) {
            alert("Proceso cancelado.");
            return;
            }

            sesion = Number(sesion);
            if (isNaN(sesion) || sesion < 1) {
            alert("El número de sesión debe ser un valor numérico mayor o igual a 1.");
            return;
            }
            let curp = prompt("Ingresa tu curp: ");
            if (curp === null) {
            alert("Proceso cancelado.");
            return;
            }
            curp = curp.trim().toUpperCase();

            if (curp === "") {
            alert("Ingresa una curp válida.");
            return;
            }

            if (!nombre2 || !sesion || !curp) {
            setErrorEmg("El nombre, la curp y el número de sesión son obligatorios");
            setTimeout(() => setErrorEmg(""), 2000);
            alert("El nombre, curp y el número de sesión son obligatorios.");
            return;
            }

            const observaciones = prompt("Ingresa las observaciones");
            if (observaciones === null) {
            alert("Proceso cancelado.");
            return;
            }
            if (!observaciones) {
            setErrorEmg("Las observaciones son obligatorias");
            setTimeout(() => setErrorEmg(""), 2000);
            return;
            }

            const response = await fetch(`http://localhost:5000/start_emg_capture`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nombre: nombre2,
                sesion: sesion,
                curp: curp,
                observaciones: observaciones,
            }),
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

            console.log("Respuesta del servidor: ", data);
        }

        if (value === false) {
            const respons = await fetch(`http://localhost:5000/stop_emg_capture`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                valor: value,
            }),
            });
            const data = await respons.json();

            if (data.message) {
            setSuccessEmg("Captura EMG detenida");
            setTimeout(() => setSuccessEmg(""), 2000);
            } else {
            setErrorEmg("Error al detener la captura.");
            setTimeout(() => setErrorEmg(""), 2000);
            }

            console.log("Respuesta del servidor: ", data);
        }
        } catch (error) {
        setErrorEmg(`Error al capturar  o detener datos: ${error.message}`);
        setTimeout(() => setErrorEmg(""), 2000);
        console.error("Error al capturar datos: ", error);
        }
    };

    useEffect(() => {
        // Mapeo de los sensores con sus respectivos nombres
        const sensorNames = [
            'sensor1', 'sensor2', 'sensor3', 'sensor4',
            'sensor5', 'sensor6', 'sensor7', 'sensor8'
        ];


        // Obtener los últimos valores maximos de cada sensor en emgData
        const absValues = emgData.map(SensorData =>
            Math.max(...SensorData.map(v =>Math.abs(v)))
        )

        //console.log("Valores max de los sensores:", absValues);

        // Relacionamos cada valor con su sensor correspondiente
        const sensorDataMap = sensorNames.map((name, index) => ({
            name,
            value: absValues[index] || 0
        }));


        const sensoractive = sensorDataMap.map((sensor, index) => (sensor.value >= 10
                    && sensor.value === Math.max(...absValues) ? index : -1)).filter(index => index !== -1);

        //console.log("Sensores activos:", sensoractive.map(sensor => sensorNames[sensor]));
        //console.log("Sensores activos:", sensoractive);
        
        // Apagar todos
        Object.values(partes.current).forEach(partGroup => {
            if (!partGroup) return; // ← evita undefined

            partGroup.forEach(part => {
                if (part && part.material) {
                    part.material.emissive.setHex(0x000000);
                    part.material.emissiveIntensity = 0;
                }
            });
        });

    // Iluminar sensores activos
        sensoractive.forEach(index => {
            const sensorName = sensorNames[index];
            const parts = partes.current[sensorName];
            if (parts) {
                parts.forEach(part => {
                    if (part && part.material) {
                        // Clonar material si no ha sido clonado
                        if (!part.userData.cloned) {
                            part.material = part.material.clone();
                            part.userData.cloned = true; // Marcar como clonado para evitar hacerlo cada frame
                        }

                        part.material.emissive = new THREE.Color("#38bdf8");
                        part.material.emissiveIntensity = 1.5;
                    }
                });
            }
        });


    }, [emgData]);

    
    useEffect(() => {

        const currentMount = mountRef.current
        //Scene
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(
            2,
            currentMount.clientWidth / currentMount.clientHeight,
            0.01,
            1000
        );

        scene.background = new THREE.Color("#a5b4c8");
        camera.position.z = -2.2
        camera.position.y = 0.9
        camera.position.x = -0.5
        scene.add(camera)

        // enviroment light
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        scene.add(ambientLight);

        // directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1); // color cielo, color tierra, intensidad
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);

        //Renderer
        const renderer = new THREE.WebGLRenderer()
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight)
        currentMount.appendChild(renderer.domElement)

        //Controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true

    

        //loader
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('/models/MODELOFINALMYOARMBAND.gltf',
            (gltf)=>{
            
                const model = gltf.scene
                scene.add(model);

                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);
                model.position.set( -0.02, -0.03,0)
                model.target.set(0, 0, 0);

                const sensorPartsMap = {
                    sensor1: [
                        scene.getObjectByName('cara1'),
                        scene.getObjectByName('cara1-sup'),
                        scene.getObjectByName('cara1-inf'),
                    ],
                    sensor2: [
                        scene.getObjectByName('cara2'),
                        scene.getObjectByName('cara2-sup'),
                        scene.getObjectByName('cara2-inf'),
                    ],
                    sensor3: [
                        scene.getObjectByName('cara3'),
                        scene.getObjectByName('cara3-sup'),
                        scene.getObjectByName('cara3-inf'),
                    ],
                    sensor4: [
                        scene.getObjectByName('cara4'),
                        scene.getObjectByName('cara4-sup'),
                        scene.getObjectByName('cara4-inf'),
                    ],
                    sensor5: [
                        scene.getObjectByName('cara5'),
                        scene.getObjectByName('cara5-sup'),
                        scene.getObjectByName('cara5-inf'),
                    ],
                    sensor6: [
                        scene.getObjectByName('cara6'),
                        scene.getObjectByName('cara6-sup'),
                        scene.getObjectByName('cara6-inf'),
                    ],
                    sensor7: [
                        scene.getObjectByName('cara7'),
                        scene.getObjectByName('cara7-sup'),
                        scene.getObjectByName('cara7-inf'),
                    ],
                    sensor8: [
                        scene.getObjectByName('cara8'),
                        scene.getObjectByName('cara8-sup'),
                        scene.getObjectByName('cara8-inf'),
                    ],
                };
                
                partes.current = sensorPartsMap;
                
                controls.target.set(model.position.x, model.position.y, model.position.z);
                controls.update(); // actualizar controles después de cambiar target
                
                
            
            },
            undefined,
                (error) => {
                    console.error("Error al cargar modelo:", error);
                }
            );
    

        //Render the scene
        const animate = () => {
            controls.update()
            renderer.render(scene, camera)
            requestAnimationFrame(animate)
            
        }
        animate()
        //clean up scene
        return () => {
            currentMount.removeChild(renderer.domElement)
        }
    },[])

return (
    <>
    <div className="contenedor3d-botones">
        
        <div className="botones">
            <button onClick={() => capEmg(true)} className="capturar">Capturar EMG</button>
            <button onClick={() => capEmg(false)} className="detener">Detener captura</button>
        </div>
        
        <div className="mensajes">
                {errorEmg && <p className="errorm" style={{ color: "red" }}>{errorEmg}</p>}
                {successEmg && <p className="successm" style={{ color: "green" }}>{successEmg}</p>}
        </div>
        
        <div className="Container3D"
            ref = {mountRef}>
        </div>
    </div>
    
    </>
    
    
)
}

export default DisplaySensor