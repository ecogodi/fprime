var F = require('./lib/f.js');

// You're strongly encouraged to mix and match: pick the helpers you really need and add your own
F.onErrorExit = function(err,res,next){
	if(!err)
		next(res);
	else if(err instanceof Array){
		for(var i in err){
			if(err[i]){
				this.F.exit(err);
				return;
			}
		}
		next(res);
	}
	else
		this.F.exit(err);
};

F.onResultExit = function(err,res,next){
	if(!res)
		next();
	else if(res instanceof Array){
		for(var i in res){
			if(res[i]){
				this.F.exit(null,res);
				return;
			}
		}
		next();
	}
	else
		this.F.exit(null,res);
};

F.while = function(c,f){
	var saveInput = function(input,next){
		if(!this._input)
			this._input = input;
		next(this._input);
	}
	// user-provided check function
	// c(next) -> (err,bool,next)
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
	return F(saveInput,c,ifFalseExit,retrieveInput,f,loop);
};


if (typeof module.exports !== "undefined") {
	module.exports = F;
}