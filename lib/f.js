(function(){
		
	function _define(stepsArray,options) {	
		options = options || {};

		var thisRun = function() {
			var runArgsArray = Array.prototype.slice.call(arguments);
			if(typeof runArgsArray[runArgsArray.length -1] !== 'function')
				throw ('Final callback needed');
			thisRun._finalCb = runArgsArray.pop();
			thisRun._parentState = this;

			var inputReceiver = thisRun._steps[0] || thisRun._finalCb;
			thisRun._numArgs =  inputReceiver._numArgs ? inputReceiver._numArgs : inputReceiver.length;

			thisRun.exec.apply(thisRun, runArgsArray);
		}

		thisRun._steps = stepsArray;
		thisRun._parallel = null;

		thisRun._exit = function(err,res){
			thisRun._stopped = true;	
			thisRun._finalCb(err,res);
		};
		thisRun._rewind = function(){
			thisRun._nextStepId = 0;
		};
		thisRun._getNextStepId = function(){
			return thisRun._nextStepId;
		};
		thisRun._setNextStepId = function(n){
			thisRun._nextStepId = ~~n;
		};

		thisRun.exec = function() {
			var execArgsArray = Array.prototype.slice.call(arguments);

			/**
			 * Methods and properties revealed to step functions ( in the this.F namespace ).
			 * 
			 * @type {Object}
			 */
			var step_revealed = {exit:thisRun._exit, rewind:thisRun._rewind};
			
			/**
			 * Methods and properties available to augmentations.
			 * Bound as 'this' context. 
			 * 
			 * @type {Object}
			 */
			var augment_context = {exit:thisRun._exit, rewind:thisRun._rewind, setNextStepId: thisRun._setNextStepId, runOneStep: runOneStep };
			for(var a in augmentations)
				step_revealed[a] = augmentations[a].bind(augment_context);

			/**
			 * Sequence execution state.
			 * Bound as 'this' context in step functions.
			 * 
			 * @type {Object}
			 * @prop {Function} F       namespace for additional utility methods available to sequence steps
			 * @prop {Object}   parent  reference to the state of the enclosing F sequence, or the 'this' enclosing the top level F sequence
			 */
			var state = {F:step_revealed, parent:thisRun._parentState};

			
			function runOneStep(id, stepArgsArray){
				if(thisRun._stopped)
					return;
								
				var step = thisRun._steps[id];

				if (step === undefined) { // seq end
					thisRun._stopped = true;

					thisRun._finalCb.apply(state, stepArgsArray);
					return
				}
				if(step instanceof Array){
					var parallelSteps = step;

					if(step.length>1){
						step = function(){
							var parallelArgs = Array.prototype.slice.call(arguments),
								next = parallelArgs.pop();
							var p;
							for(p in parallelSteps){
								if(parallelSteps[p]!==undefined)
									F(parallelSteps[p])( parallelArgs[p],next.push() );
							}
						};
					}
					else if(step.length==1){
						step = function(){
							var parallelArgs = Array.prototype.slice.call(arguments),
								next = parallelArgs.pop();
							var i;
							if(parallelArgs[0] && parallelSteps[0]){
								for(i in parallelArgs[0]){
									if(parallelArgs[0].hasOwnProperty(i)){
										F(parallelSteps[0])( parallelArgs[0][i],next.push(''+i) );
									}
								}
							}
							else
								next();
						};
					}
				}

				if(typeof step === 'object'){
					var parallelSteps = step;

					step = function(){
						var parallelArgs = Array.prototype.slice.call(arguments),
							next = parallelArgs.pop();
						var p;
						for(p in parallelSteps){
							if(parallelSteps[p]!==undefined)
								F(parallelSteps[p])( parallelArgs[0],next.push(p) );
						}
					};
					
				}
				else if(typeof step !== 'function'){
					var value = step;
					step = function(){
						var next = Array.prototype.slice.call(arguments).pop();
						next(null,value);
					}
				}

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
					if(thisRun._parallel.c>0 && thisRun._parallel.p == 0){
						finishParallel(next);
					}

				}
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

			var forkOneParallel = function(endNext,seqId){
			
				if(!seqId)
					seqId = thisRun._parallel.c;
				else if(typeof seqId !== 'number')
					thisRun._parallel.n = true; //named params

				thisRun._parallel.c++;
				thisRun._parallel.p++;
			
				var endOneParallel = function(endNext,seqId){
					var endArgsArray = Array.prototype.slice.call(arguments,2),
						err    = endArgsArray.length>0 ? endArgsArray.shift() : undefined,
						result = endArgsArray.length>0 ? endArgsArray : undefined;

					thisRun._parallel.err[seqId] = err;
					thisRun._parallel.res[seqId] = (result && result.length==1) ? result[0] : result;

					thisRun._parallel.p--;
					
					if(thisRun._parallel.p == 0 && !thisRun._parallel.lock){
						finishParallel(endNext);
					}
				}.bind(state,endNext,seqId);

				return endOneParallel;
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

		return thisRun;
	}

	var F = function(){
		return _define(Array.prototype.slice.call(arguments));
	}

	var augmentations = {};
	F.augment = function(ob, force){
		var name;
		for(name in ob){
			if(F[name] && !force)
				throw name+' was ignored: conflicting with existing augmentation.';
			if(typeof ob[name] !== 'function')
				throw name+' was ignored: not a function.';
			augmentations[name] = ob[name];	
		}
	}

	if (typeof module.exports !== "undefined") {
		module.exports = F;
	}

})();