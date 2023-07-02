"use strict";

// -- RoRenderV3 Server -- \\
// -- By StrategicPlayZ -- \\
// Inspired by reteach and Widgeon.

// Fastify for setting up a server. Sharp for creating the render image.
const fastify = require("fastify")();
const sharp = require("sharp");

let percentComplete = 0;
let latestImage = 1;

let lastRenderTime = Date.now();

let tmpdir = null;

// Stores the render data for the current render.
let render = {
  imageSize: { x: 0, y: 0 },
  numPixels: 0,

  pixelData: new Uint8Array(),
  nextIndex: 0,
};

function exportimage(path) {
  const image = sharp(render.pixelData, {
    raw: {
      width: render.imageSize.x,
      height: render.imageSize.y,
      channels: 4,
    },
  });
  image.toFile(path);
}

function getCompleationPercent() {
  return Math.ceil(percentComplete);
}

function getLatestImage() {
  return latestImage;
}

// Starts the server.
function start(tmp) {
  tmpdir = tmp;
  percentComplete = 0;
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
    console.log("Render begin:");

    render.imageSize = request.body.imageSize;
    render.numPixels = render.imageSize.x * render.imageSize.y;
    render.pixelData = new Uint8Array(render.numPixels * 4);
    render.nextIndex = 0;

    reply.send();
  });

  // Stores the received pixel data in the render data.
  fastify.post("/data", (request, reply) => {
    for (let pixelComponent of request.body)
      render.pixelData[render.nextIndex++] = pixelComponent;

    percentComplete = ((render.nextIndex - 1) / 4 / render.numPixels) * 100;
    console.log(render.numPixels);

    if (Date.now() - lastRenderTime > 1000) {
      lastRenderTime = Date.now();
      const image = sharp(render.pixelData, {
        raw: {
          width: render.imageSize.x,
          height: render.imageSize.y,
          channels: 4,
        },
      });
      image
        .toFile(tmpdir.concat("/img", ".png"))
        .then(() => (latestImage *= -1));
    }
    reply.send();
  });

  // Uses Sharp to create a png image of the render, then clears the pixel data from memory.
  fastify.post("/render-done", (request, reply) => {
    console.log("Render done.");
    console.log("Generating image...");
    reply.send();
  });
}

module.exports = { start, exportimage, getCompleationPercent, getLatestImage };
