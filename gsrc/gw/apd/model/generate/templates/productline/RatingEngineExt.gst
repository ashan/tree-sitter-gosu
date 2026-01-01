<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.RATING}"
var extPackage = "${productLine.LOBPackageName}.${APDConstants.RATING}"
%>
package ${extPackage}

uses ${basePackage}.${productLine.LinePrefix}RatingEngineBase

@Export
class ${productLine.LinePrefix}RatingEngine extends ${productLine.LinePrefix}RatingEngineBase {

  construct(line : entity.${productLine.QualifiedName}) {
    super(line)
  }

  construct(line : entity.${productLine.QualifiedName}, minimumRatingLevel : typekey.RateBookStatus) {
    super(line, minimumRatingLevel)
  }

  override protected function rateSlice(lineVersion : entity.${productLine.QualifiedName}) {
    assertSliceMode(lineVersion)

    if (lineVersion.Branch.isCanceledSlice()) {
      // Do nothing if this is a canceled slice
    } else {
      var sliceStart = lineVersion.SliceDate
      var sliceEnd = getNextSliceDateAfter(sliceStart)

      /***********
       *
       * Rating logic for rating 1 slice of the line goes here
       *
       ***********/

    }

  }

  /******
   * This default version of this method will not create any costs for the entire period.  Instead, it assumes that all costs are created
   * as part of calculating the pro rata premium for each slice of effective time.  If a policy does need to create Costs for the entire
   * period (such as a cancellation short rate penalty or a non-linear premium discount), then this method should be overridden to implement
   * that logic.
   ******/
  override protected function rateWindow(line : entity.${productLine.QualifiedName}) {
  }

}