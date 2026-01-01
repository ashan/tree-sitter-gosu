package gw.apd.web

@Export
class APDRiskClauseInputSetHelper {
  /**
   * Moves up the given clause in the list of clauses by filtering the array by clause category and type
   * and swapping the sequence on the clause with the next item in the list.
   *
   * @param clauses An array of clauses to use for changing the clause sequencing
   * @param clause The clause to move up within the given array
   */
  static function moveClauseUp(clauses : APDClause[], clause : APDClause) {
    final var previous = filterByCategoryClauseTypeAndSortBySequence(clauses, clause).lastWhere(\c -> c.Sequence < clause.Sequence)
    if (previous != null) {
      final var currentSequence = clause.Sequence
      clause.Sequence = previous.Sequence
      previous.Sequence = currentSequence
      clause.resequenceClausesOfSameType()
    }
  }

  /**
   * Moves down the given clause in the list of clauses by filtering the array by clause category and type
   * and swapping the sequence on the clause with the next item in the list.
   *
   * @param clauses An array of clauses to use for changing the clause sequencing
   * @param clause The clause to move down within the given array
   */
  static function moveClauseDown(clauses : APDClause[], clause : APDClause) {
    final var next = filterByCategoryClauseTypeAndSortBySequence(clauses, clause).firstWhere(\c -> c.Sequence > clause.Sequence)
    if (next != null) {
      final var currentSequence = clause.Sequence
      clause.Sequence = next.Sequence
      next.Sequence = currentSequence
      clause.resequenceClausesOfSameType()
    }
  }

  private static function filterByCategoryClauseTypeAndSortBySequence(clauses : APDClause[], clause : APDClause) : APDClause[] {
    return clauses.where(\c -> c.ClauseCategory == clause.ClauseCategory and c.Subtype == clause.Subtype).sortBy(\c -> c.Sequence)
  }

  /**
   * Returns the maximum sequence from <code>clauses</code> array for a given clause's category and type
   *
   * @param clauses An array of clauses to find max sequence
   * @param clause The clause to match the category and type with
   * @return maximum sequence number from <code>clauses</code> array of this clause type and category
   */
  static function maxSequenceForClauseCategoryAndType(clauses : APDClause[], clause : APDClause) : Integer {
    return filterByCategoryClauseTypeAndSortBySequence(clauses, clause)*.Sequence.max()
  }

  /**
   * Returns the minimum sequence from <code>clauses</code> array for a given clause's category and type
   *
   * @param clauses An array of clauses to find min sequence
   * @param clause The clause to match the category and type with
   * @return minimum sequence number from <code>clauses</code> array of this clause type and category
   */
  static function minSequenceForClauseCategoryAndType(clauses : APDClause[], clause : APDClause) : Integer {
    return filterByCategoryClauseTypeAndSortBySequence(clauses, clause)*.Sequence.min()
  }

}