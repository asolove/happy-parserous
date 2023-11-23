// Reminding myself how to build a backtracking monad
// to solve 8 queens.
function pickCol(next) {
    for(let i=0; i<8; i++) {
        let r = next(i);
        if (r.type==='success') {
            return r;
        }
    }
    return {type: 'error', message: 'ran out of values'};
}

function checkCol(val, n) {
    for(let i=0; i<val.length; i++) {
        if(val[i] === n) 
            return false;
        if(Math.abs(val[i] - n) === val.length - i)
            return false;
    }
    return true;
}

function done(value) {
    return {type: 'success', value}
}

function guard(test, next) {
    if(test()) {
        return next();
    } else {
        return {type: 'error', message: 'failed guard'};
    }
}

let next = done;
for(let i=0; i<8; i++) {
    let oldNext = next;
    next = (val) => {
        return pickCol((n) => {
            return guard(() => {
                return checkCol(val, n);
            }, () => {
                return oldNext([...val, n])
            });
        });
    };
}

console.log(next([]));

// Ok so that works but it forces us to write the whole thing
// as a stack of callbacks, which is unpleasant for a parser DSL
// Can we find a way to sugar this up so we have nice combinators
// that don't have be nested scopes to combine data?

/*
    digit = char('1') -> (c) => (s, next) => if s = c then next(i+1) else error
    int = oneOrMore(digit) -> (p) => (s, next) => 
    float = seq(oneOrMore(digit), char('.'), oneOrMore(digit))

    parse(float)
        -> 
*/
