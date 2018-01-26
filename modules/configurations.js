'use strict';

var configurations = [
    {
        "name": "host1",
        "hostname": "nessus-ntp.lab.com",
        "port": 1241,
        "username": "toto"
    },
    {
        "name": "host2",
        "hostname": "nessus-xml.lab.com",
        "port": 3384,
        "username": "admin"
    }
];

//
// create more configurations
//
for (var i = 3; i <= 64; i++) {
    var config = {
        name: 'host' +  i,
        port: 9000 + i,
        username: 'user' +  i
    };
    if (i % 2) {
        config.hostname = 'nessus-xml-'+ i +  '.lab.com';
        config.port = 7000 + i;
    }
    else {
        config.hostname = 'nessus-ntp-' + i +  '.lab.com';
    }
    configurations.push(config);
}


const PAGE_SIZE = 12

var Errors = {
    NOTFOUND: { code: 'NotFound', message: 'configuration not found' },
    INVALAIDPARAM: { code: 'InvalidParam', message: 'invalid paramteer' },
    INVALIDRECORD: { code: 'InvalidRecord', message: 'invalid configuration object' },
    DUPLICATERECORD: { code: 'DuplicateRecord', message: 'configuration already exists' }
}


// helper functions

// get the index of the configuration using a name
function indexFromName(name) {
    if (typeof name === 'string') {
        let ln = name.toLowerCase();

        return configurations.findIndex( val => val.name.toLowerCase() === ln );
    }
    // not found
    return -1;
}


// check for validity - simnple check here for just a name value
function isValidItem(item) {
    var valid = false;
    if (item) {
        valid = typeof item.name === 'string';
    }
    return valid;
}


// check for field validity 
const validFields = ['name','hostname','port','username'];
function isValidField(field) {
    var valid = false;
    if (field) {
        valid = validFields.indexOf(field.toLowerCase()) !== -1;
    }
    return valid;
}

// isolate int parsing
function paramToNum(val, def) {
    var num = parseInt(val);
    if (isNaN(num)) { 
        return 0; 
    }
    return num;
}

// sorts ascending or descending based on field
function doSort(field, isDescending) {
    var sorted;
    if (isDescending) {
        sorted = configurations.sort(function(a, b) {
            if (typeof b[field] === 'string') {
                return b[field].localeCompare(a[field])
            }
            else if (typeof b[field] === 'number') {
                return b[field] - a[field];
            }
            else {
                return 0;
            }
        });
    }
    else {
        sorted = configurations.sort(function(a, b) {
            if (typeof a[field] === 'string') {
                return a[field].localeCompare(b[field])
            }
            else if (typeof a[field] === 'number') {
                return a[field] - b[field];
            }
            else {
                return 0;
            }
        });
    }
    return sorted;
}

// exports

//
// get - get configurations or configuration by name
// data - common data struct containing params (name)
// next - callback function in form next(err, data)
//
//  err - null (no error needed as data will return an empty array if no items in list)
//  data - the list configurations, or the configuration record for the supplied name
//

exports.get = function(data, next) {

    if (typeof next !== 'function') {
       return;
    }

    // data validation
    var data = data || {};
    var params = data.params || {};
    var items;
    var payload = {};

    // check for filter based on name
    if (params.name) {
        let name = params.name.toLowerCase();
        items = configurations.filter((val) => val.name.toLowerCase() === name);
    }
    else {
       
        // check for sortby
        if (isValidField(params.sortby)) {
            let dir = params.sortorder || 'asc';
            let isDescending = (dir.toLowerCase() === 'desc')
            items = doSort(params.sortby, isDescending);
        }
        else {
            items = configurations;
        }

        // check for pagination, use the items array

        var pageNum = paramToNum(params.pagenum);
        if (pageNum > 0) {
            var pageSize = paramToNum(params.pagesize);
            if (pageSize <= 0) {
                pageSize = PAGE_SIZE;
            }

            let minIndex = Math.max(0, (pageNum - 1) * pageSize);
            let lastIndex = Math.min(items.length, (pageNum * pageSize));
            items = items.slice(minIndex, lastIndex);

            // return some info regarding the page
            payload.startIndex = minIndex;
            payload.endIndex = lastIndex - 1;
            payload.pageSize = pageSize;
            payload.pageNum = pageNum;
            payload.totalItems = configurations.length;
        }
    }

    payload.configurations = items;
   
    next(null, payload);    
};

//
// delete - delete a configuration
// data - common data struct containing params (name)
// next - callback function in form next(err, data)
//
//  err - error if user not found otherwise null
//  data - N/A callback will send status: ok if no error
//

exports.delete = function(data, next) {

    if (typeof next !== 'function') {
        return;
    }

    // data validation
    var data = data || {};
    var params = data.params || {};
    var err;
   
    // find the record
    var index = indexFromName(params.name);

    // remove it
    if (index != -1) {
        configurations.splice(index, 1);
    }
    else  {
        err = Errors.NOTFOUND;
    }

    next(err);
};


//
// update - update a configuration
// data - common data struct containing params (name, item)
// next - callback function in form next(err, data)
//
//  err - error if user not found otherwise null
//  data - { name: "<name>" } of updated record
//

exports.update = function(data, next) {

    if (typeof next !== 'function') {
        return;
    }

    // data validation
    var data = data || {};
    var params = data.params || {};
    var item = data.postdata || {};
    var found = false;
    var err;
    var name = params.name || item.name;
  
    var index = indexFromName(name);
    if (index !== -1) {
        if (isValidItem(item)) {
            configurations[index] = item;
        }
        else {
            err = Errors.INVALIDRECORD;
        }
    }
    else {
        err = Errors.NOTFOUND;
    }

    next(err, { name: name });
};


//
// create - create a configuration
// data - common data struct containing params (record)
// next - callback function in form next(err, data)
//
//  err - error if user not found otherwise null
//  data - { name: "<name>" } of created record
//
exports.create = function(data, next) {

    if (typeof next !== 'function') {
        return;
    }

    // data validation
    var data = data || {};
    var item = data.postdata || {};
    var err;
    
    if (isValidItem(item)) {
        let exists = configurations.findIndex((val) => val.name.toLowerCase() === item.name);
        if (exists === -1) {
            configurations.push(item);
        }
        else {
            err = Errors.DUPLICATERECORD;
        }
    }
    else {
        err = Errors.INVALIDRECORD;
    }

    next(err, { name: item.name });
};



