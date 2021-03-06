"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
        `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
        `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
        `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }

  /** filter: searches database for companies that match filter parameters
   * 
   *    takes in:
   *      {
   *        "nameLike": "cat",
   *        "minEmployees": 2,
   *        "maxEmployees": 20
   *       }
   * 
   *    returns array of results:
   *    [{handle, name, description, numEmployees, logoUrl}, ...]
   * 
   */
  static async filter(filterParams) {
    const filter = Company._sqlForFilter(filterParams);

    const results = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
        FROM companies
        WHERE ${filter.whereStatement}`,
      filter.values
    );
    const companies = results.rows;

    return companies;
  }

  /** Generates statement for filtering SQL query
   * 
   * takes in:
   *      {
   *        "nameLike": "cat",
   *        "minEmployees": 2,
   *        "maxEmployees": 20
   *       }
   * 
   *    Returns: {
   *              params: "name ILIKE $1 AND numEmployees >= $2 AND numEmployees <= $3",
   *              values: ["%net%", 5, 100]
   *              }
   * 
   */
  
  static _sqlForFilter(filterParams) {
    // checks if combination of min and max employees is valid
    if (filterParams.maxEmployees && filterParams.minEmployees) {
      if (filterParams.maxEmployees < filterParams.minEmployees) {
        throw new BadRequestError("Minimum Employees must be less than Maximum Employees");
      };
    };

    // push strings and values into arrays so sanitized params are in correct order
    let params = [];
    let values = [];
  
    if ("nameLike" in filterParams) {
      params.push(`name ILIKE $${params.length + 1}`);
      values.push(`%${filterParams.nameLike}%`);
    }
  
    if ("minEmployees" in filterParams) {
      params.push(`num_employees >= $${params.length + 1}`);
      values.push(filterParams.minEmployees);
    }
  
    if ("maxEmployees" in filterParams) {
      params.push(`num_employees <= $${params.length + 1}`);
      values.push(filterParams.maxEmployees);
    }
  
    return {
      whereStatement: params.join(" AND "),
      values
    };   
  }
}


module.exports = Company;
