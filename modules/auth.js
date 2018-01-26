'use strict';

var Errors = {
    INVALID: { code: 'InvalidUser', message: 'invalid user name' },
    NOTLOGGEDIN: { code: 'NotLoggedIn', message: 'user not logged in' }
};

// simple users array
var users = ['mike','tenable','guest','tester'];

// simple session tracker 
var sessions = [];

const TOKEN_HEADER = 'x-foo-auth-token';

// session object with timestamp for token
// could be more elaborate with expiration check

function Session(username) {

    const timeNow = new Date().getTime();
  
    return {
        username: username,
        token: timeNow.toString(),
    };
}

//
// login - log the "user" in
// data - common data struct containing postdata/querysting pairs
// next - callback function in form next(err, data)
//
//  err - error if user not found otherwise null
//  data -  a Session object for the user
//

exports.login = function(data, next) {

    // make sure we have a callback
     if (typeof next !== 'function') {
        return;
    }


    // param validation
    var data = data || {};
    var postdata = data.postdata || {};

    var username = postdata.username || '';
    var err, ret;
  
    var user = users.find( (val) => val === username);
    if (user) {

        // check if already logged in - if so just return the session
        var session = sessions.find( val => val.username === username );
        if (typeof session !== 'undefined') {
            ret = session;
        }
        else {
            ret = new Session(username);
            sessions.push(ret);
        }
    }
    else {
        err = Errors.INVALID;
    }

    next(err, ret);
}

//
// logout - logs the "user" out
// data - common data struct containing postdata/querysting pairs
// next - callback function in form next(err, data)
//
//  err - null if sucessful or err message if not found or not logged in
//  data - N/A   
//

exports.logout = function(data, next) {
    
    // make sure we have a callback
    if (typeof next !== 'function') {
        return;
    }

    // data validation
    var data = data || {};
    var params = data.postdata || {};  
    var username = params.username || '';  
    var token = params.token;  
    var err;


    // check for user in sessions
  
    var index = sessions.findIndex( val => val.username === username && val.token === token);
    if (index !== -1) { 
        sessions.splice(index, 1);   
    }
    else {
        err = Errors.NOTLOGGEDIN;
    }
   
    next(err);
}


//
// isAuthorized - checks if the request is valid
// headers - request headers
//
// returns true if valid  otherwise false
//

exports.isAuthorized = function(headers) {

    var token = headers[TOKEN_HEADER];
   
    if (typeof token === 'undefined') {
        return false;
    }
    var session = sessions.find( val => val.token == token);
 
    if (typeof session !== 'undefined') {
        return true;
    }
    else {
        return false;
    }
}

