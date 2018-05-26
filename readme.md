# ChainDB - Simple Javascript Database
[![Build Status](https://travis-ci.org/timoj/chaindb.svg?branch=master)](https://travis-ci.org/timoj/chaindb)

## Introduction
ChainDB is a simple javascript database with chained-querying support.

## Installation

`npm install --save chaindb`

## Usage

### Creating a table
A table is a collection, it has a name, which has to be unique, and a set of column names, which have to be unique to that table  
`ChainDB.createTable("Users", ["name", "age"]);`

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
        });
```


