"use strict";
//@ts-check

require("dotenv").config();
const electron = require('electron');
const {app, BrowserWindow, Menu, ipcMain, dialog} = electron;
const config = new (require('electron-config'))();

const DirectoryScanner = require('./DirectoryScanner.js')
const WebSocketClient = require("./WebSocketClient");

let win

class Main
{
	constructor()
	{
        this.wsClient = null;
    }

	async initConnection()
	{
		let wsHandler = null;

		try
		{
            this.wsClient = new WebSocketClient(process.env.WS_HOST, process.env.WS_PORT);
			wsHandler = await this.wsClient.connect();
		}
		catch(error)
		{
			console.error("Failed WS connection to CyKIT. Reasons: \n" + error.stack);
		}
    }

    /**
     * @param {string} strCSVFileName 
     */
    startEEGRecording(strCSVFileName)
    {
        if(typeof strCSVFileName !== "string")
        {
            throw new Error("The CSV file name in which to save the EEG signal must be a string.");
        }

        Main.getInstance().wsClient.sendData("CyKITv2:::RecordStart:::" + strCSVFileName); 
    }

    stopEEGRecording()
    {
        Main.getInstance().wsClient.sendData("CyKITv2:::RecordStop");
    }
    
    static getInstance()
    {
        if(!Main.instance)
        {
            Main.instance = new Main();
        }

        return Main.instance;
    }

	static createWindow () 
	{
		// Create the browser window.
		win = new BrowserWindow({width: 1200, height: 600})
	
		win.setFullScreen(true);
	
		// and load the index.html of the app.
		win.loadURL(`file://${__dirname}/index.html`);
	
		// Open the DevTools.
		// win.webContents.openDevTools();
	
		const ret = electron.globalShortcut.register('Escape', () => {
			console.log('Escape is pressed');
			Main.minimizeWindow();
		})
	
		console.log('config.path: ' + config.get("path"));
	
		// Emitted when the window is closed.
		win.on('closed', () => {
			// Dereference the window object, usually you would store windows
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			win = null
		})
	
		app.on('will-quit', () => {
	
			electron.globalShortcut.unregister('Escape');
			electron.globalShortcut.unregisterAll();
		});
	
	}

	static minimizeWindow()
	{
		win.setFullScreen(false);
		console.log(win);
	}

	static createMenu()
	{
		let template = 
		[
			{
				label: "Epic Screen",
				submenu: 
				[
					{
						role: 'about'
					},
					{
						type: 'separator'
					},
					{
						role: 'services',
						submenu: []
					},
					{
						type: 'separator'
					},
					{
						role: 'hide'
					},
					{
						role: 'hideothers'
					},
					{
						role: 'unhide'
					},
					{
						type: 'separator'
					},
					{
						role: 'quit'
					}
				]
			}, 
			{
				label: "File",
				submenu: 
				[
					{
						label:"Select folder",
						click (item, focusedWindow) {
							Main.selectFolder();
						}
					},
					{
						label:"Toggle debug",
						click (item, focusedWindow) {
							if (focusedWindow) 
							{
								focusedWindow.webContents.toggleDevTools();
							}
						}
					}
				]
			} 
		]
	
		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	}

	static selectFolder()
	{
		dialog.showOpenDialog({
			properties: ['openDirectory']
		}, (files) => {
			if(files)
			{
				config.set("path", files[0]);
				app.emit("folder_selected");
			}
		})
	}
}

ipcMain.on('list_files', (event, arg) => {
    event.sender.send('list_files_reply', DirectoryScanner.files)
})

ipcMain.on("startRecording", (event, strCSVFileName) => {
    Main.getInstance().startEEGRecording(strCSVFileName);
    event.sender.send('confirm_startRecording');
});

ipcMain.on("stopRecording", (event, arg) => {
    Main.getInstance().stopEEGRecording();
    event.sender.send('confirm_stopEEGRecording');
});

app.on('folder_selected', () => {
    DirectoryScanner.path = config.get("path");
    DirectoryScanner.scan();

	if(!win)
	{
        Main.createWindow();
        DirectoryScanner.startScanning();
    }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	Main.createMenu();

	if(!config.get("path"))
	{
		Main.selectFolder();
	}
	else
	{
		Main.selectFolder();
		// Main.createWindow();
		// DirectoryScanner.path = config.get("path");
		// DirectoryScanner.scan();
		// DirectoryScanner.startScanning();
    }
})


// Quit when all windows are closed.
app.on('window-all-closed', () => {
    app.quit()
})


process.on(
	"unhandledRejection",
	(reason, promise) => {
		console.log("-> unhandledRejection");
		console.log(`Promise: ${promise}, Reason: ${reason.stack}`);

		process.exit(1);
	}
);

process.on(
	"uncaughtException", 
	(error) => {
		console.log("uncaughtException");
		console.error(error);
		
		process.exit(1);
	}
)

Main.getInstance()
    .initConnection();