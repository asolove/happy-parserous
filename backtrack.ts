// A tiny monadic parser for quickly doing AoC problems
//
// A big thanks to Kris for [TDPTSNBN](https://www.youtube.com/watch?v=Q1YXEqCl650)
// And to Hutton and Meijer for [Monadic Parser Combinators](https://www.cs.nott.ac.uk/~pszgmh/monparsing.pdf)

export type PartialParse<A> = { value: A; rest: string };
export type Parser<A> = (input: string) => Iterable<PartialParse<A>>;

export function parse<A>(parser: Parser<A>, input: string): A {
  for (const result of parser(input)) {
    return result.value;
  }
  throw new Error("no results for parse");
}

export function result<A>(value: A): Parser<A> {
  return function* (input: string) {
    yield { value, rest: input };
  };
}

export const zero: Parser<never> = (_input: string) => {
  return [][Symbol.iterator]();
};

export function* item(input: string): Iterable<PartialParse<string>> {
  if (input[0]) {
    yield { value: input[0], rest: input.slice(1) };
  } else {
    yield* zero(input);
  }
}

export function bind<A, B>(
  p1: Parser<A>,
  next: (a: A) => Parser<B>
): Parser<B> {
  return function* (input: string) {
    for (const { value, rest } of p1(input)) {
      yield* next(value)(rest);
    }
  };
}

export function map<A, B>(p1: Parser<A>, transform: (a: A) => B): Parser<B> {
  return bind(p1, (a) => result(transform(a)));
}

export function seq<A, B>(p1: Parser<A>, p2: Parser<B>): Parser<[A, B]> {
  return bind(p1, (a) => bind(p2, (b) => result([a, b])));
}

export function sat(test: (string) => boolean): Parser<string> {
  return bind(item, (ch: string) => {
    if (test(ch)) {
      return result(ch);
    } else {
      return zero;
    }
  });
}

export function char<A extends string>(ch: A): Parser<A> {
  return sat(function (s: string): s is A {
    return s === ch;
  }) as Parser<A>; // FIXME: can we thread the type assertion through sat and bind?
}
export const digit = sat((x) => x >= "0" && x <= "9");
export const upper = sat((x) => x >= "A" && x <= "Z");
export const lower = sat((x) => x >= "a" && x <= "z");
export const alpha = plus(upper, lower);
export const alphanumeric = plus(alpha, digit);
export const int: Parser<number> = bind(many1(digit), (chars: string[]) =>
  result(parseInt(chars.join(""), 10))
);
export const name = many1(alpha);

export function string<A extends string>(st: A): Parser<A> {
  return function* (input: string) {
    if (input.slice(0, st.length) === st) {
      yield { value: st, rest: input.slice(st.length) };
    } else {
      return zero;
    }
  };
}

export function many<A>(p: Parser<A>): Parser<A[]> {
  return plus(
    bind(p, (r1) => {
      return bind(many(p), (rs) => {
        return result([r1, ...rs]);
      });
    }),
    result([])
  );
}

export const line = map(seq(many(sat((c) => c != "\n")), char("\n")), (r) =>
  [...r[0], r[1]].join("")
);

export function many1<A>(p: Parser<A>): Parser<A[]> {
  return bind(p, (r1) => {
    return bind(many(p), (rs) => {
      return result([r1, ...rs]);
    });
  });
}

export function plus<A>(p1: Parser<A>, p2: Parser<A>): Parser<A> {
  return function* (input: string) {
    yield* p1(input);
    yield* p2(input);
  };
}

export function separatedBy<A, B>(p: Parser<A>, sep: Parser<B>): Parser<A[]> {
  return map(seq(many(seq(p, sep)), p), (rs) =>
    rs[0].map((r) => r[0]).concat([rs[1]])
  );
}

export function surroundedBy<A, B, C>(
  p: Parser<A>,
  before: Parser<B>,
  after: Parser<C>
): Parser<A> {
  return map(seq(before, seq(p, after)), (r) => r[1][0]);
}
