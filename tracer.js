exports.attach = function(loader, disableExecution) {
  var _link = loader.link;

  var depTree = {};

  loader.link = function(source, opt) {
    var linked = _link(source, opt);
    if (!linked)
      linked = this._link(source, opt);

    // normalize the imports
    var imports = [].concat(linked.imports);
    var referer = { name: opt.normalized, address: opt.address };
    for (var i = 0; i < imports.length; i++) {
      imports[i] = this.normalize(imports[i], referer);
      if (imports[i].normalized)
        imports[i] = imports[i].normalized;
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
    var nextDeps = depTree[deps[i]];
    if (nextDeps)
      flatDeps = flatDeps.concat(flatten(nextDeps, depTree));
  }

  // remove duplicates
  for (var i = 0; i < flatDeps.length; i++) {
    if (flatDeps.lastIndexOf(flatDeps[i]) != i)
      flatDeps.splice(i--, 1);
  }

  return flatDeps;
}



