const {Menu, MenuItem} = eval("require('electron')").remote;

export default function createMenu(openFolder, openSchema, openUI, save, saveAll) {
    const template = [
        {
            id: 'file',
            submenu: [
                {
                    id: 'openFolder',
                    label: 'Open Folder...',
                    accelerator: 'CmdOrCtrl+O',
                    click: openFolder,
                },
                {
                    id: 'openSchema',
                    label: 'Open Schema...',
                    click: openSchema,
                },
                {
                    id: 'openUI',
                    label: 'Open UI...',
                    click: openUI,
                },
                {
                    id: 'save',
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: save,
                },
                {
                    id: 'saveAll',
                    label: 'Save All',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: saveAll,
                },
            ],
            role: 'fileMenu',
        },
        {
            id: 'view',
            submenu: [
                {
                    id: 'toggleDevTools',
                    role: 'toggledevtools',
                },
                {
                    id: 'reload',
                    role: 'reload',
                },
            ],
            role: 'viewMenu',
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
