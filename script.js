import * as THREE from 'three'
import { gsap } from "gsap";
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * GUI
 */
const gui = new GUI();

gui.hide();
window.addEventListener('keydown', (event) => {
    if (event.key === 'h'){
        gui.show(gui._hidden);
    }
})


// scene
const scene = new THREE.Scene();
// canvas
const canvas = document.querySelector('canvas.webgl');
// prevent browser from restoring scrollY
history.scrollRestoration = "manual";

/**
 * Blender GameCube Games
 */
// distance between disks

const discDistance = {
    space: 6
}

const discs = [
    '/models/Mario_Kart.glb',
    '/models/DBZ2.glb',
    '/models/Avalanche.glb',,
    '/models/Strikers.glb',
    '/models/Super_Smash.glb',,
    '/models/Pro_Skater.glb',
    '/models/Sonic.glb',
    '/models/DBZ.glb',

]

/*
let model = {};
let modelRotation = {};

const gltfLoader = new GLTFLoader();
gltfLoader.load(
    '/models/Mario_Kart.glb',
    (gltf) => {
        console.log(gltf);

        // adjust the disk material
        gltf.scene.traverse((child) => {
            if (child.isMesh){
                // to be 0.5 - 0.8
                child.material.metalness = 0;
                // to be .15 - .3
                child.material.roughness = 1;
                //child.envMapIntensity = 1.5;
            }
        })
        gltf.scene.rotation.y = -Math.PI/2;
        model = gltf.scene;
        //model.scale.setScalar(10.0); 
        
        scene.add(gltf.scene)

    }
)
*/

/**
 * Torus
 */
// material

const meshDistance = 6;
const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
//geometry
const geometry = new THREE.TorusGeometry( .75, .2, 3, 10 );
// mesh
const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

const material2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const torus2 = new THREE.Mesh(geometry, material2);
scene.add(torus2);
torus2.position.x = meshDistance;

const material3 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const torus3 = new THREE.Mesh(geometry, material3);
scene.add(torus3);
torus3.position.x = meshDistance + meshDistance;

const torus4 = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xfaa5f0 }));
scene.add(torus4);
torus4.position.x = meshDistance + meshDistance;

const torusMeshes = {
    torus,
    torus2,
    torus3
}

// window size
const size = {
    width: window.innerWidth,
    height: window.innerHeight
   
}

//gui.add(discDistance, 'space').min(4).max(10).step(1).name('Disc Distance');

/**
 * Resize
 */
window.addEventListener('resize', () =>{
    // update size constants
    size.height = window.innerHeight;
    size.width = window.innerWidth;

    // update the camera
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();

    //update renderer
    renderer.setSize(size.width, size.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})

/**
 * Lights
*/
// ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
scene.add(ambientLight)

// directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
directionalLight.position.set(5, 5, 5);
//directionalLight.target.position.set(model);
scene.add(directionalLight)

//const helper = new THREE.DirectionalLightHelper(directionalLight, 1);
//scene.add(helper);

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 100);
//camera.lookAt(model)
//camera.position.set(0,0,.5)
camera.position.set(0,0,5)
scene.add(camera)

// add to gui
gui.add(camera.position, 'z').min(.5).max(1).step(.2).name('Camera Z');
gui.add(camera, 'fov').min(80).max(120).step(5).name('Camera FOV').onChange(() => {
    camera.updateProjectionMatrix();
});

/**
 * Controls
 */
//const controls = new OrbitControls(camera, canvas);
//controls.enableDamping = true;

/**
 * Smooth Scrolling
 */
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
})
gsap.ticker.lagSmoothing(0);

/**
 * Scroll Trigger
 */
gsap.registerPlugin(ScrollTrigger);

let tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".scroll",
        //markers: true,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
    },
});

// rotate out
tl.to(torus.position, {x: -(meshDistance), duration: 2});
tl.to(torus.rotation, {y: (Math.PI), duration: 1}, "-=1.9");

// position in
tl.to(torus2.position, {x: '0', duration: 1, ease: "power1.out"}, '-=1');
// rotate out position out
tl.to(torus2.position, {x: -(meshDistance), duration: 2, ease: "power1.in"});
tl.to(torus2.rotation, {y: (Math.PI), duration: 1}, "-=1");

// position in 
tl.to(torus3.position, {x: '0', duration: 1, ease: "power1.out"}, "-=.75");
// rotate out position out
tl.to(torus3.position, {x: -(meshDistance), duration: 2, ease: "power1.in"});
tl.to(torus3.rotation, {y: (Math.PI), duration: 1}, "-=1");

// position in 
tl.to(torus4.position, {x: '0', duration: 1, ease: "power1.out"}, "-=.75");
// rotate out position out
tl.to(torus4.position, {x: -(meshDistance), duration: 2, ease: "power1.in"});
tl.to(torus4.rotation, {y: (Math.PI), duration: 1}, "-=1");



/**
 * Render
 */
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(size.width, size.height);
// handle pixel ratio, limit it to 2 to prevent performance issues
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// to remove after creating shader
renderer.setClearColor('#ffffff');
renderer.outputColorSpace = THREE.SRGBColorSpace;

// clock for animation
const clock = new THREE.Clock()

// animate
function animate () {
    // clock
    const elapsedTime = clock.getElapsedTime();
    //console.log(torus.rotation.y);

    // rotate the cd in a circle
    //torus.rotation.y = Math.sin(elapsedTime) * .3;
    //torus.rotation.x = Math.cos(elapsedTime) * .2;
    //torus.rotation.z = Math.sin(elapsedTime);

    //model.y = Math.sin(elapsedTime) * .3;
    //model.x = Math.cos(elapsedTime) * .2;

    // Update controls
    //controls.update();

    // render
    renderer.render(scene, camera);
    //console.log(window.scrollY);

    // call the next frame
    window.requestAnimationFrame(animate);
}

// call our animation loop function
animate();


