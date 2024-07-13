const express = require("express");
const router = new express.Router();
const db = require("../db");

router.get("/", async function(req, res, next){
    try{
        const response = await db.query(
            `SELECT i.code AS ind_code, i.industry, ci.comp_code 
             FROM industries AS i
             LEFT JOIN comp_ind AS ci ON i.code = ci.ind_code
             LEFT JOIN companies AS c ON ci.comp_code = c.code`);

            const industries = {};
            response.rows.forEach(row => {
                // Initialize the industry if not already done
                if (!industries[row.ind_code]) {
                    industries[row.ind_code] = {
                        ind_code: row.ind_code,
                        industry: row.industry,
                        companies: []
                    };
                }
                // Add company code if it exists
                if (row.comp_code) {
                    industries[row.ind_code].companies.push(row.comp_code);
                }
            });
        
        // Convert the map to an array of industry objects
        const result = Object.values(industries);

        // Send JSON response
        return res.json({ industries: result });
    }catch(e){
        return next(e);
    }
})

router.post("/", async function(req,res,next){
    try{
        const response = await db.query(
            `INSERT INTO industries (code, industry)
            VALUES ($1, $2)
            RETURNING code, industry`,
            [req.body.code, req.body.industry]
        );
        return res.status(201).json({industry: response.rows[0]});
    }catch(e){
        return next(e);
    }
})

router.post("/:ind_code", async function(req,res,next){
    try{
        const response = await db.query(
            `INSERT INTO comp_ind (comp_code, ind_code)
            VALUES ($1, $2)`, [req.body.comp_code, req.params.ind_code]
        );
        return res.status(201).json({message: `${req.body.comp_code} added to ${req.params.ind_code}`});
    }catch(e){
        return next(e);
    }
})

module.exports = router;