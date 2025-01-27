import { Editor } from "./editor.js";
import { GUI } from "./gui.js";
import { Controller } from "./controller.js";

debugger;
const editor = new Editor("app-container", "app");
const gui = new GUI("ui-container");
const controller = new Controller(editor, gui);

await controller.initialize();
