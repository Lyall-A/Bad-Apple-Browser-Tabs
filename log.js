const childProcess = require("child_process");
const fs = require("fs");

const fps = 10;
const videoPath = "bad apple.mp4";

clearAndWrite("Loading map...");
const map = require("./map.json");

// const rowsDir = fs.readdirSync("./rows");

// const map = [];
// for (const rowFile of fs.readdirSync("./rows")) map.push(JSON.parse(fs.readFileSync(`./rows/${rowFile}`, "utf-8")));

if (videoPath) childProcess.exec(`ffplay "${videoPath}"`);

let currentTimestamp = 0;
setInterval(() => {
    // const rows = [];
    // for (const rowFile of rowsDir) {
    //     const row = JSON.parse(fs.readFileSync(`./rows/${rowFile}`, "utf-8"));
    //     rows.push(row.map(i => i.toReversed().find(([character, timestamp]) => currentTimestamp >= timestamp)));
    // }
    const rows = map.map(i => i.map(i => i.toReversed().find(([character, timestamp]) => currentTimestamp >= timestamp)));
    clearAndWrite(rows.map(i => i.map(i => i[0]).join("")).join("\n"));
    currentTimestamp += 1000 / fps;
}, 1000 / fps);

function clearAndWrite(output) {
    process.stdout.write("\x1Bc");
    process.stdout.write(output);
}