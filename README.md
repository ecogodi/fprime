F'
====

[![Build Status](https://travis-ci.org/ecogodi/fprime.svg)](https://travis-ci.org/ecogodi/fprime)
[![Coverage Status](https://img.shields.io/coveralls/ecogodi/fprime.svg)](https://coveralls.io/r/ecogodi/fprime)

**F'** - or _F prime_ - is another asynchronous flow control library for javascript. 
It has a very simple core, but is instrumented to add more complex, customized constructs. 
For reasons clarified [later][needmore], it will also be referred to as simply **F**.

### 30 seconds intro for Step users

```javascript

    var mySeq = F(
        fs.readFile,
        F.onErrorExit, // an helper function, see later
        function capitalize(text, next){
            next(text.toString().toUpperCase());
        }
    );

    mySeq(__filename,function(err, newUpText) {
        if (err) 
            throw(err);
        else
            console.log(newUpText);
    }

```

Key differences from Step:
* **F** returns a sequence function while Step executes it right away
* in **F** the callback to execute the next step is provided as last argument, whereas in Step it's bound as `this`
* in **F** you **must** call or pass `next`, it doesn't support Step's synchronous behaviour on function return (but you can explicitely wrap a sync function with the [`F.result` helper][fresult]).


Core features and basic use
---------------------------
The module exports a single function. Call this function with a sequence of step functions to get a new _sequence_ function:

```javascript

    var mySeq = F(
        function a(input, next){ 
            var out1 = input,
                out2 = 'baz' + input;
            // next must be called 'manually' or passed 
            // as completion callback of an async.
             procedure
            next(null, out1, out2); 
        },
        function b(err, arg1, arg2, next){
            var out = arg1 + arg2; 
            next(null, out, 42); // last step, this will call the sequence final callback
        }
    );

```

The step functions are assumed to follow node conventions, i.e. to be in the form `func(err, [args...], callback)` or `func([args...], callback)`. The `next` function is injected by **F** as last argument passed to a step.

```javascript

    mySeq('foo',function(err, result1, result2){
        console.log(result1, result2);
    })
    // -> foobazfoo 42

    mySeq('bar',function(err, result1, result2){
        console.log(result1, result2);
    })
    // -> barbazbar 42

```

The sequence function itself accepts input arguments and a _final callback_ with error as a first argument. The input arguments are passed to the first step, then the sequence steps are executed in order, each one calling the next step upon completion or passing it as an async callback to some operation. The last step in turn calls the final (sequence) callback as next.


### Sequence State
All step functions are bound by **F** to a context where information can be kept for the duration of the sequence.

```javascript

    var mySeq = F(
        function save(filename, next){
            // we store something in the sequence state
            this.filename = filename; 
            fs.readFile(filename,{encoding:'utf8'},next);
        },
        function capitalize(err, text, next){
            next(text.toUpperCase());
        },
        function format(newText, next){
            // we retrieve from the sequence state
            var snippet = this.filename+': '+newText.substr(0,20);
            next(null,snippet);
        }
    );

```

The final callback is also called bound to this context.

### Parallelization
Parallel execution is supported through the use of the `next.push()` method attached to the injected next function. This method takes an optional key (see later) and _generates_ a special _parallel next_ function. As with the usual next, it can be called manually or used as an async procedure callback.
Only after completion of all parallel executions the grouped errors and results are forwarded to next step.

#### "Queued" parallel results
Calling `next.push()` with no key will generate a new parallel execution function: 

```javascript   

    var myPrlSeq = F(
        fs.readdir,
        function b(err, filenames, next){
            next.push()(null,'sync'); // first parallel
            fs.open(__dirname+'/'+filenames[1], 'r', next.push() ); // second parallel
            fs.open(__dirname+'/'+filenames[2], 'r', next.push() ); // third parallel
        }
    );

```

All functions will execute in parallel and are expected to end calling (err, result). When _all_ of them have finished, the next step will be fed:

1. a map of execution errors with numeric keys, in the order in which they were pushed 
2. the results of the parallel executions, as arguments, in the order in which they were pushed 

```javascript  

    myPrlSeq(__dirname, console.log );

    // -> { '0': null, '1': null, '2': null }, '1': 'sync', '2': 11, '3': 12 } (e.g.)

```

#### "Mapped" parallel results
Alternatively you can explicitely provide keys in `next.push`, to get "named" parallel execution functions:

```javascript

    var myPrlSeq2 = F(
        fs.readdir,
        function b(err, filenames, next){
            if(err)
                return next(err);
            for(var i in filenames)
              fs.stat(__dirname+'/'+filenames[i], next.push(filenames[i]));
        }
    );

    myPrlSeq2(__dirname, console.log);
    
```

As in the previous case, all functions will execute in parallel. When _all_ of them have finished, the next step will be fed:

1. a map of errors, with the given keys and for each the error of that execution
2. a map of results, with the given keys and for each the result of that execution

#### Nota Bene:
* you can pass numeric keys to the generator, as in `next.push(42)`. If _all_ keys are numeric, the results will still be grouped as in the queued case. Since you can provide any numeric key the arguments array fed to the next step might be _sparse_, resulting in some arguments being undefined.
* if a parallelized function executes a callback with more than one result argument, an array of values will be grouped instead of a single result value.
* if you mix synchronous calls of parallel next functions with asynchronous passing of callbacks, the sync. calls will execute immediatly, but their result will still wait the async. ones.

Slightly less basic use
-----------------------

### Contextual F namespace

The context of step execution, that is the sequence "state", comes populated with a namespace, **F**, containing utility methods available to step functions.

#### this.F.exit(err, result)
Exits the current sequence by immediatly executing the final sequence callback with given error and result. As usual, the sequence state is available to the final callback as binding context.

#### this.F.rewind()
Resets the current sequence, so that `next` actually points to the first step. The sequence state, though, is preserved for the next loop. 

Additional utility methods can be added through [_augmentations_][augments] (see later). 

### Nested sequences
Since each **F** sequence is itself a function taking arguments and a callback, it can be nested as a step of another sequence. 
A child sequence has a reference to the state of its parent in the state property `this.parent`. A top-level sequence has the context of the call of **F** set as its parent property.

```javascript

    var exitGrandparent = function(input,next){
        ...
        this.parent.parent.F.exit(null,out);
    }
            
    F(
        a,b,
        F(c,d,F(e,exitGrandparent)),
        x,y
    )( ... , finalCb);
    
    // will execute a,b,c,d,e then exit by calling finalCb(null,out)
```

### Compact notation and mapping
A few shorthand notations are implemented in **F'** as augmentations:

##### Map function over iterable

```javascript
    
    F(
        a,
        [b]
    )( ... , finalCb);
    
    // b is called in parallel iterating over all properties of the first argument
    // with which a called next; each parallel is called with the key of iteration
```
This notation makes use of the [`F.map` helper][fmap], see later

##### Parallel execution of functions

```javascript
    
    F(
        a,
        { first:b, second:c }
    )( ... , finalCb);
    
    // b,c are called in parallel with keys 'first', 'second'; 
    // both are fed all the arguments passed to the step from a
```
This notation makes use of the [`F.parallel` helper][fparallel], see later

##### Parallel execution over arguments

```javascript
    
    F(
        a,
        [,b,,c]
    )( ... , finalCb);
    
    // b is applied to the second argument with which a called next, c to the fourth;
    // they are called in parallel with `next-push()` 
```
This notation makes use of the [`F.parallelArgs` helper][fparallelargs], see later

##### Value steps

```javascript
    
    F(
        42,a
    )( ... , finalCb);
    
    // a non-function step of given value is replaced by `next(null, value)`
```
This notation makes use of the [`F.result` helper][fresult], see later. 
Nota bene: this notation by default has a lower priority than the map/array ones, thus a step such as `{a:1,b:2}` will be interpreted as a parallel of two value steps, rather than an array value.

#### Composition
Compact notations _can_ be nested:

```javascript
    
    F(
        a,
        [,{map:[b], c:c}]
    )( ... , console.log);

    // -> { 
    //  '0': { '0': { map: [Object], c: null } },
    //  '1': { map: <mapresult>, c: <cresult>} 
    // }

```
This sequence will
* discard the first argument coming out of a
* execute in parallel over the second argument: mapping of b, function c

If you need more (hint: you will)
---------------------------------

You might have noticed that the main entry point for the package is not the core **F** (`/lib/f.js`) but rather the **F'** wrapper (`fprime.js`).

**F'** decorates the core F with extra utility features. This is actually the suggested main way to use **F**: enrich it with the helpers and augmentations you need.

### Helpers
Helpers are functions attached to the main exported function and broadly come in two categories: _step helpers_ and _factory helpers_. The former can be slotted in any sequence to provide some standard behaviour. The latter are functions that generate steps/sequences. 

#### Steps

##### F.onErrorExit(err, results..., cb)
This helper _step_ function will exit the sequence if it is fed a non-null error (or a map containing a non-null error). if no error was passed, it will forward _only_ the result args to the next step. Useful as an adapter for pre-made functions that take no error as an argument.

##### F.onResultExit(err, results..., cb)
This helper _step_ function will exit the sequence if it is fed a non-null result (or a map containing a non-null result). In all other cases it will forward the received err and (null-ish) result to the next step.

##### F.ifFalseExit(err, check, [args...], cb)
This helper _step_ function will exit the sequence if it is fed either a non-null error or a falsy check value. In all other cases it will forward _only_ the remaining args to the next step.

#### Factories

##### F.result( func | value )
Given a function, this helper generates a _step_ that executes the function _synchronously_ (called with the received parameters) then passes to the next step
* if the execution completes: a null error and the given sync. result
* if the execution throws: the catched exception as error and a null result

```javascript
    
    var syncFunc = function(){ return 40 +2 };

    var mySeq = F(
        F.result(syncFunc)
    );

    mySeq( null, console.log );

    // -> null 42 

```

If a constant value is given instead of a function, that value is passed to next as the step result.

##### F.set( object )
Given an object, this helper generates a _step_ that sets on the sequence state all the properties of the object and transparently passes all received argument to the following step.

```javascript
    
    var mySeq = F(
        F.set({ bar:1 }),
        function(string,next){ next(null, 'processed ' + string); },
        F.set({ foo:'baz', bar:42 })
    )

    mySeq( 'input', function(err,result){
        console.log( err, result, this.foo, this.bar );
    });

    // -> null 'processed input' 'baz' 42
```

##### F.map( func )
Given an (async) function, this helper generates a _step_ that iterates over all the properties of the _first argument received_, calling `func` on each value in parallel, with the property name as the parallel key.

```javascript
    
    var mySeq = F(
        F.map(fs.readFile),
        function(err, data, next){
            var sizes = {};
            for(d in data){
                if(!err[d])
                    sizes[d] = data[d].length;
            }
            next(err,sizes);
        }
    );

    mySeq({
        'first file':'existing_file.js', 
        'second file':'not_existing_file.js',
    }, console.log );

    // -> (e.g.) { 'second file': { [Error: ENOENT, open 'not_existing_file.js'] errno: 34, code: 'ENOENT', path: 'not_existing_file.js' } } { 'first file': 663 }
```

##### F.parallel( {key1:func1, ...} | [[func1, ...]] )
Given a map or array of functions, this helper generates a _step_ that executes all of them in parallel with the input arguments received. The function map keys or array indexes are used as parallel execution keys.

```javascript
    
    var sum_f     = function(a,b,cb){ cb(null, a+b); };
    var product_f = function(a,b,cb){ cb(null, a*b); };

    var mySeq = F(
        F.parallel({ s: sum_f, p: product_f })
    );

    mySeq( 4, 2, console.log);

    // -> {} { s: 6, p: 8 }

    /*
    basically equivalent to:
    var mySeq = F(
        function(a,b,next){
            sum_f(     a, b, next.push('s') );
            product_f( a, b, next.push('p') );
        }
    );
    */

```

Exactly as in the handwritten form, using a function map with only numeric keys ( or an array ) results in _queued_ parallelization, with the results being passed to next step as distinct arguments:

```javascript
    
    var mySeq = F(
        F.parallel( [ sum_f, product_f ] )
    );

    mySeq( 4, 2, console.log);

    // -> {} 6 8

```

##### F.parallelArgs( [func1], [func2], ... )
Given n (async) functions, this helper generates a _step_ that applies each function in order to the received arguments. Undefined/null places are skipped, and thus the corresponding argument discarded. The parallel execution is of the "queued" kind.

```javascript
    
    var double_f  = function(a,cb){ cb(null, 2*a); };
    var triple_f  = function(a,cb){ cb(null, 3*a); };

    var mySeq = F(
        F.parallelArgs(triple_f,null,double_f)
    );

    mySeq( 1, 2, 42, console.log);

    // -> {} 3 84 

```

##### F.if( checkFunc, func )
Given an (async) check function returning a boolean and an (async) function, this helper generates a _sequence_ that calls `func` with the given sequence arguments only if the checkFunc returns a truthy result. In case of a falsy check the sequence ends with neither error nor result.

```javascript

    var lessThanFortytwo = function(input, next){
        next( null, (input < 42) );
    };

    var doubleIt = function(input,next){
        next( null, 2*input);
    };

    var finalCb = function(err,result){
        if(err)
            console.log('Error: '+err);
        else
            console.log('Result: '+result);
    };

    myseq = F(
        F.if(lessThanFortytwo, doubleIt),
        F.onResultExit,
        'bigger than 41'
    );

    myseq( 3, finalCb );
    // -> 'Result: 6'

    myseq( 50, finalCb );
    // -> 'Result: bigger than 41'

```

##### F.while( checkFunc, loopFunc )
Given an (async) check function returning a boolean and an (async) loop function, this helper generates a _sequence_ that:

1. each time the check function returns true, executes the looped function. When the check function return false or error, the sequence is exited.
2. if the looped function forwards an error, the sequence is exited. Otherway, the result of the looped function is ignored and the sequence loops back to the chek step.
3. the final callback is called with an error, if any, and as usually bound to the sequence state.

Note that the input fed to the sequence is passed as arguments to both the check function and the looped function. The looped function is supposed to change the _state_ of execution or an external resource so that eventaully the check function returns false and the sequence ends.

If the execution of the looped function needs to provide a result, it can also be stored in the sequence state, available as context to the final callback.

```javascript

    var lessThanCount = function(input, next){
        if(typeof input.maxCount !== 'number' || input.maxCount<0)
            next('invalid input.maxCount'); //immediatly call next with error, triggers exit

        // we e.g. check the execution state against an initial input parameter
        var check = !( (this.loopCount || 0) >= input.maxCount );

        delayedResult(5)(check,next); //call next(null,check) after 5 ms
    };

    var myLoopedFunc = function(input,next){
        // we're not actually using the initial input here, but we could
        this.loopCount = (this.loopCount || 0) + 1;
        this.output = (this.output || '') + 'foo';

        delayed(5)(next); //call next() after 5 ms
    };

    var finalCb = function(err){
        if(err)
            console.log('Error: '+err);
        else
            console.log('Result: '+this.output);
    };


    F.while(lessThanCount, myLoopedFunc)( {maxCount:'baz'}, finalCb );
    // -> 'Error: invalid input.maxCount'

    F.while(lessThanCount, myLoopedFunc)( {maxCount:3}, finalCb );
    // -> 'Result: foofoofoo'

```

### Augmentations
Extension of core **F** can come in different forms:

1. define utility step functions aimed at common code reuse
2. register _augmentations_ to work through exposed _hooks_

**F'** actually does both: step and factory helpers (e.g `onErrorExit` or `while`) are simply utility functions that are attached to the **F** object, whereas shorthand notations are registered as augmentations of `stepFilter` type (see later). 

Augmentations are defined as objects of the form:
```javascript

    { 
        type: <string>,
        name: <string>,
        f:  <function>,
        [options: <object>]
    }

```
...and registered by calling `F.augment`, passing either a single augmentation or an array of.

#### type: stateF
The function defined in a `stateF` augmentation will be available (with the given augmentation name) in the execution state of any sequence under the `this.F` namespace, sibling to the predefined `exit` and `rewind` functions.
These functions will be bound to a subset of the "current run" private methods (`exit`, `rewind`, `setNextStep`, `runOneStep`; see code for further details).

```javascript
    // define an augmentation that allows jumping to any step in a sequence
    var jumpAugment = {
        type: 'stateF',
        name: 'jumpWithArgs',
        f: function(n,array){
            this.setNextStepId(n+1);  //set the next execution step to be the n+1-th
            this.runOneStep(n,array); //run the n-th execution steps with the given array of args
        }
    };

    F.augment(jumpAugment);

    var j5 = function(input,next){
        this.F.jumpWithArgs(5, [input+'->jump']);
    };

    var add = function(str){ return function(input,next){next( null, input+'->'+str )} };
    var e = F.onErrorExit;

    F(add('a'),e,j5,add('b'),e,add('c'),e,add('d'))( 'start', console.log );

    // -> null 'start->a->jump->c->d'
```

This type supports no options.

#### type: stepFilter
The function defined in a `stepFilter` augmentation will act as a _filter function_ taking in a step object (as passed to the **F** sequence) and returning a new step object that replaces it.
All registered `stepFilter` augmentations will be run on every step, in the order dictated by the `options.order` value.

For example **F'** implements "value steps" by registering the augmentation:

```javascript
    {
        name: 'shorthand_value',
        type: 'stepFilter',
        f: function(step){
            if(typeof step !== 'function'){
                var value = step;
                step = F.result(value);
            }
            return step;
        },
        options: {order: 99}
    }
```


-------------------------------------------------------------------------

[needmore]:      #if-you-need-more-hint-you-will
[fonerrorexit]:  #fonerrorexiterr-results-cb
[fresult]:       #fresultfunc--value
[fmap]:          #fmap-func-
[fparallelargs]: #fparallelargs-func1-func2--
[fparallel]:     #fparallel-key1func1---func1--
[augments]:      #augmentations
