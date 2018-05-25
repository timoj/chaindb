describe("JsDb", function () {

    var JsDb = require('../src/jsdb');

    it("should be able to create a new table", function () {
        JsDb.createTable("Users");
        expect(JsDb._tables["Users"]).toEqual({name: "Users", locked: false});
    });

    it("should be able to insert data", function () {
        for (var i = 0; i < 1000; i++) {
            _addManyUsersTest(5000, 5000);
        }
        expect(Object.values(JsDb._values["Users"]).length).toEqual(5001000);
    });

    function _addManyUsersTest(start, it) {
        JsDb.insert("Users", {name: ("User" + (start % it)), age: Math.floor(Math.random() * 100)});
        if (it > 0) {
            _addManyUsersTest(start, (it - 1));
        }
    }
});
