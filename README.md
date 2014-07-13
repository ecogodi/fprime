F
=

Another asynchronous flow control library for javascript. 
It has a very simple core, but is instrumented to add more complex, customized constructs.


### 30 seconds intro for Step users

```javascript

    var F = require('f');

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
* F returns a sequence function while Step executes it right away
* in F the callback to execute the next step is provided as last argument, whereas in Step it's bound as `this`
* in F you **must** call or pass `next`, it doesn't support Step's synchronous behaviour on function return


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

The step functions are assumed to follow node conventions, i.e. to be in the form `func(err, [args...], callback)` or `func([args...], callback)`. The `next` function is injected by F as last argument passed to a step.

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
All step functions are bound by F to a context where information can be kept for the duration of the sequence.

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

### Parallelization
Parallel execution is supported through the use of the `next.push()` method attached to the injected next function. This method takes an optional key (see later) and generates a special _parallel next_ function. As with the usual next, it can be called manually or used as an async procedure callback.
Only after completion of all parallel executions the grouped errors and results are forwarded to next step.

#### "Numeric" result grouping
Calling `next.push()` with no key will return parallel execution functions and count them: 

```javascript   

    var myPrlSeq = F(
        fs.readdir,
        function b(err, filenames, next){
            next.push()(null,'sync result'); // first parallel
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

    // -> { '0': null, '1': null, '2': null }, '1': 'sync result', '2': 11, '3': 12 } (e.g.)

```

#### "Map" result grouping
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

**Nota Bene:** you _can_ pass numeric keys as in `next.push(42)`. If _all_ keys are numeric, the results will still be grouped as in the array-like case. Since you can provide any numeric key the array might be _sparse_ resulting in some arguments being fed as undefined to the next step.

#### Caveats
*  If a parallelized function executes a callback with more than one result argument, an array of values will be grouped instead of a single result value.
*  if a next.push() result is 

Slightly less basic use
-----------------------

### Nested sequences

TODO: documentation (see tests for examples)

#### Compact notation for filtering/mapping
TODO: documentation (see tests for examples)

### Contextual F namespace

The context of step execution, that is the sequence "state", comes populated with a namespace, **F**, containing utility methods available to step functions.

#### this.F.exit(err, result)
Exits the current sequence by immediatly executing the final sequence callback with given error and result.

#### this.F.rewind()
Resets the current sequence, so that `next` actually points to the first step. The sequence state, though, is preserved for the next loop. 


If you need more (hint: you will)
----------------

You might have noticed that the main entry point for the package is not the core F (`/lib/f.js`) but rather the **F'** wrapper (`fprime.js`).

F' decorates the core F with extra utility features. This is actually the suggested main way to use F: enrich it with the helpers and augmentations you need.

### Helpers
Helpers are functions attached to the main exported function and broadly come in two categories: _step helpers_ and _generator helpers_. The former can be slotted in any sequence to provide some standard behaviour. The latter are functions that generate steps/sequences.

#### F.onErrorExit(err, args..., cb)
This helper _step_ function will exit the sequence if it is fed a non-null error (or a map containing a non-null error). if no error was passed, it will forward _only_ the remaining args to the next step. Useful as an adapter for pre-made functions that  take no error as an argument.

#### F.onResultExit(err, result, cb)
This helper _step_ function will exit the sequence if it is fed a non-null result (or a map containing a non-null result). In all other cases it will forward the received err and (null-ish) result to the next step.

#### F.while(checkFun, loopFun)
Given an (async) check function returning a boolean and an (async) loop function, this helper returns a sequence that:

1. feeds its input to the loop function
2. each time the check function returns true, executes the looped function
3. when the check function return false, the sequence is exited to the final callback with the sequence state as argument

TODO: examples of use

### Nested sequences

TODO: documentation (see tests for examples)

### Augmentations

TODO: documentation (see tests for examples)

