(function (global) {
    var ChainDB = {};

    ChainDB._tables = {};
    ChainDB._tableColumns = {};
    ChainDB._tableNameSeperator = "-^&*-";
    ChainDB._tableNameIndex = ChainDB._tableNameSeperator;
    ChainDB._deletedTables = [];
    ChainDB._deletedValues = [];
    ChainDB._values = [];
    ChainDB._valIdCounter = 0;

    ChainDB.createTable = function (name, columns) {
        if (ChainDB._tableNameIndex.indexOf(ChainDB._tableNameSeperator + name + ChainDB._tableNameSeperator) < 0) {
            ChainDB._tables[name] = {name: name, locked: false};
            ChainDB._tableNameIndex += name + ChainDB._tableNameSeperator;
            ChainDB._tableColumns[name] = columns;
            ChainDB._values[name] = {};
        } else {
            //TODO Exception
        }
    };

    ChainDB.deleteTable = function (name) {
        ChainDB._deletedTables.push(name);
        ChainDB._tableNameIndex.replace(name + ChainDB._tableNameSeperator, "");
    };

    ChainDB._optimizer = function () {
        if (ChainDB._deletedValues.length) {
            for (var deletedRows in ChainDB._deletedValues) {
                var rowsData = ChainDB._deletedValues[deletedRows];
                for (var row in rowsData.rows) {
                    if (ChainDB._values[rowsData.table][rowsData.rows[row]] !== undefined) {
                        delete ChainDB._values[rowsData.table][rowsData.rows[row]];
                    }
                }
                delete ChainDB._deletedValues[deletedRows];
            }
        }
        if (ChainDB._deletedTables.length) {
            for (var tableName in ChainDB._tables) {
                for (var j = 0; j < ChainDB._deletedTables.length; j++) {
                    if (tableName === ChainDB._deletedTables[j]) {
                        delete ChainDB._tables[tableName];
                        delete ChainDB._deletedTables[j];
                    }
                }
            }
        }
    };

    ChainDB.insert = function (table, row) {
        ChainDB._valIdCounter++;
        row.id = ChainDB._valIdCounter;
        ChainDB._values[table][ChainDB._valIdCounter] = row;
    };

    ChainDB.insertBulk = function (table, rows) {
        for (var i = 0; i < rows.length; i++) {
            ChainDB._valIdCounter++;
            rows[i].id = ChainDB._valIdCounter;
            ChainDB._values[table][ChainDB._valIdCounter] = rows[i];
        }
    };

    ChainDB.Query = function () {
        this.selectedColumns = [];
        this.selectedColumnsString = "";
        this.fromTable = undefined;
        this.resultSet = undefined;

    };

    ChainDB.Query.prototype.select = function (columns) {
        this.selectedColumns = columns;
        this.selectedColumnsString = JSON.stringify(columns);
        return this;
    };

    ChainDB.Query.prototype.from = function (table) {
        if (ChainDB._tableNameIndex.indexOf(table) >= 0) {
            this.fromTable = table;
            ChainDB._tables[table].locked = true;
        } else {
            //TODO: exception
        }
        return this;
    };

    ChainDB.Query.prototype._getCorrectResultSet = function () {
        if (this.resultSet !== undefined)
            return this.resultSet;
        return ChainDB._values[this.fromTable];
    };

    ChainDB.Query.prototype._formatRowWithCorrectColumns = function (row) {
        if (this.selectedColumns.length === 1 && this.selectedColumns[0] === "*") {
            return row;
        } else {
            var rowValue = {};
            for (var c in row) {
                if (this.selectedColumnsString.indexOf(c) !== -1) {
                    rowValue[c] = row[c];
                }
            }
            return rowValue;
        }
    };

    ChainDB.Query.prototype.whereColumnEquals = function (column, value) {
        var currentResultSet = this._getCorrectResultSet();
        this.resultSet = Object.values(currentResultSet).filter(row => row[column] === value);
        return this;
    };

    ChainDB.Query.prototype.whereColumnMeets = function (column, test) {
        var currentResultSet = this._getCorrectResultSet();
        this.resultSet = Object.values(currentResultSet).filter(row => test(row[column]));
        return this;
    };

    ChainDB.Query.prototype.getResults = function () {
        ChainDB._tables[this.fromTable].locked = false;
        if (this.selectedColumns.length === 1 && this.selectedColumns[0] === "*") {
            return Object.values(this.resultSet);
        }
        var rows = Object.values(this.resultSet);
        var resultSetWithCorrectColumns =[];
        for (var i = 0; i < rows.length; i++) {
            resultSetWithCorrectColumns.push(this._formatRowWithCorrectColumns(rows[i]))
        }
        return resultSetWithCorrectColumns;
    };

    ChainDB.Query.prototype.remove = function () {
        if (this.resultSet !== undefined && Object.values(this.resultSet).length > 0) {
            var rows = Object.values(this.resultSet);
            var deletedRows = {
                table: this.fromTable,
                rows: new Array(rows.length)
            };
            for (var i = 0; i < rows.length; i++) {
                deletedRows.rows.push(rows[i].id);
            }
            ChainDB._deletedValues.push(deletedRows);
            ChainDB._optimizer();
        }
    };

    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = ChainDB;

        // Register as an AMD module
    } else if (typeof define === 'function' && define.amd) {
        define('ChainDB', [], function () {
            return ChainDB;
        });

        // Export into global space
    } else if (typeof global === 'object' && typeof global.document === 'object') {
        global.ChainDB = ChainDB;
    }

})(this);