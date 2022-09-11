const transFolder = './transcripts/';
const { clear } = require('console');
const fs = require('fs');

var HTMLParser = require('node-html-parser');
var express = require('express');
var app = express();
var port = 8000;

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

app.get('/', async (req, res) => {
    await doWork();
    //res.sendFile(__dirname + '/site/home.html')
    checkReady(res);
});

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
    res.sendFile(__dirname + req.path);
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
