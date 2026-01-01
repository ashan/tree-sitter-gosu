package nz.co.acc.integration.instruction.recordmapper

uses nz.co.acc.integration.instruction.recordmapper.impl.AddressEndDateInstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.AddressFlagsInstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.BlankPolicyChangeRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.BulkWPCEarningChangeRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.ManualRetryInstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.DocumentRemovalRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.PrimaryContactInstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.CUChangeInstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.ModifierInstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.ValidForClaimsInstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.impl.RenewalInstructionRecordMapper
uses org.apache.commons.lang3.NotImplementedException

/**
 * Created by Mike Ourednik on 7/02/2021.
 */
class InstructionRecordMapperFactory {

  function getInstructionRecordMapper(instructionType : InstructionType_ACC) : InstructionRecordMapper {
    switch (instructionType) {
      case InstructionType_ACC.TC_BULKMODIFIERUPLOAD:
        return new ModifierInstructionRecordMapper()
      case InstructionType_ACC.TC_BULKCUCHANGE:
        return new CUChangeInstructionRecordMapper()
      case InstructionType_ACC.TC_ADDRESSENDDATE:
        return new AddressEndDateInstructionRecordMapper()
      case InstructionType_ACC.TC_ADDRESSFLAGS:
        return new AddressFlagsInstructionRecordMapper()
      case InstructionType_ACC.TC_BULKEDITPRIMARYCONTACT:
        return new PrimaryContactInstructionRecordMapper()
      case InstructionType_ACC.TC_BULKISSUEBLANKPOLICYCHANGE:
        return new BlankPolicyChangeRecordMapper()
      case InstructionType_ACC.TC_IRMANUALRETRY:
        return new ManualRetryInstructionRecordMapper()
      case InstructionType_ACC.TC_DOCUMENTREMOVAL:
        return new DocumentRemovalRecordMapper()
      case InstructionType_ACC.TC_BULKWPCEARNINGCHANGE:
        return new BulkWPCEarningChangeRecordMapper()
      case InstructionType_ACC.TC_VALIDFORCLAIMS:
        return new ValidForClaimsInstructionRecordMapper()
      case InstructionType_ACC.TC_RENEWAL:
        return new RenewalInstructionRecordMapper()
      default:
        throw new NotImplementedException("Instruction type not implemented: ${instructionType}")
    }
  }

}