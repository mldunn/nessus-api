'use strict'

var users = [];
var errorsIn = [];
var errorsOut = [];
var status = [];

var util = require('./util');

function login(user, cb) {

    var user = user || {};

    util.post('/login', {username: user}, user.token, function(result) {

        console.log('login');
        if (result.error) {
            errorsIn.push(result);
            console.log('login:' + user + ' --> error: ' + result.error.message);
        }
        else {
            users.push(result)
            console.log('login:' + user + ' --> ok');
        }
        if (typeof cb === 'function') {
            cb(result)
        }
    });
}


function logout(user, cb) {

    var user = user || {};
    
    util.post('/logout', user, user.token, function(result) {

        console.log('logout')
        if (result.error) {
            errorsOut.push(result);
            console.log('logout:' + user.username + ' --> error: ' + result.error.message);
        }
        else {
            status.push(result);
            console.log('logout:' + user.username + ' --> ok');
        }
        if (typeof cb === 'function') {
            cb(result)
        }
       
    })
}

function loginTest(cb) {
    login('mike', function(res) {
    
        login('michael', function(res) {
            var mike = users.find( val => val.username == 'mike');
            logout(mike, function(res){
                logout(mike, function(res){
                    login('tenable', function(res) {
                        var ten = users.find( val => val.username == 'tenable');
                        logout(ten, cb);
                    });
                });
            });
        });
    });
}

exports.login = login;
exports.logout = logout;
exports.sessions = users;

exports.test = loginTest;
