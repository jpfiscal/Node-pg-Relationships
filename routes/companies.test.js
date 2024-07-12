process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function() {
    let result = await db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ('goog', 'Google', 'Our overseers')
        RETURNING code, name, description`);
    testCompany = result.rows[0];
})

describe("GET /companies", function(){
    test("Gets a list of 1 company", async function(){
        const response = await request(app).get(`/companies`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            companies: [testCompany]
        });
    });
});

describe("GET /companies/:code", function(){
    test("Gets a single company", async function(){
        testResult = {
            code: testCompany.code,
            name: testCompany.name,
            description: testCompany.description,
            invoices: [
                {
                    "id": null,
                    "amt": null,
                    "paid": null,
                    "add_date": null,
                    "paid_date": null
                }
            ]
        };
        const response = await request(app)
            .get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: testResult
        });
    });
});

describe("POST /companies", function(){
    test("Creates a company", async function(){
        const addCompany = {
            code: "amz",
            name: "Amazon",
            description: "Worlds largest slave drivers"
        };
        const response = await request(app).post(`/companies`)
            .send({
                code: "amz",
                name: "Amazon",
                description: "Worlds largest slave drivers"
            });
            expect(response.statusCode).toEqual(201);
            expect(response.body).toEqual({
                company: addCompany
            });
    });
});

describe("PUT /companies/:code", function(){
    test("Update a company", async function(){
        const response = await request(app)
            .put(`/companies/${testCompany.code}`)
            .send({
                name: "Google.com",
                description: "the search company"
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {code: "goog", name: "Google.com", description: "the search company"}
        });
    });
});

describe("DELETE /companies/:code", function(){
    test("Delete a company", async function(){
        const response = await request(app).delete(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({message: "Company deleted"})
    });
});

afterEach(async function() {
    await db.query("DELETE FROM companies");
})

afterAll(async function(){
    await db.end();
})