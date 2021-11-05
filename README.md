[![Makefile CI](https://github.com/lordnull/dice.js/actions/workflows/makefile.yml/badge.svg)](https://github.com/lordnull/dice.js/actions/workflows/makefile.yml)

dice.js
=======

A Generic Dice syntax parser and evaluator for javascript.

This tool is oriented more for those who wish to implement game systems or
character management systems. This means the read me can be a bit difficult
to follow you're not a coder. However, the usage section should be enough
to allow an end user to write useful rolling strings.

Dependency
==========

Node's npm can be used to fetch the build and test dependencies. There are
no run-time dependencies.

Build
=====

An already built version for use in browsers is included under build; if
you build manually, this will be overwritten.

To do a build that generates both uncompressed and minified versions,
simply use make. 'make compile' only generates the uncompressed version.
Both versions are placed in './build'.

Simply include either dice.js or dice.min.js in a script tag, and you're
off.

For use with node and installed with npm, you should only need to do the usual
`var dice = require("./src/dice.js");`.

Testing
=======

Tests are run using jasmine. To do a single test run for both the browser, use
`make test`. To run only browser tests, use `make browser_test`. To
run only the node tests, use `make node_test`. To leave a browser used
for testing running for debugging purposes, use `make dbgtest`. Jasmine will
tell you what page you need to browse to the test to actually run; but by
default it's `http://localhost:8888`.

Usage
=====

Dice.js is a tool to roll dice and fill in certain values based on a given
scope. In short:

    var res = dice.roll(diceString, scopeObject);
    console.log(+res);
    console.log(dice.stringify(res));

The res is a number that can be used like any other. It has operations
attached which allow it to be examined to determine how the total was
achieved (thus why it is coerced into a primitive when logged above).
The easiest way to analyze it is to have dice.js stringify it.

The `diceString` uses a simple-ish syntax to specify what dice to roll, how
to roll them, and the sum of the rolls. While each individual part is simple,
presenting it all at once can be overwhelming.

Basic Rolls
-----------

If you familiar with Dungeons and Dragons, the following should be
familiar:

    1d20 + 10

That is a valid statement for a dice roll. The 'd' seperator is case insensitve:

    1D20 + 10

You could simplify it a bit, in fact:

    d20 + 10
    D20 + 10

There are times when you would need to roll multiple sets of dice:

    3d6 + d8 + 5

Or maybe you have a penalty:

    d20 - 5

In some systems, there may be a minimum for the roll; in DnD, some weapons
allow one to re-roll all ones:

    3d2..6

This can be combined with the above statements:

    3d2..6 + 5
    
For players of Fudge or Fate, negative numbers can be used for the 
minimum and maximum too, and in any order.

    4d-1..1 + 1
    4d1..-1 + 3
    
You may have noticed that in the Fudge examples, the -1 and 1 are reversed.
This is because the numbers on either side of the `..` are not a minimum
and maximum, but a range. `-1..1` and `1..-1` represent the same range. The
DnD example of the minimum attack could be expressed as:

    3d6..2


If you have played Star Wars d6, using a wild die is supported as well:

    3d6 + 1w6
    3D6 + 1W6

Using `w` instead of `d` means that die will be re-rolled and added to the
result if it comes up as a the value to the right of the `..`. All the
repeat rolls will show up as a single roll in the `rolls` property of the
returned object.

Note that the `xwn..m` syntax will always reroll when the result is `m`. This
means that `3w2..6` is *not* the same as `3w6..2`. The former explodes the
dice on a 6, while the latter explodes it on a 2.

Scopes
------

As you can see, the strings to define a roll are very similar to what
players have been using for years with a minor addition to support minimum
numbers. There is another feature, however, that makes this system even more
powerful: scopes.

Let's take a very simplified DnD character, using only the ability
modifiers:

    var character = {
        name: 'Code Monkey',
        Strength: -2,
        Dexterity: -1,
        Constitution: 0,
        Charisma: 3,
        Wisdom: 3,
        Intelligence: 5
    };

Using the rules above, we can write a roll for a strength check:

    var roll = "d20 - 2";

Now if our character puts in effort to increase the stat:

    character.Strength++;

Using the rules above we need to re-write the roll:

    roll = "d20 - 1";

But what if we could just use the information in the character object?
turns you, you can:

    roll = "d20 + [Strength]";

When the roll is evaluated with the scope of the character, `[Strength]` is
replaced with the Strength property of the character. The previous two
examples are equivalent, with the bonus that if the character changes, new
evaluations will use the updated properties.

    dice.roll(roll, character);

The replacement works anywhere an integer can go:

    3d8 + [Enhancement Bonus]d12
    2d[Weapon Die]
    3d2..[Weapon Die]
    [Character Level]d6

Note how we allow spaces in the name. The only characters explicitly disallowed
are `[` and `]`.

If the scope contains values that are not integers, like 1.5, You can use one of
the built-in rounding funtions. Preface the variable box with `f` for round
down (floor), `c` for round up (ceiling), or `r` for round to nearest.

    1d20 + f[Half Level]

If the Half level was used without the `f` tag, an exception would be
thrown.

For more advanced usage, scopes can be nested.

    var scope = {
        'takes.priority': 3,
        'takes':{
            'priority': 5
        },
        'nested'{
            'value': 7
        }
    };
    var result = dice.roll("[takes.priority] + [nested.value]", scope);
    result == 10; // because we look for an exact match of property name first

Subexpressions
--------------

The Usual `+`, `-`, `*` and `/` are supported, with order of operations being
observed: `*` and `/` done in order, then `+` and `-`.

If this is not desired, or you want to do some math where an integer would go,
you can use a parenthesis expression. As with scopes, we can prepend them with
the rounding flags `f`, `c`, and `r`. The rounding is required when using a
subexpression where an integer is expected.

For example, the half level from the scope example above could be re-written
without needing an explicit half level on the scope.

    1d20 + f([Level] / 2)

Or if you need to roll half your level in d6's:

    c([Level] / 2)d6

Roll Modifiers
--------------

Many DnD players are familiar with the "4 dice, drop lowest" method of rolling
character attributes. While this can be achieved in javascript with some code
and inspecting the results, the goal is to allow many rolls to be written
without needing to know how to code. This is where roll modifiers come in.

After any dice roll expression, you can add some rules to modify the result.

    4d6{ drop lowest }
    4d6{ keep highest 3 }
    3d6{ reroll } // 3 dice, reroll 1's once.
    3d6{ reroll <3 } // 3 dice, reroll 1's and 2's once.
    3d6{ reroll 2x } // 3 dice, reroll 1's up to 2 times.
    3d6{ reroll <3 2x } // 3 dice, reroll 1's and 2's up to 2 times.

Multiple modifiers can be used. Seperate them with a `;`. They modifier the
result of the rolls in the order by are listed.

    4d6{ reroll ; drop lowest } // 4 dice, reroll 1's once, then drop lowest

Some modifiers also have a short form. When using the short form, only one
modifier can be used.

    4d6:dl // same as 4d6{ drop lowest }
    4d6:k3 // same as 4d6{ keep highest 3 }

There are 4 modifiers: keep, drop, reroll, and explode. Each as a short form of
some kind.

### Keep

Keep a certain number of the highest or lowest of a roll.

    'keep' which_type how_many

* `which_type`: either "highest" or "lowest". If omitted, this defaults to
"highest".
* `how_many`: How many dice to keep. If omitted, defaults to 1.

This also has several short forms, which are case-insensitive. Any of the short
forms can have a number appended (no space before the number) to change it from
a single die to that number. As usual, you can put a scope or rounded value in.

* `:k`: Keep the single highest roll.
* `:h`: Keep the single highest roll.
* `:kh`: Keep the single highest roll.
* `:kl`: Keep the single lowest roll.

### Drop

The inverse of keep, drop a number of the highest or lowest dice.

    'drop' which_type how_many

* `which_type`: either "highest" or "lowest". If omitted, this defaults to
"lowest".
* `how_many`: How many dice to drop. If omitted, defaults to 1.

This also has several short forms, which are case-insensitive. Any of the short
forms can have a number appended (no space before the number) to change it from
a single die to that number. As usual, you can put a scope or rounded value in.

* `:d`: Drop the single lowest roll.
* `:l`: Drop the single lowest roll.
* `:dh`: Drop the single highest roll.
* `:dl`: Drop the single lowest roll.

### Reroll

Given some condition, reroll dice a limited number of times. Note that unlimited
re-rolling is not supported. If you need to always re-roll ones on a six-sided
dice, just define `d2..6`.

    'reroll' condition limit

A condition is a number (the comparitor) optionally preceeded by any one of the
following:
* `=`: the roll is exactly the comparitor.
* `!=`: the roll is anything _but_ the comparitor.
* `>`: the roll is greater than the comparitor.
* `>=`: the roll is greater than or equal to the comparitor.
* `<`: the roll is less than the comparitor.
* `<=`: the roll is less than or equal to the comparitor.

The condition is optional. If left out, it defaults to equal to the left value
of a dice roll's range.

The limit is a number followed by the letter 'x'. The 'x' is there so we know
it's always a limit. If the limit is omitted, it defaults to `1`.

Reroll has a short form. `:rr` is the same as `{reroll}`.

### Explode

Exploding dice a rolled again when certain number is rolled, with the new result
being added to the result set (and thus total). When more than one die is rolled,
any that meet the condition explode, and will continue until either the condition
is not met, or the limit is met.

The long form is similar to reroll.

A condition is a number (the comparitor) optionally preceeded by any one of the
following:
* `=`: the roll is exactly the comparitor.
* `!=`: the roll is anything _but_ the comparitor.
* `>`: the roll is greater than the comparitor.
* `>=`: the roll is greater than or equal to the comparitor.
* `<`: the roll is less than the comparitor.
* `<=`: the roll is less than or equal to the comparitor.

The condition is optional. If left out, it defaults to equal to the right value
of a dice roll's range.

The limit is a number followed by the letter 'x'. The 'x' is there so we know
it's the limit. If the limit is omitted, it defaults to 10000.

There is a short form. Exploding dice were explained in the basic rolls section
as using `w` instead of `d`; that's the short form. It is the same as using
`{ explode =[max] }` where `[max]` is the right side of the dice range.

Statistics
==========

If you want some analysis for your rolls, you can get a result set created with
some basic stats tagged in.

Using `dice.statistics(rollString, scope, samples)` returns an object:

```javascript
    {
        'results': [dice_roll_result], // The result set generated
        'mean': number,                // The average of result set generated
        'min': number,                 // The smallest value in the result set
        'max': number,                 // The largest value in the result set
        'min_possible': number,        // The smallest value that could have
                                       // been generated.
        'max_possible': number,        // The largest value that could have
                                       // been generated.
    }
```

When using exploding dice, the min_possible and max_possible do not have a
practical meaning when the eplosion has no limit. Thus, explosions are omitted
from analysis. Rerolls have limits, thus can statistically have the condition
occur, and so also are ommited from the results. Keep and Drop, because they
actually change the result set in a deterministic way, are used.

Contributing
============

Fork and make a pull request with relavent tests. Opening issues is also
welcome.

