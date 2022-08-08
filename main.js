

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

Menu.setApplicationMenu(false);

const tmpdir = tmp.dirSync();
console.log('Dir: ', tmpdir.name);
tmp.setGracefulCleanup();


app.on("ready",function(){
    var isWin = process.platform === "win32";
    if (!isWin){
        mainWindow = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true
            },
            show: false,
            resizable: false,
            height: 540,
            width: 768,
            

        });
    }
    else{
        mainWindow = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true
            },
            show: false,
            resizable: false,
            height: 550,
            width: 780,
        }); 
    }

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


//Catch help button click
ipcMain.on("helpClick",function(e,item){
    var arg = "secondparam";
    shell.openExternal("https://devforum.roblox.com/t/rorender-minimap-creator/963288")
});

//Catch start server click
ipcMain.on("startServer",function(e,item){
    render.start(tmpdir.name);
    var check = function(){
        var percent = render.getCompleationPercent();
        if (percent > 0){
            mainWindow.webContents.send("startTimer", "arg");
            mainWindow.webContents.send("updatePercent", percent);
            try {
                let imagenum = render.getLatestImage().toString();
                var path = tmpdir.name.concat("/img",".png");
                if (fs.existsSync(path)) {
                    mainWindow.webContents.send("updateImage",path);
                }
            } 
            catch(err) {
               console.log("/img" + render.getLatestImage().toString() + ".png");
               console.log("Does not exist");
            }
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

