const { ipcRenderer } = window.require("electron");

/* Sounds Path */
const setSoundsPathBtn = document.getElementById("set-sounds-path");

setSoundsPathBtn.addEventListener("click", () => {
    ipcRenderer.invoke("setSoundsPath");  
})

/** Start Bot Code */

let isStarted = false;
const startBotBtn = document.getElementById("toggle-bot");
startBotBtn.innerText = "Start";

startBotBtn.addEventListener("click", () => {

    if(!isStarted) {
        startBotBtn.innerText = "connecting...";
        ipcRenderer.invoke("saveAndConnectBot");
    } else{
        ipcRenderer.invoke("disconnectBot");
    }
})

ipcRenderer.on("botConnected", () => {
    startBotBtn.innerText = "Stop";
    isStarted = true;
});

ipcRenderer.on("botDisconnected", () => {
    startBotBtn.innerText = "Start";
    isStarted = false;
});

/**  */