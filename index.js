const transFolder = './transcripts/';
const fs = require('fs');

function getFiles() {
    fs.readdir(transFolder, (err, files) => {
        files.forEach(file => {
            var nom = file.split('.');
            if(nom[nom.length - 1] == 'html') {
                console.log(file.replace('.' + nom[nom.length - 1], ''));
            }
        });
    });
}

getFiles();