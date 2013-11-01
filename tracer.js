exports.attach = function(loader, disableExecution, traceFilter) {
  var _link = loader.link;

  var depTree = {};
  
  var errorNames = [];
  // hack fetch to never error
  var oldFetch = loader.fetch;
  loader.fetch = function(url, callback, errback, options) {
    oldFetch.call(this, url, callback, function(err) {
      errorNames.push(options.normalized);
      callback('');
    }, options);
  }
  
  loader.link = function(source, opt) {
    var linked = _link(source, opt);
    if (!linked)
      linked = this._link(source, opt);

    if (!linked || !linked.imports)
      return linked;

    // normalize and resolve for the tree
    var imports = [];
    var referer = { name: opt.normalized, address: opt.address };
    for (var i = 0; i < linked.imports.length; i++) {
      var normalized = this.normalize(linked.imports[i], referer);
        
      if (normalized.name)
        normalized = normalized.name;
        
      // dont trace filtered dependencies
      if (traceFilter && traceFilter(normalized) === false) {
        linked.imports.splice(i--, 1);
        continue;
      }
      
      var address = this.resolve(normalized, { referer: referer });

      if (address.address)
        address = address;
        
      imports.push({
        name: normalized,
        unnormalized: linked.imports[i],
        address: address
      });
    }

    depTree[opt.normalized] = imports;

    if (disableExecution) {
      linked.execute = function() {
        return {};
      }
    }

    return linked;
  }

  loader.trace = function(names, callback, errback) {
    var multiple = names instanceof Array;
    if (!multiple)
      names = [names];

    loader.import(names, function() {
      // delete the mios from any fetch errors
      for (var i = 0; i < errorNames.length; i++)
        loader.delete(errorNames[i]);
        
      errorNames = [];
      
      var normalized = [];
      var deps = [];
      var flatDeps = [];
      for (var i = 0; i < names.length; i++) {
        normalized[i] = loader.normalize(names[i]);
        if (normalized[i].normalized)
          normalized[i] = normalized[i].normalized;
        deps[i] = depTree[normalized[i]];
        flatDeps[i] = flatten(deps[i], depTree);
      }

      if (multiple)
        callback(normalized, deps, flatDeps);
      else
        callback(normalized[0], deps[0], flatDeps[0]);
    }, errback);
  }
}

var flatten = function(deps, depTree) {
  // start with the dependency array
  var flatDeps = [].concat(deps);

  // then add the flat deps of each dependency's dependencies
  for (var i = 0; i < deps.length; i++) {
    var nextDeps = depTree[deps[i].name];
    if (nextDeps)
      flatDeps = flatDeps.concat(flatten(nextDeps, depTree));
  }

  // remove duplicates
  for (var i = 0; i < flatDeps.length; i++) {
    for (var j = i + 1; j < flatDeps.length; j++) {
      if (flatDeps[i].name == flatDeps[j].name)
        flatDeps.splice(j--, 1);
    }
  }

  return flatDeps;
}



