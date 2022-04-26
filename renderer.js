const { ipcRenderer, shell } = window.require("electron");
let editedSettings;
let editedAuthSettings;
let totalSocials = 0;

/* auth settings */
const userNameInput = document.getElementById("user-name");
const channelNameInput = document.getElementById("channel-name");
const oauthPasswordInput = document.getElementById("oauth-password");

/* generate oauth button */
const openOauthBtn = document.getElementById("open-oauth");
openOauthBtn.addEventListener("click", () => {
    shell.openExternal("https://twitchapps.com/tmi/");
})

/* socials interaction & button */
const socialListDiv = document.getElementById("socials-list");
const addSocialBtn = document.getElementById("add-social");
addSocialBtn.addEventListener("click", () => {
    addSingleSocialInput();
})

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
startBotBtn.style.color = "white";
startBotBtn.style.backgroundColor = "green";
startBotBtn.style.display = "block";
startBotBtn.style.width = "100%";

startBotBtn.addEventListener("click", () => {

    if (!isStarted) {
        startBotBtn.innerText = "connecting...";
        bundleNewSettings();
        ipcRenderer.invoke("saveAndConnectBot", editedSettings, editedAuthSettings);
    } else {
        ipcRenderer.invoke("disconnectBot");
    }
})

ipcRenderer.on("botConnected", () => {
    startBotBtn.innerText = "Stop";
    startBotBtn.style.backgroundColor = "red";
    isStarted = true;
    toggleEditable(isStarted)
});

ipcRenderer.on("botDisconnected", () => {
    startBotBtn.innerText = "Start";
    startBotBtn.style.backgroundColor = "green";
    isStarted = false;
    toggleEditable(isStarted)
});

/** system level things */
ipcRenderer.on("settingsLoaded", (event, settings, authSettings) => {
    editedSettings = settings;
    editedAuthSettings = authSettings;
    userNameInput.value = editedAuthSettings.username;
    channelNameInput.value = editedAuthSettings.channel;
    oauthPasswordInput.value = editedAuthSettings.password;
    setCommandPrefixInput.value = editedSettings.command_prefix;
    setSoundsCommandInput.value = editedSettings.sounds.command;
    setSoundsPathInput.value = editedSettings.sounds.sound_path;
    renderSocialInputs(editedSettings.socials)
});

ipcRenderer.on("newSoundsPath", (event, path) => {
    setSoundsPathInput.value = path;
});

const bundleNewSettings = () => {
    editedAuthSettings.username = userNameInput.value;
    editedAuthSettings.channel = channelNameInput.value;
    editedAuthSettings.password = oauthPasswordInput.value;
    editedSettings.command_prefix = setCommandPrefixInput.value;
    editedSettings.sounds.command = setSoundsCommandInput.value;
    editedSettings.sounds.sound_path = setSoundsPathInput.value;
    saveSocialInputs();
}

const toggleEditable = (canEdit) => {
    userNameInput.disabled = canEdit;
    channelNameInput.disabled = canEdit;
    oauthPasswordInput.disabled = canEdit;
    openOauthBtn.disabled = canEdit;
    toggleEditableSocialInputs(canEdit);
    addSocialBtn.disabled = canEdit;
    setCommandPrefixInput.disabled = canEdit;
    setSoundsCommandInput.disabled = canEdit;
    setSoundsPathInput.disabled = canEdit;
    setSoundsPathBtn.disabled = canEdit;
}

/* social inputs management */

const renderSocialInputs = (socials) => {
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
            socialListDiv.appendChild(document.createElement("br"));
            totalSocials++;
        });
    } else {
        addSingleSocialInput();
    }
}

const saveSocialInputs = () => {
    const socialsIteration = (socialListDiv.childElementCount / 2)

    // clear current socials
    editedSettings.socials = JSON.parse("{}");

    if (socialListDiv.hasChildNodes()) {
        for (var i = 0; i < socialsIteration; i++) {
            var socialKeyInput = socialListDiv.querySelector(`#socialkey${i}`)
            var socialValueInput = socialListDiv.querySelector(`#socialvalue${i}`)

            if (socialKeyInput && socialValueInput && socialKeyInput.value && socialValueInput.value) {
                console.log("saving: " + socialKeyInput.value + "[" + socialValueInput.value + "]");
                editedSettings.socials[socialKeyInput.value] = socialValueInput.value;
            }
        }
    }
}

const toggleEditableSocialInputs = (canEdit) => {
    const socialsIteration = (socialListDiv.childElementCount / 2)

    if (socialListDiv.hasChildNodes()) {
        for (var i = 0; i < socialsIteration; i++) {
            var socialKeyInput = socialListDiv.querySelector(`#socialkey${i}`)
            var socialValueInput = socialListDiv.querySelector(`#socialvalue${i}`)

            if (socialKeyInput && socialValueInput) {
                socialKeyInput.disabled = canEdit;
                socialValueInput.disabled = canEdit;
            }
        }
    }
}

const addSingleSocialInput = () => {
    const inputKey = document.createElement("input");
    inputKey.id = `socialkey${totalSocials}`;
    const inputValue = document.createElement("input");
    inputValue.id = `socialvalue${totalSocials}`;
    socialListDiv.appendChild(inputKey);
    socialListDiv.appendChild(inputValue);
    socialListDiv.appendChild(document.createElement("br"));
    totalSocials++;
}