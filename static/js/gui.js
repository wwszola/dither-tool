import { Pane } from "tweakpane";
import * as TweakpaneFileImportPlugin from "tweakpane-plugin-file-import";

export class GUI {
  constructor(guiContainerId) {
    this.guiContainer = document.getElementById(guiContainerId);
    this.pane = null;

    this.fileFolderConfig = null;
    this.parametersFolderConfig = null;

    this.updatableBindings = {};
  }

  // Create and set up the UI
  initialize() {
    this.pane = new Pane({
      container: this.guiContainer,
    });
    this.pane.registerPlugin(TweakpaneFileImportPlugin);
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

    parametersFolder.addBinding(config, "pixelate", {
      label: "Pixelate",
      min: 1,
      max: 16,
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
    parametersFolder.addBinding(config, "ditherSize", {
      label: "Dither size",
      options: [
        { text: "2x2", value: 2 },
        { text: "4x4", value: 4 },
        { text: "8x8", value: 8 },
      ],
    });
    parametersFolder.addBinding(config, "invert", { label: "Invert" });

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
        default:
          console.log(`No matching parameter key=${key} value=${value}`);
      }
    }
  }
}
