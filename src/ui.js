import { Pane } from 'tweakpane';
import * as TweakpaneFileImportPlugin from 'tweakpane-plugin-file-import';

const uiContainer = document.getElementById('ui-container');

let pane;

export function createGUI(config, params){
    pane = new Pane({
        container: uiContainer,
    });
    pane.registerPlugin(TweakpaneFileImportPlugin);

    pane.addBinding(config, 'file', {
        view: 'file-input',
        lineCount: 3,
        filetypes: ['.jpg', '.jpeg', '.png'],
        invalidFiletypeMessage: 'Invalid file type. Please upload a .jpg, .jpeg, or .png file.',
    }).on('change', (e) => {
        if(e.value){
            config.load(e.value);
        }
    });

    pane.addBinding(config, 'resultFilename');
    pane.addButton({
        title: 'Save Result'
    }).on('click', config.saveResult);

    pane.addBinding(params, 'pixelate', {
        min: 1,
        max: 16,
        step: 1
    }).on('change', params.onPixelateChange);
    pane.addBinding(params, 'contrast', {
        min: -1,
        max: 1,
        step: 0.01
    }).on('change', params.onContrastChange);
    pane.addBinding(params, 'brightness', {
        min: -1,
        max: 1,
        step: 0.01
    }).on('change', params.onBrightnessChange);
}
