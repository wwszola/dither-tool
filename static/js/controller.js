export class Controller {
  constructor(editor, gui, preview) {
    this.editor = editor;
    this.gui = gui;
    this.preview = preview;

    this.fileFolderConfig = null;
    this.parametersFolderConfig = null;
  }

  // Initialize the application
  async initialize() {
    try {
      await this.editor.preloadShaders();

      // Initialize the WebGL renderer and rendering pipeline
      this.editor.initializeRendering();

      // Configure the UI
      this.fileFolderConfig = {
        sourceFilename: "",
        onUpload: this.handleFileUpload.bind(this),
        outputFilename: "result.png",
        outputSizeString: "16x16px",
        outputSizeMode: "pixelated",
        onOutputSizeModeChange: this.handleOutputSizeModeChange.bind(this),
        onSave: this.handleSaveOutput.bind(this),
      };

      this.parametersFolderConfig = {
        ...this.editor.parameters,
        onChange: this.handleParameterChange.bind(this),
      };

      this.gui.initialize();
      this.gui.createFileControls(this.fileFolderConfig);
      this.gui.createParametersControls(this.parametersFolderConfig);

      // Bind resize event to handle canvas resizing
      window.addEventListener("resize", this.handleResize.bind(this));

      this.editor.canvas.addEventListener(
        "click",
        this.handlePreviewOpen.bind(this)
      );

      this.preview.initialize();

      this.fetchAndUpload("static/media/grayscale_256x256.png");

      this.editor.render();

      console.log("Controller initialized successfully.");
    } catch (error) {
      console.error("Error initializing the controller:", error);
    }
  }

  // Handle file uploads
  handleFileUpload(file) {
    this.editor.loadSourceImage(file, () => {
      this.editor.render();
      // Default output filename is generated from uploaded filename
      const filenameParts = file.name.split(".");
      const newFilename =
        filenameParts[0] + "-dither." + filenameParts[filenameParts.length - 1];
      this.gui.updateParameters({ outputFilename: newFilename });
      // Show correct output size
      this.handleOutputSizeModeChange();
    });
  }

  // Fetch an image from a URL and upload it
  async fetchAndUpload(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const filename = imageUrl.split("/").pop();
      const file = new File([blob], filename, { type: blob.type });

      this.handleFileUpload(file);
    } catch (error) {
      console.error("Error fetching the image:", error);
    }
  }

  // Handle parameter changes
  handleParameterChange(key, value) {
    const newParams = {};
    newParams[key] = value;
    this.editor.updateParameters(newParams);
    this.editor.render();
    if (key === "pixelate") {
      this.handleOutputSizeModeChange();
    }
  }

  // Handle canvas resizing
  handleResize() {
    this.editor.computeRendererSize();
    this.editor.render();
  }

  handleOutputSizeModeChange() {
    const outputSize = this.editor.getOutputSize(
      this.fileFolderConfig.outputSizeMode === "original"
    );
    const outputSizeString = `${outputSize.width}x${outputSize.height}px`;
    this.gui.updateParameters({ outputSizeString: outputSizeString });
  }

  getOutputMimeType() {
    const filename = this.fileFolderConfig.outputFilename.trim();
    if (filename.endsWith(".png")) {
      return "image/png";
    } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
      return "image/jpeg";
    } else {
      throw new Error(
        "Invalid file extension. Please use .png, .jpg, or .jpeg"
      );
    }
  }

  // Trigger saving the result
  handleSaveOutput() {
    const mimeType = this.getOutputMimeType();
    const filename = this.fileFolderConfig.outputFilename.trim();
    const keepOriginalSize =
      this.fileFolderConfig.outputSizeMode === "original";
    this.editor.getOutputBlob(mimeType, keepOriginalSize).then((blob) => {
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    });
  }

  handlePreviewOpen() {
    const mimeType = this.getOutputMimeType();
    const keepOriginalSize =
      this.fileFolderConfig.outputSizeMode === "original";
    this.editor.getOutputBlob(mimeType, keepOriginalSize).then((blob) => {
      this.preview.open(blob);
    });
  }
}
