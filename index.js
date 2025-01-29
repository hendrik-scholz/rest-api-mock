const express = require('express');
const fs = require('fs');
const app = express();

const port = 3000;
const responsesDirectory = './responses';
const encoding = 'utf8';
const contentTypeHeader = 'Content-Type';
const contentTypeValue = 'application/json; charset=utf-8';

const getRequests = {};
let getRequestsId = -1;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toUTCString()}]`);
    console.log(`Method: ${req.method}`);
    console.log(`Path: ${req.path}`);
    console.log(`Headers: ${JSON.stringify(req.headers)}`);
    console.log(`Body: ${JSON.stringify(req.body)}`);

    if (req.method === 'GET' && !req.path.startsWith('/mock')) {
        console.log('Saving GET request');
        
        const request = {
            method: req.method,
            path: req.path,
            headers: req.headers,
        };
    
        getRequestsId++;
        getRequests[getRequestsId] = request;

        if (getRequestsId > 10) {
            getRequestsId = 1;
        }
    }

    next();
});

const options = {
    withFileTypes: true
};

fs.readdirSync(`${responsesDirectory}/get`, options).forEach(file => {
    app.get(`/${file.name}`, (req, res) => {
        res.status(200).send();
    });

    const folderName = file.name;

    app.get(`/${folderName}/:id`, (req, res) => {
        const filename = `${req.params.id}.json`;

        fs.access(`${responsesDirectory}/get/${folderName}/${filename}`, fs.constants.F_OK, (err) => {
            if(err){
                console.log(`Reading default file message_default.json`);
    
                const data = fs.readFileSync(`${responsesDirectory}/get/${folderName}/default.json`, encoding);
                res.set(contentTypeHeader, contentTypeValue).send(data);
            } else {
                console.log(`Reading file ${filename}`);
    
                const data = fs.readFileSync(`${responsesDirectory}/get/${folderName}/${filename}`, encoding);
                const response = JSON.parse(data);

                setTimeout(() => {
                    res.set(contentTypeHeader, contentTypeValue).status(response.httpStatusCode).send(response.payload);
                }, response.delayInMs);
            }
        });
    });
});

app.get('/mock/requests/get', (req, res) => {
    res.set(contentTypeHeader, contentTypeValue).send(getRequests);
});

app.get('/mock/requests/get/latest', (req, res) => {
    res.set(contentTypeHeader, contentTypeValue).send(getRequests[getRequestsId]);
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});