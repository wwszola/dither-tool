import { Pane } from "tweakpane";
import * as TweakpaneFileImportPlugin from "tweakpane-plugin-file-import";
import * as TweakpanePluginInputs from "tweakpane-plugin-inputs";

export class GUI {
  constructor(guiContainerId) {
    this.guiContainer = document.getElementById(guiContainerId);
    this.pane = null;

    this.fileFolderConfig = null;
    this.parametersFolderConfig = null;

    this.updatableBindings = {};
    this.hidableBindings = {};
  }

  // Create and set up the UI
  initialize() {
    this.pane = new Pane({
      container: this.guiContainer,
    });
    this.pane.registerPlugin(TweakpaneFileImportPlugin);
    this.pane.registerPlugin(TweakpanePluginInputs);
  }

  // Bind file upload and save actions
  createFileControls(config) {
    const fileFolder = this.pane.addFolder({ title: "File", expanded: true });

    fileFolder
      .addBinding(config, "sourceFilename", {
        label: "Upload",
        view: "file-input",
        lineCount: 3,
        filetypes: [".jpg", ".jpeg", ".png"],
        invalidFiletypeMessage:
          "Invalid file type. Please upload a .jpg, .jpeg, or .png file.",
      })
      .on("change", (ev) => {
        config.onUpload(ev.value);
      });

    fileFolder.addBlade({ view: "separator" });

    const outputFilenameBinding = fileFolder.addBinding(
      config,
      "outputFilename",
      {
        label: "Output filename",
      }
    );
    this.updatableBindings.outputFilename = outputFilenameBinding;

    const outputSizeStringBinding = fileFolder.addBinding(
      config,
      "outputSizeString",
      {
        label: "Output size",
        disabled: true,
      }
    );
    this.updatableBindings.outputSizeString = outputSizeStringBinding;

    fileFolder
      .addBinding(config, "outputSizeMode", {
        label: "Output size mode",
        options: {
          Pixelated: "pixelated",
          Original: "original",
        },
      })
      .on("change", config.onOutputSizeChange);

    const outputSizeScaleBinding = fileFolder
      .addBinding(config, "outputSizeScale", {
        label: "Output size scale",
        min: 1,
        max: 32,
        step: 1,
      })
      .on("change", config.onOutputSizeChange);
    this.hidableBindings.outputSizeScale = outputSizeScaleBinding;

    fileFolder.addButton({ title: "Save" }).on("click", (ev) => {
      config.onSave();
    });

    this.fileFolderConfig = config;
  }

  // Bind parameter controls
  createParametersControls(config) {
    const parametersFolder = this.pane
      .addFolder({ title: "Parameters", expanded: true })
      .on("change", (ev) => {
        const key = ev.target.controller.value.binding.target.key;
        const value = ev.value;
        config.onChange(key, value);
      });

    // default state exported after parametersFolder construction
    let defaultState = undefined;
    parametersFolder.addButton({ title: "Reset" }).on("click", () => {
      parametersFolder.importState(defaultState);
    });
    parametersFolder.addBlade({ view: "separator" });

    parametersFolder.addBinding(config, "pixelate", {
      label: "Pixelate",
      min: 1,
      max: 32,
      step: 1,
    });
    parametersFolder.addBinding(config, "contrast", {
      label: "Contrast",
      min: -1,
      max: 1,
      step: 0.01,
    });
    parametersFolder.addBinding(config, "brightness", {
      label: "Brightness",
      min: -1,
      max: 1,
      step: 0.01,
    });
    parametersFolder.addBinding(config, "invert", { label: "Invert" });
    parametersFolder.addBlade({ view: "separator" });

    parametersFolder.addBinding(config, "ditherToggle", { label: "Dither" });
    parametersFolder.addBinding(config, "quantize", {
      label: "Quantize",
      min: 2,
      max: 16,
      step: 1,
    });
    parametersFolder.addBinding(config, "colorMode", { label: "Color" });
    parametersFolder
      .addBinding(config, "ditherSize", {
        label: "Dither size",
        options: [
          { text: "2x2", value: 2 },
          { text: "4x4", value: 4 },
          { text: "8x8", value: 8 },
          { text: "Custom", value: -1 },
        ],
      })
      .on("change", config.onDitherSizeChange);

    const customMatrixWidthBinding = parametersFolder
      .addBinding(config, "customMatrixWidth", {
        label: "Dither width",
        view: "stepper",
        min: 0,
        max: 8,
        step: 1,
        hidden: true,
      })
      .on("change", config.onDitherSizeChange);
    this.hidableBindings.customMatrixWidth = customMatrixWidthBinding;

    const customMatrixHeightBinding = parametersFolder
      .addBinding(config, "customMatrixHeight", {
        label: "Dither height",
        view: "stepper",
        min: 0,
        max: 8,
        step: 1,
        hidden: true,
      })
      .on("change", config.onDitherSizeChange);
    this.hidableBindings.customMatrixHeight = customMatrixHeightBinding;

    defaultState = parametersFolder.exportState();

    this.parametersFolderConfig = config;
  }

  updateParameters(newParams) {
    for (const [key, value] of Object.entries(newParams)) {
      switch (key) {
        case "outputFilename":
          this.fileFolderConfig.outputFilename = value;
          this.updatableBindings.outputFilename.refresh();
          break;
        case "outputSizeString":
          this.fileFolderConfig.outputSizeString = value;
          this.updatableBindings.outputSizeString.refresh();
          break;
        default:
          console.log(`No matching parameter key=${key} value=${value}`);
      }
    }
  }

  setHiddenProperty(binding, value) {
    value = Boolean(value);
    switch (binding) {
      case "outputSizeScale":
      case "customMatrixWidth":
      case "customMatrixHeight":
        this.hidableBindings[binding].hidden = value;
        break;
      default:
        console.log(`No matching binding=${binding} value=${value}`);
    }
  }
}
