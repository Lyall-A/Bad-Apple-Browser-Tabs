const childProcess = require("child_process");
const fs = require("fs");

const input = "bad apple.mp4";
// const input = "rgb.mp4";
const output = "map.json";
const width = 70;
const height = 53;
const fps = 5;
const defaultCharacter = "⬛";
const characters = [
    {
        redRange: [0, 10],
        greenRange: [0, 10],
        blueRange: [0, 10],
        character: "⬛"
    },
    {
        redRange: [205, 255],
        greenRange: [205, 255],
        blueRange: [205, 255],
        character: "⬜"
    },
    {
        redRange: [245, 255],
        greenRange: [0, 50],
        blueRange: [0, 50],
        character: "🟥"
    },
    {
        redRange: [0, 50],
        greenRange: [205, 255],
        blueRange: [0, 50],
        character: "🟩"
    },
    {
        redRange: [0, 50],
        greenRange: [0, 50],
        blueRange: [205, 255],
        character: "🟦"
    },
];

console.log(`Converting video to Bitmaps...`);

const ffmpeg = childProcess.spawn("ffmpeg", ["-i", input, "-vf", `scale=${width}:${height}`, "-r", fps, "-c:v", "bmp", "-f", "image2pipe", "-"]);

let ffmpegFps = 0;
let bitmapFps = 0;

const frames = [];
const lastFrameBufferArray = [];

ffmpeg.stdout.on("data", data => {
    try {
        // Check if start of frame
        parseBitmapHeaders(data);
        addFrame();
        ffmpegFps++;
    } catch (err) { };
    // Push chunk
    lastFrameBufferArray.push(data);
});

ffmpeg.stderr.on("data", data => console.log(data.toString().split("\n").map(i => `FFmpeg: ${i}`).join("\n")));

ffmpeg.on("close", () => {
    addFrame(); // Add last frame

    // console.log("Converting Bitmaps to rows");

    // const { imageHeight } = parseBitmapHeaders(frames[0]);

    // for (let y = 0; y < imageHeight; y++) {
    //     const row = [];
    //     for (const frameIndex in frames) {
    //         const frame = frames[frameIndex];
    //         const bitmap = parseBitmap(frame);
    //         const timestamp = frameIndex * (1000 / fps);
    //         let lastCharacter = " ";
    //         for (let x = 0; x < bitmap.imageWidth; x++) {
    //             const pixel = bitmap.pixels[y][x];
    //             if (!row[x]) row[x] = [];
    //             const character = characters.find(i => {
    //                 if (i.redRange[0] > pixel.red || i.redRange[1] < pixel.red) return false;
    //                 if (i.greenRange[0] > pixel.green || i.greenRange[1] < pixel.green) return false;
    //                 if (i.blueRange[0] > pixel.blue || i.blueRange[1] < pixel.blue) return false;
    //                 return true;
    //             })?.character || defaultCharacter || lastCharacter;
    //             lastCharacter = character;
    //             row[x].push([
    //                 character,
    //                 timestamp
    //             ]);
    //         }
    //     }
    //     fs.writeFileSync(`./rows/${y}.json`, JSON.stringify(row));
    // }

    // return;



    console.log("Converting Bitmaps to map");

    const map = [];

    for (const frameIndex in frames) {
        const frame = frames[frameIndex];
        const bitmap = parseBitmap(frame);

        const timestamp = frameIndex * (1000 / fps);
        
        for (let y = 0; y < bitmap.imageHeight; y++) {
            let lastCharacter = " ";
            if (!map[y]) map[y] = [];
            for (let x = 0; x < bitmap.imageWidth; x++) {
                const pixel = bitmap.pixels[y][x];
                if (!map[y][x]) map[y][x] = [];
                const character = characters.find(i => {
                    if (i.redRange[0] > pixel.red || i.redRange[1] < pixel.red) return false;
                    if (i.greenRange[0] > pixel.green || i.greenRange[1] < pixel.green) return false;
                    if (i.blueRange[0] > pixel.blue || i.blueRange[1] < pixel.blue) return false;
                    return true;
                })?.character || defaultCharacter || lastCharacter;
                lastCharacter = character;
                map[y][x].push([
                    character,
                    timestamp
                ]);
            }
        }
        // break;

        bitmapFps++;
    }

    console.log("Saving map...");
    fs.writeFileSync(output, JSON.stringify(map));
});

// setInterval(() => {
//     console.log(`FFmpeg FPS: ${ffmpegFps}`);
//     console.log(`Bitmap FPS: ${bitmapFps}`);
//     ffmpegFps = 0;
//     bitmapFps = 0;
// }, 1 * 1000);

function addFrame() {
    if (lastFrameBufferArray.length) {
        const frameBuffer = Buffer.concat(lastFrameBufferArray);
        // fs.writeFileSync(`./frames/${frames.length}.bmp`, frameBuffer); // testing
        frames.push(frameBuffer);
        lastFrameBufferArray.splice(0, lastFrameBufferArray.length);
    }
}

function parseBitmapHeaders(data) {
    // Bitmap file header
    if (data.subarray(0, 2).toString() !== "BM") throw new Error("Header does not start with 'BM'");
    const size = data.readUInt32LE(0x02);
    const pixelArrayOffset = data.readUInt32LE(0x0A);
    
    // DIB header
    if (data.readUInt32LE(0x0E) !== 40) throw new Error("BITMAPINFOHEADER is not present");
    const imageWidth = data.readInt32LE(0x12);
    const imageHeight = data.readInt32LE(0x16);
    const absoluteImageHeight = Math.abs(imageHeight);
    const colorDepth = data.readUInt16LE(0x1C);
    if (data.readUInt32LE(0x1E) !== 0) throw new Error("Compression is used");
    const imageSize = data.readUInt32LE(0x22);

    return {
        size,
        pixelArrayOffset,
        imageWidth,
        imageHeight,
        absoluteImageHeight,
        colorDepth,
        imageSize
    };
}

function parseBitmap(data) {
    const {
        size,
        pixelArrayOffset,
        imageWidth,
        imageHeight,
        absoluteImageHeight,
        colorDepth,
        imageSize
    } = parseBitmapHeaders(data);

    const rowSize = Math.floor((colorDepth * imageWidth + 31) / 32) * 4;
    const pixels = [];
    
    for (let y = 0; y < imageHeight; y++) {
        const row = [];
        const rowStart = pixelArrayOffset + (imageHeight > 0 ? (absoluteImageHeight - 1 - y) * rowSize : y * rowSize);

        for (let x = 0; x < imageWidth; x++) {
            const pixelStart = rowStart + (x * (colorDepth / 8));

            if (colorDepth === 24) {
                row.push({
                    red: data[pixelStart + 2],
                    green: data[pixelStart + 1],
                    blue: data[pixelStart],
                });
            } else {
                throw new Error(`Color depth '${colorDepth}' is not supported`);
            }
        }

        pixels.push(row);
    }

    return {
        size,
        pixelArrayOffset,
        imageWidth,
        imageHeight,
        absoluteImageHeight,
        colorDepth,
        imageSize,
        rowSize,
        data,
        pixels
    }
}