(function(){
    function _define(stepsArray,options) {  
        var options = options || {},
            stepsArray = stepsArray;

        var getRun = function(){
            var runArgsArray = Array.prototype.slice.call(arguments);

            if(typeof runArgsArray[runArgsArray.length -1] !== 'function')
                throw ('Final callback needed');

            var thisRun = {};
            thisRun._finalCb = runArgsArray.pop();
            thisRun._parentState = this;
            //thisRun._guid = Math.random();
            //thisRun._signature = stepsArray.map(function(s){return s.name;}).join('-');
            thisRun._steps = stepsArray;
            thisRun._parallel = null;

            var inputReceiver = thisRun._steps[0] || thisRun._finalCb;
            thisRun._numArgs =  inputReceiver._numArgs ? inputReceiver._numArgs : inputReceiver.length;    

            thisRun._exit = function(err,res,context){
                thisRun._stopped = true;
                if(context)
                    thisRun._finalCb.bind(context)(err,res);
                else    
                    thisRun._finalCb(err,res);
            };
            thisRun._rewind = function(){
                thisRun._nextStepId = 0;
            };
            thisRun._setNextStepId = function(n){
                thisRun._nextStepId = ~~n;
            };

            thisRun.exec = function() {
                var execArgsArray = Array.prototype.slice.call(arguments);

                var state = {};
                
                /**
                 * Methods and properties revealed to step functions ( in the this.F namespace ).
                 * 
                 * @type {Object}
                 */
                var boundExit = function(err,res){ thisRun._exit(err,res,state) };
                var step_revealed = {exit:boundExit, rewind:thisRun._rewind};
                
                /**
                 * Methods and properties available to augmentations of type 'stateF'.
                 * Bound as 'this' context. 
                 * 
                 * @type {Object}
                 */
                var augment_context = {exit:thisRun._exit, rewind:thisRun._rewind, setNextStepId: thisRun._setNextStepId, runOneStep: runOneStep };
                for(var a in augmentations['stateF']){
                    step_revealed[augmentations['stateF'][a].name] = augmentations['stateF'][a].f.bind(augment_context);
                }

                /**
                 * Sequence execution state.
                 * Bound as 'this' context in step functions.
                 * 
                 * @type {Object}
                 * @prop {Function} F       namespace for additional utility methods available to sequence steps
                 * @prop {Object}   parent  reference to the state of the enclosing F sequence, or the 'this' enclosing the top level F sequence
                 */
                state.F = step_revealed;
                state.parent = thisRun._parentState;
                
                function runOneStep(id, stepArgsArray){
                    if(thisRun._stopped)
                        return;
                                    
                    var step = thisRun._steps[id];

                    if (step === undefined) { // seq end
                        thisRun._stopped = true;
                        thisRun._finalCb.apply(state, stepArgsArray);
                        return;
                    }

                    // augmentations are allowed to enter our flow here, by registering as step filters
                    if(typeof step !== 'function')
                        step = doFilter('stepFilter', step, state);
                    
                    if(typeof step == 'function'){
                        var numargs = (step._numArgs!==undefined) ? step._numArgs : step.length;
                        while(stepArgsArray.length<numargs-1){
                            stepArgsArray.push(undefined);
                        }

                        /**
                         * 'next' is injected as last argument in step function calls.
                         * It can be passed as callback for async calls to pass excution to the step
                         * following the current one.
                         * It's also fitted with a push method to generate parallel execution.
                         * 
                         * @type {Function}
                         */
                        var next = seqNext();
                        next.push = forkOneParallel.bind(state,next);
                        stepArgsArray.push(next);

                        // initalize parallel execution state
                        thisRun._parallel = { c:0, p:0, err:{}, res:{}, n:false, lock:true };       
                        step.apply(state, stepArgsArray);

                        // unlock so async callbacks can finish when the last one ends
                        thisRun._parallel.lock = false;

                        // if all pending parallel strands have ended already, let's finish
                        thisRun._parallel.finishing = (thisRun._parallel.c>0 && thisRun._parallel.p == 0);

                        //Hook for augments manipulating the end of parallelization
                        //thisRun._parallel = doFilter('endParallelFilter', thisRun._parallel, state);

                        if(thisRun._parallel.finishing)
                            finishParallel(next);
                    }
                    else
                        throw('Unknown sequence step type for: '+step)
                }

                var finishParallel = function(endNext){
                    var next = seqNext(),
                        collectorArgsArray = [];

                    if(thisRun._parallel.n)
                        collectorArgsArray = [thisRun._parallel.err, thisRun._parallel.res];
                    else {
                        for(var r in thisRun._parallel.res){
                            collectorArgsArray[r] = thisRun._parallel.res[r];
                        }
                        collectorArgsArray.unshift(thisRun._parallel.err);
                    }
                    
                    endNext.apply(state, collectorArgsArray);
                }

                var endOneParallel = function(endNext,seqId){
                    var endArgsArray = Array.prototype.slice.call(arguments,2),
                        err    = endArgsArray.length>0 ? endArgsArray.shift() : undefined,
                        result = endArgsArray.length>0 ? endArgsArray : undefined;

                    if(err)
                        thisRun._parallel.err[seqId] = err;
                    thisRun._parallel.res[seqId] = (result && result.length==1) ? result[0] : result;

                    thisRun._parallel.p--;
                    
                    thisRun._parallel.finishing = (thisRun._parallel.p == 0 && !thisRun._parallel.lock);

                    //TODO: hook for augments manipulating the end of parallelization
                    //thisRun._parallel = doFilter('endParallelFilter', thisRun._parallel);

                    if(thisRun._parallel.finishing)
                        finishParallel(endNext);

                 };

                var forkOneParallel = function(endNext,seqId){
                
                    if(!seqId)
                        seqId = thisRun._parallel.c;
                    else if(typeof seqId !== 'number')
                        thisRun._parallel.n = true; //named params

                    thisRun._parallel.c++;
                    thisRun._parallel.p++;
            
                    return endOneParallel.bind(state,endNext,seqId);
                }

                var seqNext = function(){
                    return function() {
                        var nextArgsArray = Array.prototype.slice.call(arguments),
                            id = thisRun._nextStepId ++;
                        runOneStep(id, nextArgsArray);
                    }
                }

                thisRun._nextStepId = 0;
                seqNext().apply(this, execArgsArray);
            }

            thisRun.exec.apply(thisRun, runArgsArray);
        }

        return getRun;
    }

    var F = function(){
        return _define(Array.prototype.slice.call(arguments));
    }

    var augmentations = {};
    F.augment = function(augs, replace){
        var ob, name, type, tosort =[];
        if(!(augs instanceof Array))
            augs = [augs];
        for(var ai in augs){
            ob = augs[ai];
            name = ob.name;
            if(typeof ob.name !== 'string')
                throw 'Augmentation error: .name not a string.';
            if(typeof ob.f !== 'function')
                throw 'Augmentation error: .f not a function.';
            if(typeof ob.type !== 'string')
                throw 'Augmentation error: .type not a string.';

            type = ob.type;

            if(!augmentations[type])
                augmentations[type] = [];

            augmentations[type].push(ob);
            
            if(ob.options && ob.options.order)
                tosort.push(type);
        }

        for(var ti in tosort){
            augmentations[tosort[ti]].sort(function(a1,a2){
                return (parseInt(a1.options.order,10) || Infinity) - (parseInt(a2.options.order,10) || Infinity);
            });
        }
    }

    var doFilter = function(type, ob, context){
        context = context || F;
        var filters = augmentations[type];
        if(!filters || filters.length === 0)
           return ob;
        
        var oldOb;
        for(var fi in filters){
            oldOb = ob;
            ob = (filters[fi].f.bind(context))(oldOb);
        }
    
        return ob;
    }

    if (typeof module.exports !== "undefined") {
        module.exports = F;
    }

})();