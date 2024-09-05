const Benchmark = require('benchmark');
const fs = require('fs');
const path = require('path');
const { parse: csvParse } = require('csv-parse');
const csvParser = require('csv-parser');
const Papa = require('papaparse');
const fastCsv = require('fast-csv');

// Sample CSV file path
const csvFilePath = path.join(__dirname, '../assets/sample-1000k.csv');

// Load sample CSV data
const csvData = fs.readFileSync(csvFilePath, 'utf8');

// Create a Benchmark Suite
const suite = new Benchmark.Suite();

// Define benchmarks for each CSV parser

suite
  .add('csv-parser', {
    defer: true,
    fn: async (deferred) => {
      const results = [];
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => deferred.resolve());
    }
  })
  .add('fast-csv', {
    defer: true,
    fn: async (deferred) => {
      const results = [];
      fs.createReadStream(csvFilePath)
        .pipe(fastCsv.parse({ headers: true }))
        .on('data', (data) => results.push(data))
        .on('end', () => deferred.resolve());
    }
  })
  .add('papaparse', {
    defer: true,
    fn: async (deferred) => {
      Papa.parse(csvData, {
        header: true,
        complete: () => deferred.resolve()
      });
    }
  })
  .add('csv-parse', {
    defer: true,
    fn: async (deferred) => {
      const results = [];
      fs.createReadStream(csvFilePath)
        .pipe(csvParse({ columns: true }))
        .on('data', (data) => results.push(data))
        .on('end', () => deferred.resolve());
    }
  })
  .on('cycle', (event) => {
    const name = event.target.name;
    const opsPerSec = event.target.hz;
    const ms = 1000 / opsPerSec; // Convert ops/sec to ms per operation
    console.log(`${name}: ${ms.toFixed(2)} ms (${opsPerSec.toFixed(2)} ops/sec)`);
  })
  .on('complete', function() {
    const fastest = this.filter('fastest')[0];
    console.log('Fastest is ' + fastest.name);
  })
  .run({ async: true });
