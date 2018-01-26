'use strict';


const util = require('./util');
const auth = require('./auth-test');



function get(name, token, params, cb) {
    
    var path = '/configurations';
    if (typeof name == 'string') {
        path += '/' + name;
    }

    if (typeof params == 'string') {
        path += '?' + params;
    }
    console.log('configurations: get('+path+') -->');

   
    util.get(path, token, function(result) {
        console.dir(result)
        if (typeof cb === 'function') {
            cb(result)
        }
    });
    
}

function update(data, token, cb) {
    
    var path = '/configurations/' + data.name;
   
    console.log('configurations: update('+path+') -->');

    util.put(path, data, token, function(result) {
        console.dir(result)
        if (typeof cb === 'function') {
            cb(result)
        }
    });
}



function del(name, token, cb) {
    
    var path = '/configurations/' + name;
    console.log('configurations: delete('+path+') -->');

    util.del(path, token, function(result) {
        console.dir(result)
        if (typeof cb === 'function') {
            cb(result)
        }
    });
}


function create(data, token, cb) {
    
    var path = '/configurations';
    
    console.log('configurations: create('+path+') -->');

    util.post(path, data, token, function(result) {
        console.dir(result)
        if (typeof cb === 'function') {
            cb(result)
        }
    });
}



function sort(sortby, order, token, cb) {

    var params = 'sortby='+sortby;
    
    if (typeof order === 'string') {
       
        params += '&sortorder='+sortorder;
    }

    console.log('configurations: sort('+params+') -->');

    get(null, token, params, function(result) {

        console.dir(result)
        if (typeof cb === 'function') {
            cb(result)
        }
    })
}

function page(num, size, token, cb) {

    var params = 'page='+num;
    
    if (typeof size === 'string') {
        params += '&pagesize='+size;
    }

    console.log('configurations: sort('+params+') -->');

    get(null, token, params, function(result) {

        console.dir(result)
        if (typeof cb === 'function') {
            cb(result)
        }
    })
}

function test() {

    auth.login('tester', function(user) {
        var obj1 = { name:'host123', port: 1001010, user: 'tester', hostname: 'testhost' };
        var obj2 = { name:'host2', port: 1001010, user: 'tester', hostname: 'testhost' };
        create(obj1, user.token, function(result) {
            update(obj2, user.token, function(result) {
                /*
                get(null, user.token, function(result) {
                    del(obj1.name, user.token, function(result) {
                        get(null, user.token, function(result) {
                            auth.logout(user);
                        });
                    });
                });
                */
            });
        });
    });
}

exports.test = test;