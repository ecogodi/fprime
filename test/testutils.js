var utils = {};

utils.debug = function debug(){
	//console.log.apply(null,Array.prototype.slice.call(arguments));
}

utils.delayedResult = function delayedResult(delay){
	return function(result,cb){
		setTimeout(function(result,cb){cb(null,result)}.bind(null,result,cb),delay);
	}
}

utils.delayedErr = function delayedErr(delay){
	return function(cb){
		setTimeout(function(cb){cb('error_message')}.bind(null,cb),delay);
	}
}

utils.delayed = function delayed(delay){
	return function(cb){
		setTimeout(cb,delay);
	}
}

if (typeof module.exports !== "undefined") {
    module.exports = utils;
}