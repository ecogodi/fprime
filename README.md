F
=

Another async sequences execution library.  
It has a very simple core, but is instrumented to add more complex flow control features.


### 30 seconds intro for Step users


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

Key differences from Step:
* F returns a sequence function while Step executes it right away
* in F the callback to execute the next step is provided as last argument, whereas in Step it's bound as `this`
* in F you **must** call or pass `next`, it doesn't support Step's synchronous behaviour on function return


Core features and basic use
---------------------------
The module exports a single function. Call this function with a sequence of step functions to get a new _sequence_ function:

    var mySeq =F(
    	function a(input, next){ 
    		var out1 = input,
    			out2 = 'baz' + input;
    		// next must be called 'manually' or passed as completion cb of an async procedure
    		next(null, out1, out2); 
    	},
    	function b(err, arg1, arg2, next){
    		var out = arg1 + arg2; 
    		next(null, out, 42); // last step, this will call the sequence final callback
    	}
    );

The step functions are assumed to follow node conventions, i.e. to be in the form `func(err, [args...], callback)` or `func([args...], callback)`. The `next` callback is injected by F as last argument passed to a step when the previous one executes its callback.

	mySeq('foo',function(err, result1, result2){
        console.log(result1, result2);
    })
    // -> foobazfoo 42

    mySeq('bar',function(err, result1, result2){
        console.log(result1, result2);
    })
    // -> barbazbar 42

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
Parallel execution is supported through the use of the `next.push()` method attached to the injected next callback.

#### Array-like result grouping
TODO

#### Map-like result grouping
Alternatively, you can give strings as keys in `next.push`

	var mySeq = F(
    	fs.readdir,
    	function b(err, filenames, next){
    		if(err)
    			return next(err);
            for(var i in filenames)
    		  fs.stat(__dirname+'/'+filenames[i], next.push(filenames[i]));
    	}
    );

	mySeq(__dirname, console.log);

As in the previous case, all functions will execute in parallel. When _all_ of them have finished, the next step will be executed and passed:

1. a map of errors, with the given keys and for each the error of that execution, if any
2. a map of results, with the given keys and for each the result of that execution

#### Shorthand for parallelization
TODO

If you need more 
----------------
#### (hint: you will)

You might have noticed that the main entry point for the package is not the core F (`/lib/f.js`) but rather the **F'** wrapper (`fprime.js`).

F' decorates the core F with extra utility features. This is actually the suggested main way to use F: enrich it with the helpers and augmentations you need (see later).

### Helpers
Helpers are functions attached to the main exported function. They all accept callbacks as last arguments and can be dropped in place of a step in any sequence.

#### F.onErrorExit(err, result, cb)
This helper step function will exit the sequence if it is fed a non-null error (or a map containing a non-null error).

#### F.onResultExit(err, result, cb)
This helper step function will exit the sequence if it is fed a non-null result (or a map containing a non-null result).

#### F.while(checkFun,loopFun)
Given an (async) check function returning a boolean and an (async) loop function, this helper returns a sequence that:

1. feeds its input to the loop function
2. each time the check function returns true, executes the looped function
3. when the check function return false, the sequence is exited to the final callback with the sequence state as argument

TODO: example of use

### Nested sequences

TODO

### Inner F namespace and augmentations

TODO

-------------------
Addendum: rationale for yet-another-async-flow-library
------------------------------------------------------

**Step** is neat and svelte, but has a few quirks I found unpleasant
* by _returning_ sequence functions, F is intended to build nestable code blocks, doing away with wrapping Step in functions and passing arguments through closures
* expecting the continuation callback as last argument, most node-styled functions can be dropped in place as a sequence step
* `this` is freed for use as a persistent state

On the other hand **Async** offers a lot more: looping constructs, mapping, retries, worker queues, etc.
Along with what you need, though, comes a lot you won't use at the same time, or that would better be replaced by different, more focused tools. 
Also, you aren't always given complete control over the execution: what if we need an `async.map` that doesn't end at first error, or ends as soon as we got k results out of n? 
* by starting with an elementary core of features on which helpers and augmentations are built, F aims at letting you define or reuse exactly the constructs you need 