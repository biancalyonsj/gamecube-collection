import * as THREE from 'three'
import { gsap } from "gsap";
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { curlNoise } from 'three/examples/jsm/tsl/math/curlNoise.js';

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

// path to blender models
const discs = [
    '/models/Mario_Kart.glb',
    '/models/DBZ2.glb',
    '/models/Avalanche.glb',
    '/models/Strikers.glb',
    '/models/Super_Smash.glb',
    '/models/Pro_Skater.glb',
    '/models/Sonic.glb',
    '/models/DBZ.glb',
]

const loadingManger = new THREE.LoadingManager(
    // loaded
    ()=> {
        //console.log('loaded')
    },
    //progressing
    () => {
        //console.log('progress')
    }
);

const gltfLoader = new GLTFLoader(loadingManger);
// store each blender disc mesh that will animate
let discModels;

async function loadModels(){
    // map each url, use aysnc for the await loadAsync
    const promiseArray = discs.map(async disc => {
        const gltf = await gltfLoader.loadAsync(disc);
           // adjust the disk material
            gltf.scene.traverse((child) => {
                if (child.isMesh){
                    // to be 0.5 - 0.8
                    child.material.metalness = 0.5;
                    // to be .15 - .3
                    child.material.roughness = .15;
                    //child.envMapIntensity = 1.5;
                }
            })
            gltf.scene.rotation.y = -Math.PI/2;
            scene.add(gltf.scene)
            return gltf.scene
    })
    // use allsettled so that the promise does not terminate if one fails
    const results = await Promise.allSettled(promiseArray);
    // only store the models that successfully loaded
    discModels = results.filter(disc => disc.status === 'fulfilled').map(disc => disc.value);
}

//once all of the models are loaded, add the gsap .to animation to each model
loadModels().then(animateModel);


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

// distance between disks
const distanceBetween = 6;
let currentDistance = 0;
const viewHeight = 150;

/**
 * Animates each mesh position and rotation
 * using GSAP
 */
function animateModel(){
    // position each mesh along the x axis
    for (const disc of discModels){
        disc.position.x += currentDistance;
        currentDistance += distanceBetween;
    }

    // attach gsap animation
    for (let i = 0; i < discModels.length; i++){
        if ( i === 0){
            // rotate out
            tl.to(discModels[i].position, {x: -(distanceBetween), duration: 1.75});
            tl.to(discModels[i].rotation, {y: (Math.PI), duration: 1}, "-=1.5");
        } else {
            // position in
            tl.to(discModels[i].position, {x: '0', duration: 1.75, ease: "power1.out"}, '-=1');
            // rotate out position out
            tl.to(discModels[i].position, {x: -(distanceBetween), duration: 2, ease: "power1.in"});
            tl.to(discModels[i].rotation, {y: (Math.PI), duration: 1}, "-=1");
        }
        
    }

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

const ambientLight = new THREE.AmbientLight(0xffffff, 3.5)
scene.add(ambientLight)

// directional light
//const directionalLight = new THREE.DirectionalLight(0xffffff, 4)
const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
scene.add(directionalLight)


//const helper = new THREE.DirectionalLightHelper(directionalLight, 10);
//directionalLight.position.z = 4;
//directionalLight.position.y = 4;
//directionalLight.rotation.x = Math.PI / 2;
//scene.add(helper);


//const axesHelper = new THREE.AxesHelper(30);
//scene.add(axesHelper)


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
 * Render
 */
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(size.width, size.height);
// handle pixel ratio, limit it to 2 to prevent performance issues
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// to remove after creating shader
renderer.setClearColor('#ffffff');
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2

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


