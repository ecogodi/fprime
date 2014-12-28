
// instrument by jscoverage, do not modifly this file
(function (file, lines, conds, source) {
  var BASE;
  if (typeof global === 'object') {
    BASE = global;
  } else if (typeof window === 'object') {
    BASE = window;
  } else {
    throw new Error('[jscoverage] unknow ENV!');
  }
  if (BASE._$jscoverage) {
    BASE._$jscmd(file, 'init', lines, conds, source);
    return;
  }
  var cov = {};
  /**
   * jsc(file, 'init', lines, condtions)
   * jsc(file, 'line', lineNum)
   * jsc(file, 'cond', lineNum, expr, start, offset)
   */
  function jscmd(file, type, line, express, start, offset) {
    var storage;
    switch (type) {
      case 'init':
        if(cov[file]){
          storage = cov[file];
        } else {
          storage = [];
          for (var i = 0; i < line.length; i ++) {
            storage[line[i]] = 0;
          }
          var condition = express;
          var source = start;
          storage.condition = condition;
          storage.source = source;
        }
        cov[file] = storage;
        break;
      case 'line':
        storage = cov[file];
        storage[line] ++;
        break;
      case 'cond':
        storage = cov[file];
        storage.condition[line] ++;
        return express;
    }
  }

  BASE._$jscoverage = cov;
  BASE._$jscmd = jscmd;
  jscmd(file, 'init', lines, conds, source);
})('fprime.js', [1,2,11,31,51,63,74,84,112,135,154,171,188,189,207,219,231,12,13,14,25,21,22,32,33,34,45,41,42,56,64,65,68,70,75,76,77,80,85,97,103,108,86,90,98,104,105,113,125,131,114,118,126,136,137,145,155,156,157,160,172,173,176,203,194,197,200,215,212,213,227,224,225,234], {"16_11_4":0,"18_16_20":0,"20_19_6":0,"36_11_5":0,"38_16_21":0,"40_19_7":0,"52_11_3":0,"54_11_5":0,"79_49_18":0,"79_70_1":0,"88_15_12":0,"116_15_12":0,"140_15_13":0,"140_15_8":0,"140_27_1":0,"142_23_26":0,"143_27_23":0,"161_19_38":0,"163_24_28":0,"165_19_1":0,"177_19_38":0,"179_24_28":0,"181_19_1":0,"193_15_21":0,"196_19_13":0,"199_24_14":0,"211_15_24":0,"223_15_26":0,"233_8_37":0}, ["(function(){","    var F = require('./lib/f.js');","","    // You're strongly encouraged to mix and match: pick the helpers you really need and add your own","","","    // ----------------------------------------------","    // Steps","    // ----------------------------------------------","","    F.onErrorExit = function(){","        var args = Array.prototype.slice.call(arguments);","        var err = args.shift();","        var next = args.pop();","","        if(!err)","            next.apply(this,args);","        else if(err instanceof Array){","            for(var i in err){","                if(err[i]){","                    this.F.exit(err);","                    return;","                }","            }","            next.apply(this,args);","        }","        else","            this.F.exit(err);","    };","","    F.onResultExit = function(){","        var args = Array.prototype.slice.call(arguments);","        var err = args.shift();","        var next = args.pop();","","        if(!args)","            next();","        else if(args instanceof Array){","            for(var i in args){","                if(args[i]){","                    this.F.exit.apply(this,[err].concat(args));","                    return;","                }","            }","            next.apply(this,args);","        }","        else","            this.F.exit.apply(this,[err].concat(args));","    };","","    F.ifFalseExit = function(err,bool,next){","        if(err)","            return this.F.exit(err);","        if(!bool)","            return this.F.exit(null,this);","        next();","    }","","    // ----------------------------------------------","    // Generators","    // ----------------------------------------------","","    F.set = function(ob){","        var s = ob;","        return function(){","            for(var p in s)","                this[p] = s[p];","            var args = Array.prototype.slice.call(arguments),","                next = args.pop();","            next.apply(this, args);","        };","    }","","    F.result = function(res){","        var r = res;","        return function(){","            var args = Array.prototype.slice.call(arguments),","                next = args.pop(),","                value = typeof r == 'function' ? r.apply(this,args) : r;","            next(null,value);","        }","    }","","    F.while = function(check, f){","        var saveInput = function(){","            var args = Array.prototype.slice.call(arguments),","                next = args.pop();","            if(!this._input)","                this._input = args;","            next.apply(this, this._input);","        }","        // user-provided check function","        // check(input,next) -> (err,bool,next)","        // ","        // F.ifFalseExit","        // ","        var retrieveInput = function(next){","            next.apply(this, this._input);","        }","        // user-provided looped function","        // f(input,next) -> (err,next)","        // ","        var loop = function(err,next){","            this.F.rewind();","            next();","        }","","        return F(saveInput,check,F.ifFalseExit,retrieveInput,f,loop).bind(this);","    };","","","    F.if = function(check, f){","        var saveInput = function(){","            var args = Array.prototype.slice.call(arguments),","                next = args.pop();","            if(!this._input)","                this._input = args;","            next.apply(this, this._input);","        }","        // user-provided check function","        // check(input,next) -> (err,bool,next)","        // ","        // F.ifFalseExit","        // ","        var retrieveInput = function(next){","            next.apply(this, this._input);","        }","        // user-provided function","        // f(input,next) -> (err,next)","        // ","        return F(saveInput,check,F.ifFalseExit,retrieveInput,f).bind(this);","    };","","","    F.map = function(f){","        return function(){","            var args = Array.prototype.slice.call(arguments),","                next = args.pop(),","                iterable = args.shift();","            if(iterable && f){","                for(var i in iterable){","                    if(iterable.hasOwnProperty(i)){","                        if(typeof f !== 'function')","                            f = F(f);","                        f.bind(this)( iterable[i], next.push(''+i) );","                    }","                }","            }","            else","                next();","        }","    }","","    F.parallelArgs = function(){","        var parallelSteps = Array.prototype.slice.call(arguments);","        return function(){","            var args = Array.prototype.slice.call(arguments),","                next = args.pop();","            for(var p in parallelSteps){","                var f;","                if(typeof parallelSteps[p] === 'function')","                    f = parallelSteps[p];","                else if(parallelSteps[p]!==undefined)","                    f = F(parallelSteps[p]);","                if(f)","                    f.bind(this)( args[p], next.push() );","            }","        };","    }","","    F.parallel = function(parallelSteps){","        return function(){","            var args = Array.prototype.slice.call(arguments),","                next = args.pop();","            for(var p in parallelSteps){","                var f;","                if(typeof parallelSteps[p] === 'function')","                    f = parallelSteps[p];","                else if(parallelSteps[p]!==undefined)","                    f = F(parallelSteps[p]);","                if(f)","                    f.apply( this, args.concat(next.push(p)) );","            }","        };","    }","","    // a few short notations for common operators, added as augmentation:","    var shorthands = [];","    shorthands.push({","        name: 'shorthand_array',","        type: 'stepFilter',","        f: function(step){","            if(step instanceof Array){","                var stepArray = step;","","                if(step.length>1){","                    step = F.parallelArgs.apply(this, stepArray);","                }","                else if(step.length==1){","                    step = F.map(stepArray[0]);","                }","            }","            return step;","        },","        options: {order: 10}","    });","    shorthands.push({","        name: 'shorthand_object',","        type: 'stepFilter',","        f: function(step){","            if(typeof step === 'object'){","                var stepMap = step;","                step = F.parallel(stepMap);","            }","            return step;","        },","        options: {order: 20}","    });","    shorthands.push({","        name: 'shorthand_value',","        type: 'stepFilter',","        f: function(step){","            if(typeof step !== 'function'){","                var value = step;","                step = F.result(value);","            }","            return step;","        },","        options: {order: 99}","    });","    F.augment(shorthands);","","    if (typeof module.exports !== \"undefined\") {","        module.exports = F;","    }","    ","})();"]);
_$jscmd("fprime.js", "line", 1);

(function() {
    _$jscmd("fprime.js", "line", 2);
    var F = require("./lib/f.js");
    _$jscmd("fprime.js", "line", 11);
    // You're strongly encouraged to mix and match: pick the helpers you really need and add your own
    // ----------------------------------------------
    // Steps
    // ----------------------------------------------
    F.onErrorExit = function() {
        _$jscmd("fprime.js", "line", 12);
        var args = Array.prototype.slice.call(arguments);
        _$jscmd("fprime.js", "line", 13);
        var err = args.shift();
        _$jscmd("fprime.js", "line", 14);
        var next = args.pop();
        if (_$jscmd("fprime.js", "cond", "16_11_4", !err)) next.apply(this, args); else if (_$jscmd("fprime.js", "cond", "18_16_20", err instanceof Array)) {
            for (var i in err) {
                if (_$jscmd("fprime.js", "cond", "20_19_6", err[i])) {
                    _$jscmd("fprime.js", "line", 21);
                    this.F.exit(err);
                    _$jscmd("fprime.js", "line", 22);
                    return;
                }
            }
            _$jscmd("fprime.js", "line", 25);
            next.apply(this, args);
        } else this.F.exit(err);
    };
    _$jscmd("fprime.js", "line", 31);
    F.onResultExit = function() {
        _$jscmd("fprime.js", "line", 32);
        var args = Array.prototype.slice.call(arguments);
        _$jscmd("fprime.js", "line", 33);
        var err = args.shift();
        _$jscmd("fprime.js", "line", 34);
        var next = args.pop();
        if (_$jscmd("fprime.js", "cond", "36_11_5", !args)) next(); else if (_$jscmd("fprime.js", "cond", "38_16_21", args instanceof Array)) {
            for (var i in args) {
                if (_$jscmd("fprime.js", "cond", "40_19_7", args[i])) {
                    _$jscmd("fprime.js", "line", 41);
                    this.F.exit.apply(this, [ err ].concat(args));
                    _$jscmd("fprime.js", "line", 42);
                    return;
                }
            }
            _$jscmd("fprime.js", "line", 45);
            next.apply(this, args);
        } else this.F.exit.apply(this, [ err ].concat(args));
    };
    _$jscmd("fprime.js", "line", 51);
    F.ifFalseExit = function(err, bool, next) {
        if (_$jscmd("fprime.js", "cond", "52_11_3", err)) return this.F.exit(err);
        if (_$jscmd("fprime.js", "cond", "54_11_5", !bool)) return this.F.exit(null, this);
        _$jscmd("fprime.js", "line", 56);
        next();
    };
    _$jscmd("fprime.js", "line", 63);
    // ----------------------------------------------
    // Generators
    // ----------------------------------------------
    F.set = function(ob) {
        _$jscmd("fprime.js", "line", 64);
        var s = ob;
        _$jscmd("fprime.js", "line", 65);
        return function() {
            for (var p in s) this[p] = s[p];
            _$jscmd("fprime.js", "line", 68);
            var args = Array.prototype.slice.call(arguments), next = args.pop();
            _$jscmd("fprime.js", "line", 70);
            next.apply(this, args);
        };
    };
    _$jscmd("fprime.js", "line", 74);
    F.result = function(res) {
        _$jscmd("fprime.js", "line", 75);
        var r = res;
        _$jscmd("fprime.js", "line", 76);
        return function() {
            _$jscmd("fprime.js", "line", 77);
            var args = Array.prototype.slice.call(arguments), next = args.pop(), value = typeof r == "function" ? _$jscmd("fprime.js", "cond", "79_49_18", r.apply(this, args)) : _$jscmd("fprime.js", "cond", "79_70_1", r);
            _$jscmd("fprime.js", "line", 80);
            next(null, value);
        };
    };
    _$jscmd("fprime.js", "line", 84);
    F.while = function(check, f) {
        _$jscmd("fprime.js", "line", 85);
        var saveInput = function() {
            _$jscmd("fprime.js", "line", 86);
            var args = Array.prototype.slice.call(arguments), next = args.pop();
            if (_$jscmd("fprime.js", "cond", "88_15_12", !this._input)) this._input = args;
            _$jscmd("fprime.js", "line", 90);
            next.apply(this, this._input);
        };
        _$jscmd("fprime.js", "line", 97);
        // user-provided check function
        // check(input,next) -> (err,bool,next)
        // 
        // F.ifFalseExit
        // 
        var retrieveInput = function(next) {
            _$jscmd("fprime.js", "line", 98);
            next.apply(this, this._input);
        };
        _$jscmd("fprime.js", "line", 103);
        // user-provided looped function
        // f(input,next) -> (err,next)
        // 
        var loop = function(err, next) {
            _$jscmd("fprime.js", "line", 104);
            this.F.rewind();
            _$jscmd("fprime.js", "line", 105);
            next();
        };
        _$jscmd("fprime.js", "line", 108);
        return F(saveInput, check, F.ifFalseExit, retrieveInput, f, loop).bind(this);
    };
    _$jscmd("fprime.js", "line", 112);
    F.if = function(check, f) {
        _$jscmd("fprime.js", "line", 113);
        var saveInput = function() {
            _$jscmd("fprime.js", "line", 114);
            var args = Array.prototype.slice.call(arguments), next = args.pop();
            if (_$jscmd("fprime.js", "cond", "116_15_12", !this._input)) this._input = args;
            _$jscmd("fprime.js", "line", 118);
            next.apply(this, this._input);
        };
        _$jscmd("fprime.js", "line", 125);
        // user-provided check function
        // check(input,next) -> (err,bool,next)
        // 
        // F.ifFalseExit
        // 
        var retrieveInput = function(next) {
            _$jscmd("fprime.js", "line", 126);
            next.apply(this, this._input);
        };
        _$jscmd("fprime.js", "line", 131);
        // user-provided function
        // f(input,next) -> (err,next)
        // 
        return F(saveInput, check, F.ifFalseExit, retrieveInput, f).bind(this);
    };
    _$jscmd("fprime.js", "line", 135);
    F.map = function(f) {
        _$jscmd("fprime.js", "line", 136);
        return function() {
            _$jscmd("fprime.js", "line", 137);
            var args = Array.prototype.slice.call(arguments), next = args.pop(), iterable = args.shift();
            if (_$jscmd("fprime.js", "cond", "140_15_13", _$jscmd("fprime.js", "cond", "140_15_8", iterable) && _$jscmd("fprime.js", "cond", "140_27_1", f))) {
                for (var i in iterable) {
                    if (_$jscmd("fprime.js", "cond", "142_23_26", iterable.hasOwnProperty(i))) {
                        if (_$jscmd("fprime.js", "cond", "143_27_23", typeof f !== "function")) f = F(f);
                        _$jscmd("fprime.js", "line", 145);
                        f.bind(this)(iterable[i], next.push("" + i));
                    }
                }
            } else next();
        };
    };
    _$jscmd("fprime.js", "line", 154);
    F.parallelArgs = function() {
        _$jscmd("fprime.js", "line", 155);
        var parallelSteps = Array.prototype.slice.call(arguments);
        _$jscmd("fprime.js", "line", 156);
        return function() {
            _$jscmd("fprime.js", "line", 157);
            var args = Array.prototype.slice.call(arguments), next = args.pop();
            for (var p in parallelSteps) {
                _$jscmd("fprime.js", "line", 160);
                var f;
                if (_$jscmd("fprime.js", "cond", "161_19_38", typeof parallelSteps[p] === "function")) f = parallelSteps[p]; else if (_$jscmd("fprime.js", "cond", "163_24_28", parallelSteps[p] !== undefined)) f = F(parallelSteps[p]);
                if (_$jscmd("fprime.js", "cond", "165_19_1", f)) f.bind(this)(args[p], next.push());
            }
        };
    };
    _$jscmd("fprime.js", "line", 171);
    F.parallel = function(parallelSteps) {
        _$jscmd("fprime.js", "line", 172);
        return function() {
            _$jscmd("fprime.js", "line", 173);
            var args = Array.prototype.slice.call(arguments), next = args.pop();
            for (var p in parallelSteps) {
                _$jscmd("fprime.js", "line", 176);
                var f;
                if (_$jscmd("fprime.js", "cond", "177_19_38", typeof parallelSteps[p] === "function")) f = parallelSteps[p]; else if (_$jscmd("fprime.js", "cond", "179_24_28", parallelSteps[p] !== undefined)) f = F(parallelSteps[p]);
                if (_$jscmd("fprime.js", "cond", "181_19_1", f)) f.apply(this, args.concat(next.push(p)));
            }
        };
    };
    _$jscmd("fprime.js", "line", 188);
    // a few short notations for common operators, added as augmentation:
    var shorthands = [];
    _$jscmd("fprime.js", "line", 189);
    shorthands.push({
        name: "shorthand_array",
        type: "stepFilter",
        f: function(step) {
            if (_$jscmd("fprime.js", "cond", "193_15_21", step instanceof Array)) {
                _$jscmd("fprime.js", "line", 194);
                var stepArray = step;
                if (_$jscmd("fprime.js", "cond", "196_19_13", step.length > 1)) {
                    _$jscmd("fprime.js", "line", 197);
                    step = F.parallelArgs.apply(this, stepArray);
                } else if (_$jscmd("fprime.js", "cond", "199_24_14", step.length == 1)) {
                    _$jscmd("fprime.js", "line", 200);
                    step = F.map(stepArray[0]);
                }
            }
            _$jscmd("fprime.js", "line", 203);
            return step;
        },
        options: {
            order: 10
        }
    });
    _$jscmd("fprime.js", "line", 207);
    shorthands.push({
        name: "shorthand_object",
        type: "stepFilter",
        f: function(step) {
            if (_$jscmd("fprime.js", "cond", "211_15_24", typeof step === "object")) {
                _$jscmd("fprime.js", "line", 212);
                var stepMap = step;
                _$jscmd("fprime.js", "line", 213);
                step = F.parallel(stepMap);
            }
            _$jscmd("fprime.js", "line", 215);
            return step;
        },
        options: {
            order: 20
        }
    });
    _$jscmd("fprime.js", "line", 219);
    shorthands.push({
        name: "shorthand_value",
        type: "stepFilter",
        f: function(step) {
            if (_$jscmd("fprime.js", "cond", "223_15_26", typeof step !== "function")) {
                _$jscmd("fprime.js", "line", 224);
                var value = step;
                _$jscmd("fprime.js", "line", 225);
                step = F.result(value);
            }
            _$jscmd("fprime.js", "line", 227);
            return step;
        },
        options: {
            order: 99
        }
    });
    _$jscmd("fprime.js", "line", 231);
    F.augment(shorthands);
    if (_$jscmd("fprime.js", "cond", "233_8_37", typeof module.exports !== "undefined")) {
        _$jscmd("fprime.js", "line", 234);
        module.exports = F;
    }
})();