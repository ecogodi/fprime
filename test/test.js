var chai = require('chai');
var assert = chai.assert;
var F = process.env.TESTMODE==='COVERAGE' ? require('./cov/fprime.js') : require('..');
var utils = require('./testutils.js');

function a(input,next){
	utils.debug('a:',input);
	if(input == 'please_err')
		utils.delayedErr(10)(next);
	else
		utils.delayedResult(5)(input+'-a',next);
}

function s(input,next){
	utils.debug('s:',input);
	this.foo = 'bar';
	this.parent.foo = 'baz'
	
	utils.delayedResult(10)(input,next);
}

function b(input,next){
	utils.debug('b:',input);
	utils.delayedResult(12)(input+'-b',next);
}

function c(input,next){
	utils.debug('c:',input);
	utils.delayedResult(13)(input+'-c',next);
}

function d(input,next){
	utils.debug('d:',input);
	utils.delayedResult(14)(input+'-d',next);
}

function p(input, next){
	utils.debug('p:',input);
	utils.delayedResult(13)(input+'-p1', next.push());
	utils.delayedResult(15)(input+'-p2', next.push(2));
}

function pn(input, next){
	utils.debug('pn:',input);
	utils.delayedResult(13)(input+'-pna',next.push('a'));
	utils.delayedResult(12)(input+'-pnb',next.push('b'));
}

function pm(input, next){
	utils.debug('pm:',input);

	F(b)(input+'-pma',next.push('a'));
	F(c,e,d)(input+'-pmb',next.push('b'));
}

function pe(input,next){
	utils.debug('pe:',input);
	utils.delayedResult(15)(input+'-pe1',next.push());
	utils.delayedErr(12)(next.push());
}

function x(err,input,next){
	utils.debug('x:',err,input);
	next(err,'x0',input+'-x');
}

function y(input0,input1,next){
	utils.debug('y:',input0,input1);
	next(input1+'-y');
}

function i(err,result,next){
	utils.debug('i:', arguments);
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

		it('recycled sequence', function(done){
			var ab = F(a,e,b);
			F([ab])(['input',42],function(err,result){
				done();
				assert.deepEqual(err,{});
				assert.deepEqual(result, { '0': 'input-a-b', '1': '42-a-b' });
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
			)('start',function(err,result1,result2,result3,result4){
				done();
				assert.deepEqual(err,{},'empty error');
				assert.equal(result1,'start-a-p1', 'expected result');
				assert.notOk(result2,'expected null');
				assert.equal(result3,'start-a-p2', 'expected result');
				assert.isUndefined(result4,'no more results');
			});
		});

		it('result accumulation with named params', function(done){
			F(a,e,
				pn,i
			)('start',function(err,result){
				done();
				assert.deepEqual(err,{},'empty error');
				assert.isObject(result,'array-like result');
				assert.lengthOf(Object.keys(result),2,'result length');
				assert.equal(result['a'],'start-a-pna', 'expected result');
				assert.equal(result['b'],'start-a-pnb', 'expected result');
			});
		});

		it('result accumulation in sequence', function(done){
			F(a,e,
				pm,i
			)('start',function(err,result){
				done();
				assert.deepEqual(err,{},'empty error');
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
				assert.notOk(err[0],'no error');
				assert.equal(err[1],'error_message', 'expected error');
				assert.equal(result1,'start-a-pe1', 'expected result');
				assert.notOk(result2,'expected null result');
			});
		});

		it('result accumulation with sync calls', function(done){
			F(
				function(input,next){
					utils.delayedErr(30)(next.push('async'));
					utils.delayedResult(10)('aresult2',next.push('async2'));
					next.push('sync')(null,'sresult');
					next.push('sync2')(null,'sresult2');
				}
			)('start',function(err,result){
				done();
				assert.isObject(err,'array-like error');
				assert.notOk(err['sync'],'no error');
				assert.notOk(err['sync2'],'no error');
				assert.notOk(err['async2'],'no error');
				assert.equal(err['async'],'error_message','expected error');
				assert.isObject(result,'array-like result');
				assert.lengthOf(Object.keys(result),4,'result length');
				assert.equal(result['sync'],'sresult', 'expected result');
				assert.equal(result['sync2'],'sresult2', 'expected result');
				assert.equal(result['async2'],'aresult2', 'expected result');
				assert.notOk(result['async'],'no result');
			});
		});
	});

	describe('shorthand tests -> ', function(){

		it('shorthand parallel over args', function(done){
			F(
				[a,'const',42],
				[,b,d,8]
			)('start',function(err,resultb,resultc,resultd){
				done();
				assert.isObject(err,'array-like error');
				assert.lengthOf(Object.keys(err),0,'error length');
				assert.equal(resultb,'start-a-b', 'expected result');
				assert.equal(resultc,'const-d', 'expected result');
				assert.equal(resultd,'8', 'expected result');
			});
		});

		it('shorthand parallel', function(done){
			F( a,e,
				{'resultb':b,'resultc':c,'resultd':d,'foo':F(42)}
			)('start',function(err,result){
				done();
				assert.isObject(err,'array-like error');
				assert.lengthOf(Object.keys(err),0,'error length');
				assert.isObject(result,'array-like result');
				assert.lengthOf(Object.keys(result),4,'result length');
				assert.equal(result.resultb,'start-a-b', 'expected result');
				assert.equal(result.resultc,'start-a-c', 'expected result');
				assert.equal(result.resultd,'start-a-d', 'expected result');
				assert.equal(result.foo,42, 'expected result');
			});
		});

		it('shorthand map (over array)', function(done){
			F(
				[,[a]]
			)('input1', ['input2-1','input2-2','input2-3'], 'input3', function(err, result){
				done();
				assert.isObject(err,'array-like error');
				assert.notOk(err[0].t,'no error');
				assert.notOk(err[1],'no error');
				assert.isObject(result,'array-like result');
				assert.deepEqual(result,{ '0': 'input2-1-a', '1': 'input2-2-a', '2': 'input2-3-a' }, 'expected result');
				
			});
		});

		it('shorthand map (over object)', function(done){
			F(
				[,[a],b]
			)('input1', {t:'input2'}, 'input3', function(err, result1, result2){
				done();
				assert.isObject(err,'array-like error');
				assert.notOk(err[0].t,'no error');
				assert.notOk(err[1],'no error');
				assert.isObject(result1,'array-like result');
				assert.deepEqual(result1,{t:'input2-a'}, 'expected result');
				assert.equal(result2,'input3-b', 'expected result');
				
			});
		});

	});
	
	describe('"result" helper tests -> ', function(){
		
		it('constant value', function(done){
			F(F.result('myresult'),F.onErrorExit,a)('start',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.ok(result,'truthy result');
				assert.equal(result,'myresult-a', 'expected result');
			});
		});

		it('sync function result', function(done){
			var syncFunc = function(){ return 40 +2 };

			F(F.result(syncFunc),F.onErrorExit,a)('start',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.ok(result,'truthy result');
				assert.equal(result,'42-a', 'expected result');
			});
		});

	});

	describe('"set" helper tests -> ', function(){
		it('set a state', function(done){
			F(F.set({foo:'baz', bar:42}),a)('start',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.ok(result,'truthy result');
				assert.equal(result,'start-a', 'expected result');
				assert.equal(this.foo, 'baz', 'expected state');
				assert.equal(this.bar, 42, 'expected state');
			});
		})
	});


	describe('"exit" helper tests -> ', function(){
		it('sequence with exit on error (exit)', function(done){
			F(a,x,e,b)('please_err',function(err,result){
				done();
				assert.ok(err,'truthy error');
				assert.equal(err,'error_message', 'expected error');
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
				assert.equal(result,'undefined-b', 'expected result');	
			});
		});
	});

	describe('"if" helper tests -> ', function(){

		var checkTrue = function(input, next){
			utils.delayedResult(5)(true,next);
		};
		var checkFalse = function(input, next){
			utils.delayedResult(5)(false,next);
		};
		var checkErr = function(input, next){
			utils.delayedErr(5)(next);
		};

		it('test of a "if" helper (false)', function(done){
			F.if(false, a)('start',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.ok(result,'state');
			});
		});

		it('test of a "if" helper (truthy)', function(done){
			F.if(1, a)('start',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.equal(result,'start-a', 'expected result');
			});
		});

		it('test of a "if" helper (function returning true)', function(done){
			F.if(checkTrue, a)('start',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.equal(result,'start-a', 'expected result');
			});
		});

		it('test of a "if" helper (function returning false)', function(done){
			F.if(checkFalse, a)('start',function(err,result){
				done();
				assert.notOk(err,'no error');
				assert.ok(result,'state');
			});
		});

		it('test of a "if" helper (function returning error)', function(done){
			F.if(checkErr, a)('start',function(err,result){
				done();
				assert.equal(err,'error_message');
				assert.notOk(result,'no result');
			});
		});
	});

	describe('"while" helper tests -> ', function(){

		var lessThanCount = function(input, next){
			var check = !( (this.loopCount || 0) >= input.maxCount );
			utils.delayedResult(5)(check,next);
		};
		var myLoopedFunc = function(input, next){
			this.loopCount = (this.loopCount || 0) + 1;
			this.output = (this.output || '') + 'foo';
			utils.delayed(5)(next);
		};
		var checkErr = function(input, next){
			utils.delayedErr(5)(next);
		};

		it('test of a "while" helper (0)', function(done){
			F.while(lessThanCount, myLoopedFunc)({maxCount:0},function(err,state){
				done();
				assert.isUndefined(state.loopCount);
				assert.isUndefined(state.output);
			});
		});

		it('test of a "while" helper (3)', function(done){
			F.while(lessThanCount, myLoopedFunc)({maxCount:3},function(err,state){
				done();
				assert.equal(state.loopCount,3, 'expected result');
				assert.equal(state.output,'foofoofoo', 'expected result');	
			});
		});

		it('test of a "while" helper (7)', function(done){
			F.while(lessThanCount, myLoopedFunc)({maxCount:7},function(err,state){
				done();
				assert.equal(state.loopCount,7, 'expected result');
				assert.equal(state.output,'foofoofoofoofoofoofoo', 'expected result');
			});
		});

		it('test of a "while" helper (error in check)', function(done){
			F.while(checkErr, myLoopedFunc)({maxCount:7},function(err,result){
				done();
				assert.equal(err,'error_message');
				assert.notOk(result,'no result');
			});
		});
	});


	describe('augmentation tests -> ', function(){
		beforeEach(function(){
			var myAugment = 
				{
					name: 'jumpWithArgs',
					type: 'stateF',
					f: function(c,array){
						this.setNextStepId(c+1);
						this.runOneStep(c,array);
					}
				};

			F.augment(myAugment);
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

