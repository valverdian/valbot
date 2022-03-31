const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const tmi = require('tmi.js');
const fs = require('fs');
const soundplay = require('sound-play');

// global variables
let twitchAuth;
let settings;
let twitchClient;
let soundsList = [];

const loadSettings = () => {
    const rawTwitchData = fs.readFileSync(path.resolve(__dirname, 'twitch_auth.json'));
    twitchAuth = JSON.parse(rawTwitchData);

    const rawSettingsData = fs.readFileSync(path.resolve(__dirname, 'settings.json'));
    settings = JSON.parse(rawSettingsData);
}

const loadSoundList = () => {
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
    //fs.writeFileSync(path.resolve(__dirname, 'settings.json'), JSON.stringify(settings));
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    // loadSettings and starting up twitch
    loadSettings();
    loadSoundList();
    startupTwitch();
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

// TODO we'll work on this later, nothing to see here
// ipcMain.handle("startTwitch", () => {
//     // startupTwitch();
// });

/* TWITCH PART */

const startupTwitch = () => {
    twitchClient = new tmi.Client({
        options: { debug: true },
        identity: {
            username: twitchAuth.username,
            password: twitchAuth.password
        },
        channels: [twitchAuth.channel]
    });

    twitchClient.connect();

    twitchClient.on('message', (channel, tags, message, self) => {

        // if it was myself don't do anything
        if (self) return;

        var command = findAndSanitizeCommand(settings.command_prefix, message);

        // if there's no recognizable command don't do anything
        if (command === undefined) return;

        checkSocials(channel, command);
        checkSounds(tags, channel, command); 
    })
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
    //TODO: traverse through the sounds_path directory and see if you have file by the nameof the command

    if(soundsList === undefined) return;

    console.log("we have sounds to get through");

    if(soundsList.includes(command)) {
        console.log("oh hey! got a sound to play with");
        soundplay.play(settings.sounds.sound_path + command + '.mp3');
        twitchClient.say(channel, "@"+ tags.username + ", has played: " + command + ".");
    }
}

