const topOffset = 23;
const characterWidth = 17;
const widthMargin = 150;
// const fps = 1;
const useServer = true;
const serverUrl = "http://localhost:6969";
const videoUrl = "/video.mp4";

function loadMap(url) {
    return fetch(url).then(i => i.json());
}

function getFrame(y, currentTimestamp) {
    return fetch(`${serverUrl}/frame?y=${y}&currentTimestamp=${currentTimestamp}`).then(i => i.json());
}

function getRow(y) {
    return fetch(`${serverUrl}/row?y=${y}`).then(i => i.json());
}