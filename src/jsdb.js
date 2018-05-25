(function (global) {
    var JsDb = {};

    JsDb._tables = {};
    JsDb._tableColumns = {};
    JsDb._tableNameIndex = "";
    JsDb._tableNameSeperator = "-^&*-";
    JsDb._deletedTables = [];
    JsDb._deletedValues = [];
    JsDb._values = [];
    JsDb._valIdCounter = 0;

    JsDb.createTable = function (name, columns) {
        if (JsDb._tableNameIndex.indexOf(name) < 0) {
            JsDb._tables[name] = {name: name, locked: false};
            JsDb._tableNameIndex += name + JsDb._tableNameSeperator;
            JsDb._tableColumns[name] = columns;
            JsDb._values[name] = {};
        } else {
            //TODO Exception
        }
    };

    JsDb.deleteTable = function (name) {
        JsDb._deletedTables.push(name);
        JsDb._tableNameIndex.replace(name + JsDb._tableNameSeperator, "");
    };

    JsDb._optimizer = function () {
        if (JsDb._deletedValues.length) {
            for (var deletedRows in JsDb._deletedValues) {
                var rowsData = JsDb._deletedValues[deletedRows];
                for (var row in rowsData.rows) {
                    if (JsDb._values[rowsData.table][rowsData.rows[row]] !== undefined) {
                        delete JsDb._values[rowsData.table][rowsData.rows[row]];
                    }
                }
                delete JsDb._deletedValues[deletedRows];
            }
        }
        if (JsDb._deletedTables.length) {
            for (var tableName in JsDb._tables) {
                for (var j = 0; j < JsDb._deletedTables.length; j++) {
                    if (tableName === JsDb._deletedTables[j]) {
                        delete JsDb._tables[tableName];
                        delete JsDb._deletedTables[j];
                    }
                }
            }
        }
    };

    JsDb.insert = function (table, row) {
        JsDb._valIdCounter++;
        row.id = JsDb._valIdCounter;
        JsDb._values[table][JsDb._valIdCounter] = row;
    };

    JsDb.insertBulk = function (table, rows) {
        for (var i = 0; i < rows.length; i++) {
            JsDb._valIdCounter++;
            rows[i].id = JsDb._valIdCounter;
            JsDb._values[table][JsDb._valIdCounter] = rows[i];
        }
    };

    JsDb.Query = function () {
        this.selectedColumns = [];
        this.selectedColumnsString = "";
        this.fromTable = undefined;
        this.resultSet = undefined;

    };

    JsDb.Query.prototype.select = function (columns) {
        this.selectedColumns = columns;
        this.selectedColumnsString = JSON.stringify(columns);
        return this;
    };

    JsDb.Query.prototype.from = function (table) {
        if (JsDb._tableNameIndex.indexOf(name) >= 0) {
            this.fromTable = table;
            JsDb._tables[table].locked = true;
        } else {
            //TODO: exception
        }
        return this;
    };

    JsDb.Query.prototype._getCorrectResultSet = function () {
        if (this.resultSet !== undefined)
            return this.resultSet;
        return JsDb._values[this.fromTable];
    };

    JsDb.Query.prototype._formatRowWithCorrectColumns = function (row) {
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

    JsDb.Query.prototype.whereColumnEquals = function (column, value) {
        var currentResultSet = this._getCorrectResultSet();
        this.resultSet = Object.values(currentResultSet).filter(row => row[column] === value);
        return this;
    };

    JsDb.Query.prototype.whereColumnMeets = function (column, test) {
        var currentResultSet = this._getCorrectResultSet();
        this.resultSet = Object.values(currentResultSet).filter(row => test(row[column]));
        return this;
    };

    JsDb.Query.prototype.getResults = function () {
        JsDb._tables[this.fromTable].locked = false;
        if (this.selectedColumns.length === 1 && this.selectedColumns[0] === "*") {
            return Object.values(this.resultSet);
        }
        var rows = Object.values(this.resultSet);
        var resultSetWithCorrectColumns = new Array(rows.length);
        for (var i = 0; i < rows.length; i++) {
            resultSetWithCorrectColumns.push(this._formatRowWithCorrectColumns(rows[i]))
        }
        return resultSetWithCorrectColumns;
    };

    JsDb.Query.prototype.remove = function () {
        if (this.resultSet !== undefined && Object.values(this.resultSet).length > 0) {
            var rows = Object.values(this.resultSet);
            var deletedRows = {
                table: this.fromTable,
                rows: new Array(rows.length)
            };
            for (var i = 0; i < rows.length; i++) {
                deletedRows.rows.push(rows[i].id);
            }
            JsDb._deletedValues.push(deletedRows);
            JsDb._optimizer();
        }
    };

    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = JsDb;

        // Register as an AMD module
    } else if (typeof define === 'function' && define.amd) {
        define('JsDb', [], function () {
            return JsDb;
        });

        // Export into global space
    } else if (typeof global === 'object' && typeof global.document === 'object') {
        global.JsDb = JsDb;
    }

})(this);