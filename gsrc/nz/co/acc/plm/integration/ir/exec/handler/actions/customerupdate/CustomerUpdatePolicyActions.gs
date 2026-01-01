package nz.co.acc.plm.integration.ir.exec.handler.actions.customerupdate

uses entity.BusinessIndustryCode_ACC
uses entity.PolicyLine
uses gw.api.financials.CurrencyAmount
uses gw.api.productmodel.Product
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.integration.instruction.helper.InstructionRecordUtil
uses nz.co.acc.integration.ir.record.util.IRConstants
uses nz.co.acc.plm.integration.ir.exec.handler.actions.ActionsUtil
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper
uses productmodel.CWPSLine
uses productmodel.EMPWPCLine
uses productmodel.INDCoPLine

uses java.lang.invoke.MethodHandles
uses java.math.BigDecimal

/**
 * Customer Update specific policy actions.
 * <p>
 * Created by Swati Patel on 13/04/2017.
 */
class CustomerUpdatePolicyActions {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  // The producer code to use for the policy
  private var _producerCode : ProducerCode
  // The product used for the policy
  private var _product : Product
  private var _policyLineType : typekey.PolicyLine as readonly PolicyLineType
  // Used to determine the policy type
  private var _accNumber : String
  private var _entityType : String
  private var _employerClassification : String
  private var _dateOfBirth : Date

  construct(accNumber : String, entityType : String, empClass : String, dateOfBirth : Date) {
    _accNumber = accNumber
    _entityType = entityType
    _employerClassification = empClass
    _dateOfBirth = dateOfBirth
    determinePolicyLine()
  }

  protected function updateEmployerClassificationIfRequired(policy : Policy, bundle : Bundle) {
    var existingEmpClassificationCode = policy.EMPClassificationCode_ACC

    if (existingEmpClassificationCode != _employerClassification) {
      bundle.add(policy).EMPClassificationCode_ACC = _employerClassification
    }
  }

  /**
   * Create policy based on the entity type/employer classification
   *
   * @param bundle - the bundle to use.
   * @return - the submission created.
   */
  function createPolicy(bicCode : BusinessIndustryCode_ACC, bundle : Bundle, startDate : Date) {
    _log.info("Create ${_policyLineType} policy for ACC Number: ${_accNumber}")

    var account = policyCreateValidation(bundle)
    var submission : Submission

    var producerSelection = new ProducerSelection()
    producerSelection.ProducerCode = _producerCode
    producerSelection.Producer = _producerCode.Organization

    producerSelection.State = Jurisdiction.TC_NZ
    submission = account.createSubmission(_product, producerSelection);
    ActionsUtil.setIRFlags(submission)

    var policyPeriod = submission.LatestPeriod

    policyPeriod.createACCPolicyID()

    // We use a specified number of years in the past for the policy start date.
    policyPeriod.PeriodStart = startDate
    policyPeriod.TermType = TermType.TC_OTHER

    policyPeriod = bundle.add(policyPeriod)
    policyPeriod.SubmissionProcess.beginEditing()
    policyPeriod.autoSelectUWCompany()

    var line = createPolicyLine(_policyLineType, policyPeriod, startDate.YearOfDate)
    var polBicCode = policyBicCodeFromBicCode(bicCode, policyPeriod, line)
    line.PrimaryBICCode_ACC = polBicCode
    line.addToBICCodes(polBicCode)

    policyPeriod.Lines = {line}
    submission.Periods = {policyPeriod}
    submission.Policy.EMPClassificationCode_ACC = _employerClassification

    nz.co.acc.lob.util.ModifiersUtil_ACC.setSelectedExperienceRating(policyPeriod, ExpRatingProgramme_ACC.TC_STANDARD)

    policyPeriod.SubmissionProcess.requestQuote()
    policyPeriod.SubmissionProcess.issue()

    if (ScriptParameters.RenewToCurrentOnCREG_ACC) {
      createRenewals(account, policyPeriod, bundle)
    }
  }

  function createRenewals(account : Account, period : PolicyPeriod, bundle : Bundle) {
    var record = InstructionRecordUtil.createRenewalInstructionRecordEntity(
        bundle,
        account.ACCID_ACC,
        period.Policy.ProductCode_ACC.Suffix.Code,
        InstructionSource_ACC.TC_IR)
    _log.info("Created ${record}")
  }

  private function policyBicCodeFromBicCode(bicCode : BusinessIndustryCode_ACC, policyPeriod : PolicyPeriod, line : entity.PolicyLine) : PolicyLineBusinessClassificationUnit_ACC {
    var policyBicCode = new PolicyLineBusinessClassificationUnit_ACC(policyPeriod, line.EffectiveDate, line.ExpirationDate)
    policyBicCode.BICCode = bicCode.BusinessIndustryCode
    policyBicCode.CUCode = bicCode.ClassificationUnit_ACC.ClassificationUnitCode
    // Always 100 %
    policyBicCode.Percentage = 100.00bd
    policyBicCode.BICDescription = bicCode.BusinessIndustryDescription
    policyBicCode.CUDescription = bicCode.ClassificationUnit_ACC.ClassificationUnitDescription
    // 0 for submission
    policyBicCode.AdjustedLiableEarnings = new CurrencyAmount(0)
    return policyBicCode
  }

  // Validates account, producer code, product
  private function policyCreateValidation(bundle : Bundle) : Account {
    // Look for Account in the bundle
    var accounts = bundle.getBeansByRootType(Account)

    // Look in the existing bundle first, otherwise check the DB
    var account = accounts.firstWhere(\entity -> (entity as Account).ACCID_ACC == _accNumber) as Account

    if (account == null) {
      // This can never happen - account is always created or updated first.
      throw new DisplayableException("Processing error: account not found in bundle")
    }

    _producerCode = ActionsUtil.getACCProducerCode()
    if (_producerCode == null) {
      throw new DisplayableException("ACC Producer Code not found")
    }

    var productCode : String
    productCode = determineProductCode()

    _product = gw.api.productmodel.ProductLookup.getByCodeIdentifier(productCode)
    if (_product == null) {
      throw new DisplayableException("Product not found: " + productCode)
    }
    return account
  }

  private function determineProductCode() : String {
    if (_policyLineType == (typekey.PolicyLine.TC_INDCOPLINE)) {
      return ConstantPropertyHelper.PRODUCTCODE_CP
    } else if (_policyLineType == (typekey.PolicyLine.TC_EMPWPCLINE)) {
      return ConstantPropertyHelper.PRODUCTCODE_WPC
    } else if (_policyLineType == (typekey.PolicyLine.TC_CWPSLINE)) {
      return ConstantPropertyHelper.PRODUCTCODE_WPS
    } else {
      // This can never happen
      throw new DisplayableException("Cannot determine product code:Invalid policy line: ${_policyLineType}}")
    }
  }

  private function determinePolicyLine(entityType : String, employerClassification : String) : Optional<typekey.PolicyLine> {
    var isIndividual = entityType == IRConstants.ENTITY_TYPE_INDIVIDUAL

    var isEmployerClassificationEmployer = employerClassification == IRConstants.EMPLOYER_CLASSIFICATION_EMPLOYER
    var isEmployerClassificationIndividual = employerClassification == IRConstants.EMPLOYER_CLASSIFICATION_INDIVIDUAL
    var isEmployerClassificationSE = (employerClassification == null)
        or (employerClassification == IRConstants.EMPLOYER_CLASSIFICATION_SELF_EMPLOYED)


    // I + <empty>
    if (isIndividual && isEmployerClassificationSE) {
      return Optional.of(typekey.PolicyLine.TC_INDCOPLINE)
    }
    // <>I + O
    else if (!isIndividual && isEmployerClassificationEmployer) {
      return Optional.of(typekey.PolicyLine.TC_EMPWPCLINE)
    }
    // <>I + <empty>
    else if (!isIndividual && isEmployerClassificationSE) {
      return Optional.of(typekey.PolicyLine.TC_CWPSLINE)
    }
    // I + I
    else if (isIndividual && isEmployerClassificationIndividual) {
      return Optional.of(typekey.PolicyLine.TC_EMPWPCLINE)
    }
    // I + O
    else if (isIndividual && isEmployerClassificationEmployer) {
      return Optional.of(typekey.PolicyLine.TC_EMPWPCLINE)
    } else {
      return Optional.empty()
    }
  }

  // Use entity type and employer classification to determine the line
  private function determinePolicyLine() : typekey.PolicyLine {
    var policyLineOptional = determinePolicyLine(_entityType, _employerClassification)
    if (policyLineOptional.Present) {
      _policyLineType = policyLineOptional.get()
      return _policyLineType
    } else {
      throw new DisplayableException("Cannot determine policy line: Invalid Entity Type & EmployerClassification Combination/Values: ${_entityType} ${_employerClassification}")
    }
  }

  private function createPolicyLine(policyLineType : typekey.PolicyLine, policyPeriod : PolicyPeriod, year : int) : PolicyLine {
    switch (policyLineType) {
      case typekey.PolicyLine.TC_INDCOPLINE:
        var indLine : INDCoPLine
        indLine = new INDCoPLine(policyPeriod)
        indLine.createAndAddINDCoPCov();
        indLine.INDCoPCovs[0].ProRataFactor = 1
        ActionsUtil.setFMUStatus(_dateOfBirth, indLine.INDCoPCovs[0].LiableEarningCov, year)
        policyPeriod.EffectiveDatedFields.syncModifiers()
        return indLine
      case typekey.PolicyLine.TC_EMPWPCLINE:
        var empLine : EMPWPCLine
        empLine = new EMPWPCLine(policyPeriod)
        empLine.createAndAddEMPWPCCov()
        empLine.syncModifiers()
        return empLine
      case typekey.PolicyLine.TC_CWPSLINE:
        var cwpsLine : CWPSLine
        cwpsLine = new CWPSLine(policyPeriod)
        cwpsLine.createAndAddCWPSCov()
        cwpsLine.syncModifiers()
        return cwpsLine
      default:
        throw new DisplayableException("Unexpected policy line type: ${policyLineType}")
    }
  }
}
