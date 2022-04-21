const { ipcRenderer } = window.require("electron");
let editedSettings;
let totalSocials = 0;

/* command prefix */
const setCommandPrefixInput = document.getElementById("cmd-prefix");

/* sounds command */
const setSoundsCommandInput = document.getElementById("sounds-cmd");

/* sounds path */
const setSoundsPathBtn = document.getElementById("set-sounds-path");
const setSoundsPathInput = document.getElementById("sounds-path");

setSoundsPathBtn.addEventListener("click", () => {
    ipcRenderer.invoke("setSoundsPath");
})

/** start bot */

let isStarted = false;
const startBotBtn = document.getElementById("toggle-bot");
startBotBtn.innerText = "Start";

startBotBtn.addEventListener("click", () => {

    if (!isStarted) {
        startBotBtn.innerText = "connecting...";
        bundleNewSettings();
        ipcRenderer.invoke("saveAndConnectBot", editedSettings);
    } else {
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
    editedSettings = settings;
    setCommandPrefixInput.value = editedSettings.command_prefix;
    setSoundsCommandInput.value = editedSettings.sounds.command;
    setSoundsPathInput.value = editedSettings.sounds.sound_path;
    renderSocialInputs(editedSettings.socials)
});

ipcRenderer.on("newSoundsPath", (event, path) => {
    setSoundsPathInput.value = path;
});

const bundleNewSettings = () => {
    editedSettings.command_prefix = setCommandPrefixInput.value;
    editedSettings.sounds.command = setSoundsCommandInput.value;
    editedSettings.sounds.sound_path = setSoundsPathInput.value;
    // saveSocialInputs(); FIXME: this currently breaks over a null value on pulling document id stuff
}

const toggleEditable = (canEdit) => {
    setCommandPrefixInput.disabled = canEdit;
    setSoundsCommandInput.disabled = canEdit;
    setSoundsPathInput.disabled = canEdit;
    setSoundsPathBtn.disabled = canEdit;
}

const renderSocialInputs = (socials) => {
    const socialListDiv = document.getElementById("socials-list");

    if (socials) {

        var socialKeys = Object.keys(socials);
        socialKeys.forEach(socialKey => {
            const inputKey = document.createElement("input");
            inputKey.id = `socialkey${totalSocials}`;
            inputKey.value = socialKey;
            const inputValue = document.createElement("input");
            inputValue.id = `socialvalue${totalSocials}`;
            inputValue.value = socials[socialKey];

            socialListDiv.appendChild(inputKey);
            socialListDiv.appendChild(inputValue);

            totalSocials++;
        });
    } else {
        const inputKey = document.createElement("input");
        inputKey.id = `socialkey${totalSocials}`;
        const inputValue = document.createElement("input");
        inputValue.id = `socialvalue${totalSocials}`;
    }
}

const saveSocialInputs = () => {
    for (var i = 0; i < (totalSocials-1); i++) {
        const socialKeyInput = document.getElementById(`socialKey${i}`)
        const socialValueInput = document.getElementById(`socialValue${i}`)
        editedSettings.socials[socialKeyInput.value] = socialValueInput.value;
    }
}