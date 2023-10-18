const electron = require("electron");
const sharp = require("sharp");
const url = require("url");
const path = require("path");
const render = require("./imageRender.js");
const fs = require("fs");
const tmp = require("tmp");
const unhandled = require("electron-unhandled");
const fastify = require("fastify")()

const { app, BrowserWindow, Menu, ipcMain, dialog, ipcRenderer, shell } =
  electron;

let mainWindow;
let helpWindow;

unhandled();
let imageSize = {}

Menu.setApplicationMenu(false);

const tmpdir = tmp.dirSync();
console.log("Dir: ", tmpdir.name);
tmp.setGracefulCleanup();

app.on("ready", function () {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
    show: false,
    resizable: false,
    height: 540,
    width: 768,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
      mainWindow.webContents.openDevTools()
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

  // Uses Sharp to create a png image of the render, then clears the pixel data from memory.
  fastify.post("/render-done", (request, reply) => {
      console.log("Done")
    reply.send();
  });
});

//Catch export image click
ipcMain.on("exportImage", function (e, pixelData) {
  const image = sharp(pixelData, {
    raw: {
      width: imageSize.x,
      height: imageSize.y,
      channels: 4,
    }}).toFile(dialog.showSaveDialogSync(mainWindow, {
      title: "Save image",
      buttonLabel: "Save",
      filters: [{ name: "png", extensions: ["png"] }],
    }))
});
