const topOffset = 30;
const characterWidth = 30;

function loadMap(url) {
    return fetch(url).then(i => i.json());
}