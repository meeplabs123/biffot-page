//https://discordjs.guide/oauth2/

const transFolder = './transcripts/';
const { clear } = require('console');
const fs = require('fs');
const config = require('./config.json');

var https = require('https');
var HTMLParser = require('node-html-parser');
var express = require('express');
var app = express();

publicdata = {};

async function getFiles() {
    publicdata.ready = false;
    fs.readFile('./site/home.html', 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        publicdata.html = data;
    });
    publicdata.listings = {};
    fs.readdir(transFolder, processFiles);
}

async function processFiles(err, files) {
    files.forEach(file => {
        var nom = file.split('.');
        if (nom[nom.length - 1] == 'html') {
            fs.readFile(transFolder + file, 'utf8', (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                }
                //inside the file
                parseData(data, file);
            });
        }
    });
}

async function parseData(data, filename) {
    var items = [];
    var root = await HTMLParser.parse(data);
    var elementsyes = root.childNodes[1].childNodes;
    elementsyes.forEach(async (item, index) => {
        var itemready = await item;
        if(!itemready.isWhitespace) {
            await items.push(itemready);
        }
    });
    setTimeout(async function() {
        var obj = {
            'title': '',
            'oppenedby': '',
            'oppenedtime': ''
        }
        items.forEach((item, index) => {
            comprehendItem(item, obj, filename);
        })
        publicdata.html = publicdata.html.replace('<!--more-content-here-->', '<h4>' + obj.title + ' <a href="transcripts/' + publicdata.listings[obj.title] + '">View</a></h4><h3>Oppened By: ' + obj.oppenedby + '</h3><h3>Oppened On: ' + obj.oppenedtime + '</h3><br><br><!--more-content-here-->')
        publicdata.ready = true;
    }, 1000);
}

async function comprehendItem(element, target, filename) {
    if(element.rawTagName == 'title') {
        target['title'] = element.innerText;
        publicdata.listings[target.title] = filename;
    }
    if(element.id == 'chatlog') {
        target['oppenedtime'] = element.childNodes[1].childNodes[1].childNodes[2].innerText;
        target['oppenedby'] = element.childNodes[1].childNodes[1].childNodes[3].lastChild.childNodes[0].childNodes[0].childNodes[0].attributes.title;
    }

}

async function doWork() {
    await getFiles();
}

function checkReady(objPass) {
    if(publicdata.ready === false) {
        setTimeout(checkReady, 100, objPass);
    } else {
        itsReady(objPass);
    }
}

function itsReady(obj) {
    obj.send(publicdata.html);
}

function auth() { return 'https://discord.com/api/oauth2/authorize?client_id=' + config.clientId + '&redirect_uri=' + config.redirectUri + '&response_type=token&scope=' + config.scope }

app.get('/', async (req, res) => {
    await doWork();
    fs.readFile('./oauth/main.html', 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        var genScript = '<script>window.location = "' + auth() + '"</script>';

        if(req.query.action) {
            if(req.query.action.includes('[auth]')) {
                data = data.replace('<!--script-goes-here-->', genScript);
            }
            if(req.query.action.includes('[data]')) {
                var oauthdata = req.query.action.replace('[data]', '');
                oauthdata = Buffer.from(oauthdata, 'base64').toString();
                oauthdata = Object.fromEntries(new URLSearchParams(oauthdata));
                
                var requestdata
                var request = https.request({
                    hostname: 'discord.com',
                    path: `/api/users/@me/guilds/${config.guildId}/member`,
                    method: 'GET',
                    headers: {
                        'Authorization': `${oauthdata.token_type} ${oauthdata.access_token}`
                    }
                }, response => {
                    response.on('data', d => {
                        requestdata = JSON.parse(d.toString());
                        parseResponseData(requestdata, data, req, res);
                    });
                });
                request.on('error', error => {
                    console.error(error);
                });
                request.end();
                
                //data = data.replace('<!--content-goes-here-->', '<script>if(window.location.pathname == "/app") { } else { window.location.href = window.location.origin + "/app" }</script>')
            }
        }
        if(!req.query.action) {
            res.send(data);
        } else {
            if(!req.query.action.includes('[data]')) {
                res.send(data);
            }
        }
    });
});

function parseResponseData(dataobject, data, req, res) {
    if(dataobject.retry_after) {
        console.log('You are being RATE LIMITED...');
        setTimeout(parseResponseData, 100, dataobject, data, req, res);
    } else {
        if(dataobject.roles.includes(config.roleId)) {
            console.log(`${dataobject.user.username}#${dataobject.user.discriminator} authenticated on ${req.ip}.`);
            

            checkReady(res)
        }
    }
}

app.get('/transcripts/*', async (req, res) => {
    fs.readFile('.' + req.path, 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        res.send(data);
    });
})

app.get('/site/*', async (req, res) => {
    if(req.path.includes('html')) { 
        res.send('access denied loserrrr');
        return;
     }
    res.sendFile(__dirname + req.path);
})

app.listen(config.port, () => {
    console.log(`App listening on port ${config.port}`);
});
