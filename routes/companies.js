const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError")

router.get("/", async function(req,res,next){
    try{
        const compQuery = await db.query("SELECT * FROM companies");
        return res.json({companies: compQuery.rows});
    }catch(e){
        return next(e);
    }
});

router.get("/:code", async function(req,res,next){
    try{
        const compQuery = await db.query(
            `SELECT * FROM companies AS c LEFT JOIN invoices AS i ON c.code = i.comp_code
            WHERE code = $1`, 
            [req.params.code]);
        const compdata = compQuery.rows[0];
        const invData = compQuery.rows;
        const result = {
            code: compdata.code,
            name: compdata.name,
            description: compdata.description,
            invoices: invData.map(row => ({
                id: row.id,
                amt: row.amt,
                paid: row.paid,
                add_date: row.add_date,
                paid_date: row.paid_date
            }))
        }
        if (compQuery.rows.length === 0){
            let notFoundError = new Error(`There is no company with the code: ${req.params.code}`);
            notFoundError.status = 404;
            throw notFoundError;
        }

        return res.json({company: result});
    }catch(e){
        return next(e);
    }
});

router.post("/", async function(req, res, next){
    try{
        const result = await db.query(
            `INSERT INTO companies (code, name, description)
                VALUES ($1, $2, $3)
                RETURNING code, name, description`,
            [req.body.code, req.body.name, req.body.description]);
        return res.status(201).json({company: result.rows[0]});
    }catch(e){
        next(e);
    }
});

router.put("/:code", async function(req, res, next){
    try{
        if ("code" in req.body) {
            throw new ExpressError("Not Allowed", 400)
        }
        const result = await db.query(
            `UPDATE companies
                SET name = $1, description = $2
                WHERE code = $3
                RETURNING code, name, description`,
            [req.body.name, req.body.description, req.params.code]);

            if (result.rows.length === 0){
                throw new ExpressError(`There is no company with code: ${req.params.code}`,404);
            }
            return res.json({company: result.rows[0]});
    }catch(e){
        next(e);
    }
});

router.delete("/:code", async function(req,res,next){
    try{
        const result = await db.query(
            `DELETE FROM companies
            WHERE code = $1`,
            [req.params.code]
        );
        return res.json({message: "Company deleted"});
    }catch(e){
        next(e);
    }
})

module.exports = router;