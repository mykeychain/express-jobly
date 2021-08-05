
"use strict"

const {BadRequestError} = require("../expressError");

describe("convert to SQL", function () {
    test("works: converts successfully", function () {
      const dataToUpdate = {firstName: 'Aliya', age: 32}; // body of the user patch request
      const jsToSql = {firstName: "first_name"};
      const sql = sqlForPartialUpdate(dataToUpdate, jsToSql);
      expect(sql).toEqual({setCols: "\"first_name\"=$1, \"age\"=$2", values: ["Aliya", 32]});
    });

    test("bad request: missing data", function () {
        const dataToUpdate = {}; 
        const jsToSql = {firstName: "first_name"};
       
        try {
            sqlForPartialUpdate(dataToUpdate, jsToSql);
            //fail();
          } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
          }
      });

})