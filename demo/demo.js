var System = require('es6-module-loader').System;

console.log('Attach tracing functionality to the System loader. \n');
require('../tracer').attach(System, true);

console.log('Tracing dependencies for the demo file demo/test-file');
System.trace('demo/test-file', function(normalized, deps, flatDeps) {
  console.log('Normalized name: ' + normalized);
  console.log('Dependencies: ');
  console.log(deps);
  console.log('Flat dependencies:');
  console.log(flatDeps);
});

