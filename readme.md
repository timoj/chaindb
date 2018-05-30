# ChainDB - Simple Javascript Database
[![Build Status](https://travis-ci.org/timoj/chaindb.svg?branch=master)](https://travis-ci.org/timoj/chaindb)

## Introduction
ChainDB is a simple javascript database with chained-querying support.

## Installation

`npm install --save chaindb`

Settings:
- indexAtInsert: default true, if false: rows will be indexed by the optimize task, on a later moment
- maxRows: default 51000000, max number of rows allowed to be stored in the database.
- optimizerInterval: default 500, the interval in which the optimize task is triggered, in milliseconds

Settings can be changed in the following way:  
`ChainDB.settings.optimizerInterval = xxx;`
## Usage

### Creating a table
A table is a collection, it has a name, which has to be unique, and a set of column names, which have to be unique to that table  
`ChainDB.createTable("Users", ["name", "age"]);`

You can also give a list of columns that need to be indexed. The values of these columns will be indexed for faster querying:  
`ChainDB.createTable("Users", ["name", "age"]);`  
_Note that you should only index columns that hold a small value such as number values or short string values._

### Inserting data

Inserting a single row:  
`ChainDB.insert("Users", {name: "User1", age: 24});`

Inserting in bulk:  
`ChainDB.insertBulk("Users", [{name: "User2", age: 32},{name: "User3", age: 24}]);`

### Querying

Example:
```
var query = new ChainDB.Query();
var users = query.select(["name", "age"])
    .from("Users")
    .whereColumnEquals("age", 24)
    .whereColumnMeets("name", function (name) {
        return (name.slice(-1) === "3")
    })
    .getResults();
```

### Removing data
You can remove each result set, by doing the following:  
```
var query = new ChainDB.Query();
var users = query.select(["name", "age"])
    .from("Users")
    .whereColumnEquals("age", 24)
    .whereColumnMeets("name", function (name) {
        return (name.slice(-1) === "3")
    })
    .remove();
```

