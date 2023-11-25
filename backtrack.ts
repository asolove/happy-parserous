// Reminding myself how to build a backtracking monad
// to solve 8 queens.
function countNQueens(n) {

    function pickCol(next) {
        for(let i=0; i<n; i++) {
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
    
    
    function guard(test, next) {
        if(test()) {
            return next();
        } else {
            return {type: 'error', message: 'failed guard'};
        }
    }


    let r = 0; 
    function done(value) {
        r++;
        return {type: 'error', message: `Found ${r}: find another.`};
    }
    
    let next = done;
    for(let i=0; i<n; i++) {
        let oldNext = next;
        next = (val) => {
            return pickCol((n) => {
                return guard(() => checkCol(val, n), () => {
                    return oldNext([...val, n])
                });
            });
        };
    }
    
    console.log(next([]));
    return r;
}


// Ok so that works but it forces us to write the whole thing
// as a stack of callbacks to share state, which is unpleasant
// for a parser DSL.
// 
// Can we find a way to sugar this up so we have nice combinators
// that don't have be nested scopes to combine data?

/*
    digit = char('1') -> (c) => (s, next) => if s = c then next(i+1) else error
    int = oneOrMore(digit) -> (p) => (s, next) => 
    float = seq(oneOrMore(digit), char('.'), oneOrMore(digit))
    program = seq(float, EOF)

    seq(a, b) -> (next) => a((v1) => b((v2 => next())))

    base language:
    char('a') -> 'a' or error
    or a, b -> needs backtracking
    seq -> needs backtracking

    sugar:
    a+ -> seq(a, a*)
    a* -> or(a, next)
*/

type PartialParse<A> = {value: A, rest: string};
type Parser<A> = (input: string) => Iterable<PartialParse<A>>

function result<A>(value: A): Parser<A> {
    return function*(input: string) {
        yield {value, rest: input};
    }
}

const zero: Parser<never> = (_input: string) => {
    return [][Symbol.iterator]();
};

function* item(input: string): Iterable<PartialParse<string>> {
    if(input[0]) {
        yield {value: input[0], rest: input.slice(1)};
    } else {
        yield* zero(input);
    }
}

function bind<A, B>(p1: Parser<A>, next: (a: A) => Parser<B>): Parser<B> {
    return function*(input: string) {
        for(const {value, rest} of p1(input)) {
            yield* next(value)(rest);
        }
    }
}

function seq<A, B>(p1: Parser<A>, p2: Parser<B>): Parser<[A, B]> {
    return bind(p1, (a) => bind(p2, (b) => result([a, b])));
}

function sat(test: (string) => boolean): Parser<string> {
    return bind(item, (ch: string) => {
        if(test(ch)) {
            return result(ch);
        } else {
            return zero;
        }
    })
}
const char = (ch: string) => sat(x => x === ch);
const digit = sat(x => x >= '0' && x <= '9');
const upper = sat(x => x >= 'A' && x <= 'Z' );
const lower = sat(x => x >= 'a' && x <= 'z');
const alpha = plus(upper, lower);

const string: (string) => Parser<string> = (st: string) => {
    return function*(input: string) {
        if(input.slice(0, st.length) === st) {
            yield {value: st, rest: input.slice(st.length)}
        }  else {
            return zero;
        }
    }
}

function many<A>(p: Parser<A>): Parser<A[]> {
    return plus(bind(p, (r1) => {
        return bind(many(p), (rs) => {
            return result([r1, ...rs]);
        });
    }), result([]));
}

function many1<A>(p: Parser<A>): Parser<A[]> {
    return bind(p, (r1) => {
        return bind(many(p), (rs) => {
            return result([r1, ...rs]);
        });
    });
}

function plus<A>(p1: Parser<A>, p2: Parser<A>): Parser<A> {
    return function* (input: string) {
        yield* p1(input);
        yield* p2(input);
    }
}

const nat = bind(many1(digit), (ds) => result(parseInt(ds.join(''))));
const int = plus(nat, bind(seq(char('-'), nat), ([_c, n]) => result(-n)));
const float = seq(int, seq(char('.'), nat));

let p = seq(seq(seq(many(alpha), string('aa')), many(alpha)),  seq(int, float));

for(const {value, rest} of p("aaa-01234.012")) {
    console.log({value, rest});
}
