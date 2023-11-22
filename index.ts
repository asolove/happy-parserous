type ParseResult<A> = 
    | {type: 'success', result: [Parser<A>, A], nextIndex: number}
    | {type: 'error', index: number, message: string}

abstract class Parser<A> {
    abstract *parse(input: string, i: number): IterableIterator<ParseResult<A>>
}

class CharacterParser extends Parser<string> {
    ch: string;

    constructor(ch: string) {
        super();
        if(typeof ch !== 'string' || ch.length !== 1) throw new Error(`Invalid character parser: expected one character but received ${ch}`);
        this.ch = ch;
    }

    *parse(input: string, i: number = 0): IterableIterator<ParseResult<string>> {
        if(input[i] == this.ch) {
            return {type: 'success', result: [this, this.ch], nextIndex: i+1}
        } else {
            return {type: 'error', index: i, message: `Expected character '${this.ch}' but got '${input[i]}'.'`}
        }
    }
}

export const char = (c: string) => new CharacterParser(c);

class AndParser<A, B> extends Parser<[A, B]> {
    p1: Parser<A>;
    p2: Parser<B>;

    constructor(p1: Parser<A>, p2: Parser<B>) {
        super();
        this.p1 = p1;
        this.p2 = p2;
    }

    *parse(input: string, i: number = 0): IterableIterator<ParseResult<[A, B]>> {
        let r1 = this.p1.parse(input, i).next().value;
        if(r1.type === 'error') {
            return r1;
        }
        let r2 = this.p2.parse(input, r1.nextIndex).next().value;
        if(r2.type === 'error') {
            return r2;
        }
        return {type: 'success', result: [this, [r1.result[1], r2.result[1]]], nextIndex: r2.nextIndex};
    }
}

export const and = (p1, p2) => new AndParser(p1, p2);


class RepeatParser<A> extends Parser<A[]> {
    p: Parser<A>;
    min: number;
    max: number;

    constructor(p: Parser<A>, min: number, max: number) {
        if(min < 0 || max < min) {
            throw new Error(`Invalid min+max for RepeatParser: received ${min}-${max}.`)
        }
        super();
        this.p = p;
        this.min = min;
        this.max = max;
    }

    *parse(input: string, i: number = 0): IterableIterator<ParseResult<A[]>> {
        const results: ParseResult<A>[] = [];
        const matched = true;
        const initialIndex = i;
        let currentIndex = i;
        
        while(matched && results.length <= this.max) {
            let r = this.p.parse(input, currentIndex).next().value;
            if(r.type === 'error') break;
            results.push(r);
            currentIndex = r.nextIndex;
        }

        if(results.length < this.min) {
            return {type: 'error', index: currentIndex, message: `Expected at least ${this.min} matches, but only found ${results.length}`};
        }
        return {type: 'success', result: [this, results.map(r => r[1])], nextIndex: currentIndex};
    }
}

export const repeat = (p, min: number, max: number) => new RepeatParser(p, min, max);

export const parse = (p, str: string) => p.parse(str, 0).next().value;