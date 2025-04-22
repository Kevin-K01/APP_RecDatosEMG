import { from } from "form-data"
import {useRef, useEffect, use} from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import "../styles_css/brazalete.css"

const DisplaySensor = () => {
    const mountRef = useRef(null)
    
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
        camera.position.z = 0.01
        camera.position.y = 0.2
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
        gltfLoader.load('/models/MYOARMBANDBRAZALET_3D.gltf',
            (gltf)=>{
                const model = gltf.scene
                scene.add(model);
                model.position.set(-0.01, -0.02, -0.02)
                console.log("Modelo cargado correctamente");

               // model.traverse((child) => {
                //    if (child.isMesh) {
                  //    console.log("Parte encontrada:", child.name);
                   // }
                    //else{
                      //  console.log("Parte no encontrada:", child.name);
                    //}
                  //});
                
                
            
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
