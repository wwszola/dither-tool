import { Pane } from "tweakpane";
import * as TweakpaneFileImportPlugin from "tweakpane-plugin-file-import";

const uiContainer = document.getElementById("ui-container");

let pane;

export function createGUI(config, params) {
  pane = new Pane({
    container: uiContainer,
  });
  pane.registerPlugin(TweakpaneFileImportPlugin);

  // File: upload, save
  const fileFolder = pane.addFolder({ title: "File", expanded: true });
  fileFolder
    .addBinding(config, "sourceFile", {
      label: "Upload",
      view: "file-input",
      lineCount: 3,
      filetypes: [".jpg", ".jpeg", ".png"],
      invalidFiletypeMessage:
        "Invalid file type. Please upload a .jpg, .jpeg, or .png file.",
    })
    .on("change", (e) => {
      if (e.value) {
        config.onUpload(e.value);
      }
    });
  fileFolder.addBlade({ view: "separator" });
  fileFolder.addBinding(config, "resultFilename", {
    label: "Output filename",
  });
  fileFolder.addButton({ title: "Save" }).on("click", config.onSave);

  // Params: controlling effects
  const paramsFolder = pane
    .addFolder({ title: "Parameters", expanded: true })
    .on("change", params.onChange);
  // default state exported after paramsFolder construction
  let defaultParamsFolderState = undefined;
  paramsFolder.addButton({ title: "Reset" }).on("click", () => {
    if (defaultParamsFolderState) {
      paramsFolder.importState(defaultParamsFolderState);
    }
  });
  paramsFolder
    .addBinding(params, "pixelate", {
      label: "Pixelate",
      min: 1,
      max: 16,
      step: 1,
    })
    .on("change", params.onPixelateChange);
  paramsFolder
    .addBinding(params, "contrast", {
      label: "Contrast",
      min: -1,
      max: 1,
      step: 0.01,
    })
    .on("change", params.onContrastChange);
  paramsFolder
    .addBinding(params, "brightness", {
      label: "Brightness",
      min: -1,
      max: 1,
      step: 0.01,
    })
    .on("change", params.onBrightnessChange);
  paramsFolder
    .addBinding(params, "ditherSize", {
      label: "Dither size",
      options: [
        { text: "2x2", value: 2 },
        { text: "4x4", value: 4 },
        { text: "8x8", value: 8 },
      ],
      value: 2,
    })
    .on("change", params.onDitherSizeChange);

  defaultParamsFolderState = paramsFolder.exportState();
}
