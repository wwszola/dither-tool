import { Editor } from "./editor.js";
import { GUI } from "./gui.js";
import { Preview } from "./preview.js";
import { Controller } from "./controller.js";

const editor = new Editor("editor-container", "editor");
const gui = new GUI("gui-container");
const preview = new Preview("preview-container", "preview");
const controller = new Controller(editor, gui, preview);

(async () => {
  await controller.initialize();
})();
