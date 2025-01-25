import { Pane } from 'tweakpane';
import * as TweakpaneFileImportPlugin from 'tweakpane-plugin-file-import';

export function createGUI(config){
    const pane = new Pane();
    pane.registerPlugin(TweakpaneFileImportPlugin);

    pane.addBinding(config, 'file', {
        view: 'file-input',
        lineCount: 3,
        filetypes: ['.jpg', '.jpeg', '.png'],
        invalidFileTypeMessage: 'Invalid file type. Please upload a .jpg, .jpeg, or .png file.',
    }).on('change', (e) => {
        if(e.value){
            config.loadTexture(e.value);
        }
    });
}


