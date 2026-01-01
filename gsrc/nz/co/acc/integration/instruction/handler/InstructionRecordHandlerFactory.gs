package nz.co.acc.integration.instruction.handler

uses nz.co.acc.integration.instruction.handler.impl.AddressEndDateInstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.impl.AddressFlagsInstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.impl.BlankPolicyChangeRecordHandler
uses nz.co.acc.integration.instruction.handler.impl.BulkWPCEarningChangeRecordHandler
uses nz.co.acc.integration.instruction.handler.impl.CUChangeInstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.impl.ManualRetryInstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.impl.DocumentRemovalRecordHandler
uses nz.co.acc.integration.instruction.handler.impl.ModifierInstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.impl.PrimaryContactInstructionRecordHandler

uses nz.co.acc.integration.instruction.handler.impl.ValidForClaimsInstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.impl.RenewalInstructionRecordHandler
uses nz.co.acc.integration.instruction.record.impl.AddressEndDateInstructionRecord
uses nz.co.acc.integration.instruction.record.impl.AddressFlagsInstructionRecord
uses nz.co.acc.integration.instruction.record.impl.BlankPolicyChangeRecord
uses nz.co.acc.integration.instruction.record.impl.BulkWPCEarningChangeRecord
uses nz.co.acc.integration.instruction.record.impl.CUChangeInstructionRecord
uses nz.co.acc.integration.instruction.record.impl.ManualRetryInstructionRecord
uses nz.co.acc.integration.instruction.record.impl.DocumentRemovalInstructionRecord
uses nz.co.acc.integration.instruction.record.impl.ModifierInstructionRecord

uses nz.co.acc.integration.instruction.record.InstructionRecord
uses nz.co.acc.integration.instruction.record.impl.PrimaryContactInstructionRecord
uses nz.co.acc.integration.instruction.record.impl.ValidForClaimsInstructionRecord
uses nz.co.acc.integration.instruction.record.impl.RenewalInstructionRecord
uses org.apache.commons.lang3.NotImplementedException

/**
 * Created by Mike Ourednik on 7/02/2021.
 */
class InstructionRecordHandlerFactory {

  public function createInstructionRecordHandler(instructionRecord : InstructionRecord) : InstructionRecordHandler {
    switch (instructionRecord.InstructionType) {
      case InstructionType_ACC.TC_BULKMODIFIERUPLOAD:
        return new ModifierInstructionRecordHandler(instructionRecord as ModifierInstructionRecord)
      case InstructionType_ACC.TC_BULKCUCHANGE:
        return new CUChangeInstructionRecordHandler(instructionRecord as CUChangeInstructionRecord)
      case InstructionType_ACC.TC_ADDRESSENDDATE:
        return new AddressEndDateInstructionRecordHandler(instructionRecord as AddressEndDateInstructionRecord)
      case InstructionType_ACC.TC_ADDRESSFLAGS:
        return new AddressFlagsInstructionRecordHandler(instructionRecord as AddressFlagsInstructionRecord)
      case InstructionType_ACC.TC_BULKEDITPRIMARYCONTACT:
        return new PrimaryContactInstructionRecordHandler(instructionRecord as PrimaryContactInstructionRecord)
      case InstructionType_ACC.TC_BULKISSUEBLANKPOLICYCHANGE:
        return new BlankPolicyChangeRecordHandler(instructionRecord as BlankPolicyChangeRecord)
      case InstructionType_ACC.TC_IRMANUALRETRY:
        return new ManualRetryInstructionRecordHandler(instructionRecord as ManualRetryInstructionRecord)
      case InstructionType_ACC.TC_DOCUMENTREMOVAL:
        return new DocumentRemovalRecordHandler(instructionRecord as DocumentRemovalInstructionRecord)
      case InstructionType_ACC.TC_BULKWPCEARNINGCHANGE:
        return new BulkWPCEarningChangeRecordHandler(instructionRecord as BulkWPCEarningChangeRecord)
      case InstructionType_ACC.TC_VALIDFORCLAIMS:
        return new ValidForClaimsInstructionRecordHandler(instructionRecord as ValidForClaimsInstructionRecord)
      case InstructionType_ACC.TC_RENEWAL:
        return new RenewalInstructionRecordHandler(instructionRecord as RenewalInstructionRecord)
      default:
        throw new NotImplementedException("Instruction type not implemented: ${instructionRecord.InstructionType}")
    }
  }
}