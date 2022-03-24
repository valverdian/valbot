window.addEventListener('DOMContentLoaded', () => {

    let element = document.getElementById('node-version');
    if (element) {
        element.innerText = process.versions['node'];
    }

    element = document.getElementById('electron-version');
    if (element) {
        element.innerText = process.versions['electron'];
    }

    element = document.getElementById('chrome-version');
    if (element) {
        element.innerText = process.versions['chrome'];
    }
})