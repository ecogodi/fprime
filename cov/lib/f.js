
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
})('lib/f.js', [1,223,227,228,3,6,220,7,12,13,14,17,18,20,21,23,27,30,33,37,217,24,25,28,31,34,38,45,53,67,126,154,170,191,204,212,213,69,76,79,80,81,89,102,103,104,107,108,111,114,91,127,151,129,135,136,135,140,144,146,147,155,167,164,162,171,177,179,181,198,199,201,205,206,208,224,229,233,234,239,244], {"3_22_7":0,"3_33_2":0,"9_15_58":0,"20_32_17":0,"20_53_16":0,"21_57_22":0,"21_82_20":0,"55_23_33":0,"73_23_16":0,"78_24_18":0,"85_23_26":0,"88_23_25":0,"89_68_13":0,"89_84_11":0,"114_55_21":0,"114_80_24":0,"119_27_27":0,"128_23_22":0,"131_31_29":0,"134_27_14":0,"143_23_14":0,"158_23_19":0,"172_57_20":0,"172_80_9":0,"173_57_12":0,"173_72_9":0,"175_23_3":0,"177_82_9":0,"177_94_6":0,"177_52_6":0,"177_62_16":0,"181_51_24":0,"181_79_23":0,"186_23_27":0,"193_23_6":0,"195_28_25":0,"230_11_24":0,"235_15_17":0,"235_15_7":0,"235_26_6":0,"237_15_26":0,"243_8_37":0}, ["(function(){","    function _define(stepsArray,options) {  ","        var options = options || {},","            stepsArray = stepsArray;","","        var getRun = function(){","            var runArgsArray = Array.prototype.slice.call(arguments);","","            if(typeof runArgsArray[runArgsArray.length -1] !== 'function')","                throw ('Final callback needed');","","            var thisRun = {};","            thisRun._finalCb = runArgsArray.pop();","            thisRun._parentState = this;","            //thisRun._guid = Math.random();","            //thisRun._signature = stepsArray.map(function(s){return s.name;}).join('-');","            thisRun._steps = stepsArray;","            thisRun._parallel = null;","","            var inputReceiver = thisRun._steps[0] || thisRun._finalCb;","            thisRun._numArgs =  inputReceiver._numArgs ? inputReceiver._numArgs : inputReceiver.length;    ","","            thisRun._exit = function(err,res){","                thisRun._stopped = true;    ","                thisRun._finalCb(err,res);","            };","            thisRun._rewind = function(){","                thisRun._nextStepId = 0;","            };","            thisRun._getNextStepId = function(){","                return thisRun._nextStepId;","            };","            thisRun._setNextStepId = function(n){","                thisRun._nextStepId = ~~n;","            };","","            thisRun.exec = function() {","                var execArgsArray = Array.prototype.slice.call(arguments);","","                /**","                 * Methods and properties revealed to step functions ( in the this.F namespace ).","                 * ","                 * @type {Object}","                 */","                var step_revealed = {exit:thisRun._exit, rewind:thisRun._rewind};","                ","                /**","                 * Methods and properties available to augmentations.","                 * Bound as 'this' context. ","                 * ","                 * @type {Object}","                 */","                var augment_context = {exit:thisRun._exit, rewind:thisRun._rewind, setNextStepId: thisRun._setNextStepId, runOneStep: runOneStep };","                for(var a in augmentations){","                    if(augmentations[a].type == 'stateF')","                        step_revealed[augmentations[a].name] = augmentations[a].f.bind(augment_context);","                }","","                /**","                 * Sequence execution state.","                 * Bound as 'this' context in step functions.","                 * ","                 * @type {Object}","                 * @prop {Function} F       namespace for additional utility methods available to sequence steps","                 * @prop {Object}   parent  reference to the state of the enclosing F sequence, or the 'this' enclosing the top level F sequence","                 */","                var state = {F:step_revealed, parent:thisRun._parentState};","                for(var ps in thisRun._presetState){","                    state[ps] = thisRun._presetState[ps];","                }","                ","                function runOneStep(id, stepArgsArray){","                    if(thisRun._stopped)","                        return;","                                    ","                    var step = thisRun._steps[id];","","                    if (step === undefined) { // seq end","                        thisRun._stopped = true;","                        thisRun._finalCb.apply(state, stepArgsArray);","                        return;","                    }","","                    // augmentations are allowed to enter our flow here, by registering as step filters","                    if(typeof step !== 'function')","                        step = doFilter('stepFilter', step);","                    ","                    if(typeof step == 'function'){","                        var numargs = (step._numArgs!==undefined) ? step._numArgs : step.length;","                        while(stepArgsArray.length<numargs-1){","                            stepArgsArray.push(undefined);","                        }","","                        /**","                         * 'next' is injected as last argument in step function calls.","                         * It can be passed as callback for async calls to pass excution to the step","                         * following the current one.","                         * It's also fitted with a push method to generate parallel execution.","                         * ","                         * @type {Function}","                         */","                        var next = seqNext();","                        next.push = forkOneParallel.bind(state,next);","                        stepArgsArray.push(next);","","                        // initalize parallel execution state","                        thisRun._parallel = { c:0, p:0, err:{}, res:{}, n:false, lock:true };       ","                        step.apply(state, stepArgsArray);","","                        // unlock so async callbacks can finish when the last one ends","                        thisRun._parallel.lock = false;","","                        // if all pending parallel strands have ended already, let's finish","                        thisRun._parallel.finishing = (thisRun._parallel.c>0 && thisRun._parallel.p == 0);","","                        //Hook for augments manipulating the end of parallelization","                        //thisRun._parallel = doFilter('endParallelFilter', thisRun._parallel);","","                        if(thisRun._parallel.finishing)","                            finishParallel(next);","                    }","                    else","                        throw('Unknown sequence step type for: '+step)","                }","","                var doFilter = function(type, ob){","                    var filters;","                    if(!(augmentations[type])){","                        filters = [];","                        for(var a in augmentations){","                            if(augmentations[a].type == type)","                                filters.push(augmentations[a]);","                        }","                        if(filters.length){","                            filters.sort(function(a1,a2){return a1.options.order - a2.options.order});","                            augmentations[type] = filters;","                        }","                    }","                    else {","                        filters = augmentations[type];","                    }","                    ","                    if(filters.length){","                        var oldOb;","                        for(var fi in filters){","                            oldOb = ob;","                            ob = (filters[fi].f.bind(state))(oldOb);","                        }","                    }","","                    return ob;","                }","","                var finishParallel = function(endNext){","                    var next = seqNext(),","                        collectorArgsArray = [];","","                    if(thisRun._parallel.n)","                        collectorArgsArray = [thisRun._parallel.err, thisRun._parallel.res];","                    else {","                        for(var r in thisRun._parallel.res){","                            collectorArgsArray[r] = thisRun._parallel.res[r];","                        }","                        collectorArgsArray.unshift(thisRun._parallel.err);","                    }","                    ","                    endNext.apply(state, collectorArgsArray);","                }","","                var endOneParallel = function(endNext,seqId){","                    var endArgsArray = Array.prototype.slice.call(arguments,2),","                        err    = endArgsArray.length>0 ? endArgsArray.shift() : undefined,","                        result = endArgsArray.length>0 ? endArgsArray : undefined;","","                    if(err)","                        thisRun._parallel.err[seqId] = err;","                    thisRun._parallel.res[seqId] = (result && result.length==1) ? result[0] : result;","","                    thisRun._parallel.p--;","                    ","                    thisRun._parallel.finishing = (thisRun._parallel.p == 0 && !thisRun._parallel.lock);","","                    //TODO: hook for augments manipulating the end of parallelization","                    //thisRun._parallel = doFilter('endParallelFilter', thisRun._parallel);","","                    if(thisRun._parallel.finishing)","                        finishParallel(endNext);","","                 };","","                var forkOneParallel = function(endNext,seqId){","                ","                    if(!seqId)","                        seqId = thisRun._parallel.c;","                    else if(typeof seqId !== 'number')","                        thisRun._parallel.n = true; //named params","","                    thisRun._parallel.c++;","                    thisRun._parallel.p++;","            ","                    return endOneParallel.bind(state,endNext,seqId);","                }","","                var seqNext = function(){","                    return function() {","                        var nextArgsArray = Array.prototype.slice.call(arguments),","                            id = thisRun._nextStepId ++;","                        runOneStep(id, nextArgsArray);","                    }","                }","","                thisRun._nextStepId = 0;","                seqNext().apply(this, execArgsArray);","            }","","            //thisRun.apply(this,Array.prototype.slice.call(arguments));","            thisRun.exec.apply(thisRun, runArgsArray);","        }","","        return getRun;","    }","","    var F = function(){","        return _define(Array.prototype.slice.call(arguments));","    }","","    var augmentations = [];","    F.augment = function(augs, force){","        var ob, name;","        if(!(augs instanceof Array))","                augs = [augs];","        for(i in augs){","            ob = augs[i];","            name = ob.name;","            if(F[name] && !force)","                 throw name+' was ignored: conflicting with existing augmentation.';","            if(typeof ob.f !== 'function')","                throw name+' was ignored: .f not a function.';","            augmentations.push(ob); ","        }","    }","","    if (typeof module.exports !== \"undefined\") {","        module.exports = F;","    }","","})();"]);
_$jscmd("lib/f.js", "line", 1);

(function() {
    function _define(stepsArray, options) {
        _$jscmd("lib/f.js", "line", 3);
        var options = _$jscmd("lib/f.js", "cond", "3_22_7", options) || _$jscmd("lib/f.js", "cond", "3_33_2", {}), stepsArray = stepsArray;
        _$jscmd("lib/f.js", "line", 6);
        var getRun = function() {
            _$jscmd("lib/f.js", "line", 7);
            var runArgsArray = Array.prototype.slice.call(arguments);
            if (_$jscmd("lib/f.js", "cond", "9_15_58", typeof runArgsArray[runArgsArray.length - 1] !== "function")) throw "Final callback needed";
            _$jscmd("lib/f.js", "line", 12);
            var thisRun = {};
            _$jscmd("lib/f.js", "line", 13);
            thisRun._finalCb = runArgsArray.pop();
            _$jscmd("lib/f.js", "line", 14);
            thisRun._parentState = this;
            _$jscmd("lib/f.js", "line", 17);
            //thisRun._guid = Math.random();
            //thisRun._signature = stepsArray.map(function(s){return s.name;}).join('-');
            thisRun._steps = stepsArray;
            _$jscmd("lib/f.js", "line", 18);
            thisRun._parallel = null;
            _$jscmd("lib/f.js", "line", 20);
            var inputReceiver = _$jscmd("lib/f.js", "cond", "20_32_17", thisRun._steps[0]) || _$jscmd("lib/f.js", "cond", "20_53_16", thisRun._finalCb);
            _$jscmd("lib/f.js", "line", 21);
            thisRun._numArgs = inputReceiver._numArgs ? _$jscmd("lib/f.js", "cond", "21_57_22", inputReceiver._numArgs) : _$jscmd("lib/f.js", "cond", "21_82_20", inputReceiver.length);
            _$jscmd("lib/f.js", "line", 23);
            thisRun._exit = function(err, res) {
                _$jscmd("lib/f.js", "line", 24);
                thisRun._stopped = true;
                _$jscmd("lib/f.js", "line", 25);
                thisRun._finalCb(err, res);
            };
            _$jscmd("lib/f.js", "line", 27);
            thisRun._rewind = function() {
                _$jscmd("lib/f.js", "line", 28);
                thisRun._nextStepId = 0;
            };
            _$jscmd("lib/f.js", "line", 30);
            thisRun._getNextStepId = function() {
                _$jscmd("lib/f.js", "line", 31);
                return thisRun._nextStepId;
            };
            _$jscmd("lib/f.js", "line", 33);
            thisRun._setNextStepId = function(n) {
                _$jscmd("lib/f.js", "line", 34);
                thisRun._nextStepId = ~~n;
            };
            _$jscmd("lib/f.js", "line", 37);
            thisRun.exec = function() {
                _$jscmd("lib/f.js", "line", 38);
                var execArgsArray = Array.prototype.slice.call(arguments);
                _$jscmd("lib/f.js", "line", 45);
                /**
                 * Methods and properties revealed to step functions ( in the this.F namespace ).
                 * 
                 * @type {Object}
                 */
                var step_revealed = {
                    exit: thisRun._exit,
                    rewind: thisRun._rewind
                };
                _$jscmd("lib/f.js", "line", 53);
                /**
                 * Methods and properties available to augmentations.
                 * Bound as 'this' context. 
                 * 
                 * @type {Object}
                 */
                var augment_context = {
                    exit: thisRun._exit,
                    rewind: thisRun._rewind,
                    setNextStepId: thisRun._setNextStepId,
                    runOneStep: runOneStep
                };
                for (var a in augmentations) {
                    if (_$jscmd("lib/f.js", "cond", "55_23_33", augmentations[a].type == "stateF")) step_revealed[augmentations[a].name] = augmentations[a].f.bind(augment_context);
                }
                _$jscmd("lib/f.js", "line", 67);
                /**
                 * Sequence execution state.
                 * Bound as 'this' context in step functions.
                 * 
                 * @type {Object}
                 * @prop {Function} F       namespace for additional utility methods available to sequence steps
                 * @prop {Object}   parent  reference to the state of the enclosing F sequence, or the 'this' enclosing the top level F sequence
                 */
                var state = {
                    F: step_revealed,
                    parent: thisRun._parentState
                };
                for (var ps in thisRun._presetState) {
                    _$jscmd("lib/f.js", "line", 69);
                    state[ps] = thisRun._presetState[ps];
                }
                function runOneStep(id, stepArgsArray) {
                    if (_$jscmd("lib/f.js", "cond", "73_23_16", thisRun._stopped)) return;
                    _$jscmd("lib/f.js", "line", 76);
                    var step = thisRun._steps[id];
                    if (_$jscmd("lib/f.js", "cond", "78_24_18", step === undefined)) {
                        _$jscmd("lib/f.js", "line", 79);
                        // seq end
                        thisRun._stopped = true;
                        _$jscmd("lib/f.js", "line", 80);
                        thisRun._finalCb.apply(state, stepArgsArray);
                        _$jscmd("lib/f.js", "line", 81);
                        return;
                    }
                    // augmentations are allowed to enter our flow here, by registering as step filters
                    if (_$jscmd("lib/f.js", "cond", "85_23_26", typeof step !== "function")) step = doFilter("stepFilter", step);
                    if (_$jscmd("lib/f.js", "cond", "88_23_25", typeof step == "function")) {
                        _$jscmd("lib/f.js", "line", 89);
                        var numargs = step._numArgs !== undefined ? _$jscmd("lib/f.js", "cond", "89_68_13", step._numArgs) : _$jscmd("lib/f.js", "cond", "89_84_11", step.length);
                        while (stepArgsArray.length < numargs - 1) {
                            _$jscmd("lib/f.js", "line", 91);
                            stepArgsArray.push(undefined);
                        }
                        _$jscmd("lib/f.js", "line", 102);
                        /**
                         * 'next' is injected as last argument in step function calls.
                         * It can be passed as callback for async calls to pass excution to the step
                         * following the current one.
                         * It's also fitted with a push method to generate parallel execution.
                         * 
                         * @type {Function}
                         */
                        var next = seqNext();
                        _$jscmd("lib/f.js", "line", 103);
                        next.push = forkOneParallel.bind(state, next);
                        _$jscmd("lib/f.js", "line", 104);
                        stepArgsArray.push(next);
                        _$jscmd("lib/f.js", "line", 107);
                        // initalize parallel execution state
                        thisRun._parallel = {
                            c: 0,
                            p: 0,
                            err: {},
                            res: {},
                            n: false,
                            lock: true
                        };
                        _$jscmd("lib/f.js", "line", 108);
                        step.apply(state, stepArgsArray);
                        _$jscmd("lib/f.js", "line", 111);
                        // unlock so async callbacks can finish when the last one ends
                        thisRun._parallel.lock = false;
                        _$jscmd("lib/f.js", "line", 114);
                        // if all pending parallel strands have ended already, let's finish
                        thisRun._parallel.finishing = _$jscmd("lib/f.js", "cond", "114_55_21", thisRun._parallel.c > 0) && _$jscmd("lib/f.js", "cond", "114_80_24", thisRun._parallel.p == 0);
                        //Hook for augments manipulating the end of parallelization
                        //thisRun._parallel = doFilter('endParallelFilter', thisRun._parallel);
                        if (_$jscmd("lib/f.js", "cond", "119_27_27", thisRun._parallel.finishing)) finishParallel(next);
                    } else throw "Unknown sequence step type for: " + step;
                }
                _$jscmd("lib/f.js", "line", 126);
                var doFilter = function(type, ob) {
                    _$jscmd("lib/f.js", "line", 127);
                    var filters;
                    if (_$jscmd("lib/f.js", "cond", "128_23_22", !augmentations[type])) {
                        _$jscmd("lib/f.js", "line", 129);
                        filters = [];
                        for (var a in augmentations) {
                            if (_$jscmd("lib/f.js", "cond", "131_31_29", augmentations[a].type == type)) filters.push(augmentations[a]);
                        }
                        if (_$jscmd("lib/f.js", "cond", "134_27_14", filters.length)) {
                            _$jscmd("lib/f.js", "line", 135);
                            filters.sort(function(a1, a2) {
                                _$jscmd("lib/f.js", "line", 135);
                                return a1.options.order - a2.options.order;
                            });
                            _$jscmd("lib/f.js", "line", 136);
                            augmentations[type] = filters;
                        }
                    } else {
                        _$jscmd("lib/f.js", "line", 140);
                        filters = augmentations[type];
                    }
                    if (_$jscmd("lib/f.js", "cond", "143_23_14", filters.length)) {
                        _$jscmd("lib/f.js", "line", 144);
                        var oldOb;
                        for (var fi in filters) {
                            _$jscmd("lib/f.js", "line", 146);
                            oldOb = ob;
                            _$jscmd("lib/f.js", "line", 147);
                            ob = filters[fi].f.bind(state)(oldOb);
                        }
                    }
                    _$jscmd("lib/f.js", "line", 151);
                    return ob;
                };
                _$jscmd("lib/f.js", "line", 154);
                var finishParallel = function(endNext) {
                    _$jscmd("lib/f.js", "line", 155);
                    var next = seqNext(), collectorArgsArray = [];
                    if (_$jscmd("lib/f.js", "cond", "158_23_19", thisRun._parallel.n)) collectorArgsArray = [ thisRun._parallel.err, thisRun._parallel.res ]; else {
                        for (var r in thisRun._parallel.res) {
                            _$jscmd("lib/f.js", "line", 162);
                            collectorArgsArray[r] = thisRun._parallel.res[r];
                        }
                        _$jscmd("lib/f.js", "line", 164);
                        collectorArgsArray.unshift(thisRun._parallel.err);
                    }
                    _$jscmd("lib/f.js", "line", 167);
                    endNext.apply(state, collectorArgsArray);
                };
                _$jscmd("lib/f.js", "line", 170);
                var endOneParallel = function(endNext, seqId) {
                    _$jscmd("lib/f.js", "line", 171);
                    var endArgsArray = Array.prototype.slice.call(arguments, 2), err = endArgsArray.length > 0 ? _$jscmd("lib/f.js", "cond", "172_57_20", endArgsArray.shift()) : _$jscmd("lib/f.js", "cond", "172_80_9", undefined), result = endArgsArray.length > 0 ? _$jscmd("lib/f.js", "cond", "173_57_12", endArgsArray) : _$jscmd("lib/f.js", "cond", "173_72_9", undefined);
                    if (_$jscmd("lib/f.js", "cond", "175_23_3", err)) thisRun._parallel.err[seqId] = err;
                    _$jscmd("lib/f.js", "line", 177);
                    thisRun._parallel.res[seqId] = _$jscmd("lib/f.js", "cond", "177_52_6", result) && _$jscmd("lib/f.js", "cond", "177_62_16", result.length == 1) ? _$jscmd("lib/f.js", "cond", "177_82_9", result[0]) : _$jscmd("lib/f.js", "cond", "177_94_6", result);
                    _$jscmd("lib/f.js", "line", 179);
                    thisRun._parallel.p--;
                    _$jscmd("lib/f.js", "line", 181);
                    thisRun._parallel.finishing = _$jscmd("lib/f.js", "cond", "181_51_24", thisRun._parallel.p == 0) && _$jscmd("lib/f.js", "cond", "181_79_23", !thisRun._parallel.lock);
                    //TODO: hook for augments manipulating the end of parallelization
                    //thisRun._parallel = doFilter('endParallelFilter', thisRun._parallel);
                    if (_$jscmd("lib/f.js", "cond", "186_23_27", thisRun._parallel.finishing)) finishParallel(endNext);
                };
                _$jscmd("lib/f.js", "line", 191);
                var forkOneParallel = function(endNext, seqId) {
                    if (_$jscmd("lib/f.js", "cond", "193_23_6", !seqId)) seqId = thisRun._parallel.c; else if (_$jscmd("lib/f.js", "cond", "195_28_25", typeof seqId !== "number")) thisRun._parallel.n = true;
                    _$jscmd("lib/f.js", "line", 198);
                    //named params
                    thisRun._parallel.c++;
                    _$jscmd("lib/f.js", "line", 199);
                    thisRun._parallel.p++;
                    _$jscmd("lib/f.js", "line", 201);
                    return endOneParallel.bind(state, endNext, seqId);
                };
                _$jscmd("lib/f.js", "line", 204);
                var seqNext = function() {
                    _$jscmd("lib/f.js", "line", 205);
                    return function() {
                        _$jscmd("lib/f.js", "line", 206);
                        var nextArgsArray = Array.prototype.slice.call(arguments), id = thisRun._nextStepId++;
                        _$jscmd("lib/f.js", "line", 208);
                        runOneStep(id, nextArgsArray);
                    };
                };
                _$jscmd("lib/f.js", "line", 212);
                thisRun._nextStepId = 0;
                _$jscmd("lib/f.js", "line", 213);
                seqNext().apply(this, execArgsArray);
            };
            _$jscmd("lib/f.js", "line", 217);
            //thisRun.apply(this,Array.prototype.slice.call(arguments));
            thisRun.exec.apply(thisRun, runArgsArray);
        };
        _$jscmd("lib/f.js", "line", 220);
        return getRun;
    }
    _$jscmd("lib/f.js", "line", 223);
    var F = function() {
        _$jscmd("lib/f.js", "line", 224);
        return _define(Array.prototype.slice.call(arguments));
    };
    _$jscmd("lib/f.js", "line", 227);
    var augmentations = [];
    _$jscmd("lib/f.js", "line", 228);
    F.augment = function(augs, force) {
        _$jscmd("lib/f.js", "line", 229);
        var ob, name;
        if (_$jscmd("lib/f.js", "cond", "230_11_24", !(augs instanceof Array))) augs = [ augs ];
        for (i in augs) {
            _$jscmd("lib/f.js", "line", 233);
            ob = augs[i];
            _$jscmd("lib/f.js", "line", 234);
            name = ob.name;
            if (_$jscmd("lib/f.js", "cond", "235_15_17", _$jscmd("lib/f.js", "cond", "235_15_7", F[name]) && _$jscmd("lib/f.js", "cond", "235_26_6", !force))) throw name + " was ignored: conflicting with existing augmentation.";
            if (_$jscmd("lib/f.js", "cond", "237_15_26", typeof ob.f !== "function")) throw name + " was ignored: .f not a function.";
            _$jscmd("lib/f.js", "line", 239);
            augmentations.push(ob);
        }
    };
    if (_$jscmd("lib/f.js", "cond", "243_8_37", typeof module.exports !== "undefined")) {
        _$jscmd("lib/f.js", "line", 244);
        module.exports = F;
    }
})();