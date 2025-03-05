const http = require("http");
const fs = require("fs");

const map = require("./map.json");

const server = http.createServer();

server.on("request", (req, res) => {
    const [path, rawQuery] = req.url.split("?");
    const query = Object.fromEntries(rawQuery?.split("&").map(i => i.split("=")).map(([key, value]) => [key, decodeURIComponent(value)]) || []);

    if (req.method === "GET" && path === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync("./index.html"));
    } else
    if (req.method === "GET" && path === "/tab") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync("./tab.html"));
    } else
    if (req.method === "GET" && path === "/main.js") {
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.end(fs.readFileSync("./main.js"));
    } else
    if (req.method === "GET" && path === "/map.json") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(fs.readFileSync("./map.json"));
    } else
    if (req.method === "GET" && path === "/video.mp4") {
        res.writeHead(200, { "Content-Type": "video/mp4" });
        res.end(fs.readFileSync("./bad apple.mp4"));
    } else
    if (req.method === "GET" && path === "/video.mp4") {
        res.writeHead(200, { "Content-Type": "video/mp4" });
        res.end(fs.readFileSync("./bad apple.mp4"));
    } else
    if (req.method === "GET" && path === "/row") {
        const y = parseInt(query.y);

        if (isNaN(y)) return res.end();
        if (!map[y]) return res.end();

        const row = map[y];

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(row));
    } else
    if (req.method === "GET" && path === "/frame") {
        const currentTimestamp = parseInt(query.currentTimestamp);
        const y = parseInt(query.y);

        if (isNaN(currentTimestamp)) return res.end();
        if (isNaN(y)) return res.end();
        if (!map[y]) return res.end();

        const frame = map[y].map(i => i.toReversed().find(([character, timestamp]) => currentTimestamp >= timestamp));

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(frame));
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(6969);