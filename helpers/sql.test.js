
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

    
 







  
   

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    const keys = Object.keys(dataToUpdate);
    if (keys.length === 0) throw new BadRequestError("No data");
  
    // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
    const cols = keys.map((colName, idx) =>
        `"${jsToSql[colName] || colName}"=$${idx + 1}`,
    );
  
    return {
      setCols: cols.join(", "),
      values: Object.values(dataToUpdate),
    };
  }