process.env.NODE_ENV = "test";
const request = require("supertest");
const db = require("../db");
const app = require("../app");

let testInvoice;

beforeEach(async function(){
    let result = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid)
        VALUES ('goog', 40000, false)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`
    );
    testInvoice = result.rows[0];
})

describe("GET /invoices", function(){
    test("Gets a list of 1 invoice", async function(){
        const response = await request(app).get(`/invoices`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoices: [{
                id: testInvoice.id,
                amt: testInvoice.amt,
                paid: testInvoice.paid,
                add_date: testInvoice.add_date.toISOString(),
                paid_date: testInvoice.paid_date ? testInvoice.paid_date.toISOString() : null,
                comp_code: testInvoice.comp_code
            }]
        })
    })
})

describe("GET /invoices/:id", function(){
    test("Gets a request invoice by id", async function(){
        const compQuery = await db.query(`SELECT * FROM companies WHERE code = $1`, [testInvoice.comp_code]);
        const data = compQuery.rows[0];
        const response = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoice: {
                id: testInvoice.id,
                amt: testInvoice.amt,
                paid: testInvoice.paid,
                add_date: testInvoice.add_date.toISOString(),
                paid_date: testInvoice.paid_date ? testInvoice.paid_date.toISOString() : null,
                company: {
                    code: testInvoice.comp_code,
                    name: data.name,
                    description: data.description
                }
            }
        })
    })
})

describe("POST /invoices", function(){
    test("Create a new invoice entry", async function(){
        const response = await request(app).post(`/invoices`)
            .send({
                comp_code: "goog",
                amt: "3.14"
            });
        const jsonObject = JSON.parse(response.text);
        console.log(`RESPONSE OBJ: ${JSON.stringify(response.text)}`);
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual(
            jsonObject
        );
    });
})

describe("PUT /invoices/:id", function(){
    test("Update existing invoice", async function(){
        const response = await request(app).put(`/invoices/${testInvoice.id}`)
            .send({
                amt: 6.28
            });
        const jsonObject = JSON.parse(response.text);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(jsonObject);
    });
});

describe("DELETE /invoices/:id", function(){
    test("Delete an existing invoice", async function(){
        const response = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({status: "deleted"})
    });
});

afterEach(async function(){
    await db.query("DELETE FROM invoices");
});

afterAll(async function(){
    await db.end();
});
