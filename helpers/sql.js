const { BadRequestError } = require("../expressError");

/**
 * sqlForPartialUpdate takes in dataToUpdate (the body from a patch request) 
 * and jsToSql which comes from the models and converts camel cased names to
 * snake case to be readable by SQL, or if it's already snake case, it leaves it 
 * alone. It also sanitizes the data by using parameterized queries and auto 
 * increments them to get unique numbers for them. 
 * 
 * jsToSql: 
 *      {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        }
 * 
 * 
 * It returns an object with column names and values like:
 * 
 *      {
 *        setCols: "first_name=$1, age=$2",
 *        values: ["Aliya", 32]
 *      }
 *  
 * 
 */

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

module.exports = { sqlForPartialUpdate };
