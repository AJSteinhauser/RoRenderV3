

const electron = require('electron');
const url = require('url');
const path = require('path');
const render = require("./imageRender.js");
const fs = require("fs");
const tmp = require('tmp');
const unhandled = require('electron-unhandled');



const {app, BrowserWindow, Menu, ipcMain, dialog, ipcRenderer, shell} = electron;


let mainWindow;
let helpWindow;

unhandled();

//Listen for app readyness
var tmpdir;

Menu.setApplicationMenu(false);
tmp.setGracefulCleanup();

tmp.dir(function _tempDirCreated(err, path, cleanupCallback) {
  if (err) throw err;
 
  tmpdir = path;
  
  // Manual cleanup
  cleanupCallback();
});



app.on("ready",function(){
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        show: false,
        resizable: false,
        height: 540,
        width: 768,
        

    });

    mainWindow.once("ready-to-show", () =>{
        mainWindow.show()
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true,    
    }));

    //Quit all windows and
    mainWindow.on("closed", function(){
        app.quit();
    });


    mainWindow.on("focus", function(){
        if (helpWindow != null){
            helpWindow.close();
            helpWindow = null;
        }
    });

});


//Create help window
function createHelpWindow(){
    if (helpWindow == null){
        helpWindow = new BrowserWindow({
            width: 300,
            height: 200,
            title: "Help",
            webPreferences: {
                nodeIntegration: true
            },
            show: false,
            frame: false,
            resizable: false,
            hasShadow: true
        });


        helpWindow.loadURL(url.format({
            pathname: path.join(__dirname, "helpWindow.html"),
            protocol: "file:",
            slashes: true,
        }));

        //Garbage collection
        helpWindow.on("close",function(){
            helpWindow = null;
        });


        helpWindow.once("ready-to-show", () =>{
            helpWindow.show()
        });
    }
}


//Catch help button click
ipcMain.on("helpClick",function(e,item){
    var arg = "secondparam";
    shell.openExternal("https://devforum.roblox.com/t/rorender-minimap-creator/963288")
    //createHelpWindow();
});

//Catch start server click
ipcMain.on("startServer",function(e,item){
    render.start(tmpdir);
    var check = function(){
        var percent = render.getCompleationPercent();
        if (percent > 0){
            mainWindow.webContents.send("startTimer", "arg");
            mainWindow.webContents.send("updatePercent", percent);
            mainWindow.webContents.send("updateImage",tmpdir.concat("/img",render.getYValue(),".png"));
        }
        if(percent == 100){
            return true;
        }
        else {
            setTimeout(check, 500); // check again in a second
        }
    }
    check();
});

//Catch export image click
ipcMain.on("exportImage",function(e,item){
    render.exportimage(
        dialog.showSaveDialogSync(mainWindow,{
            title: "Save image",
            buttonLabel: "Save",
            filters: [
                {name: "png", extensions: ["png"]}
            ]
        })
    );
});

