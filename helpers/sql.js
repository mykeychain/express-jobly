const { BadRequestError } = require("../expressError");

/**
 * sqlForPartialUpdate:
 *  - accepts body from a patch request
 *  - converts camelCase to snake_case as needed
 *  - returns parameterized query and values
 * 
 * Accepts: 
 *  dataToUpdate: {firstName: 'Aliya', age: 32}
 *  jsToSql: {firstName: "first_name"...}
 * 
 * Returns:
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
