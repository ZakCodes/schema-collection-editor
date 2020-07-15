const fs = eval("require('fs')");
import {join} from 'path';
const {app} = eval("require('electron')").remote;
import deepmerge from 'deepmerge';

const settingsPath = app.getPath('userData');
const settingsFile = join(settingsPath, 'config.json');
export default class Settings {
    static get() {
        const defaults = {
            directory: app.getPath('home'),
            schemaPath: null,
            uiPath: null,
        };

        let loaded = {};
        try {
            const data = fs.readFileSync(settingsFile);
            loaded = JSON.parse(data);
        } catch (error) {
            console.log(error);
        }

        return deepmerge(defaults, loaded);
    }
    static set(settings) {
        try {
            const data = JSON.stringify(settings);
            fs.writeFileSync(settingsFile, data);
        } catch (error) {
            console.log(error);
            alert("The settings couldn't be saved.");
        }
    }
}
