export class Controller {
  constructor(editor, gui) {
    this.editor = editor;
    this.gui = gui;

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

  // Trigger saving the result
  handleSaveOutput() {
    this.editor.saveOutput(
      this.fileFolderConfig.outputFilename.trim(),
      this.fileFolderConfig.outputSizeMode === "original"
    );
  }
}
