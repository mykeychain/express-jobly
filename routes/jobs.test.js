"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "j3",
    salary: 3,
    equity: 0.3,
    companyHandle: "c3",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
        job: {id: expect.any(Number),
            title: "j3",
            salary: 3,
            equity: "0.3",
            companyHandle: "c3",}
      });
  });

  test("fails for non-admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 10
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          title: "j3",
          salary: "invalid-salary"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
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
            },
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });


//   test ("works with filter by query string", async function() {
//     const resp = await request(app).get(`/companies?nameLike=c1`);
//     expect(resp.body).toEqual({companies: [{
//       handle: "c1",
//       name: "C1",
//       description: "Desc1",
//       numEmployees: 1,
//       logoUrl: "http://c1.img",
//     }]});
//   });

//   test("bad request if invalid input in query string", async function() {
//     const resp = await request(app).get(`/companies?minEmployees=invalid&maxEmployees=invalid`);
//     expect(resp.statusCode).toEqual(400);
//   })

//   test("no company matches; returns no companies found", async function() {
//     const resp = await request(app).get(`/companies?nameLike=no-company-name`);
//     expect(resp.body).toEqual({message: "No companies found"});
//   })
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const idResp = await request(app).get(`/jobs`);
    const id = idResp.body.jobs[0].id;

    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0.1",
        company: {
            handle: "c1",
            name: "C1",
            numEmployees: 1,
            description: "Desc1",
            logoUrl: "http://c1.img",
        },
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/job/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const idResp = await request(app).get(`/jobs`);
    const id = idResp.body.jobs[0].id;

    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "j1-new",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1"
      },
    });
  });

  test("fails for non-admins", async function () {
    const idResp = await request(app).get(`/jobs`);
    const id = idResp.body.jobs[0].id;

    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const idResp = await request(app).get(`/jobs`);
    const id = idResp.body.jobs[0].id;

    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "j1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const idResp = await request(app).get(`/jobs`);
    const id = idResp.body.jobs[0].id;

    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          id: 0,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const idResp = await request(app).get(`/jobs`);
    const id = idResp.body.jobs[0].id;

    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          salary: "not-a-number",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const idResp = await request(app).get(`/jobs`);
    const id = idResp.body.jobs[0].id;

    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${id}`});
  });

  test("fails for non-admins", async function () {
    const idResp = await request(app).get(`/jobs`);
    const id = idResp.body.jobs[0].id;

    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const idResp = await request(app).get(`/jobs`);
    const id = idResp.body.jobs[0].id;

    const resp = await request(app)
        .delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });
  
  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/job/0`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
