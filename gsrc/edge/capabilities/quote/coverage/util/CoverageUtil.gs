package edge.capabilities.quote.coverage.util

uses edge.capabilities.quote.coverage.dto.CoverageDTO
uses java.lang.UnsupportedOperationException
uses gw.api.productmodel.CoveragePattern
uses edge.util.MapUtil
uses java.lang.IllegalArgumentException
uses edge.capabilities.currency.dto.AmountDTO

final class CoverageUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }
  
  
  /**
   * Batch version of updateFromPattern. Operates with coverage patterns instead of coverages.
   * <p>Also synchronizes coverages on the coverable to match list of supported patterns.
   */
  public static function updateFrom(coverable : Coverable, patterns : CoveragePattern[], dto : CoverageDTO[]) {
    final var covUpdates = MapUtil.groupUniqueArrayBy(dto, \ i -> i.PublicID)
    final var patternCodes = patterns.map(\ c -> c.PublicID).toSet()
    
    if (!patternCodes.containsAll(covUpdates.Keys)) {
      throw new IllegalArgumentException("Attempt to add coverage unsupported by pattern")
    }
    
    patterns.each(\pat -> updateFromPattern(coverable, pat, covUpdates.get(pat.PublicID)))
  }

  public static function updateFrom<T extends PolicyLine>(coverable(pattern:CoveragePattern):Coverable, patterns : CoveragePattern[], dto : CoverageDTO[]) {
    final var covUpdates = MapUtil.groupUniqueArrayBy(dto, \ i -> i.PublicID)
    final var patternCodes = patterns.map(\ c -> c.PublicID).toSet()

    if (!patternCodes.containsAll(covUpdates.Keys)) {
      throw new IllegalArgumentException("Attempt to add coverage unsupported by pattern")
    }

    patterns.each(\pat -> updateFromPattern(coverable(pat), pat, covUpdates.get(pat.PublicID)))
  }

  
  /**
   * Updates one coverable from the coverage.
   * <p>Supports null dtos which are treated as "deselect this coverable" option.
   */
  public static function updateFromPattern(coverable : Coverable, pat : CoveragePattern, dto :  CoverageDTO) {
    if (dto == null || !dto.Selected) {
        if (pat.isRequiredCov(coverable)) {
          throw new IllegalArgumentException("Attempt to remove required coverage for pattern " + pat)
        }

        coverable.setCoverageConditionOrExclusionExists(pat, false)
      return
    }

      coverable.setCoverageConditionOrExclusionExists(pat, true)
    TermUtil.updateFrom(coverable.getCoverage(pat).CovTerms, dto.Terms)
  }


  /**
   * Converts coverage pattern (and coverage on the coverable) into a DTO.
   */
  @Param("pat", "Coverage pattern")
  @Param("coverable", "Coverable to which this coverage applies. May change 'required' state")
  @Param("cost", "Cost provider. Used for selected coverages")
  public static function toDTO(pat : CoveragePattern, coverable : Coverable, cost(cov : Coverage) : AmountDTO) : CoverageDTO {
    final var res = new CoverageDTO()
    res.PublicID = pat.PublicID
    res.Description = pat.DisplayName
    res.Required  = !pat.allowToggle(coverable)
    res.Selected = coverable.hasCoverageConditionOrExclusion(pat)
    res.Name = pat.DisplayName
    if (res.Selected) {
      final var cov = coverable.getCoverage(pat)
      res.Terms = 
        cov.CovTerms
          .sortBy(\ c -> c.Pattern.Priority)
          .map(\ t -> TermUtil.toDTO(t))
       res.Amount = cost(cov)
    } else {
      res.Terms = {}
      res.Amount = null
    }
    return res
  }    
}
