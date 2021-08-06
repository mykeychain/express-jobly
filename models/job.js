"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

// get all, get by id, update, delete

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
      `INSERT INTO jobs(
            title,
            salary,
            equity,
            company_handle)
             VALUES
               ($1, $2, $3, $4)
             RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        companyHandle,
      ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsResp = await db.query(
      `SELECT id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"
        FROM jobs
        ORDER BY id`);
    return jobsResp.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, {company} }
   *  where company is:
   *      { handle, name, description, numEmployees, logoUrl }
   *   
   * Throws NotFoundError if not found.
   **/

  static async get(jobId) {
    const jobRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
            FROM jobs
                JOIN companies
                ON company_handle = companies.handle
            WHERE id = $1`,
      [jobId]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${jobId}`);

    const { id, title, salary, equity, ...company } = job;

    return { id, title, salary, equity, company };

  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns  { id, title, salary, equity (as a string), companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

  /** filter: searches database for jobs that match filter parameters
   * 
   *    takes in:
   *      {
   *        "titleLike": "cat",
   *        "minSalary": 2,
   *        "hasEquity": true
   *       }
   * 
   *    returns array of results:
   *    [{id, title, salary, equity, companyHandle}, ...]
   * 
   */
   static async filter(filterParams) {
    const filter = Job._sqlForFilter(filterParams);

    const results = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
        FROM jobs
        WHERE ${filter.whereStatement}
        ORDER BY id`,
      filter.values
    );
    const jobs = results.rows;

    return jobs;
  }


  /** Generates statement for filtering SQL query
   * 
   * takes in:
   *      {
   *        "titleLike": "cat",
   *        "minSalary": 2,
   *        "hasEquity": true
   *       }
   * 
   *    Returns: {
   *              params: "title ILIKE $1 AND salary >= $2 AND equity > 0",
   *              values: ["%cat%", 2]
   *              }
   * 
   */

   static _sqlForFilter(filterParams) {
   
    // push strings and values into arrays so sanitized params are in correct order
    let params = [];
    let values = [];
  
    if ("titleLike" in filterParams) {
      params.push(`title ILIKE $${params.length + 1}`);
      values.push(`%${filterParams.titleLike}%`);
    }
  
    if ("minSalary" in filterParams) {
      params.push(`salary >= $${params.length + 1}`);
      values.push(filterParams.minSalary);
    }
  
    if ("hasEquity" in filterParams && filterParams.hasEquity) {
      params.push(`equity > 0`);
    }
    
    if (params.length === 0) throw new BadRequestError("No search valid search parameters")

    return {
      whereStatement: params.join(" AND "),
      values
    };   
  }

}




module.exports = Job;