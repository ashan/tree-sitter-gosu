package nz.co.acc.integration.instruction.helper

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.integration.instruction.record.impl.CUChangeInstructionRecord
uses nz.co.acc.integration.instruction.record.impl.ManualRetryInstructionRecord
uses nz.co.acc.integration.instruction.record.impl.RenewalInstructionRecord
uses nz.co.acc.integration.instruction.recordmapper.impl.CUChangeInstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.ManualRetryInstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.RenewalInstructionRecordMapper

/**
 * Created by Mike Ourednik on 28/02/2021.
 */
class InstructionRecordUtil {

  static function createCUChangeInstructionRecordEntity(
      bundle : Bundle,
      accID : String,
      productCode : String,
      levyYear : Integer,
      bicCode : String,
      source : InstructionSource_ACC) : CUChangeInstructionRecord {
    var mapper = new CUChangeInstructionRecordMapper()
    var record = new CUChangeInstructionRecord(accID, productCode, levyYear, bicCode, source)
    mapper.createEntity(bundle, record, Optional.empty())
    return record
  }

  static function createManualRetryInstructionRecordEntity(
      bundle : Bundle,
      accID : String) {
    var mapper = new ManualRetryInstructionRecordMapper()
    var record = new ManualRetryInstructionRecord(accID)
    mapper.createEntity(bundle, record, Optional.empty())
  }

  static function createRenewalInstructionRecordEntity(
      bundle : Bundle,
      accID : String,
      productCode : String,
      source : InstructionSource_ACC) : RenewalInstructionRecord {
    var mapper = new RenewalInstructionRecordMapper()
    var record = new RenewalInstructionRecord(accID, productCode, source)
    mapper.createEntity(bundle, record, Optional.empty())
    return record
  }

}