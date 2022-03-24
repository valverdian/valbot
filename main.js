const { app, BrowserWindow } = require('electron');
const path = require('path');
const tmi = require('tmi.js');
const fs = require('fs');
const rawData = fs.readFileSync(path.resolve(__dirname, 'twitch_auth.json'));
let twitchAuth = JSON.parse(rawData);

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html');
}

app.whenReady().then(() => {
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


/* TWITCH PART */

const client = new tmi.Client({
    options: { debug: true },
    identity: {
        username: twitchAuth.username,
        password: twitchAuth.password
    },
    channels: [twitchAuth.channel]
});

client.connect();

client.on('message', (channel, tags, message, self) => {

    if (self) return;

    if (message.toLowerCase() === '!hello') {
        client.say(channel, "@" + tags.username + ", Sup! ");
    }

})