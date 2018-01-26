'use strict';

const auth = require('./auth-test');
const configs = require('./config-test');

auth.test( () => {
    configs.test();
});


