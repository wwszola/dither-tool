import * as THREE from 'three';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { createGUI } from './ui.js';

const canvas = document.getElementById('app');

const uiConfig = {
    file: '',
    loadTexture: loadTexture,
    resultFilename: 'result.png',
    saveResult: saveResult,
}

const params = {
    pixelate: 1,
    onPixelateChange: (v) => {
        computeLowResTargetSize();
        render();
    },
}

const ditherShader = {
    uniforms: {
        tDiffuse: { value: null },
    },
    vertexShader: null,
    fragmentShader: null,
};

let renderer, lowResTarget, composer, scene, camera, mesh;

async function preload(){
    const ditherVert = await fetch('src/glsl/dither-vert.glsl').then(
        (response) => response.text(),
        (reason) => console.error(reason)
    );
    ditherShader.vertexShader = ditherVert;

    const ditherFrag = await fetch('src/glsl/dither-frag.glsl').then(
        (response) => response.text(),
        (reason) => console.error(reason)
    );
    ditherShader.fragmentShader = ditherFrag;
}

function setup(){
    const maxCanvasSize = getCanvasSize();
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        preserveDrawingBuffer: true,
        antialias: false,
    });
    renderer.setSize(maxCanvasSize.width, maxCanvasSize.height);

    lowResTarget = new THREE.WebGLRenderTarget(maxCanvasSize.width, maxCanvasSize.height,{
        magFilter: THREE.NearestFilter,
        minFilter: THREE.NearestFilter,
    });

    scene = new THREE.Scene();

    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
        map: null,
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    composer = new EffectComposer(renderer, lowResTarget);
    const renderPass = new RenderPass(scene, camera);
    const ditherPass = new ShaderPass(ditherShader);
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(ditherPass);
    composer.addPass(outputPass);
}

function render(){
    composer.render();
}

function loadTexture(file){
    const reader = new FileReader();
    reader.onload = (e) => {
        const loader = new THREE.TextureLoader();
        loader.load(e.target.result, setSourceTexture, undefined, console.error);
    };
    reader.readAsDataURL(file);
}

function computeLowResTargetSize(){
    if(!mesh?.material?.map){
        return;
    }
    const width = mesh.material.map.image.width;
    const height = mesh.material.map.image.height;
    lowResTarget.setSize(
        Math.floor(width/params.pixelate), 
        Math.floor(height/params.pixelate)
    );
}

function setSourceTexture(texture){
    if(mesh.material.map){
        mesh.material.map.dispose();
    }
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;

    const size = getCanvasSize();
    renderer.setSize(size.width, size.height);
    computeLowResTargetSize();

    render();
}

function getCanvasSize(){
    const appContainer = document.getElementById('app-container');
    const containerSize = {
        width: appContainer.clientWidth,
        height: appContainer.clientHeight,
        aspectRatio: appContainer.clientWidth / appContainer.clientHeight,
    };
    const currentTexture = mesh?.material?.map;
    let width = containerSize.width;
    let height = containerSize.height;
    if (currentTexture) {
        const textureSize = {
            width: currentTexture.image.width,
            height: currentTexture.image.height,
            aspectRatio: currentTexture.image.width / currentTexture.image.height,
        };
        if (containerSize.aspectRatio > textureSize.aspectRatio) {
            let scale = containerSize.height / textureSize.height;
            scale = Math.pow(2, Math.floor(Math.log2(scale)));
            height = textureSize.height * scale;
            width = height * textureSize.aspectRatio;
        } else {
            let scale = containerSize.width / textureSize.width;
            scale = Math.pow(2, Math.floor(Math.log2(scale)));
            width = textureSize.width * scale;
            height = width / textureSize.aspectRatio;
        }
    }
    return {width, height};
}

async function saveResult(){
    try{
        // Data from GPU needs to be drawn to a canvas to ensure proper file encoding
        const offscreenCanvas = new OffscreenCanvas(lowResTarget.width, lowResTarget.height);
        const context = offscreenCanvas.getContext('2d');

        const imageData = context.createImageData(lowResTarget.width, lowResTarget.height);

        // Read pixels from gpu
        await renderer.readRenderTargetPixelsAsync(
            lowResTarget, 
            0, 0, 
            lowResTarget.width, lowResTarget.height, 
            imageData.data
        );

        // GPU pixels are flipped along y axis, ImageBitmap allows reversing the flip
        const imageBitmap = await createImageBitmap(imageData, {imageOrientation: 'flipY'});

        context.drawImage(imageBitmap, 0, 0);

        imageBitmap.close();

        const filename = uiConfig.resultFilename.trim();
        let mimeType;
        if(filename.endsWith('.png')){
            mimeType = 'image/png';
        }else if(filename.endsWith('.jpg') || filename.endsWith('.jpeg')){
            mimeType = 'image/jpeg';
        }else{
            throw new Error('Invalid file extension. Please use .png, .jpg, or .jpeg');
        }

        const blob = await offscreenCanvas.convertToBlob({type: mimeType});

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

    }catch(e){
        console.error(e);
    }
}

window.addEventListener('resize', () => {
    const size = getCanvasSize();
    renderer.setSize(size.width, size.height);
    render();
});

await preload();
setup();
createGUI(uiConfig, params);
render();
