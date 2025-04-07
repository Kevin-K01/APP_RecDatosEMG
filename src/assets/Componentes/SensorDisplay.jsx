// BrazaleteConSensores.js
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const SensorDisplay = () => {
    const mountRef = useRef(null);

  useEffect(() => {
    // Crear la escena
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Material básico para el brazalete y los sensores
    const brazaleteMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true }); // Contorno azul
    const sensorMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff }); // Azul para los sensores

    // Crear el cilindro para el brazalete (representación del brazalete)
    const brazaleteGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 32); // Cilindro de radio 2 y altura 0.5
    const brazalete = new THREE.Mesh(brazaleteGeometry, brazaleteMaterial);
    brazalete.rotation.x = Math.PI / 2; // Hacer que el cilindro esté plano
    scene.add(brazalete);

    // Crear los sensores (8 sensores distribuidos alrededor del brazalete)
    const numSensores = 8;
    const radioSensores = 2.2; // Radio donde se colocan los sensores
    const sensores = [];

    // Crear los sensores (como pequeñas esferas o cilindros)
    for (let i = 0; i < numSensores; i++) {
      const angle = (i / numSensores) * (2 * Math.PI); // Distribuir equidistantemente
      const x = radioSensores * Math.cos(angle);
      const y = radioSensores * Math.sin(angle);

      // Usar esferas pequeñas para los sensores
      const sensorGeometry = new THREE.SphereGeometry(0.1, 16, 16); // Pequeña esfera
      const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
      sensor.position.set(x, y, 0); // Colocarlos en el círculo
      scene.add(sensor);
      sensores.push(sensor);
    }

    // Iluminación
    const light = new THREE.AmbientLight(0x404040, 2); // Luz ambiental
    scene.add(light);

    // Cámara
    camera.position.z = 5;

    // Animación de la escena
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotar el brazalete y los sensores para animarlos
      brazalete.rotation.z += 0.01;
      sensores.forEach(sensor => {
        sensor.rotation.x += 0.02;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Redimensionar la ventana
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={mountRef} />;
};

export default SensorDisplay;
