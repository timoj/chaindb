(function (global) {

    var contains = function (needle) {
        // Per spec, the way to identify NaN is that it is not equal to itself
        var findNaN = needle !== needle;
        var indexOf;

        if (!findNaN && typeof Array.prototype.indexOf === 'function') {
            indexOf = Array.prototype.indexOf;
        } else {
            indexOf = function (needle) {
                var i = -1, index = -1;

                for (i = 0; i < this.length; i++) {
                    var item = this[i];

                    if ((findNaN && item !== item) || item === needle) {
                        index = i;
                        break;
                    }
                }

                return index;
            };
        }

        return indexOf.call(this, needle) > -1;
    };

    var ChainDB = {};
    //TODO: implememnt lock correctly

    ChainDB.settings = {
        indexAtInsert: true, //If false, newly inserted rows will be indexed by the optimizer, which means it will be indexed at a later moment
        maxRows: 51000000,
        optimizerInterval: 500, //In milliseconds
    };

    ChainDB._tables = {};
    ChainDB._tableColumns = {};
    ChainDB._tableNameSeperator = "-^&*-";
    ChainDB._tableNameIndex = ChainDB._tableNameSeperator;
    ChainDB._deletedTables = [];
    ChainDB._deletedValues = [];
    ChainDB._values = [];
    ChainDB._valIdCounter = 0;
    ChainDB._busy = false;
    ChainDB._changed = false;
    ChainDB._indexes = {};
    ChainDB._indexValues = {};
    ChainDB._rowsToIndex = [];
    ChainDB._optimizerTask = null;
    ChainDB._oldOptimizerInterval = ChainDB.settings.optimizerInterval;

    function optimizerManager() {
        if (!ChainDB._busy && (ChainDB._changed || ChainDB._rowsToIndex.length > 0)) {
            ChainDB._optimizer();
        }
        if (ChainDB._oldOptimizerInterval !== ChainDB.settings.optimizerInterval) {
            clearInterval(ChainDB._optimizerTask);
            ChainDB._optimizerTask = setInterval(optimizerManager, ChainDB.settings.optimizerInterval);
            ChainDB._oldOptimizerInterval = ChainDB.settings.optimizerInterval;
        }
    }

    ChainDB._optimizerTask = setInterval(optimizerManager, ChainDB.settings.optimizerInterval);

    ChainDB.createTable = function (name, columns, indexes) {
        if (ChainDB._tableNameIndex.indexOf(ChainDB._tableNameSeperator + name + ChainDB._tableNameSeperator) < 0) {
            ChainDB._tables[name] = {name: name, locked: false};
            ChainDB._tableNameIndex += name + ChainDB._tableNameSeperator;
            ChainDB._tableColumns[name] = columns;
            ChainDB._values[name] = {};
            if (indexes === undefined) {
                indexes = [];
            }
            ChainDB._indexes[name] = indexes;
            ChainDB._indexValues[name] = {};
        } else {
            //TODO Exception
        }
    };

    ChainDB.deleteTable = function (name) {
        ChainDB._deletedTables.push(name);
        ChainDB._tableNameIndex.replace(name + ChainDB._tableNameSeperator, "");
        ChainDB._changed = true;
    };

    ChainDB._optimizer = function () {
        ChainDB._busy = true;
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
        console.log(ChainDB._rowsToIndex.length);
        if (ChainDB._rowsToIndex.length > 0) {
            var i = ChainDB._rowsToIndex.length;
            while (i--) {
                ChainDB._indexRowValues(ChainDB._rowsToIndex[i].table, ChainDB._values[ChainDB._rowsToIndex[i].table][ChainDB._rowsToIndex[i].rowId]);
                ChainDB._rowsToIndex.splice(i, 1);
            }
        }
        ChainDB._busy = false;
        ChainDB._changed = false;
    };

    ChainDB._indexRowValues = function (table, row, atInsert) {
        if (atInsert === undefined) {
            atInsert = false;
        }
        if (ChainDB._indexes[table] !== undefined && ChainDB._indexes[table].length > 0) {
            if (ChainDB.settings.indexAtInsert || !atInsert) {
                for (var column in row) {
                    if (contains.call(ChainDB._indexes[table], column)) {
                        if (ChainDB._indexValues[table][column] === undefined) {
                            ChainDB._indexValues[table][column] = [];
                        }
                        if (ChainDB._indexValues[table][column][row[column]] === undefined) {
                            ChainDB._indexValues[table][column][row[column]] = [ChainDB._valIdCounter];
                        } else {
                            ChainDB._indexValues[table][column][row[column]].push(ChainDB._valIdCounter);
                        }
                    }
                }
            } else {
                ChainDB._rowsToIndex.push({table: table, rowId: row.id});
            }
        }
    };

    ChainDB._getIndexValues = function (table, column, value) {
        var correctIndexedValues = ChainDB._indexValues[table];
        if (correctIndexedValues !== undefined) {
            correctIndexedValues = correctIndexedValues[column];
            if (correctIndexedValues !== undefined) {
                correctIndexedValues = correctIndexedValues[value];
                if (correctIndexedValues !== undefined) {
                    return correctIndexedValues;
                }
            }
        }
        return [];
    };

    ChainDB.insert = function (table, row) {
        if (ChainDB._valIdCounter >= ChainDB.settings.maxRows) {
            //TODO exception.
        }
        ChainDB._valIdCounter++;
        row.id = ChainDB._valIdCounter;
        ChainDB._values[table][ChainDB._valIdCounter] = row;
        ChainDB._indexRowValues(table, row, true);
    };

    ChainDB.insertBulk = function (table, rows) {
        ChainDB._busy = true;
        for (var i = 0; i < rows.length; i++) {
            ChainDB.insert(table, rows[i]);
        }
        ChainDB._busy = false;
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
        var values = ChainDB._values[this.fromTable];
        return values;
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
        if (contains.call(ChainDB._indexes[this.fromTable], column)) {
            var correctIndexedRowIds = ChainDB._getIndexValues(this.fromTable, column, value);
            var tmpResults = [];
            for (var id in correctIndexedRowIds) {
                if (currentResultSet.hasOwnProperty(id)) {
                    tmpResults.push(currentResultSet[id]);
                }
            }
            this.resultSet = tmpResults;
        } else {
            this.resultSet = Object.values(currentResultSet).filter(row => row[column] === value);
        }
        return this;
    };

    ChainDB.Query.prototype.whereColumnMeets = function (column, test) {
        var currentResultSet = this._getCorrectResultSet();
        this.resultSet = Object.values(currentResultSet).filter(row => test(row[column]));
        return this;
    };

    ChainDB.Query.prototype.getResults = function () {
        //TODO: filter out results that need to be deleted;
        var resultSet = this._getCorrectResultSet();
        ChainDB._tables[this.fromTable].locked = false;
        if (this.selectedColumns.length === 1 && this.selectedColumns[0] === "*") {
            return Object.values(resultSet);
        }
        var rows = Object.values(resultSet);
        var resultSetWithCorrectColumns = [];
        for (var i = 0; i < rows.length; i++) {
            resultSetWithCorrectColumns.push(this._formatRowWithCorrectColumns(rows[i]))
        }
        return resultSetWithCorrectColumns;
    };

    ChainDB.Query.prototype.remove = function () {
        var resultSet = this._getCorrectResultSet();
        if (Object.values(resultSet).length > 0) {
            var rows = Object.values(resultSet);
            var deletedRows = {
                table: this.fromTable,
                rows: new Array(rows.length)
            };
            for (var i = 0; i < rows.length; i++) {
                deletedRows.rows.push(rows[i].id);
            }
            ChainDB._deletedValues.push(deletedRows);
            ChainDB._changed = true;
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