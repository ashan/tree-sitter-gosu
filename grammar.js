"use strict";
/// <reference types="tree-sitter-cli/dsl" />
function commaSep1(rule) {
    return seq(rule, repeat(seq(",", rule)));
}
function commaSep(rule) {
    return optional(commaSep1(rule));
}
const PREC = {
    ASSIGN: 1,
    OR: 2,
    AND: 3,
    BIT_OR: 4,
    BIT_AND: 5,
    EQUAL: 6,
    REL: 7,
    SHIFT: 8,
    ADD: 9,
    MULT: 10,
    CALL: 11,
    MEMBER: 12,
};
module.exports = grammar({
    name: "gosu",
    word: $ => $.identifier,
    extras: $ => [
        /\s/,
        $.line_comment,
        $.block_comment,
    ],
    externals: $ => [
        $.number_literal,
    ],
    conflicts: $ => [
        [$._expression, $.type_reference],
        [$._expression, $.generic_identifier],
        [$._expression, $.type_reference, $.generic_identifier],
        [$.member_access, $.binary_expression],
        [$.member_access], // Self-conflict for generic method vs binary
        [$.generic_identifier, $.binary_expression],
        [$.generic_identifier, $.type_reference],
        [$.array_initializer, $.block],
        [$.array_initializer, $.expression_statement],
        [$.uses_statement, $.binary_expression],
        [$.uses_statement, $.binary_expression],
        [$.this_expression, $.this_type],
        [$.class_body, $.object_initializer, $.array_initializer],
        [$.argument_list, $.block_type],
        [$.local_variable_declaration],
        [$.local_variable_declaration, $.field_as_property_declaration],
        [$.modifiers],
        [$.labeled_statement, $._expression],
        [$.expression_statement, $.annotation_type_declaration],
        [$.generic_identifier, $.binary_expression],
        [$.generic_identifier, $.type_reference],
        [$._expression, $.generic_identifier],
        [$._expression, $.type_reference, $.generic_identifier]
    ],
    rules: {
        //...
        source_file: $ => repeat($._top_level),
        _top_level: $ => choice($.package_declaration, $.uses_statement, $.class_declaration, $.enum_declaration, $.structure_declaration, $.interface_declaration, $.enhancement_declaration, $.annotation_type_declaration, $.function_declaration, $._statement, 
        // Testing support
        $.primitive_type, $.array_type),
        package_declaration: $ => prec.right(2, seq('package', $.type_reference, // Simplification
        optional(';'))),
        uses_statement: $ => prec.right(2, seq('uses', $.type_reference, optional($.wildcard_suffix), optional(';'))),
        wildcard_suffix: $ => token(seq(choice('.', '#'), /\s*/, '*')),
        // ...
        new_expression: $ => prec.right(seq('new', optional($._type), choice($.argument_list, $.array_initializer, repeat1($.array_dimension)), optional(choice($.class_body, $.object_initializer, $.array_initializer)))),
        array_dimension: $ => seq('[', $._expression, ']'),
        array_initializer: $ => seq('{', commaSep($._expression), '}'),
        object_initializer: $ => seq('{', commaSep($.initializer_assignment), optional(','), '}'),
        initializer_assignment: $ => seq($.symbol_literal, '=', $._expression),
        // ...
        modifiers: $ => repeat1(choice($.modifier_annotation, 'public', 'private', 'protected', 'internal', 'static', 'final', 'abstract', 'override', 'transient', 'readonly', 'reified')),
        modifier_annotation: $ => seq('@', $.type_reference, optional($.argument_list)),
        function_declaration: $ => prec.right(2, seq(optional($.modifiers), 'function', $.identifier, optional($.type_parameters), $.parameter_list, optional(seq(':', $._type)), optional(seq('=', $._expression)), choice($.block, optional(';')))),
        parameter_list: $ => seq('(', optional(commaSep1($.formal_parameter)), ')'),
        parameter: $ => seq($.identifier, choice(optional(seq(':', $._type, optional(seq('=', $._expression)))), seq($.parameter_list, optional(seq(':', $._type))) // Block shorthand: name(args):Type
        )),
        formal_parameter: $ => seq(optional($.modifiers), choice($.identifier, 'internal'), // Allow 'internal' as parameter name
        choice(seq(optional(seq(':', $._type)), optional(seq('=', $._expression))), seq($.parameter_list, optional(seq(':', $._type))) // Block shorthand: name(args):Type
        )),
        block: $ => prec(1, seq('{', repeat($._statement), '}')),
        _statement: $ => choice($.local_variable_declaration, $.if_statement, $.while_statement, $.for_statement, $.return_statement, $.block, $.expression_statement, $.try_statement, $.throw_statement, $.switch_statement, $.do_statement, $.using_statement, $.labeled_statement, $.empty_statement),
        empty_statement: $ => ';',
        expression_statement: $ => prec.right(2, seq($._expression, optional(';'))),
        local_variable_declaration: $ => seq(optional($.modifiers), 'var', $.identifier, optional($.parameter_list), optional(seq(':', $._type)), 
        // optional(seq('as', optional($.modifiers), $.identifier)), // Moved to field_as_property_declaration
        optional(seq('=', $._expression)), optional(';')),
        for_variable_declaration: $ => seq(optional($.modifiers), choice('var', 'final'), $.identifier, optional(seq(':', $._type)), optional(seq('=', $._expression))),
        // ...
        assignment_expression: $ => prec.right(PREC.ASSIGN, seq(choice($.identifier, $.member_access, $.array_access), choice('=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>='), $._expression)),
        typeof_expression: $ => seq('typeof', choice($._expression, $._type) // typeof(x) or typeof String
        ),
        if_statement: $ => prec.right(seq('if', '(', $._expression, ')', $._statement, optional(seq('else', $._statement)))),
        while_statement: $ => seq('while', '(', $._expression, ')', $._statement),
        do_statement: $ => prec.right(2, seq('do', $._statement, 'while', '(', $._expression, ')', optional(';'))),
        using_statement: $ => seq('using', '(', commaSep1(choice($.using_resource_declaration, $._expression)), ')', $._statement),
        using_resource_declaration: $ => seq(optional($.modifiers), 'var', $.identifier, optional(seq(':', $._type)), '=', $._expression),
        try_statement: $ => seq('try', $.block, repeat($.catch_clause), optional($.finally_clause)),
        labeled_statement: $ => seq($.identifier, ':', $._statement),
        catch_clause: $ => seq('catch', '(', $.identifier, optional(seq(':', $._type)), ')', $.block),
        finally_clause: $ => seq('finally', $.block),
        throw_statement: $ => prec.right(2, seq('throw', $._expression, optional(';'))),
        switch_statement: $ => seq('switch', '(', $._expression, ')', '{', repeat(choice($.case_clause, $.default_clause)), '}'),
        case_clause: $ => seq('case', $._expression, ':', repeat($._statement)),
        default_clause: $ => seq('default', ':', repeat($._statement)),
        for_statement: $ => seq(choice('for', 'foreach'), '(', choice(seq(optional(choice('var', 'final')), $.identifier, optional(seq(':', $._type)), 'in', $._expression, optional(seq('index', $.identifier)), optional(seq('iterator', $.identifier))), seq($.identifier, 'in', $._expression, optional(seq('index', $.identifier)), optional(seq('iterator', $.identifier))), // Inferred type
        seq($._expression, optional(seq('index', $.identifier)), optional(seq('iterator', $.identifier))), seq(choice($.for_variable_declaration, optional($._expression)), ';', optional($._expression), ';', optional($._expression))), ')', $._statement),
        return_statement: $ => prec.right(seq('return', optional($._expression), optional(';'))),
        _expression: $ => choice($.assignment_expression, $.binary_expression, $.unary_expression, $.ternary_expression, $.elvis_expression, $.string_template, $.interval_expression, $.feature_literal, $.update_expression, $.call_expression, $.member_access, $.new_expression, $.array_access, $.null_safe_array_access, $.lambda_expression, $.lambda_expression, $.type_check_expression, $.typeof_expression, $.symbol_literal, $.type_cast_expression, $.parenthesized_expression, $.super_expression, $.array_initializer, // List/Map literal
        $.generic_identifier, $.identifier, $.this_expression, $._literal),
        super_expression: $ => prec.right(seq('super', optional($.argument_list))),
        parenthesized_expression: $ => seq('(', $._expression, ')'),
        lambda_expression: $ => seq('\\', commaSep($.parameter), '->', choice($.block, $._expression)),
        // ...
        call_expression: $ => prec(PREC.CALL, seq($._expression, $.argument_list)),
        length_expression: $ => seq('[', $._expression, ']'),
        array_access: $ => prec(PREC.MEMBER, seq($._expression, '[', $._expression, ']')),
        null_safe_array_access: $ => prec(PREC.MEMBER, seq($._expression, '?[', $._expression, ']')),
        argument_list: $ => seq('(', optional(commaSep1(choice($._expression, $.named_argument))), ')'),
        named_argument: $ => seq($.symbol_literal, '=', $._expression),
        // ...
        unary_expression: $ => choice(prec.left(7, seq('!', $._expression)), prec.left(7, seq('-', $._expression)), prec.left(7, seq('+', $._expression)), prec.left(7, seq('~', $._expression)), prec.left(7, seq('not', $._expression)) // Added 'not' keyword
        ),
        update_expression: $ => prec.left(7, choice(seq($._expression, '++'), seq($._expression, '--'), seq('++', $._expression), seq('--', $._expression))),
        binary_expression: $ => choice(prec.right(PREC.REL, seq($._expression, $.arrow_operator, $._expression)), prec.left(PREC.OR, seq($._expression, choice('or', '||'), $._expression)), prec.left(PREC.AND, seq($._expression, choice('and', '&&'), $._expression)), prec.left(PREC.REL, seq($._expression, choice('<', '>', '<=', '>=', '!=', '==', '!==', '==='), $._expression)), prec.left(PREC.ADD, seq($._expression, '+', $._expression)), prec.left(PREC.ADD, seq($._expression, '-', $._expression)), prec.left(PREC.MULT, seq($._expression, $.multiply_operator, $._expression)), prec.left(PREC.MULT, seq($._expression, '/', $._expression)), prec.left(PREC.MULT, seq($._expression, '%', $._expression)), prec.left(PREC.BIT_OR, seq($._expression, '|', $._expression)), prec.left(PREC.BIT_AND, seq($._expression, '&', $._expression)), prec.left(PREC.BIT_OR, seq($._expression, '^', $._expression)), prec.left(PREC.SHIFT, seq($._expression, '<<', $._expression)), prec.left(PREC.SHIFT, seq($._expression, '>>', $._expression)), prec.left(PREC.SHIFT, seq($._expression, '>>>', $._expression))),
        //...
        class_declaration: $ => prec.right(2, seq(optional($.modifiers), 'class', $.identifier, optional($.type_parameters), optional(seq('extends', $._type)), optional(seq('implements', commaSep1($._type))), $.class_body)),
        interface_declaration: $ => prec.right(2, seq(optional($.modifiers), 'interface', $.identifier, optional($.type_parameters), optional(seq('extends', commaSep1($._type))), // Interfaces extend interfaces
        $.class_body)),
        enhancement_declaration: $ => prec.right(2, seq(optional($.modifiers), 'enhancement', $.identifier, optional($.type_parameters), ':', $._type, optional(seq('implements', commaSep1($._type))), // Enhancements can implement interfaces
        $.class_body)),
        structure_declaration: $ => prec.right(2, seq(optional($.modifiers), 'structure', $.identifier, optional($.type_parameters), optional(seq('extends', commaSep1($._type))), // Structures can extend multiple interfaces/structures
        $.class_body)),
        enum_declaration: $ => prec.right(2, seq(optional($.modifiers), 'enum', $.identifier, optional(seq('implements', commaSep1($._type))), $.enum_body, optional(';'))),
        enum_body: $ => seq('{', commaSep($.enum_constant), optional(','), optional(','), repeat($._class_member), '}'),
        enum_constant: $ => seq($.identifier, optional($.argument_list)),
        annotation_type_declaration: $ => prec.right(2, seq(optional($.modifiers), $.annotation_keyword, $.identifier, $.class_body)),
        class_body: $ => seq('{', repeat($._class_member), '}'),
        _class_member: $ => choice($.function_declaration, $.constructor_declaration, $.property_get_declaration, $.property_set_declaration, $.class_declaration, $.interface_declaration, $.structure_declaration, $.enum_declaration, $.annotation_type_declaration, $.field_as_property_declaration, $.delegate_declaration, $.block, // Static initialization
        $.local_variable_declaration, // Fields
        $.empty_statement),
        field_as_property_declaration: $ => prec.right(2, seq(optional($.modifiers), choice('var', 'val'), $.identifier, 
        // $.parameter_list, // Fields don't have parameters
        optional($.parameter_list), // Block fields DO have parameters
        optional(seq(':', $._type)), 'as', optional('readonly'), // Support 'as readonly Prop'
        $.identifier, optional(seq('=', $._expression)), optional(';'))),
        delegate_declaration: $ => prec.right(2, seq(optional($.modifiers), 'delegate', $.identifier, optional(seq(':', $._type)), 'represents', $._type, optional(seq('=', $._expression)), optional(';'))),
        property_get_declaration: $ => prec.right(seq(optional($.modifiers), 'property', 'get', $.identifier, optional($.parameter_list), optional(seq(':', $._type)), choice($.block, optional(';')))),
        property_set_declaration: $ => prec.right(seq(optional($.modifiers), 'property', 'set', $.identifier, $.parameter_list, optional(seq(':', $._type)), choice($.block, optional(';')))),
        constructor_declaration: $ => seq(optional($.modifiers), 'construct', $.parameter_list, $.block),
        type_cast_expression: $ => prec(PREC.REL, seq(// Precedence? REL is 5.
        $._expression, 'as', $._type)),
        type_check_expression: $ => prec(PREC.REL, seq($._expression, choice('typeis', 'typeof', 'instanceof'), $._type)),
        _type: $ => choice($.primitive_type, $.array_type, $.block_type, $.type_reference, $.intersection_type, $.this_type),
        primitive_type: $ => choice('void', 'boolean', 'byte', 'short', 'int', 'long', 'char', 'float', 'double'),
        array_type: $ => prec(1, seq($._type, '[', ']')),
        intersection_type: $ => prec.left(2, seq($._type, '&', $._type)),
        block_type: $ => prec.right(seq(optional('block'), '(', optional(commaSep1($.block_type_parameter)), ')', optional(seq(':', $._type)))),
        block_type_parameter: $ => seq(optional(seq($.identifier, ':')), $._type),
        type_reference: $ => prec.dynamic(10, prec.right(seq($.identifier, optional($.type_arguments), repeat(seq('.', $.identifier, optional($.type_arguments)))))),
        type_parameters: $ => seq('<', commaSep1($.type_parameter), '>'),
        type_parameter: $ => seq($.identifier, optional(seq('extends', $._type))),
        type_arguments: $ => prec.dynamic(10, seq('<', commaSep($._type), '>')),
        feature_literal: $ => prec.right(PREC.MEMBER, seq(optional($.type_reference), '#', choice($.identifier, 'class', 'default', 'typeof'), optional($.type_arguments), // Generic method reference
        optional($.type_list))),
        type_list: $ => seq('(', commaSep($._type), ')'),
        _literal: $ => choice($.string_literal, 
        // ...
        $.number_literal, $.boolean_literal, $.null_literal),
        string_literal: $ => seq("'", repeat(choice(/[^'\\\n]+/, /\\./)), "'"),
        ternary_expression: $ => prec.right(PREC.REL, seq($._expression, '?', $._expression, ':', $._expression)),
        elvis_expression: $ => prec.right(PREC.OR, seq($._expression, '?:', $._expression)),
        interval_expression: $ => prec.left(PREC.REL, seq($._expression, choice('..', '|..', '..|', '|..|'), $._expression)),
        string_template: $ => seq('"', repeat(choice($.string_content, $.string_interpolation, $.escape_sequence, $.line_continuation, '$', '{' // Literal brace
        )), '"'),
        line_continuation: $ => token(seq('\\', /\r?\n/)),
        string_content: $ => token.immediate(prec(1, /[^"$\\\n{]+/)),
        escape_sequence: $ => token.immediate(seq('\\', /./)),
        string_interpolation: $ => prec(1, seq('$', choice($.identifier, seq('{', $._expression, '}')))),
        generic_identifier: $ => seq($.identifier, $.type_arguments),
        // Update member access for null-safe ?.
        member_access: $ => prec(PREC.MEMBER, seq(choice($._expression, $.feature_literal), choice('.', '?.', '*.'), choice($.identifier, 'get', 'set', 'iterator'), optional($.type_arguments))),
        boolean_literal: $ => choice('true', 'false'),
        null_literal: $ => 'null',
        annotation_keyword: $ => /annotation/,
        symbol_literal: $ => seq(':', $.identifier),
        identifier: $ => /[a-zA-Z_$][\w$]*/,
        arrow_operator: $ => '->',
        this_expression: $ => 'this',
        this_type: $ => 'this',
        multiply_operator: $ => '*',
        line_comment: $ => token(seq('//', /[^\n]*/)),
        block_comment: $ => seq('/*', repeat(choice(/[^*\/]+/, $.block_comment, '*', '/')), '*/'),
    }
});
