import * as THREE from "three";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

import { createUI } from "./ui.js";

const canvas = document.getElementById("app");

const uiConfig = {
  sourceFile: "",
  onUpload: loadSourceImage,
  resultFilename: "result.png",
  onSave: saveResult,
};

const params = {
  onChange: (v) => render(),
  pixelate: 1,
  onPixelateChange: (v) => {
    computeLowResTargetSize();
  },
  contrast: 0.0,
  onContrastChange: (v) => {
    levelsAdjustPass.uniforms.contrast.value = v.value;
  },
  brightness: 0.0,
  onBrightnessChange: (v) => {
    levelsAdjustPass.uniforms.brightness.value = v.value;
  },
  ditherSize: 2,
  onDitherSizeChange: (v) => {
    ditherPass.uniforms.ditherSize.value = v.value;
  },
  invert: false,
  onInvertChange: (v) => {
    levelsAdjustPass.uniforms.invert.value = Number(v.value);
  },
};

const ditherShader = {
  uniforms: {
    tDiffuse: { value: null },
    ditherSize: { value: 2 },
  },
  vertexShader: null,
  fragmentShader: null,
};

const levelsAdjustShader = {
  uniforms: {
    tDiffuse: { value: null },
    contrast: { value: 0.0 },
    brightness: { value: 0.0 },
    invert: { value: 0 },
  },
  vertexShader: null,
  fragmentShader: null,
};

let ditherPass, levelsAdjustPass;

let renderer, lowResTarget, composer, scene, camera, mesh;

async function preload() {
  try {
    const ditherVert = await fetch("static/glsl/dither-vert.glsl");
    ditherShader.vertexShader = await ditherVert.text();
    const ditherFrag = await fetch("static/glsl/dither-frag.glsl");
    ditherShader.fragmentShader = await ditherFrag.text();
  } catch (e) {
    console.error(e);
  }
  try {
    const levelsAdjustVert = await fetch("static/glsl/levels-adjust-vert.glsl");
    levelsAdjustShader.vertexShader = await levelsAdjustVert.text();
    const levelsAdjustFrag = await fetch("static/glsl/levels-adjust-frag.glsl");
    levelsAdjustShader.fragmentShader = await levelsAdjustFrag.text();
  } catch (e) {
    console.error(e);
  }
}

function setup() {
  const maxCanvasSize = getCanvasSize();
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    preserveDrawingBuffer: true,
    antialias: false,
  });
  renderer.setSize(maxCanvasSize.width, maxCanvasSize.height);

  lowResTarget = new THREE.WebGLRenderTarget(
    maxCanvasSize.width,
    maxCanvasSize.height,
    {
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
    }
  );

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
  levelsAdjustPass = new ShaderPass(levelsAdjustShader);
  ditherPass = new ShaderPass(ditherShader);
  const outputPass = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(levelsAdjustPass);
  composer.addPass(ditherPass);
  composer.addPass(outputPass);
}

function render() {
  composer.render();
}

function loadSourceImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const loader = new THREE.TextureLoader();
    loader.load(e.target.result, setSourceTexture, undefined, console.error);
  };
  reader.readAsDataURL(file);
}

function computeLowResTargetSize() {
  if (!mesh?.material?.map) {
    return;
  }
  let width = mesh.material.map.image.width;
  width = Math.floor(width / params.pixelate);
  let height = mesh.material.map.image.height;
  height = Math.floor(height / params.pixelate);
  if (lowResTarget.width !== width || lowResTarget.height !== height) {
    // WebGLRenderTarget.setSize calls dispose on itself,
    // thus allowing to commit size change to gpu
    lowResTarget.setSize(width, height);
    // EffectComposer keeps a clone of the render target as renderTarget2(readBuffer)
    // calling EffectComposer.reset calls dispose on the readBuffer,
    // thus properly commiting size change to the whole postprocessing pipeline
    composer.reset(lowResTarget);
  }
}

function setSourceTexture(texture) {
  if (mesh.material.map) {
    mesh.material.map.dispose();
  }
  mesh.material.map = texture;
  mesh.material.needsUpdate = true;

  const size = getCanvasSize();
  renderer.setSize(size.width, size.height);
  computeLowResTargetSize();

  render();
}

function getCanvasSize() {
  const appContainer = document.getElementById("app-container");
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
  return { width: Math.floor(width), height: Math.floor(height) };
}

async function saveResult() {
  try {
    // Data from GPU needs to be drawn to a canvas to ensure proper file encoding
    const offscreenCanvas = new OffscreenCanvas(
      lowResTarget.width,
      lowResTarget.height
    );
    const context = offscreenCanvas.getContext("2d");

    const imageData = context.createImageData(
      lowResTarget.width,
      lowResTarget.height
    );

    // Read pixels from gpu
    await renderer.readRenderTargetPixelsAsync(
      lowResTarget,
      0,
      0,
      lowResTarget.width,
      lowResTarget.height,
      imageData.data
    );

    // GPU pixels are flipped along y axis, ImageBitmap allows reversing the flip
    const imageBitmap = await createImageBitmap(imageData, {
      imageOrientation: "flipY",
    });

    context.drawImage(imageBitmap, 0, 0);

    imageBitmap.close();

    const filename = uiConfig.resultFilename.trim();
    let mimeType;
    if (filename.endsWith(".png")) {
      mimeType = "image/png";
    } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
      mimeType = "image/jpeg";
    } else {
      throw new Error(
        "Invalid file extension. Please use .png, .jpg, or .jpeg"
      );
    }

    const blob = await offscreenCanvas.convertToBlob({ type: mimeType });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  } catch (e) {
    console.error(e);
  }
}

window.addEventListener("resize", () => {
  const size = getCanvasSize();
  renderer.setSize(size.width, size.height);
  render();
});

await preload();
setup();
createUI(uiConfig, params);
render();
