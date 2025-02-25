const electron = require("electron");
const url = require("url");
const path = require("path");
const fs = require("fs");
const unhandled = require("electron-unhandled");
const fastify = require("fastify")()

const { app, BrowserWindow, Menu, ipcMain, dialog, ipcRenderer, shell } = electron;

let mainWindow;
let helpWindow;

unhandled();
let imageSize = {}

Menu.setApplicationMenu(false);

app.on("ready", function () {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
        },
        show: false,
        resizable: true,
        height: 540,
        width: 768,
    });

    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "index.html"),
            protocol: "file:",
            slashes: true,
        })
    );

    //Quit all windows and
    mainWindow.on("closed", function () {
        app.quit();
    });

    mainWindow.on("focus", function () {
        if (helpWindow != null) {
            helpWindow.close();
            helpWindow = null;
        }
    });
});

//Catch help button click
ipcMain.on("helpClick", function (e, item) {
    var arg = "secondparam";
    shell.openExternal(
        "https://devforum.roblox.com/t/rorender-minimap-creator/963288"
    );
});

//Catch start server click
ipcMain.on("startServer", function (e, item) {
    console.log("server started")
    fastify.listen({ port: 8081 }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit();
        }
        console.log(`Server is now listening on address: ${address}`);
    });

    // Get request for if the user opens the url in their web browser.
        fastify.get("/", (request, reply) => {
            reply.send("RoRenderV3 server is running.");
        });

    // Resets the render data and sets it to the new image size.
        fastify.post("/render-begin", (request, reply) => {
            console.log("start")
            imageSize = request.body.imageSize;
            mainWindow.webContents.send("render-begin", imageSize);
            reply.send();
        });

    // Stores the received pixel data in the render data.
        fastify.post("/data", (request, reply) => {

            console.log("data")
            mainWindow.webContents.send("data", request.body);
            reply.send();
        });

        fastify.post("/render-done", (request, reply) => {
            reply.send();
        });
});

//Catch export image click
ipcMain.on("exportImage", function (e, dataURL) {
    fs.writeFile(
        dialog.showSaveDialogSync(mainWindow, {
            title: "Save image",
            buttonLabel: "Save",
            filters: [{ name: "png", extensions: ["png"] }],
        }),
        Buffer.from(dataURL.split(",")[1], 'base64'),
        () => {console.log("done")}
    )
});
