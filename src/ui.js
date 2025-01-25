import { Pane } from 'tweakpane';
import * as TweakpaneFileImportPlugin from 'tweakpane-plugin-file-import';

let pane;

export function createGUI(config){
    pane = new Pane();
    pane.registerPlugin(TweakpaneFileImportPlugin);

    pane.addBinding(config, 'file', {
        view: 'file-input',
        lineCount: 3,
        filetypes: ['.jpg', '.jpeg', '.png'],
        invalidFiletypeMessage: 'Invalid file type. Please upload a .jpg, .jpeg, or .png file.',
    }).on('change', (e) => {
        if(e.value){
            config.loadTexture(e.value);
        }
    });

    pane.addBinding(config, 'resultFilename');
    pane.addButton({
        title: 'Save Result'
    }).on('click', config.saveResult);
}
