# Happy Parserous

:warning: Doesn't work yet.

A JavaScript parser generator generator and visualizer, with a festival feel, designed for Advent of Code challenges.

- Put in your sample input
- Write parsing rules in a simple shorthand
- Preview the matches
- Generate readable JS code

## Todo

- [x] Basic UI shape: named rules, visualize matches in string
- [x] Basic parser combinator library
- [ ] Higher-level micro-language for writing rules
      e.g. `digit* | character` -> `plus(many1(digit), character)`
- [ ] Parser state tracks character indexes for visualization
- [ ] Visualize results in UI
