var F = require('./lib/f.js');

// You're strongly encouraged to mix and match: pick the helpers you really need and add your own
F.onErrorExit = function(){
	var args = Array.prototype.slice.call(arguments);
	var err = args.shift();
	var next = args.pop();

	if(!err)
		next.apply(this,args);
	else if(err instanceof Array){
		for(var i in err){
			if(err[i]){
				this.F.exit(err);
				return;
			}
		}
		next.apply(this,args);
	}
	else
		this.F.exit(err);
};

F.onResultExit = function(){
	var args = Array.prototype.slice.call(arguments);
	var err = args.shift();
	var next = args.pop();

	if(!args)
		next();
	else if(args instanceof Array){
		for(var i in args){
			if(args[i]){
				this.F.exit.apply(this,[err].concat(args));
				return;
			}
		}
		next.apply(this,args);
	}
	else
		this.F.exit.apply(this,[err].concat(args));
};

F.while = function(check, f){
	var saveInput = function(input,next){
		if(!this._input)
			this._input = input;
		next(this._input);
	}
	// user-provided check function
	// check(next) -> (err,bool,next)
	// 
	var ifFalseExit = function(err,bool,next){
		if(!bool)
			this.F.exit(null,this);
		next(err);
	}
	var retrieveInput = function(err,next){
		next(err,this._input);
	}
	// user-provided looped function
	// f(err,input,next) -> (err,next)
	// 
	var loop = function(err,next){
		this.F.rewind();
		next();
	}

	return F(saveInput,check,ifFalseExit,retrieveInput,f,loop);
};

F.map = function(f){
	return function(iterable,next){
		if(iterable && f){
			for(var i in iterable){
				if(iterable.hasOwnProperty(i)){
					F(f)(iterable[i],next.push(''+i) );
				}
			}
		}
		else
			next();
	}
}

F.mapArgs = function(){
	var parallelSteps = Array.prototype.slice.call(arguments);
	return function(){
		var parallelArgs = Array.prototype.slice.call(arguments),
			next = parallelArgs.pop();
		for(var p in parallelSteps){
			if(parallelSteps[p]!==undefined)
				F(parallelSteps[p])( parallelArgs[p],next.push() );
		}
	};
}

F.applyFuncs = function(parallelSteps){
	return function(){
		var parallelArgs = Array.prototype.slice.call(arguments),
			next = parallelArgs.pop();
		var p;
		for(p in parallelSteps){
			if(parallelSteps[p]!==undefined)
				F(parallelSteps[p])( parallelArgs[0],next.push(p) );
		}
	};
}

var shorthands = {
	shorthand_array: {
		type: 'stepFilter',
		f: function(step){
			if(step instanceof Array){
				var stepArray = step;

				if(step.length>1){
					step = F.mapArgs.apply(this, stepArray);
				}
				else if(step.length==1){
					step = F.map(stepArray[0]);
				}
			}
			return step;
		},
		options: {order: 10}
	},
	shorthand_object: {
		type: 'stepFilter',
		f: function(step){
			if(typeof step === 'object'){
				var stepMap = step;
				step = F.applyFuncs(stepMap);
			}
			return step;
		},
		options: {order: 20}
	}
}
F.augment(shorthands);

if (typeof module.exports !== "undefined") {
	module.exports = F;
}