
import {useRef, useEffect, useState} from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import "../styles_css/brazalete.css"

const DisplaySensor = () => {
    const mountRef = useRef(null)
    const [color,setColor] = useState(false)
    
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
        gltfLoader.load('/models/MYOARMBANDBRAZALET_3D.gltf',
            (gltf)=>{
              
                const model = gltf.scene
                scene.add(model);
                model.position.set( -0.02, -0.01, -0.01)

                let partes = [
                    scene.getObjectByName('cara1'),
                    scene.getObjectByName('cara1-sup'),
                    scene.getObjectByName('cara1-inf'),
                    scene.getObjectByName('cara2'),
                    scene.getObjectByName('cara2-sup'),
                    scene.getObjectByName('cara2-inf'),
                    scene.getObjectByName('cara3'),
                    scene.getObjectByName('cara3-sup'),
                    scene.getObjectByName('cara3-inf'),
                    scene.getObjectByName('cara4'),
                    scene.getObjectByName('cara4-sup'),
                    scene.getObjectByName('cara4-inf'),
                    scene.getObjectByName('cara5'),
                    scene.getObjectByName('cara5-sup'),
                    scene.getObjectByName('cara5-inf'),
                    scene.getObjectByName('cara6'),
                    scene.getObjectByName('cara6-sup'),
                    scene.getObjectByName('cara6-inf'),
                    scene.getObjectByName('cara7'),
                    scene.getObjectByName('cara7-sup'),
                    scene.getObjectByName('cara7-inf'),
                    scene.getObjectByName('cara8'),
                    scene.getObjectByName('cara8-sup'),
                    scene.getObjectByName('cara8-inf'),
                    
                ];


                const parte = partes[1];
                if (parte){
                    parte.material = parte.material.clone();
                    parte.material.color.set('#ff0000')
                }
                
            
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
