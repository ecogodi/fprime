./node_modules/.bin/jscoverage lib test/cov/lib
./node_modules/.bin/jscoverage fprime.js test/cov/fprime.js
env TESTMODE=COVERAGE ./node_modules/.bin/mocha -R html-cov > test/cov/coverage_report.html