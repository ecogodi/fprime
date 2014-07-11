(function(){
		
	function _define(stepsArray,options) {	
		options = options || {};

		var thisRun = function() {
			var runArgsArray = Array.prototype.slice.call(arguments);
			if(typeof runArgsArray[runArgsArray.length -1] !== 'function')
				throw ('Final callback needed');
			thisRun._finalCb = runArgsArray.pop();
			thisRun._parentState = this;
			thisRun.exec.apply(thisRun, runArgsArray);
		}

		thisRun._steps = stepsArray;
		thisRun._numArgs =  stepsArray[0]._numArgs ? stepsArray[0]._numArgs : stepsArray[0].length;
		thisRun._cumulations = null;

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
				if(step instanceof Array || typeof step == 'object'){
					var parallelSteps = step;
						parallelArgs = stepArgsArray;
					step = function(){
						var p,k;
						for(p in parallelSteps){
							if(typeof parallelSteps[p] == 'function'){
								// ensure numeric parallel ids are pushed in array case
								k = (parallelSteps instanceof Array) ? ~~p : p;
								parallelSteps[p].apply(state, parallelArgs.concat(next.push(k)) );
							}
						}
					}
				}
				if(typeof step == 'function'){
					var numargs = (step._numArgs!==undefined) ? step._numArgs : step.length;
					if(numargs-1<stepArgsArray.length)
						stepArgsArray = stepArgsArray.slice(0,numargs-1);
					else while(stepArgsArray.length<numargs-1){
					 	stepArgsArray.push(null);
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
					next.push = forkParallel.bind(state,next);

					stepArgsArray.push(next);

					step.apply(state, stepArgsArray);
				}
			}


			var forkParallel = function(collectorFunc,seqId){
			
				thisRun._cumulations = thisRun._cumulations || { c:0, p:0, err:{}, res:{}, n:false };		
				if(!seqId)
					seqId = thisRun._cumulations.c;
				else if(typeof seqId !== 'number')
					thisRun._cumulations.n = true; //named params

				thisRun._cumulations.c++;
				thisRun._cumulations.p++;
			
				return function(collectorFunc,seqId,err,result){

					thisRun._cumulations.err[seqId] = err;
					thisRun._cumulations.res[seqId] = result;
					thisRun._cumulations.p--;
					
					if(thisRun._cumulations.p == 0){
						var next = seqNext(),
							collectorArgsArray;

						if(thisRun._cumulations.n)
							collectorArgsArray = [thisRun._cumulations.err, thisRun._cumulations.res, next];
						else {
							var numArgs = [];
							for(var r in thisRun._cumulations.res){
								numArgs[r] = thisRun._cumulations.res[r];
							}
							collectorArgsArray = [thisRun._cumulations.err].concat(numArgs).concat(next);
						}
						
						collectorFunc.apply(state, collectorArgsArray);
						delete thisRun._cumulations;
					}
				}.bind(state,collectorFunc,seqId);
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