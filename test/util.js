'use strict';

const http = require('http');
const port = process.env.CONFIG_PORT || 8100;
const hostname = process.hostname || '127.0.0.1';
const apiserver = `http://${hostname}:${port}/`;

function callWithData(path, postdata, token, method, callback) {

    const options = {
        hostname: hostname,
        port: port,
        path: path,
        method: method
    };
      
    if (token) {
        options.headers =  {
            'Content-Type': 'application/json',
            'x-foo-auth-token': token
        }
    }
    else {
        options.headers =  {
            'Content-Type': 'application/json'
        }
    }
    
    const req = http.request(options, (res) => {
        var rawbody = '';
        var parsedData = {};
        res.setEncoding('utf8');
    
        res.on('data', (chunk) => { rawbody += chunk });

        res.on('end', () => {
            try {
                parsedData = JSON.parse(rawbody);
              } 
              catch (e) {
                console.error(e.message);
              };
              callback(parsedData)
        });
    });
      
    
    // write data to request body
   
    if (typeof postdata === 'object') {
        try {
            const json = JSON.stringify(postdata);
            req.write(json);
        }
        catch (e) {
            console.error(e.message);
        }
    }
    req.end();
}

exports.post = function (path, data, token, callback) {
    callWithData(path, data, token, 'POST', callback);
};

exports.put = function (path, data, token, callback) {
    callWithData(path, data, token, 'PUT', callback);
};

exports.get = function (path, token, callback) {
    callWithData(path, null, token, 'GET', callback);
};

exports.del = function (path, token, callback) {
    callWithData(path, null, token, 'DELETE', callback);
};

