var express = require('express');
var router = express.Router();
var Airtable = require('airtable');
var base = new Airtable({apiKey: 'keyPCYXRyfQfmw6yl'}).base('app9zIJGJioUnqgol');
var Record = require('../models/record');
var mongoose = require('mongoose');

/* GET all records */
router.get('/', function(req, res, next) {
  function getAirtableRecords() {

    return new Promise((resolve, reject) => {
      let records_array = [];

      base('test_records').select({
        // Selecting the first 3 records in Grid view:
        maxRecords: 3,
        view: "Grid view"
        }).eachPage(function page(records, fetchNextPage) {
            // This function (`page`) will get called for each page of records.
        
            records.forEach(function(record) {
                // console.log('Retrieved', record.get('Name'));

                let record_object = {
                  title: record.get('Name'),
                }

                records_array.push(record_object);
            });
        
            // To fetch the next page of records, call `fetchNextPage`.
            // If there are more records, `page` will get called again.
            // If there are no more records, `done` will get called.
            fetchNextPage();
        
        }, function done(err) {
            if (err) { console.error(err); return; }
            resolve(records_array);
        });  
    })
  }

  async function compareRecords() {
    const airtable_records = await getAirtableRecords();
    
    return airtable_records;
  }

  compareRecords().then((recordsRetrieved) => {
    recordsRetrieved.forEach((record) => {
      console.log(record);
    })
    res.render('index');
  })
})

module.exports = router;
