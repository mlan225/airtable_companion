var express = require('express');
var router = express.Router();
var Airtable = require('airtable');
var base = new Airtable({apiKey: 'keyPCYXRyfQfmw6yl'}).base('app9zIJGJioUnqgol');
var Record = require('../models/record');
var mongoose = require('mongoose');

/* GET all records */
router.get('/', function(req, res, next) {
  // return all the airtable records
  let airtable_get = () => {
    let promise = new Promise((resolve, reject) => {

      let records_array = [];
    
      base('test_records').select({
        // Selecting the first 3 records in Grid view:
        maxRecords: 3,
        view: "Grid view"
      }).eachPage(function page(records, fetchNextPage) {
          // This function (`page`) will get called for each page of records.
    
          records.forEach(function(record) {
              let record_object = {
                title: record.get('Name'),
                recent_activity: record.get('Recent Activity'),
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
    return promise;
  }

  //Find all record objects in database and return as array
  let database_get = () => {
    let records_array = [];

    let promise = new Promise((resolve, reject) => {
      Record.find({},'title recent_activity' ,(err, records) => {
        if(err) {
          reject(err);
        }
        records.forEach(record => {
          records_array.push(record)
        });
        resolve(records_array);
      });
    })

    return promise;
  }

  async function compare_records() {
    let airtable_records = await airtable_get();
    let db_records = await database_get();

    airtable_record_titles = airtable_records.map(record => {
      return record.title
    })
  
    db_records_titles = db_records.map(record => {
      return record.title
    })

    db_record_activity = db_records.map(record => {
      return record.recent_activity
    })

    //purge deleted airtable records from db
    db_records.forEach(record => {
      // console.log(record.title + " ---> " + airtable_record_titles.indexOf(record.title))
      if(airtable_record_titles.indexOf(record.title) < 0) {
        Record.findByIdAndDelete({"_id": record._id}, (err, deletedRecord) => {
          console.log('deleting record: ' + deletedRecord)
        })
      }
    })

    airtable_records.forEach(record => {
      console.log('Current record = ' + record.title)
      if(db_records_titles.indexOf(record.title) > -1) {
        if(db_record_activity.indexOf(record.recent_activity) > -1) {
          console.log('no change in recent activity for: ' + record.title)
        } else {
          console.log('updating the record ' + record.title + ' with the recent activity: ' + record.recent_activity);

          Record.findOneAndUpdate(record._id, {
            recent_activity: record.recent_activity
          }, {
            new: true
          }, (err, updatedRecord) => {
            console.log('updating recent activity for: ' + updatedRecord.title)
          })          
        }
      } else {
        Record.create({
          title: record.title,
          recent_activity: record.recent_activity
        }, (err, record) => {
          console.log('saving new record: ' + record)
        })
      }
    });
  }


  compare_records().then((updatedRecords) => {
    res.render('index', {title: 'home'});
  })
})


//save new pre written record (for testing) 
router.get('/save', function(req, res, next) {
  Record.create({
    title: 'Test Record 2',
    recent_activity: 'This is the first test record'
  }, (err, record) => {
    console.log('saving new record: ' + record)
    
  })
})

// router.get('/delete', function(req, res, next) {
//   let record_id = '5c3577edcfd14207d924e6c3';

//   Record.findByIdAndDelete({"_id": record_id}, (err, record) => {
//     console.log('deleting record: ' + record)
    
//   })
// })

module.exports = router;
