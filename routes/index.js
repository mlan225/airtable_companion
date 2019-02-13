var express = require('express');
var router = express.Router();
var Airtable = require('airtable');
var base = new Airtable({apiKey: 'keyPCYXRyfQfmw6yl'}).base('app9zIJGJioUnqgol');
var Record = require('../models/record');
var mongoose = require('mongoose');

// Get all airtable records
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

  // Get all database recods
  function getDbRecords(){
    return new Promise((resolve, reject) => {
      let records_array = [];

      Record.find({}, (err, records) => {
        if(err) {
          reject(err);
        }
        records.forEach(record => {
          records_array.push(record)
        });
        resolve(records_array);
      });
    })
  }

  // Update a record in the database
  function updateRecord(record_id, record_recent_activity) {
    return new Promise((resolve, reject) => {

      Record.findOneAndUpdate(record_id, {
        recent_activity: record_recent_activity
      }, {
        new: true
      }, (err, updatedRecord) => {
        if(err) {reject(err)}
        console.log('updating recent activity for: ' + updatedRecord.title)
        resolve();
      })  
    })
  }

  // Delete removed records from database
  async function deleteNonRecords() {
    let db_records = await getDbRecords();

    db_records.forEach(record => {
      if(airtable_record_titles.indexOf(record.title) < 0) {
        Record.findByIdAndDelete({"_id": record._id}, (err, deletedRecord) => {
          console.log('deleting record: ' + deletedRecord)
        })
      }
    })
  }

  // Run through records for airtable and db and compare records
  async function compareRecords(airtable_records, db_record_titles, db_record_activity) {

    let airtable_records_array = airtable_records;
    let db_record_titles_array = db_record_titles;
    let db_record_activity_array = db_record_activity;

    airtable_records_array.forEach(record => {
      
      if(db_records_titles_array.indexOf(record.title) > -1) {
        if(db_record_activity_array.indexOf(record.recent_activity) > -1) {
          console.log('no change in recent activity for: ' + record.title)
        } else {
          console.log('updating the record ' + record.title + ' with the recent activity: ' + record.recent_activity);

          // await updateRecord(record._id, record.recent_activity)
        }
      } else {
        console.log('saving new record');
      }
    });
  }

  async function getRecordUpdates() {
    const airtable_records = await getAirtableRecords();
    const db_records = await getDbRecords();

    airtable_record_titles = airtable_records.map(record => {
      return record.title
    })
  
    db_records_titles = db_records.map(record => {
      return record.title
    })

    db_record_activity = db_records.map(record => {
      return record.recent_activity
    })

    //remove records that are not in the airtable data
    deleteNonRecords();


    
    return db_records;
  }

  getRecordUpdates().then((recordsRetrieved) => {
    recordsRetrieved.forEach((record) => {
      console.log(record);
    })
    res.render('index');
  })
})

module.exports = router;
