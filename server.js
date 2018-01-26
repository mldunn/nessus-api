"use strict";
//
// server.js
// node server for API exercise
// entry point main()
//

// node modules
const http = require('http');
const url = require('url');

// custom auth module to validate / login / logout
const auth = require('./modules/auth');

// configurations module for CRUD operations
const configurations = require('./modules/configurations');

// custom log module for logging purpose 
const log = require('./modules/log');

//
// API object defining routes (could be loaded from a seperate json file if more complex)
// 
const api = [
    {
        method: 'POST',  
        path: '/login',
        route: auth.login,
        authenticated: false
    },
    {
        method: 'POST',
        path: '/logout',
        route: auth.logout,
        authenticated: true
    },
    {
        method: 'GET',
        path: '/configurations',
        route: configurations.get,
        authenticated: true
    },
    {
        method: 'GET',
        path: '/configurations/:name',
        route: configurations.get,
        authenticated: true
    },
    {
        method: 'POST',
        path: '/configurations',
        route: configurations.create,
        authenticated: true
    },
    {
        method: 'DELETE',
        path: '/configurations/:name',
        route: configurations.delete,
        authenticated: true
    },
    {
        method: 'PUT',
        path: '/configurations/:name',
        route: configurations.update,
        authenticated: true
    }
];

const Errors = {
    NOTIMPLEMENTED: { code: 'NotImplemented', message: 'specified route is valid but not implemented' },
    UNAUTHORIZED: { code: 'Unauthorized', message: 'not authorized' },
    INVALIDROUTE: { code: 'Invalid', message: 'specified route is invalid' },
    OTHER: { code: 'InternalError' }
};


// 
// validateBody - returns an object based on the json from the body data
//
// body: string of body data
//

function validateBody(body) {
    var valid;
    if (typeof body == 'string') {
        try {
            valid = JSON.parse(body);
            // perform any additional validation here if needed
        }
        catch (e) {
            log.exception(e, 'validateBody');
        }
    }
    return valid || {};
}

//
// processRequest - parse the URL and routes to the appropriate command
// 
// reg: http request
// res: http response
// body: body as string 
//

function processRequest(req, res, body) {

    const { method } = req;

    var { pathname, query } = url.parse(req.url, true);
    var path = pathname.toLowerCase();
  
    // use sendError to as centralized method for sending error responses
    // wraps the detailed error object into a common error object
    // { error: { code: '', message: '' } }

    var sendError = function (details) {
        res.write(JSON.stringify({error: details}));
        res.end('\n');
    };
   
    //
    // centralized processing for all routes via command entry
    // find the command based on the method and path
    // we need to deal with placeholders (/:name) etc so the logic is a lttle more involved
    // 
    var command = api.find( function(item, index) {
        // check for correct method
        if (item.method !== method) {
            return false;
        }

        // make sure the item path is a string
        if (typeof item.path !== 'string') {
            return false;
        }

        let itemPath = item.path.toLowerCase();
        // methods are equal, now string compare paths
        if (itemPath === path) {
            return true;
        }
        else if (itemPath.indexOf('/:') !== -1) {
            // paths not equal so check for placehholders in command path 
            // a placeholder starts with a colon (:) and represents the field name
            // need to check each part of the path independently 
            // so split by forward slash (/) 
            let paths = path.split('/');
            let vals = itemPath.split('/');
            // make sure both arrays have the same number of items
            if (vals.length === paths.length) {
                var placeholders = {};
                for (var i = 0; i < vals.length; i += 1) {
                    
                    var part = vals[i];

                    // first check it this is a placeholder item
                    // if so save the placeholder/value pair
                    if (part.indexOf(':') === 0) {
                        placeholders[part.substr(1)] = paths[i];
                    }
                    else if (part !== paths[i]) {
                        // abort if not a placeholder and items not equal
                        return false;
                    }
                }

                // if we got here then the paths are equal aside from placeholders
                // merge any placeholders and corresponding value into the query object
                for (var key in placeholders) {
                    query[key] = placeholders[key];
                }
                return true;
            }
        }
        return false;
    });
    
    // if we have a command check for authentication then route it
    if (command) {

        // check for our custom auth token if the command requires authentication
        if (command.authenticated) {
            if (!auth.isAuthorized(req.headers)) {
                 return sendError(Errors.UNAUTHORIZED);
            }
        }

        // check for body on PUT or POST 
        // body is in json format

        var postdata = {};
        if (command.method === 'PUT' || command.method === 'POST') {
            postdata = validateBody(body);
        }

        // consolidate postdata and querystring values into a simple object to pass to the route
        var data = {
            method: method,
            postdata: postdata,
            params: query
        };

      
        // return everything in json       
        res.setHeader('content-type', 'application/json')
       
        //
        // call the "route" function for the command with the data object and a callback
        // the callback is function with signature void fn(err, result) where:
        //  err is null if no error or object if an error is encounterd
        //  result is the data being returned in the repsonse 
        //

        if (typeof command.route === 'function') {
            command.route(data, function(err, result) {
                if (err) {
                    sendError(err)
                }
                else {

                    // put the result into a json string, if no result return {status: 'ok'} 
                    // check for result type 
                    var obj;
                    if (typeof result === 'object') {
                        obj = result;
                    }
                    else if (typeof result === 'undefined') {
                       obj = { status: 'ok' };
                    }
                    else {
                        // if result is a non-object type just send it in a result object
                        obj = { result:  result }; 
                    }
                    var json = '';
                    try {
                        json = JSON.stringify(obj);
                    }
                    catch (e) {
                        log.exception(e, 'JSON result');
                    }

                    res.write(json);
                    res.end('\n');
                }
            });
        }
        else {
            return sendError(Errors.NOTIMPLEMENTED);
        }
    }
    else {
        sendError(Errors.INVALIDROUTE);
    }
}

function main() {

    // get some config values 
    let port = process.env.CONFIG_PORT || 8100;
    let hostname = process.hostname || '127.0.0.1';
    
    // create the server and grab the body on each request, then call processRequest
    const server = http.createServer( (req, res) => {

        req.setEncoding('utf8')

        // set any additional headers here, i.e for CORS

        var body = '';
        req.on('data', data => body += data);
        req.on('end', () => {
            processRequest(req, res, body);
        });
    });

    // listen for errors
    server.on('error', (err) => log.error(err));

    // listen on the port
    server.listen(port, hostname, () => {
        log.info(`server running at http://${hostname}:${port}/`);
    });
}

// use main function as entry point 
main();