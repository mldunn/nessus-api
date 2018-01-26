"use strict";


exports.exception = function(e, msg) {
    console.log('EXCEPTION: ' + e.message)
    console.log('EXMSG: ' + msg)
};


exports.error = function(msg) {
    console.log('ERROR: ' + msg)
};

exports.info = function(msg) {
    console.log('INFO: ' + msg)
};

exports.dump = function(obj) {
    console.dir(obj)
};