const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const tmi = require('tmi.js');
const fs = require('fs');
const soundplay = require('sound-play');

// global variables
let twitchAuth;
let settings;
let twitchClient;
let soundsList = [];
let mainWindow;

const loadSettings = () => {
    const rawTwitchData = fs.readFileSync(path.resolve(__dirname, 'twitch_auth.json'));
    twitchAuth = JSON.parse(rawTwitchData);

    const rawSettingsData = fs.readFileSync(path.resolve(__dirname, 'settings.json'));
    settings = JSON.parse(rawSettingsData);
}

const loadSoundList = () => {
    soundsList = [];
    var loadedSounds = fs.readdirSync(settings.sounds.sound_path);
    console.log("sounds loaded: " + loadedSounds.length);

    loadedSounds.forEach(sound => {
        var candidateSound = sound.split(".mp3")[0];
        soundsList.push(candidateSound);
    });
}

const saveSettings = () => {
    //TODO save settings
    // fs.writeFileSync(path.resolve(__dirname, 'twitch_auth.json'), JSON.stringify(twitchAuth));
    fs.writeFileSync(path.resolve(__dirname, 'settings.json'), JSON.stringify(settings));
}

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadFile('index.html');

    mainWindow.webContents.once('dom-ready', () => {
        mainWindow.webContents.send("settingsLoaded", settings);
    });
}

app.whenReady().then(() => {
    // load Previous Settings
    loadSettings();
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

/* Listeners to renderer.js */

ipcMain.handle("saveAndConnectBot", (event, editedSettings) => {
    settings = editedSettings;
    saveSettings();
    loadSettings();
    loadSoundList();
    startupBot();
});

ipcMain.handle("disconnectBot", () => {
    disconnectBot();
});


ipcMain.handle("setSoundsPath", () => {
    getSoundsPath();
});

const getSoundsPath = () => {
    let options = {
        title : "Choose a directory with your MP3s", 
        defaultPath : settings.sounds.sound_path || "C://",
        properties: ['openDirectory']
       }
       
       let filePath = dialog.showOpenDialogSync(mainWindow, options)
       mainWindow.webContents.send('newSoundsPath', filePath + "/");
}

/* TWITCH PART */

const startupBot = () => {
    twitchClient = new tmi.Client({
        options: { debug: true },
        identity: {
            username: twitchAuth.username,
            password: twitchAuth.password
        },
        channels: [twitchAuth.channel]
    });

    twitchClient.connect().then(botConnectionSuccessCallback(), botConnectionFailedCallback());
}

function botConnectionSuccessCallback(result) {
    twitchClient.on('message', (channel, tags, message, self) => {

        // if it was myself don't do anything
        if (self) return;

        var command = findAndSanitizeCommand(settings.command_prefix, message);

        // if there's no recognizable command don't do anything
        if (command === undefined) return;

        checkSocials(channel, command);
        checkSounds(tags, channel, command); 
    })

    mainWindow.webContents.send('botConnected');
}
  
function botConnectionFailedCallback(error) {
    console.log(error);
}

function disconnectBot () {
    twitchClient.disconnect().finally(()=> {
        twitchClient = null; // wipes the current twitch client
        mainWindow.webContents.send('botDisconnected');
    });
}

/** checks for the existence of a command in a message (always takes last one) */
function findAndSanitizeCommand(prefix, message) {
    var foundCommand;
    var words = message.split(" ");
    words.forEach(word => {
        if (word.length >= 2 && word.charAt(0) === prefix) {
            foundCommand = word.slice(1);
        }
    });

    return foundCommand;
}

function checkSocials(channel, command) {
    var socialUrl = settings.socials[command.toLowerCase()];
    if(socialUrl !== undefined){
        twitchClient.say(channel, socialUrl);
    }
}

function checkSounds(tags, channel, command) {

    // if the sounds list isn't defined. don't iterate or respond
    if(soundsList === undefined) return;

    // if they just give the command then all the sounds are listed
    if (command === settings.sounds.command) {

        var resultMessage = ""

        soundsList.forEach(sound => {
            resultMessage = resultMessage + sound + ", ";
        });

        twitchClient.say(channel, "sounds list: " + resultMessage);
    }
    
    // go through each sound and check
    if(soundsList.includes(command)) {
        soundplay.play(settings.sounds.sound_path + command + '.mp3', 130);
        twitchClient.say(channel, "@"+ tags.username + ", has played: " + command + ".");
    }
}

