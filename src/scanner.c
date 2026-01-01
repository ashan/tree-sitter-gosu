#include <tree_sitter/parser.h>
#include <wctype.h>

enum TokenType {
  NUMBER_LITERAL,
};

void *tree_sitter_gosu_external_scanner_create() { return NULL; }
void tree_sitter_gosu_external_scanner_destroy(void *p) {}
unsigned tree_sitter_gosu_external_scanner_serialize(void *p, char *buffer) {
  return 0;
}
void tree_sitter_gosu_external_scanner_deserialize(void *p, const char *b,
                                                   unsigned n) {}

static void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

static void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

bool tree_sitter_gosu_external_scanner_scan(void *payload, TSLexer *lexer,
                                            const bool *valid_symbols) {
  if (valid_symbols[NUMBER_LITERAL]) {
    while (iswspace(lexer->lookahead))
      skip(lexer);

    if (!iswdigit(lexer->lookahead))
      return false;

    // Check for Hex: 0x...
    if (lexer->lookahead == '0') {
      advance(lexer);
      if (lexer->lookahead == 'x' || lexer->lookahead == 'X') {
        advance(lexer); // Consume x
        // Consume hex digits
        bool has_hex = false;
        while (iswxdigit(lexer->lookahead)) {
          advance(lexer);
          has_hex = true;
        }
        if (!has_hex)
          return false; // 0x without digits?

        // Hex suffix?
        if (lexer->lookahead == 'l' || lexer->lookahead == 'L' ||
            lexer->lookahead == 's' || lexer->lookahead == 'S') {
          advance(lexer);
        }
        lexer->mark_end(lexer);
        lexer->result_symbol = NUMBER_LITERAL;
        return true;
      }
      // If 0 not followed by x, it's a decimal number (0 or 0.123 or 0123)
      // We already consumed '0'. Continue to Decimal logic.
    } else {
      // Consuming first non-zero digit
      advance(lexer);
    }

    // Decimal logic: consume remaining integer part digits
    while (iswdigit(lexer->lookahead)) {
      advance(lexer);
    }

    // Check for fractional part
    if (lexer->lookahead == '.') {
      lexer->mark_end(lexer);
      advance(lexer); // Consume dot temporarily

      bool is_dot = lexer->lookahead == '.';
      bool is_id_start = iswalpha(lexer->lookahead) ||
                         lexer->lookahead == '_' || lexer->lookahead == '$';

      if (is_dot || is_id_start) {
        // Dot followed by dot (..) or identifier (.toString).
        // Not a float. Revert to integer part.
        lexer->result_symbol = NUMBER_LITERAL;
        return true;
      }

      // otherwise it IS a float
      while (iswdigit(lexer->lookahead)) {
        advance(lexer);
      }
    }

    // Exponent part
    if (lexer->lookahead == 'e' || lexer->lookahead == 'E') {
      advance(lexer);
      if (lexer->lookahead == '+' || lexer->lookahead == '-') {
        advance(lexer);
      }
      while (iswdigit(lexer->lookahead)) {
        advance(lexer);
      }
    }

    // Suffixes
    if (lexer->lookahead == 'b' || lexer->lookahead == 'B') {
      advance(lexer);
      if (lexer->lookahead == 'd' || lexer->lookahead == 'D')
        advance(lexer); // bd
    } else if (lexer->lookahead == 'f' || lexer->lookahead == 'F' ||
               lexer->lookahead == 'd' || lexer->lookahead == 'D' ||
               lexer->lookahead == 'l' || lexer->lookahead == 'L' ||
               lexer->lookahead == 's' || lexer->lookahead == 'S') {
      advance(lexer);
    }

    lexer->mark_end(lexer);
    lexer->result_symbol = NUMBER_LITERAL;
    return true;
  }

  return false;
}
