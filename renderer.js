const { ipcRenderer } = window.require("electron");

/* command prefix */
const setCommandPrefixInput = document.getElementById("cmd-prefix");

/* Sounds Command */
const setSoundsCommandInput = document.getElementById("sounds-cmd");

/* Sounds Path */
const setSoundsPathBtn = document.getElementById("set-sounds-path");
const setSoundsPathInput = document.getElementById("sounds-path");

setSoundsPathBtn.addEventListener("click", () => {
    ipcRenderer.invoke("setSoundsPath");  
})

/** Start Bot */

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
    toggleEditable(isStarted)
});

ipcRenderer.on("botDisconnected", () => {
    startBotBtn.innerText = "Start";
    isStarted = false;
    toggleEditable(isStarted)
});

/** system level things */

ipcRenderer.on("settingsLoaded", (event, settings) => {
    setCommandPrefixInput.value = settings.command_prefix;
    setSoundsCommandInput.value = settings.sounds.command;
    setSoundsPathInput.value = settings.sounds.sound_path;
});

const toggleEditable = (canEdit) => {
    setCommandPrefixInput.disabled = canEdit;
    setSoundsCommandInput.disabled = canEdit;
    setSoundsPathInput.disabled = canEdit;
    setSoundsPathBtn.disabled = canEdit;
}