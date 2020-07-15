import YAML from 'yaml';
import React from 'react';
import Form from 'react-jsonschema-form';
import FileTree from './FileTree';
import Tabs from './Tabs';
import Editor from './Editor';
import createMenu from './menu.js';
import Settings from './settings';
import {join} from 'path';
import {readDataSync, saveDataSync, yamlExt, mdExt, jsonExt} from './utils';
const fs = eval("require('fs')"); // This is a temporary fix to make sure this statement is executed at runtime
const { dialog, app } = eval("require('electron').remote"); // Same here

function readCfgSync(path, filename) {
    let error;
    const exts = [
        {mod: YAML, ext: '.yaml'},
        {mod: YAML, ext: '.yml'},
        {mod: JSON, ext: '.json'},
    ];
    for (let ext of exts) {
        try {
            const p = join(path, filename + ext.ext);
            const content = fs.readFileSync(p);
            const data = ext.mod.parse(content.toString());
            return {
                data: data,
                path: p,
            };
        } catch (e) {
            error = e;
        }
    }
    throw error;
}

const widgets = {
    editor: Editor,
};

export default class App extends React.Component {
    constructor(props) {
        super(props);

        // Open the path.
        const settings = Settings.get();
        console.log(settings);

        this.state = {
            files: [{
                path: null,
                data: null,
            }],
            index: 0,
            //...(this.loadDirectory(settings.directory))
            ...(this.loadDirectory('/home/zakcodes/Downloads/cctt/site/_sources'))
        };

        createMenu(this.openFolder, this.openSchema, this.openUI, this.save, this.saveAll);

        app.on('before-quit', () => {
            Settings.set({
                directory: this.state.directory,
                schemaPath: this.state.schema && this.state.schema.path,
                uiPath: this.state.ui && this.state.ui.path,
            });
        });
    }

    handleSubmit = () => {
        this.save(this.state.index);
    }
    handleChange = (data) => {
        const file = this.state.files[this.state.index];
        file.data = data.formData;
        file.changed = true;
    }
    handleError = (errors) => {
        console.log(errors);
    }

    handleClose = (index) => {
        const file = this.state.files[index];

        // If the file needs to be saved
        if (file.changed) {
            // If the user wants to cancel the close
            const options = {
                type: "warning",
                title: "The file isn't saved, do you want to save it?",
                buttons: ["yes", "no", "cancel"],
                defaultId: 2,
            };
            const choice = dialog.showMessageBox(options);
            // If the user wants to cancel the action
            if (choice === 2) {
                return;
            }
            // If the user wants to save the file
            else if (choice === 0) {
                this.save(index);
            }
        }

        // Close the file.
        this.state.files.splice(index, 1);

        // If there are no more files
        if (this.state.files.length === 0)
            // Create a new one
            this.state.files.push({ path: null, changed: false });

        console.log('files:', this.state.files.length);

        this.setState({
            index: index <= this.state.index && this.state.index != 0 ? this.state.index - 1 : this.state.index,
        });
    }
    handleSelect = (index) => {
        this.setState({
            index: index,
        });
    }

    handleFileSelect = (path) => {
        let index = this.state.files.findIndex(file => file.path === path);
        if (index < 0) {
            let data = null;
            try {
                data = readDataSync(path);
            } catch (error) {
                console.log(error);
                alert(error);
            }
            this.state.files.push({
                path: path,
                data: data,
                changed: false,
            });
            index = this.state.files.length - 1;
        }
        console.log(this.state.files[index]);
        this.setState({
            index: index,
        });
    }

    changeDirectory = (path) => {
        this.setState(this.loadDirectory(path));
    }
    loadDirectory = (path) => {
        let schema = null;
        try {
            schema = readCfgSync(path, 'schema');
        } catch (error) {
            alert(error);
        }

        let ui = undefined;
        try {
            ui = readCfgSync(path, 'ui');
        } catch (error) {}

        return {
            directory: path,
            schema: schema,
            ui: ui,
        }
    }

    saveAll = () => {
        // Save all the files that already have a filename.
        for (let [i, file] of this.state.files.entries()) {
            if (file.path) {
                this.save(i);
            }
        }
    };
    save = (index) => {
        // If no index is selected, use the selected editor.
        index |= this.state.index;
        const file = this.state.files[index];

        // If the file doesn't have a path
        if (file.path) {
            return this.savePath(file);
        } else {
            return this.saveAs(file);
        }
    }
    saveAs = (file) => {
        // If no file is provided, use the opened one.
        file = this.state.files[this.state.index];

        // If the file doesn't have a path
        if (!file.path) {
            // Ask the user for a path
            const newPath = dialog.showSaveDialog();

            if (newPath) {
                file.path = newPath;
                this.savePath(file);
            } else {
                return -1;
            }
        }
    }
    savePath = (file) => {
        try {
            saveDataSync(file.path, file.data);
            file.changed = false;
            this.setState({});
        } catch (error) {
            alert(error);
            return error;
        }
        return null;
    }

    openFolder = () => {
        const directory = dialog.showOpenDialog({ properties: ['openDirectory'] });
        if (directory && directory[0])
            this.changeDirectory(directory[0]);
    };
    openSchema = () => {
        try {
            const files = dialog.showOpenDialog({
                title: 'Pick a JSON Schema file',
                properties: ['openFile'],
                filters: [
                    { name: 'YAML', extensions: yamlExt.map(s => s.slice(1)) },
                    { name: 'JSON', extensions: jsonExt.map(s => s.slice(1)) },
                    { name: 'All Files', extensions: ['*'] },
                ],
            });
            const file = files && files[0];
            if (files && files[0]) {
                let data = readDataSync(file);
                this.setState({
                    schema: {
                        path: file,
                        data: data,
                    },
                });
            }
        } catch(error) {
            alert(error);
        }
    };
    openUI = () => {
        try {
            const path = dialog.showOpenDialog({
                title: 'Pick a UI file',
                properties: ['openFile'],
                filters: [
                    { name: 'YAML', extensions: yamlExt },
                    { name: 'JSON', extensions: jsonExt },
                    { name: 'All Files', extensions: ['*'] },
                ],
            })[0];
            if (path) {
                let data = readDataSync(data);
                this.setState({
                    schema: {
                        path: path,
                        data: data,
                    },
                });
            }
        } catch(error) {
            alert(error);
        }
    };

    render() {
        let form;
        // If a schema is loaded
        if (this.state.schema) {
            let file = this.state.files[this.state.index];
            // Return a form.
            form = (<Form schema={this.state.schema.data}
                        uiSchema={this.state.ui && this.state.ui.data}
                        widgets={widgets}
                        formData={file.data}
                        onChange={this.handleChange}
                        onSubmit={this.handleSubmit}
                        onError={this.handleError}
                        style={{padding: 20, overflow: 'scroll', minWidth: '500px'}} />);
        } else {
            // Ask the user to create a schema.
            form = [
                <h1>Please create a schema in the opened directory</h1>,
                <button onClick={() => this.loadDirectory(this.state.directory)}>Reload the file</button>,
            ];
        }

        return (
            <div className="a" style={{ height: '100%', width: '100%'}}>
                <FileTree
                    directory={this.state.directory}
                    onFileSelect={this.handleFileSelect} />
                <Tabs tabs={this.state.files}
                    index={this.state.index}
                    onSelect={this.handleSelect}
                    onClose={this.handleClose} />
                <div className="editor">{form}</div>
                <div className="statusbar">
                    <div>schema: {this.state.schema && this.state.schema.path}</div>
                    <div>ui: {(this.state.ui && this.state.ui.path) || '!'}</div>
                </div>
            </div>
        );
    }
}
