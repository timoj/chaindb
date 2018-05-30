describe("ChainDB", function () {

    var ChainDB = require('../src/chaindb');

    it("should be able to create a new table", function (done) {
        ChainDB.createTable("Users", ["name", "age"]);
        expect(ChainDB._tables["Users"]).toEqual({name: "Users", locked: false});
        done();
    });

    it("should be able to insert data", function (done) {
        ChainDB.createTable("Users", ["name", "age"]);
        for (var i = 0; i < 10; i++) {
            _addManyUsersTest(5000, 5000);
        }
        expect(Object.values(ChainDB._values["Users"]).length).toEqual(50010);
        done();
    });

    it("should be able to query data", function () {
        ChainDB.createTable("WebUsers", ["name", "age"]);
        ChainDB.insert("WebUsers", {name: "User1", age: 24});
        ChainDB.insertBulk("WebUsers", [{name: "User2", age: 32},{name: "User3", age: 24}]);
        var query = new ChainDB.Query();
        var users = query.select(["name","age"]).from("WebUsers").whereColumnEquals("age", 24).whereColumnMeets("name", function (name) {
            return (name.slice(-1) === "3")
        }).getResults();
        expect(users.length).toEqual(1);
    });

    it("should be able to delete data", function (done) {
        ChainDB.createTable("SysUsers", ["name", "age"]);
        ChainDB.insert("SysUsers", {name: "User1", age: 24});
        ChainDB.insertBulk("SysUsers", [{name: "User2", age: 32},{name: "User3", age: 24}]);
        var initCount = Object.values(ChainDB._values['SysUsers']).length;
        var query = new ChainDB.Query();
        query.select(["*"]).from("SysUsers").whereColumnEquals("age", 24).remove();
        setTimeout(function() {
            expect(initCount).toBeGreaterThan(Object.values(ChainDB._values['SysUsers']).length);
            done();
        }, 4000);

    });

    function _addManyUsersTest(start, it) {
        ChainDB.insert("Users", {name: ("User" + (start % it)), age: Math.floor(Math.random() * 100)});
        if (it > 0) {
            _addManyUsersTest(start, (it - 1));
        }
    }
});
