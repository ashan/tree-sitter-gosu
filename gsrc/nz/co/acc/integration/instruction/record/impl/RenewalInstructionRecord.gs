package nz.co.acc.integration.instruction.record.impl

uses nz.co.acc.constants.ProductSuffix
uses nz.co.acc.integration.instruction.record.InstructionRecord
uses org.apache.commons.lang3.builder.ToStringBuilder
uses org.apache.commons.lang3.builder.ToStringStyle

/**
 * Created by Mike Ourednik on 5/02/2021.
 */
class RenewalInstructionRecord implements InstructionRecord {
  private var _accID : String as readonly ACCID
  private var _productCode : ProductSuffix as readonly ProductCode
  private var _source: InstructionSource_ACC as readonly InstructionSource

  public construct(
      accID : String,
      productCode : String,
      source: InstructionSource_ACC) {
    _accID = accID
    _productCode = ProductSuffix.valueOf(productCode)
    _source = source
  }

  override property get InstructionType() : InstructionType_ACC {
    return InstructionType_ACC.TC_RENEWAL
  }

  override function toString() : String {
    return new ToStringBuilder(this, ToStringStyle.SHORT_PREFIX_STYLE)
        .append("accID", _accID)
        .append("productCode", _productCode)
        .append("source", _source)
        .toString()
  }

}