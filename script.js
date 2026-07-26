import * as THREE from 'three'
import { gsap } from "gsap";
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import topographicVertexShader from './shaders/vertex.glsl';
import topographicFragmentShader from './shaders/fragment.glsl';


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

// window size
const size = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 100);
camera.position.set(0,0,5)
scene.add(camera)

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
// bool to check if loaded is complete
let isModelsLoaded = false;

// distance between disks
let distanceBetween;

async function loadModels(){
    // map each url, use aysnc for the await loadAsync
    const promiseArray = discs.map(async disc => {
        const gltf = await gltfLoader.loadAsync(disc);
           // adjust the disk material
            gltf.scene.traverse((child) => {
                if (child.isMesh){
                    if (child.material.name === 'Whole Disk'){
                        child.material = new THREE.MeshNormalMaterial();
                    } else {
                        child.material.metalness = 0.5;
                        child.material.roughness = .15;
                    }
                    if (child.material.name === 'Mario'){
                       child.material.metalness = 0.3;
                    }
                    if (child.material.name === 'Material.001'){
                        child.material.metalness = 0.6;
                    }
                    
                }
            })
            gltf.scene.rotation.y = -Math.PI/2;
            gltf.scene.scale.set(1.2, 1.2, 1.2)
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
 * Calculate Distance between disc
 * based on horizontal fov so that the 
 * position of the disc when it rotates out of 
 * view is outside the frustrum
 */
function calculateDistance(){
    // tan() => radians, convert fov to radians
    let fovRadians = (camera.fov / 2) * (Math.PI / 180);
    // calculate the horizontal FOV so discs are outside frustrum
    const halfWidth = camera.position.z * Math.tan(fovRadians) * camera.aspect;
    // non-visible horizon distance 
    return halfWidth;
}

function calculateShaderSize(){
    // tan() => radians, convert fov to radians
    let fovRadians = (camera.fov / 2) * (Math.PI / 180);
    // calculate the horizontal FOV so discs are outside frustrum
    const width = 2 * (10 * Math.tan(fovRadians) * camera.aspect);
    const height = 2 * (10 * Math.tan(fovRadians));
    // non-visible horizon distance 
    return {width, height};
}

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
// timeline variable
let tl;

function createTimeline(){
    // delete old timelines and ScrollTrigger Instance to prevent glitches
    if (tl){
        tl.kill()
    }
    
    // create new timeline
    tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".scroll",
            //markers: true,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
        },
    });
}


const viewHeight = 150;

/**
 * Animates each mesh position and rotation
 * using GSAP
 */
function animateModel(){
    // exit the function if loadModels has not completed or array does not exist
    if (!discModels) return;
    // calculate how far apart the discs need to be based on horizontal fov
    distanceBetween = calculateDistance() + 3;
    // keep track of prev distance
    let currentDistance = 0;
    // position each mesh along the x axis
    //console.log('Position: ',discModels[1].position.x)
    for (const disc of discModels){
        // reset position to the origin
        disc.position.x = 0;
        // reset rotation to the origin
        disc.rotation.y = -Math.PI/2;

        // position the disc outside of the frustrum
        disc.position.x += currentDistance;
        currentDistance += distanceBetween;
    }
    // create a new timeline for the scroll trigger
    createTimeline();

    // attach gsap animation
    for (let i = 0; i < discModels.length; i++){
        if ( i === 0){
            // the first mesh position and rotate out
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


/**
 * Resize
 */
window.addEventListener('resize', () =>{
    // update size constants
    size.height = window.innerHeight;
    size.width = window.innerWidth;

    // update the camera new aspect
    camera.aspect = size.width / size.height;

    // update horizontal fov so discs remain outside of frustrum
    animateModel();

    // update camera in scene
    camera.updateProjectionMatrix();

    // update shader background size
    const shaderSize = calculateShaderSize();
    topographic.scale.set(shaderSize.width, shaderSize.height);

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
const directionalLight = new THREE.DirectionalLight(0xffffff, .5)
directionalLight.position.z = 4;
directionalLight.position.y = 4;
directionalLight.position.x = .2;
directionalLight.rotation.x = Math.PI / 2;
scene.add(directionalLight)

const light = new THREE.PointLight( 0xffffff, 10, 100 );
light.position.set(-5,5,5);
light.rotation.x = 70
light.rotation.z = -10
scene.add(light)


/**
 * Controls
 */
//const controls = new OrbitControls(camera, canvas);
//controls.enableDamping = true;

/**
 * Plane Material
 */
const topographicGeometry = new THREE.PlaneGeometry(1, 1, 128, 128);

const topographicMaterial = new THREE.ShaderMaterial({
    vertexShader: topographicVertexShader,
    fragmentShader: topographicFragmentShader, 
    uniforms: {
        uTime: {value: 0}
    }
});

const topographic = new THREE.Mesh(topographicGeometry, topographicMaterial);
topographic.position.z = -5;
scene.add(topographic);

// calculate the correct shader size and scale
const shaderSize = calculateShaderSize();
topographic.scale.set(shaderSize.width, shaderSize.height);


/**
 * Render
 */
const renderer = new THREE.WebGLRenderer({canvas:canvas, antialias: true});
renderer.setSize(size.width, size.height);
// handle pixel ratio, limit it to 2 to prevent performance issues
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// to remove after creating shader
//renderer.setClearColor('#ffffff');
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2

// clock for animation
const clock = new THREE.Clock()

// animate
function animate () {
    // clock
    const elapsedTime = clock.getElapsedTime();

    // set animation time for uniform
    topographicMaterial.uniforms.uTime.value = elapsedTime;

    // rotate the cd in a circle
    if (discModels){ // check if promises are still in progress
        for (const disc of discModels){
            disc.rotation.x = (Math.cos(elapsedTime * 1.5) * .13);
            disc.rotation.z = Math.sin(elapsedTime) * .01;
        }
        
    }

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