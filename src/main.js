import * as THREE from 'three';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const canvas = document.getElementById('app');

const pixelate = 4;

const ditherShader = {
    uniforms: {
        tDiffuse: { value: null },
    },
    vertexShader: null,
    fragmentShader: null,
};

let renderer, buffer, composer, scene, camera, mesh;

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
    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(maxCanvasSize.width, maxCanvasSize.height);

    buffer = new THREE.WebGLRenderTarget(maxCanvasSize.width, maxCanvasSize.height,{
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

    composer = new EffectComposer(renderer, buffer);
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

function setSourceTexture(texture){
    if(mesh.material.map){
        mesh.material.map.dispose();
    }
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;

    const size = getCanvasSize();
    renderer.setSize(size.width, size.height);
    buffer.setSize(texture.image.width/pixelate, texture.image.height/pixelate);

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

window.addEventListener('resize', () => {
    const size = getCanvasSize();
    renderer.setSize(size.width, size.height);
    render();
});

canvas.addEventListener('dragover', (event) => {
    event.preventDefault();
});

canvas.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const loader = new THREE.TextureLoader();
            loader.load(e.target.result, setSourceTexture, undefined, console.error);
        };
        reader.readAsDataURL(file);
    }
});

await preload();
setup();
render();
