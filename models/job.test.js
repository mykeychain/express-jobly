"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "j3",
    salary: 3,
    equity: 0.3,
    companyHandle: "c3",
  };

  test("works", async function () {
    const resp = await Job.create(newJob);
    let {id, ...job} = resp;
    expect(job).toEqual({
      title: "j3",
      salary: 3,
      equity: "0.3",
      companyHandle: "c3",
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [id]);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.3",
        company_handle: "c3",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2,
        equity: "0.2",
        companyHandle: "c2"
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const testJob = await db.query(`
                            SELECT id 
                            FROM jobs 
                            WHERE title='j1'`
                            );

    let job = await Job.get(testJob.rows[0].id);
    expect(job).toEqual({
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0.1",
        company: {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** filter */
// describe("filter", function() {
//   test("works", async function () {
//     let filterParams = {
//       nameLike: "c",
//       minEmployees: 1,
//       maxEmployees: 1
//     };

//     let companies = await Company.filter(filterParams);

//     expect(companies).toEqual([{
//       handle: "c1",
//       name: "C1",
//       description: "Desc1",
//       numEmployees: 1,
//       logoUrl: "http://c1.img",
//     }]);
//   })


//   test("works with only some parameters", async function() {
//     let filterParams = {
//       maxEmployees: 1
//     };

//     let companies = await Company.filter(filterParams);

//     expect(companies).toEqual([{
//       handle: "c1",
//       name: "C1",
//       description: "Desc1",
//       numEmployees: 1,
//       logoUrl: "http://c1.img",
//     }]);
//   })


//   test("bad request error if maxEmployees < minEmployees", async function() {
//     let filterParams = {
//       nameLike: "c",
//       minEmployees: 10,
//       maxEmployees: 1
//     };

//     try {
//       await Company.filter(filterParams);
//       fail();
//     } catch (err) {
//       console.log(err);
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   })


// })

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 10,
    equity: 1.0,
  };

  test("works", async function () {
    const id = 1;
    let job = await Job.update(id, updateData);
    expect(job).toEqual({
      id: 1,
      title: "New",
      salary: 10,
      equity: "1.0",
      company_handle: "c1"
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
          FROM jobs
          WHERE id = $1`, [id]);
    expect(result.rows).toEqual([
      {
        id: 1,
        title: "New",
        salary: 10,
        equity: "1.0",
        company_handle: "c1",
      },
    ]);
  });

  // test("works: null fields", async function () {
  //   const updateNullData = {
  //     title: "New",
  //     salary: null,
  //     equity: null,
  //   };
  //   const id = 1;
  //   let job = await Job.update(id, updateData);
  //   expect(job).toEqual({
  //     id: 1,
  //     title: "New",
  //     salary: null,
  //     equity: null,
  //     company_handle: "c1"
  //   });

  //   const result = await db.query(
  //         `SELECT handle, name, description, num_employees, logo_url
  //          FROM companies
  //          WHERE handle = 'c1'`);
  //   expect(result.rows).toEqual([{
  //     handle: "c1",
  //     name: "New",
  //     description: "New Description",
  //     num_employees: null,
  //     logo_url: null,
  //   }]);
  // });

  test("not found if no such job", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
        "SELECT id FROM job WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
