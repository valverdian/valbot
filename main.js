const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const tmi = require('tmi.js');
const fs = require('fs');
const soundplay = require('sound-play');

// global variables
let twitchAuth;
let settings;
let twitchClient;

const loadSettings = () => {
    const rawTwitchData = fs.readFileSync(path.resolve(__dirname, 'twitch_auth.json'));
    twitchAuth = JSON.parse(rawTwitchData);

    const rawSettingsData = fs.readFileSync(path.resolve(__dirname, 'settings.json'));
    settings = JSON.parse(rawSettingsData);
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


ipcMain.handle("startTwitch", () => {
    // startupTwitch(); //TODO: put this as the way to start later
});

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

        if (self) return;

        if (hasCommand('!', message)) {
            
            if (message.toLowerCase().includes('!hello')) {
                twitchClient.say(channel, "@" + tags.username + ", Sup! ");
            }
        }
    })
}

/** checks for the existence of a command in a message */
function hasCommand(prefix, message) {
    var foundCommand = false;
    var words = message.split(" ");
    words.forEach(word => {
        if(word.length >= 2 && word.charAt(0) === prefix){
            foundCommand = true;
        }
    });

    return foundCommand;
}

