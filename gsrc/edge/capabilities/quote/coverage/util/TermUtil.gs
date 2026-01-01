package edge.capabilities.quote.coverage.util

uses java.lang.UnsupportedOperationException
uses gw.api.domain.covterm.CovTerm
uses gw.api.productmodel.OptionCovTermPattern
uses java.lang.Exception
uses java.lang.Integer
uses java.lang.Math
uses gw.api.productmodel.CovTermOpt
uses java.lang.IllegalArgumentException
uses gw.api.productmodel.PackageCovTermPattern
uses gw.api.productmodel.ChoiceCovTermPattern
uses gw.api.productmodel.CovTermPack
uses gw.api.productmodel.TypekeyCovTermPattern
uses gw.api.domain.covterm.BooleanCovTerm
uses gw.api.productmodel.GenericCovTermPattern
uses edge.util.MapUtil
uses edge.capabilities.quote.coverage.dto.TermDTO
uses edge.capabilities.quote.coverage.dto.TermOptionDTO
uses gw.api.productmodel.DirectCovTermPattern
uses gw.api.domain.covterm.DirectCovTerm

/**
 * Coverage utilities.
 */
final class TermUtil {
  private final static var COVERAGE_TERM_MAX_RATING_STARS = 5

  private construct() {
    throw new UnsupportedOperationException()
  }
  
  
  
  /**
   * Batch version of update.
   */
  public static function updateFrom(terms : CovTerm[], dtos : TermDTO[]) {
    final var dtomap = MapUtil.groupUniqueArray(dtos, \ dto -> dto.PatternCode, \ dto -> dto)
    
    terms.each(\ term -> {
      final var update = dtomap.get(term.PatternCode)
      if (update != null && update.Updated) {
        updateFrom(term, update)
      }
    })
  }
  
  
  
  /**
   * Updates a coverage term from the term update definition.
   */
  public static function updateFrom(term : CovTerm, dto : TermDTO) {
    if (term typeis gw.api.domain.covterm.TypekeyCovTerm) {
      final var typeChoices = term.Pattern.TypeList.getTypeKeys(false)
      final var chosenTypeKey = typeChoices.firstWhere(\ t -> t.Code.equalsIgnoreCase(dto.ChosenTerm))
      term.Value = chosenTypeKey
    } else if (term typeis gw.api.domain.covterm.OptionCovTerm) {
      final var choices = term.Pattern.Options
      final var chosen = choices.firstWhere(\ c -> c.CodeIdentifier.equalsIgnoreCase(dto.ChosenTerm))
      term.setOptionValue(chosen)
    } else if (term typeis gw.api.domain.covterm.PackageCovTerm) {
      final var choicePattern = term.Pattern
      final var opts = choicePattern.getOrderedAvailableValues(term)
      final var chosen = opts.firstWhere(\ c -> c.CodeIdentifier.equalsIgnoreCase(dto.ChosenTerm))
      term.setPackageValue(chosen)
    } else if (term typeis gw.api.domain.covterm.BooleanCovTerm) {
      term.setValue(dto.ChosenTerm == null ? null : dto.ChosenTerm.toBoolean())
    } else if (term typeis DirectCovTerm) {
        term.setValue(dto.DirectValue)
    } else {//Unable to set the term
      throw new Exception("unable to set the supplied coverage term: ${term.DisplayValue}")
    }
  }


  /**
   * Converts coverage term to coverage term DTO.
   */
  public static function toDTO(term : CovTerm) : TermDTO {
    final var res = new TermDTO()
    res.isAscendingBetter = true
    res.PatternCode = term.PatternCode
    res.Name = term.DisplayName
    res.ChosenTermValue = term.DisplayValue
    res.Options = getEmptySelections(term).concat(getOptions(term))
    res.ChosenTerm = selectedCodeOf(term)
    if ( term typeis DirectCovTerm ) {
      res.ValueType = term.ValueType.DisplayName
      res.DirectValue = term.Value
    }
    return res
  }
  
  
  
  /**
   * Returns a (possible empty) array of "empty" options for the term DTO.
   * These options are used to represent non-required term.
   */
  public static function getEmptySelections(term : CovTerm) : TermOptionDTO[] {
    return term.Pattern.Required ? new TermOptionDTO[0] : { simpleOption("None Selected", null) }
  }
  
  
  /**
   * Returns option terms for the coverage term.
   */
  public static function getOptions(term : CovTerm) : TermOptionDTO[] {
    final var pattern = term.Pattern
    if (pattern typeis OptionCovTermPattern) {
      final var opts = pattern.getAvailableValues(term)
      final var numOpts = opts.length
      return opts.mapWithIndex(\ opt, i -> {
        if (opt typeis CovTermOpt) {
          return starredOption(opt.DisplayName, opt.CodeIdentifier, i, numOpts)
        } else {
          throw new IllegalArgumentException("Cov term " + opt.CodeIdentifier + "is not a package or option term but is " + (typeof opt))
        }
      }).toTypedArray()
    } else if (pattern typeis PackageCovTermPattern || pattern typeis ChoiceCovTermPattern) {
      final var choicePattern = pattern as ChoiceCovTermPattern
      final var choices = choicePattern.getOrderedAvailableValues(term)
      final var numOpts2 = choices.length
      /* Order is very specific for carbon. Cannot convert to typed array
       * first due to ERROR gw.lang.parser.EvaluationException: Null reference for array.
       */
      return choices.mapWithIndex(\ opt, i -> {
        if (opt typeis CovTermPack) {
          return starredOption(opt.DisplayName, opt.CodeIdentifier, i, numOpts2)
        } else {
          throw new IllegalArgumentException("Cov term " + opt + "is not a package or option term but is " + (typeof opt))
        }
      }).toTypedArray()
    } else if (pattern typeis TypekeyCovTermPattern) {
      final var typekeys = pattern.TypeList.getTypeKeys(false)
      final var numOpts3 = typekeys.length
      return typekeys.mapWithIndex(\ opt, i ->
          starredOption(opt.DisplayName, opt.Code, i, numOpts3))
        .toTypedArray()
    } else if (pattern typeis GenericCovTermPattern) {
      if(term.getValueTypeName() === 'bit'){
        return {
            option("Yes", "true", 1, 1),
            option("No", "false", 0, 1)
        }
      }
      throw new Exception("Unsupported pattern type " + pattern)
    } else if ( pattern typeis DirectCovTermPattern ){
      return {}
    } else {
      throw new Exception("Unsupported pattern type " + pattern)
    }
  }
  
  
  
  /**
   * Calculates selection code of the term.
   */
  public static function selectedCodeOf(term : CovTerm) : String {
    if (term typeis gw.api.domain.covterm.TypekeyCovTerm) {
      return term.Value.Code
    } else if (term typeis gw.api.domain.covterm.OptionCovTerm) {
      return term.OptionValue.CodeIdentifier
    } else if (term typeis gw.api.domain.covterm.PackageCovTerm) {
      return term.PackageValue.CodeIdentifier
    } else if (term typeis gw.api.domain.covterm.BooleanCovTerm) {
      return term.Value == null ? null : term.Value ? "true" : "false"
    } else if (term typeis gw.api.domain.covterm.DirectCovTerm ) {
      return term.ValueAsString
    } else {
      throw new Exception("unable to get the supplied coverage term: ${term.DisplayValue}")
    }
  }



  /**
   *  Calculates a magic starred rating.
   */
  private static function starredOption(name : String, code : String, ind : int, size : int) : TermOptionDTO {
    /* Double value! */
    final var val = ind + 1.0
    return option(name, code,
      Math.round((val / size) * COVERAGE_TERM_MAX_RATING_STARS) as int, COVERAGE_TERM_MAX_RATING_STARS)
  }




  /**
   * Creates simple unbounded option.
   */
  private static function simpleOption(name : String, code : String) : TermOptionDTO {
    final var res = new TermOptionDTO()
    res.Name = name
    res.Code = code
    return res
  }
  
  

  /**
   * Creates simple option with bound and value.
   */
  private static function option(name : String, code : String, value : Integer, maxValue : Integer) : TermOptionDTO {
    final var res = new TermOptionDTO()
    res.Name = name
    res.Code = code
    res.OptionValue = value
    res.MaxValue = maxValue
    return res
  }
}
