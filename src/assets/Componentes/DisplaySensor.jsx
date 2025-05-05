import {useRef, useEffect, useState, use, act} from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import "../styles_css/brazalete.css"
import { io } from "socket.io-client";

const socket = io("http://127.0.0.1:5000");

const NUM_SENSORS = 8;
const WINDOW_SIZE = 100;

const DisplaySensor = () => {
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
            25,
            currentMount.clientWidth / currentMount.clientHeight,
            0.01,
            1000
        );

        scene.background = new THREE.Color("#1a202c");
        camera.position.z = -0.2
        camera.position.y = 0.08
        scene.add(camera)

        // enviroment light
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        // directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

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
                model.position.set( -0.02, -0.01, -0.01)

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
    <div className="Container3D"
        ref = {mountRef}>
    </div>
)
}

export default DisplaySensor