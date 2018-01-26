# nessus-api

simple REST API implementation in node

## Requirements

* NodeJS v8.9.4 or above (thats it)

## Running the server

To start the server run the following command

npm start

The server runs via localhost:8100, the port can be modified via the CONFIG_PORT environment variable, the hostname is taken from the process.hostname variable

## Usage

### Basic Concepts

All API calls return a json object, for calls with no associated data a {status: "ok"} object is returned. If an error occurs it is returned as a json object instead of the data object, and has the following format:
 
    { error: { code: "<shortname>", message: "<detailed message>"}}
   

Callers should check for the existence of an "error" property in the response payload 

All calls requiring authentication must set a custom header called x-foo-auth-token with the token value supplied in the login response

    'x-foo-auth-token': <token>

### Authentication

#### login

* path: /login
* method: POST
* body: JSON encoded object containing username field 

returns json object in the form of:
    
    { username: "<username>", token: "<token>" }
    
example:

    curl -d '{"username": "guest"}' -X POST http://localhost:8100/login
    
Valid usernames are 'mike', 'tenable', 'guest' and 'tester'


#### logout

* path: /logout
* method: POST
* body: JSON encoded object containing username field and token field
* authenticated: true

returns status ok or error object

example:

    curl -d '{"username": "guest", "token": "<token>" }' -H "x-foo-auth-token: <token>" -X POST http://localhost:8100/logout
    
    

### Configurations

#### get  - retrieve the list configurations or one configuration based on name

* path: /configurations[/<configuration.name>]
* method: GET
* authenticated: true

example:

    curl -H "x-foo-auth-token: <token>"  http://localhost:8100/configurations

    curl -H "x-foo-auth-token: <token>"  http://localhost:8100/configurations/<configuration.name>

returns {configurations: &lt;array of matching configurations&gt; }    


##### Sorting and Pagination

The configurations command supports sorting and pagination via query parameters, you can use both paging and sorting parameters in a single request. Note: sorting and page are only applicable to requests without configuration.name specified.

###### sorting params

    sortby=<field name>  -  valid fields are name, hostname, port, and username
    sortorder=asc|desc  - defaults to ascending if not specified or invalid

    http://localhost:8100/configurations?sortby=hostname&sortorder=desc

returns {configurations: &lt;array of sorted configurations&gt;}    

##### pagination - note the returned object contains additional paging information

    pagenum = <page number> - page number to be retrieved
    pagesize = <number of items per page> - if none specfied defaults to 12

    http://localhost:8100/configurations?page=6

    http://localhost:8100/configurations?page=4&pagesize=20
      
      
returns json object in the form of

        {   
            configurations: <array of configurations for the page>, 
            startIndex: <index/position of first item on page - relative to the entire set of items>,  
            endIndex: <index/position of last item on page - relative to the entire set of items>,
            pageSize: <number of items per page>,  
            pageNum: <the page number being returned>,
            totalItems: <total number of items in enitre set of items>
        } 

#### create

* path: /configurations
* method: POST
* authenticated: true
    
example:

    curl -H "x-foo-auth-token: <token>"  -d '{"name":"<name>", "hostname":"<hostname>", "port":<port>, "user":"<user>"}' -X POST http://localhost:8100/configurations

returns {name: "&lt;configuration.name&gt;"} if succeeds otherwise error object is returned 

#### update

* path: /configurations/<configuration.name>
* method: PUT
* authenticated: true
    
example:

    curl -H "x-foo-auth-token: <token>"  -d '{"name":"<name>", "hostname":"<hostname>", "port":<port>, "user":"<user>"}' -X PUT http://localhost:8100/configurations/<configuration.name>


returns {name: "&lt;configuration.name&gt;"} if succeeds otherwise error object is returned 

### delete

* path: /configurations/<configuration.name>
* method: DELETE
* authenticated: true
    
example:

    curl -H "x-foo-auth-token: <token>"  -X DELETE http://localhost:8100/configurations/<configuration.name>

returns {status: "ok"} if succeeds otherwise error object is returned 

## Testing

Custom test scripts have been included in the test directory and can be invoked via `npm test` all output is logged to console.  Note: the server must be running for the test scripts to run

    
