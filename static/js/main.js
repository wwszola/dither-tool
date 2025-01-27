import { Editor } from "./editor.js";
import { GUI } from "./gui.js";
import { Controller } from "./controller.js";

const editor = new Editor("editor-container", "editor");
const gui = new GUI("gui-container");
const controller = new Controller(editor, gui);

(async () => {
  await controller.initialize();
})();
