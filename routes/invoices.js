const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError")

const today = new Date();
const year = today.getFullYear(); // Gets the full year (e.g., 2024)
const month = today.getMonth() + 1; // getMonth() is zero-based; add 1 to get 1-12
const day = today.getDate();

router.get("/", async function(req,res,next){
    try{
        const invQuery = await db.query("SELECT * FROM invoices");
        return res.json({invoices: invQuery.rows});
    }catch(e){
        return next(e);
    }
});

router.get("/:id", async function(req,res,next){
    try{
        const invQuery = await db.query(
            `SELECT * FROM invoices AS i INNER JOIN companies as c ON (i.comp_code = c.code)
            WHERE id=$1`,
            [req.params.id]);

        if (invQuery.rows.length === 0){
            throw new ExpressError(`There is no invoice with the id: ${req.params.id}`,404);
        }
        const data = invQuery.rows[0];
        const invoice = {
            id: data.id,
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description
            }
        }
        return res.json({invoice: invoice});
    }catch(e){
        return next(e);
    }
});

router.post("/", async function(req,res,next){
    try{
        if ("id" in req.body) {
            throw new ExpressError("Not Allowed", 400)
        }
        const invQuery = await db.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id,comp_code, amt, paid, add_date, paid_date`,
            [req.body.comp_code, req.body.amt]
        )
        return res.status(201).json({invoice: invQuery.rows[0]});
    }catch(e){
        next(e);
    }
})

router.put("/:id", async function(req,res,next){
    try{
        if (Object.keys(req.body).length ===2 && Object.keys(req.body) === 'amt','paid'){
            let paidDate;
            const invoice = await db.query(
                `SELECT * FROM invoices WHERE id = $1`,
                [req.params.id]
            );
            const invoiceData = invoice.rows[0];
            if (invoiceData.paid === false && req.body.paid === 't'){
                paidDate = `,paid_date = '${year}-${month}-${day}'`;
            }else if (invoiceData.paid === true && req.body.paid === 'f'){
                paidDate = `,paid_date = NULL`;
            }else{
                paidDate = '';
            }
            console.log(`paid date string: ${paidDate}`);
            console.log(`invoiceData.paid: ${invoiceData.paid}`);
            console.log(`req.body.paid: ${req.body.paid}`);
            const result = await db.query(
                `UPDATE invoices
                SET amt = $1
                ,paid = $2
                ${paidDate}
                WHERE id = $3
                RETURNING id, comp_code, amt, paid, add_date, paid_date`,
                [req.body.amt, req.body.paid, req.params.id]
            );
            if (result.rows.length === 0){
                throw new ExpressError(`There is no invoice with the id: ${req.params.id}`,404);
            }
            return res.json({invoice: result.rows[0]});
        }else{
            throw new ExpressError("Not Allowed", 400);
        }
    }catch(e){
        next(e);
    }
})

router.delete("/:id", async function(req, res, next){
    try{
        const check_result = await db.query(
            `SELECT * FROM invoices
            WHERE id = $1`,
            [req.params.id]
        )
        if (check_result.rows.length === 0){
            throw new ExpressError(`There is no invoice with id: ${req.params.id}`);
        }
        const result = await db.query(
            `DELETE FROM invoices
            WHERE id = $1`,
            [req.params.id]
        );

        res.json({status: "deleted"})
    }catch(e){
        next(e);
    }
})

module.exports = router;