const transFolder = './transcripts/';
const fs = require('fs');

function getFiles() {
    fs.readdir(transFolder, (err, files) => {
        files.forEach(file => {
            var nom = file.split('.');
            if(nom[nom.length - 1] == 'html') {
                fs.readFile(transFolder + file, 'utf8', (err, data) => {
                    if(err) {
                        console.log(err);
                        return;
                    }
                    let _one = data.split('<title>')[0];
                    let _two = data.split('</title>')[1];
                    var title = data.replace(_two, '').replace(_one, '').replace('<title>', '').replace('</title>', '');
                    console.log('Ticket Name: ' + title);
                });
            }
        });
    });
}

getFiles();