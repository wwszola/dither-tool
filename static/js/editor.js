import * as THREE from "three";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

export class Editor {
  constructor(canvasContainerId, canvasId) {
    this.canvasContainer = document.getElementById(canvasContainerId);
    this.canvas = document.getElementById(canvasId);

    this.parameters = {
      pixelate: 1,
      contrast: 0.0,
      brightness: 0.0,
      invert: false,
      ditherToggle: true,
      quantize: 2,
      colorMode: false,
      ditherSize: 2,
    };

    this.ditherShader = {
      uniforms: {
        tDiffuse: { value: null },
        ditherSize: { value: 2 },
        quantize: { value: 2 },
        colorMode: { value: 0 },
      },
      vertexShader: null,
      fragmentShader: null,
    };

    this.levelsAdjustShader = {
      uniforms: {
        tDiffuse: { value: null },
        contrast: { value: 0.0 },
        brightness: { value: 0.0 },
        invert: { value: 0 },
      },
      vertexShader: null,
      fragmentShader: null,
    };

    this.renderer = null;
    this.lowResTarget = null;
    this.scene = null;
    this.camera = null;
    this.mesh = null;
    this.composer = null;
    this.passes = null;
  }

  // Load and assign shaders
  async preloadShaders() {
    try {
      const ditherVert = await fetch("static/glsl/dither-vert.glsl");
      this.ditherShader.vertexShader = await ditherVert.text();
      const ditherFrag = await fetch("static/glsl/dither-frag.glsl");
      this.ditherShader.fragmentShader = await ditherFrag.text();
    } catch (e) {
      console.error(e);
    }
    try {
      const levelsAdjustVert = await fetch(
        "static/glsl/levels-adjust-vert.glsl"
      );
      this.levelsAdjustShader.vertexShader = await levelsAdjustVert.text();
      const levelsAdjustFrag = await fetch(
        "static/glsl/levels-adjust-frag.glsl"
      );
      this.levelsAdjustShader.fragmentShader = await levelsAdjustFrag.text();
    } catch (e) {
      console.error(e);
    }
  }

  // Initialize WebGL renderer, shaders, and post-processing pipeline
  initializeRendering() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      preserveDrawingBuffer: true,
      antialias: false,
    });
    this.renderer.setSize(16, 16);

    this.lowResTarget = new THREE.WebGLRenderTarget(16, 16, {
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
    });

    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
      map: null,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    this.composer = new EffectComposer(this.renderer, this.lowResTarget);
    this.passes = {
      render: new RenderPass(this.scene, this.camera),
      levelsAdjust: new ShaderPass(this.levelsAdjustShader),
      dither: new ShaderPass(this.ditherShader),
      output: new OutputPass(),
    };
    this.composer.addPass(this.passes.render);
    this.composer.addPass(this.passes.levelsAdjust);
    this.composer.addPass(this.passes.dither);
    this.composer.addPass(this.passes.output);
  }

  computeRendererSize() {
    const sourceTextureSize = this.getSourceTextureSize();
    if (sourceTextureSize === undefined) {
      return;
    }
    sourceTextureSize.aspectRatio =
      sourceTextureSize.width / sourceTextureSize.height;
    const containerSize = {
      width: this.canvasContainer.clientWidth,
      height: this.canvasContainer.clientHeight,
      aspectRatio:
        this.canvasContainer.clientWidth / this.canvasContainer.clientHeight,
    };
    let width, height;
    if (containerSize.aspectRatio > sourceTextureSize.aspectRatio) {
      let scale = containerSize.height / sourceTextureSize.height;
      scale = Math.pow(2, Math.floor(Math.log2(scale)));
      height = sourceTextureSize.height * scale;
      width = height * sourceTextureSize.aspectRatio;
    } else {
      let scale = containerSize.width / sourceTextureSize.width;
      scale = Math.pow(2, Math.floor(Math.log2(scale)));
      width = sourceTextureSize.width * scale;
      height = width / sourceTextureSize.aspectRatio;
    }
    width = Math.floor(width);
    height = Math.floor(height);
    this.renderer.setSize(width, height);
  }

  // Compute low-resolution target size for pixelation
  computeComposerSize() {
    if (!this.mesh?.material?.map) {
      return;
    }
    const sourceTextureSize = this.getSourceTextureSize();
    const width = Math.floor(
      sourceTextureSize.width / this.parameters.pixelate
    );
    const height = Math.floor(
      sourceTextureSize.height / this.parameters.pixelate
    );
    this.composer.setSize(width, height);

    // if (lowResTarget.width !== width || lowResTarget.height !== height) {
    // // WebGLRenderTarget.setSize calls dispose on itself,
    // // thus allowing to commit size change to gpu
    // lowResTarget.setSize(width, height);
    // // EffectComposer keeps a clone of the render target as renderTarget2(readBuffer)
    // // calling EffectComposer.reset calls dispose on the readBuffer,
    // // thus properly commiting size change to the whole postprocessing pipeline
    // composer.reset(lowResTarget);
    // }
  }

  setSourceTexture(texture) {
    if (this.mesh.material.map) {
      this.mesh.material.map.dispose();
    }
    this.mesh.material.map = texture;
    this.mesh.material.needsUpdate = true;

    this.computeRendererSize();
    this.computeComposerSize();
  }

  getSourceTextureSize() {
    if (!this.mesh?.material?.map) {
      return undefined;
    }
    return {
      width: this.mesh.material.map.image.width,
      height: this.mesh.material.map.image.height,
    };
  }

  // Update parameters
  updateParameters(newParams) {
    for (const [key, value] of Object.entries(newParams)) {
      switch (key) {
        case "pixelate":
          this.parameters.pixelate = value;
          this.computeComposerSize();
          break;
        case "ditherSize":
        case "quantize":
          this.parameters[key] = value;
          this.passes.dither.uniforms[key].value = value;
          break;
        case "ditherToggle":
          this.parameters.ditherToggle = value;
          this.passes.dither.enabled = value;
          break;
        case "colorMode":
          this.parameters.colorMode = value;
          this.passes.dither.uniforms.colorMode.value = Number(value);
          break;
        case "contrast":
        case "brightness":
          this.parameters[key] = value;
          this.passes.levelsAdjust.uniforms[key].value = value;
          break;
        case "invert":
          this.parameters.invert = value;
          this.passes.levelsAdjust.uniforms.invert.value = Number(value);
          break;
        default:
          console.log(`No matching parameter key=${key} value=${value}`);
      }
    }
  }

  // Render the scene
  render() {
    this.composer.render();
  }

  // Load source image
  loadSourceImage(file, onSuccess) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        e.target.result,
        (texture) => {
          this.setSourceTexture(texture);
          onSuccess();
        },
        undefined,
        console.error
      );
    };
    reader.readAsDataURL(file);
  }

  getOutputSize(keepOriginal = false, scale = 1) {
    const sourceTexture = this.mesh?.material?.map;
    if (!sourceTexture) {
      return undefined;
    }
    if (keepOriginal) {
      return {
        width: sourceTexture.image.width,
        height: sourceTexture.image.height,
      };
    } else {
      return {
        width: this.composer.writeBuffer.width * scale,
        height: this.composer.writeBuffer.height * scale,
      };
    }
  }

  async getOutputBlob(mimeType, keepOriginalSize = false, scale = 1) {
    // Due to swapping buffers internally used in EffectComposer
    // the result is not always rendered into lowResTarget passed
    // in EffectComposer constructor or reset function
    // Instead to get the result read pixels from target referenced as writeBuffer
    const outputTarget = this.composer.writeBuffer;
    const outputSize = this.getOutputSize(keepOriginalSize, scale);
    try {
      // Data from GPU needs to be drawn to a canvas to ensure proper file encoding
      const offscreenCanvas = new OffscreenCanvas(
        outputSize.width,
        outputSize.height
      );
      const context = offscreenCanvas.getContext("2d");

      const imageData = context.createImageData(
        outputTarget.width,
        outputTarget.height
      );
      // Read pixels from gpu
      await this.renderer.readRenderTargetPixelsAsync(
        outputTarget,
        0,
        0,
        outputTarget.width,
        outputTarget.height,
        imageData.data
      );

      // GPU pixels are flipped along y axis, ImageBitmap allows reversing the flip
      const imageBitmap = await createImageBitmap(imageData, {
        imageOrientation: "flipY",
        resizeWidth: outputSize.width,
        resizeHeight: outputSize.height,
        resizeQuality: "pixelated",
      });

      context.drawImage(imageBitmap, 0, 0);

      imageBitmap.close();

      const blob = await offscreenCanvas.convertToBlob({ type: mimeType });
      return blob;
    } catch (e) {
      console.error(e);
    }
  }
}
