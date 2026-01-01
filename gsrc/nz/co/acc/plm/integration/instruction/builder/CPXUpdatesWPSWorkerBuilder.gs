package nz.co.acc.plm.integration.instruction.builder

uses gw.api.database.Query
uses gw.api.system.database.SequenceUtil
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * WorkBuilder for CPXUpdatesWPS
 */
class CPXUpdatesWPSWorkerBuilder extends WorkerBuilderBase {

  private var _accNumber : String
  private var _jobNmber : String

  /**
   * Build the parameter String
   * @param jobNumber
   * @param accNumber
   */
  public function buildParameters(jobNumber : String, accNumber : String) {
    var stringBuilder = new StringBuilder()
    stringBuilder.append(jobNumber)
    stringBuilder.append(InstructionConstantHelper.CSV_DELIMITER)
    stringBuilder.append(accNumber)
    this.Instruction.Parameters = stringBuilder.toString()
  }

  /**
   * This context should provide context for the instruction
   */
  override public function loadParameters() {

    var theParam = this.Instruction.Parameters
    var values : String[]
    if (theParam != null) {
      values = theParam.split(InstructionConstantHelper.CSV_DELIMITER)
    }
    if (values == null || values.length != 2) {
      throw new DisplayableException("Invalid Parameters [${theParam}]")
    }
    _jobNmber = values[0]
    _accNumber = values[1]

  }

  /**
   * Build worker for CPXUpdateWPS
   * @param bundle
   */
  override public function buildWorker(bundle : Bundle) {
    var contacts = gw.api.database.Query.make(Contact)
        .compare(Contact#ACCID_ACC, Equals, _accNumber)
        .select()

    if (contacts?.Count != 1) {
      throw new DisplayableException("Can't find an unique contact by [${_accNumber}]")
    }

    var listOfWPSAccs = new ArrayList<String>()
    var cpxContact = contacts.first()
    cpxContact.AccountContacts?.each(\accountContact -> {
      if (accountContact.Roles.hasMatch(\role -> role typeis ShareholderContact_ACC)) {
        //This acc id is WPS
        listOfWPSAccs.add(accountContact.Account.ACCID_ACC)
      }
    })

    if (listOfWPSAccs.HasElements) {
      var termQ = Query.make(PolicyTerm)
      termQ.compareIn(PolicyTerm#AEPACCNumber_ACC, listOfWPSAccs.toArray())
      termQ.compare(PolicyTerm#AEPFinancialYear_ACC, Equals, this.Instruction.LevyYear)
      termQ.compare(PolicyTerm#AEPProductCode_ACC, Equals, ConstantPropertyHelper.PRODUCTCODE_WPS)

      var terms = termQ.select()

      if (terms.HasElements) {
        terms.each(\term -> {
          var r = new InstructionWorker_ACC(bundle)
          r.SequencerKey = term.AEPACCNumber_ACC
          r.Parameters = _jobNmber + InstructionConstantHelper.CSV_DELIMITER + term.PolicyNumber
          r.InstructionExecStatus_ACC = InstructionExecStatus_ACC.TC_UNPROCESSED
          r.RecordSequence = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND)
          r.Instruction_ACC = this.Instruction
          r.doInitOfNewRecord()
        })
      }
    }
  }

}