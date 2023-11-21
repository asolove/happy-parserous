type ParseResult<A> = 
    | {type: 'success', result: [Parser<A>, A], nextIndex: number}
    | {type: 'error', index: number, message: string}

abstract class Parser<A> {
    abstract parse(input: string, i: number): ParseResult<A>
}

class CharacterParser extends Parser<string> {
    ch: string;

    constructor(ch: string) {
        super();
        if(ch.length !== 1) throw new Error(`Invalid character parser: expected one character but received ${ch}`);
        this.ch = ch;
    }

    parse(input: string, i: number): ParseResult<string> {
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

    parse(input: string, i: number): ParseResult<[A, B]> {
        let r1 = this.p1.parse(input, i);
        if(r1.type === 'error') {
            return r1;
        }
        let r2 = this.p2.parse(input, r1.nextIndex);
        if(r2.type === 'error') {
            return r2;
        }
        return {type: 'success', result: [this, [r1.result[1], r2.result[1]]], nextIndex: r2.nextIndex};
    }
}

export const and = (p1, p2) => new AndParser(p1, p2);