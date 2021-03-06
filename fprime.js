(function(){
    var F = require('./lib/f.js');

    // You're strongly encouraged to mix and match: pick the helpers you really need and add your own


    // ----------------------------------------------
    // Steps
    // ----------------------------------------------

    F.onErrorExit = function(){
        var args = Array.prototype.slice.call(arguments);
        var next = args.pop();
        var err = args.shift();

        if(!err)
            next.apply(this,args);
        else if(typeof err === 'object'){
            for(var prop in err) {
                if(err.hasOwnProperty(prop)){
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
        var next = args.pop();
        var err = args.shift();

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

    F.ifFalseExit = function(){
        var args  = Array.prototype.slice.call(arguments);
        var next  = args.pop();
        var err   = args.shift();
        var check = args.shift();

        if(err)
            return this.F.exit(err);
        if(!check)
            return this.F.exit();
        next.apply(this,args);
    }

    // ----------------------------------------------
    // Factories
    // ----------------------------------------------

    F.set = function(ob){
        var s = ob;
        return function(){
            for(var p in s)
                this[p] = s[p];
            var args = Array.prototype.slice.call(arguments),
                next = args.pop();
            next.apply(this, args);
        };
    }

    F.result = function(res){
        var r = res;
        return function(){
            var args = Array.prototype.slice.call(arguments),
                next = args.pop(),
                value = r;
            
            if(typeof r == 'function'){
                try{
                    value = r.apply(this,args);
                } catch (e){
                    return next(e,null);
                }
            }
            next(null,value);
        }
    }

    F.while = function(check, f){
        var saveInput = function(){
            var args = Array.prototype.slice.call(arguments),
                next = args.pop();
            if(!this._input)
                this._input = args;
            next.apply(this, this._input);
        }
        // user-provided check function
        // check(input,next) -> (err,bool,next)
        // 
        // F.ifFalseExit
        // 
        var retrieveInput = function(next){
            next.apply(this, this._input);
        }
        // user-provided looped function
        // f(input,next) -> (err,next)
        //
        // F.onErrorExit
        //  
        var loop = function(next){
            this.F.rewind();
            next();
        }

        return F(saveInput,check,F.ifFalseExit,retrieveInput,f,F.onErrorExit,loop).bind(this);
    };


    F.if = function(check, f){
        var saveInput = function(){
            var args = Array.prototype.slice.call(arguments),
                next = args.pop();
            if(!this._input)
                this._input = args;
            next.apply(this, this._input);
        }
        // user-provided check function
        // check(input,next) -> (err,bool,next)
        // 
        // F.ifFalseExit
        // 
        var retrieveInput = function(next){
            next.apply(this, this._input);
        }
        // user-provided function
        // f(input,next) -> (err,next)
        // 
        return F(saveInput,check,F.ifFalseExit,retrieveInput,f).bind(this);
    };


    F.map = function(f){
        return function(){
            var args = Array.prototype.slice.call(arguments),
                next = args.pop(),
                iterable = args.shift();
            if(iterable && f){
                for(var i in iterable){
                    if(iterable.hasOwnProperty(i)){
                        if(typeof f !== 'function')
                            f = F(f);
                        f.bind(this)( iterable[i], next.push(''+i) );
                    }
                }
            }
            else
                next();
        }
    }

    F.parallelArgs = function(){
        var parallelSteps = Array.prototype.slice.call(arguments);
        return function(){
            var args = Array.prototype.slice.call(arguments),
                next = args.pop();

            for(var p in parallelSteps){
                var f = null;
                if(typeof parallelSteps[p] === 'function')
                    f = parallelSteps[p];
                else if(parallelSteps[p] !== undefined && parallelSteps[p] !== null)
                    f = F(parallelSteps[p]);
                if(f)
                    f.bind(this)( args[p], next.push() );
            }
        };
    }

    F.parallel = function(parallelSteps){
        return function(){
            var args = Array.prototype.slice.call(arguments),
                next = args.pop();

            for(var p in parallelSteps){
                if(!isNaN(p))
                    nk = parseInt(p,10);
                else
                    nk = p;

                var f = null;
                if(typeof parallelSteps[p] === 'function')
                    f = parallelSteps[p];
                else if(parallelSteps[p] !== undefined && parallelSteps[p] !== null)
                    f = F(parallelSteps[p]);
                if(f)
                    f.apply( this, args.concat(next.push(nk)) );
            }
        };
    }

    // a few short notations for common operators, added as augmentation:
    var shorthands = [];
    shorthands.push({
        name: 'shorthand_array',
        type: 'stepFilter',
        f: function(step){
            if(step instanceof Array){
                var stepArray = step;

                if(step.length>1){
                    step = F.parallelArgs.apply(this, stepArray);
                }
                else if(step.length==1){
                    step = F.map(stepArray[0]);
                }
            }
            return step;
        },
        options: {order: 10}
    });
    shorthands.push({
        name: 'shorthand_object',
        type: 'stepFilter',
        f: function(step){
            if(typeof step === 'object'){
                var stepMap = step;
                step = F.parallel(stepMap);
            }
            return step;
        },
        options: {order: 20}
    });
    shorthands.push({
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
    });
    F.augment(shorthands);

    if (typeof module.exports !== "undefined") {
        module.exports = F;
    }
    
})();