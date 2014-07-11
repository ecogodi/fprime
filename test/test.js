var chai = require('chai');
var assert = chai.assert;
var F = require('..');


function debug(){
	//console.log.apply(null,Array.prototype.slice.call(arguments));
}

function delayed(delay){
	return function(result,cb){
		setTimeout(function(result,cb){cb(null,result)}.bind(null,result,cb),delay);
	}
}

function delayedErr(delay){
	return function(cb){
		setTimeout(function(cb){cb('err as requested')}.bind(null,cb),delay);
	}
}

function delayedNoErr(delay){
	return function(cb){
		setTimeout(cb,delay);
	}
}

function a(input,next){
	debug('a',input);
	if(input == 'please_err')
		delayedErr(100)(next);
	else
		delayed(100)(input+'-a',next);
}

function s(input,next){
	debug('s',input);
	this.foo = 'bar';
	this.parent.foo = 'baz'
	
	delayed(100)(input,next);
}

function b(input,next){
	debug('b',input);
	delayed(200)(input+'-b',next);
}

function c(input,next){
	debug('c',input);
	delayed(300)(input+'-c',next);
}

function d(input,next){
	debug('d',input);
	delayed(400)(input+'-d',next);
}

function p(input, next){
	debug('p',input);
	delayed(300)(input+'-p1', next.push());
	delayed(500)(input+'-p2', next.push(2));
}

function pn(input, next){
	debug('pn',input);
	delayed(300)(input+'-pna',next.push('a'));
	delayed(200)(input+'-pnb',next.push('b'));
}

function pm(input, next){
	debug('pm',input);

	F(b)(input+'-pma',next.push('a'));
	F(c,e,d)(input+'-pmb',next.push('b'));
}

function pe(input,next){
	debug('pe',input);
	delayed(500)(input+'-pe1',next.push());
	delayedErr(200)(next.push());
}

function x(err,input,next){
	debug('x',err,input);
	next(err,'x0',input+'-x');
}

function y(input0,input1,next){
	debug('y',input0,input1);
	next(input1+'-y');
}

function i(err,result,next){
	debug('i:', err, result);
	next(err,result);
}

var e = F.onErrorExit;
var re = F.onResultExit;

describe('F -> ', function(){

	describe('sequence tests -> ', function(){

		it('single function run', function(done){
			F(a)('start',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.ok(result,'truthy result');
				assert.equal(result,'start-a', 'expected result');
			});
		});


		it('multiple function sequence', function(done){
			F(a,x,e,y,b)('start',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.equal(result,'start-a-x-y-b', 'expected result');
			});
		});

		it('sequence with saved state', function(done){
			F(
				s,e,
				b,e,
				c
			)('start',function(err,result){
				done();
				assert.equal(this.foo,'bar', 'expected saved state');
			});
		});

		it('sequence with nested saved state', function(done){
			F(
				F(s),e,
				b,e,
				c
			)('start',function(err,result){
				done();
				assert.equal(this.foo,'baz', 'expected nested saved state');
			});
		});

		it('exit from nested sequence', function(done){
			var exitGrandparent = function(input,next){
				var out = input+'-egp';
				this.parent.parent.F.exit(null,out);
			}
			F(
				a,e,
				F(b,e,F(c,e,exitGrandparent)),
				d,e,d,e,d,e
			)('start',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.ok(result,'truthy result');
				assert.equal(result,'start-a-b-c-egp', 'expected result');
			});
		});

	});

	describe('parallel tests -> ', function(){

		it('result accumulation', function(done){
			F(a,e,
				p
			)('start',function(err,result1,result2,result3){
				done();
				assert.isObject(err,'array-like error');
				assert.isDefined(err[0],'error index was set');
				assert.notOk(err[0],'no error');
				assert.isUndefined(err[1],'error index was set');
				assert.notOk(err[1],'no error');
				assert.isDefined(err[2],'error index was set');
				assert.notOk(err[2],'no error');
				assert.equal(result1,'start-a-p1', 'expected result');
				assert.notOk(result2,'expected null');
				assert.equal(result3,'start-a-p2', 'expected result');
			});
		});

		it('result accumulation with named params', function(done){
			F(a,e,
				pn
			)('start',function(err,result){
				done();
				assert.isObject(err,'array-like error');
				assert.lengthOf(Object.keys(err),2,'error length');
				assert.notOk(err['a'],'no error');
				assert.notOk(err['b'],'no error');
				assert.isObject(result,'array-like result');
				assert.lengthOf(Object.keys(result),2,'result length');
				assert.equal(result['a'],'start-a-pna', 'expected result');
				assert.equal(result['b'],'start-a-pnb', 'expected result');
			});
		});

		it('result accumulation in sequence', function(done){
			F(a,e,
				pm
			)('start',function(err,result){
				done();
				assert.isObject(err,'array-like error');
				assert.notOk(err['a'],'no error');
				assert.notOk(err['b'],'no error');
				assert.isObject(result,'array-like result');
				assert.equal(result['a'],'start-a-pma-b', 'expected result');
				assert.equal(result['b'],'start-a-pmb-c-d', 'expected result');
			});
		});

		it('result accumulation with error', function(done){
			F(a,e,
				pe
			)('start',function(err,result1,result2){
				done();
				assert.isObject(err,'array-like error');
				assert.lengthOf(Object.keys(err),2,'error length');
				assert.notOk(err[0],'no error');
				assert.equal(err[1],'err as requested', 'expected error');
				assert.equal(result1,'start-a-pe1', 'expected result');
				assert.notOk(result2,'expected null result');
			});
		});

		it('shorthand for parallel (array)', function(done){
			F(a,e,
				[b,c,d,'foo']
			)('start',function(err,resultb,resultc,resultd){
				done();
				assert.isObject(err,'array-like error');
				assert.lengthOf(Object.keys(err),3,'error length');
				assert.notOk(err[0],'no error');
				assert.notOk(err[1],'no error');
				assert.notOk(err[2],'no error');
				assert.equal(resultb,'start-a-b', 'expected result');
				assert.equal(resultc,'start-a-c', 'expected result');
				assert.equal(resultd,'start-a-d', 'expected result');
			});
		});

		it('shorthand for parallel (object)', function(done){
			F(a,e,
				{'resultb':b,'resultc':c,'resultd':d,'foo':2}
			)('start',function(err,result){
				done();
				assert.isObject(err,'array-like error');
				assert.lengthOf(Object.keys(err),3,'error length');
				assert.notOk(err.resultb,'no error');
				assert.notOk(err.resultc,'no error');
				assert.notOk(err.resultd,'no error');
				assert.isObject(result,'array-like result');
				assert.lengthOf(Object.keys(result),3,'error length');
				assert.equal(result.resultb,'start-a-b', 'expected result');
				assert.equal(result.resultc,'start-a-c', 'expected result');
				assert.equal(result.resultd,'start-a-d', 'expected result');
			});
		});

	});
	
	describe('exit helper tests -> ', function(){
		it('sequence with exit on error (exit)', function(done){
			F(a,x,e,b)('please_err',function(err,result){
				done();
				assert.ok(err,'truthy error');
				assert.equal(err,'err as requested', 'expected error');
			});
		});

		it('sequence with exit on result (exit)', function(done){
			F(a,re,b)('input',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.equal(result,'input-a', 'expected result');	
			});
		});

		it('sequence with exit on result (no exit)', function(done){
			F(a,re,b)('please_err',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.equal(result,'null-b', 'expected result');	
			});
		});
	});

	describe('"while" helper tests -> ', function(){

		var lessThanCount = function(input, next){
			var check = !( (this.myCount || 0) >=input.maxCount );
			delayed(25)(check,next);
		};

		var myLoopedFunc = function(err,input,next){
			this.myCount = this.myCount || 0;
			this.myCount++;

			delayedNoErr(25)(next);
		};

		it('test of a "while" costruct augmentation (0)', function(done){
			F.while(lessThanCount, myLoopedFunc)({maxCount:0},function(err,result){
				done();
				assert.isUndefined(result.myCount);
			});
		});

		it('test of a "while" costruct augmentation (7)', function(done){
			F.while(lessThanCount, myLoopedFunc)({maxCount:7},function(err,result){
				done();
				assert.equal(result.myCount,7);
			});
		});

		it('test of a "while" costruct augmentation (10)', function(done){
			F.while(lessThanCount, myLoopedFunc)({maxCount:10},function(err,result){
				done();
				assert.equal(result.myCount,10);
			});
		});
	});


	describe('augmentation tests -> ', function(){
		beforeEach(function(){
			F.augment({'jumpWithArgs':function(c,array){
				this.setNextStepId(c+1);
				this.runOneStep(c,array);
			}})
		});

		it('sequence using jump augmentation', function(done){

			var j5 = function(input,next){
				this.F.jumpWithArgs(5, [input+'-goto']);
			};

			F(a,e,j5,b,e,c,e,d)('start',function(err,result){
				done();
				assert.equal(result,'start-a-goto-c-d');
			});

		});
	});


});

