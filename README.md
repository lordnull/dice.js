dice.js
=====

A Generic Dice syntax parser and evaluator for javascript.

Build
=====

An already build version is included under build; if you build manually,
this will be overwritten.

To do a build that generates both uncompressed and minified versions, 
simply use make. 'make compile' only generates the uncompressed version.
Both versions are placed in the './build'.

Test
====

Tests are run use karma. To do a single run test, use 'make test'.

Usage
=====

Dice.js is a tool to roll dice and fill in certain values based on a given
scope. In short:

    var res = dice.roll(diceString, scopeObject);
    console.log(res.sum);
    console.log(res.rolls);

The sum is the sum of all the rolls, while the rolls is an array of each
individual dice roll (or integer if that was the case).

The diceString uses a simple-ish syntax to specify what dice to roll, how
to roll them, and the sum of the rolls:

    diceRoll [operation diceRoll [...]]
        operation: "+" | "-"
        diceRoll: maybeInteger | [numDice] rollMode [min ".."] max
            numDice: maybeInteger
            rollMode: "d" | "w"
            min: maybeInteger
            max: maybeInteger
            maybeInteger: integer | "[" propertyInScope "]"

If that was confusing, that's okay, it makes much more sense after some
examples.

If you familiar with Dungeons and Dragons, the following should be
familiar:

    1d20 + 10

That is a valid statement for dice.roll. You could simplify it a bit, in
fact:

    d20 + 10

There are times when you would need to roll multiple sets of dice:

    3d6 + d8 + 5

Or maybe you have a penalty:

    d20 - 5

If you have played Star Wars d6, using wild die is supported as well:

    3d6 + 1w6

Using "w" instead of "d" means that die will be re-rolled if it comes up
as a maximum. All the repeat rolls will show up as a single roll in the 
'rolls' property of the returned object.

In some systems, there may be a minimum for the roll; in DnD, some weapons
allow one to re-roll all ones:

    3d2..6

This can be combined with the above statements:

    3d2..6 + 5

As you can see, the strings to define a roll are very similar to what
players have been using for years with a minor addition to support minimum
numbers. There is another feature, however, that make this system even more
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

Now if our character puts in effort to increate the stat:

    character.Strength++;

Using the rules above we need to re-write the roll:

    roll = "d20 - 1";

But what if we could just use the information in the character object?
turns you, you can:

    roll = "d20 + [Strength]";

When the roll is evaluated with the scope of the character, "[Strength]" is
replaced with the Strength property of the character. The previous two
examples are equivalent, with the bonus that if the character changes, new
evaludations will use the updated properties.

    dice.roll(roll, character);

The replacement works anywhere an integer can go:

    3d8 + [Enhancement Bonus]d12
    2d[Weapon Die]
    3d2..[Weapon Die]
    [Character Level]d6

Note that only integers are supported when using the scope. If a property
is referenced in the roll that does not exist in the scope, and error is
thrown.

Contributing
============

Fork and make a pull request with relavent tests. Opening Issues is also
welcome.
