package nz.co.acc.plm.integration.ir.exec.handler.actions.customerupdate

uses com.google.common.annotations.VisibleForTesting
uses entity.BusinessIndustryCode_ACC
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths

uses nz.co.acc.plm.common.bic.BusinessClassificationAPI
uses nz.co.acc.plm.integration.ir.util.IRAccountHelper
uses nz.co.acc.plm.util.ActivityUtil
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

/**
 * Created by Swati Patel on 9/06/2017.
 */
class CustomerUpdateBusinessClassificationAPI {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  private var _bicApi = new BusinessClassificationAPI()
  private var _defaultBICApplied : Boolean

  construct() {
  }

  /**
   * BIC code lookup for nature of business string.
   *
   * @param bic     - string to lookup, real BIC code instead of description
   * @param address - address to use if string lookup fails in the case of a new policy.
   * @return - New policies - the BIC code to use.  Existing policies - null if the BIC code is the same as on the
   * existing policy.  Not null if the BIC code is different (and trusted).  Null if BIC code different but not trusted.
   */
  public function bicCodeLookupForNewPolicy(
      account : Account,
      policyStartDate : Date,
      bic : String,
      address : String) : BusinessIndustryCode_ACC {
    _log.info("bicCodeLookupForNewPolicy: accID=${account.ACCID_ACC}, bic=${bic}, policyStartDate=${policyStartDate.toISODate()}")
    var bicCode = _bicApi.getBICCode(bic, policyStartDate.YearOfDate)

    if (bicCode != null) {
      return bicCode

    } else {
      // look for CU from another policy on same account
      bicCode = findCUOtherPolicy(account, policyStartDate)
      if (bicCode == null) {
        // Use address to determine a BIC code to use - will always return a code.
        bicCode = _bicApi.getBICCodeFromAddress(address, policyStartDate.YearOfDate)
        _defaultBICApplied = true
      }
      _log.info("bicCodeLookupForNewPolicy: accID=${account.ACCID_ACC}. bic [${bic}] not found. Using default CU.")
      return bicCode
    }
  }

  private function findCUOtherPolicy(account : Account, policyStartDate : Date) : BusinessIndustryCode_ACC {
    var policyPeriod = new IRAccountHelper(account).findLatestPolicyPeriod()
    if (policyPeriod != null) {
      //DE1216 - Apply the default BIC rule if there's only 1 BIC/CU in the other policy
      if (policyPeriod.Lines[0].BICCodes.length == 1) {
        var policyBic = policyPeriod.Lines[0].PrimaryBICCode_ACC
        return _bicApi.getBICCode(policyBic.BICCode, policyStartDate.YearOfDate)
      }
    }
    return null
  }

  /**
   * BIC code lookup for nature of business string.
   *
   * @param bic     - string to lookup, real BIC code instead of description
   * @param address - address to use if string lookup fails in the case of a new policy.
   * @return - New policies - the BIC code to use.  Existing policies - null if the BIC code is the same as on the
   * existing policy.  Not null if the BIC code is different (and trusted).  Null if BIC code different but not trusted.
   */
  public function bicCodeLookupForExistingPolicy(
      account : Account,
      policyStartDate : Date,
      bic : String,
      policyLineType : typekey.PolicyLine,
      inboundRecordPublicID : String) : BusinessIndustryCode_ACC {

    _log.info("bicCodeLookupForExistingPolicy: accID=${account.ACCID_ACC}, policyStartDate=${policyStartDate.toISODate()}"
        + ", bic=${bic}, policyLineType=${policyLineType}, inboundRecordPublicID=${inboundRecordPublicID}")

    var policyPeriod = new IRAccountHelper(account).findLatestPolicyPeriod(policyLineType)

    if (policyPeriod == null) {
      _log.info("bicCodeLookupForExistingPolicy: accID=${account.ACCID_ACC}, policyLineType=${policyLineType}. policyPeriod not found")
      return null

    } else {
      var multiCU = policyPeriod.Lines[0].BICCodes.Count > 1
      if (multiCU) {
        _log.info("bicCodeLookupForExistingPolicy: accID=${account.ACCID_ACC}. Received update for multi CU policy")
        return null
      }
      // There will always be a bic code
      var policyBic = policyPeriod.Lines[0].BICCodes.single()

      if (policyBic == null) {
        _log.info("bicCodeLookupForExistingPolicy: accID=${account.ACCID_ACC}, policyLineType=${policyLineType}. policyBic is null")
        return null

      } else {
        // does it match the one we have got in
        var bicCode = _bicApi.getBICCode(bic, policyStartDate.YearOfDate)
        if (bicCode == null) {
          _log.info("bicCodeLookupForExistingPolicy: accID=${account.ACCID_ACC}. Received update for invalid BIC [${bic}]")
          return null
        }
        if (policyBic.BICDescription?.trim()?.equalsIgnoreCase(bicCode.BusinessIndustryDescription?.trim())) {
          _log.info("bicCodeLookupForExistingPolicy: accID=${account.ACCID_ACC}. New BIC matches existing.")
          // all good - nothing to do
          return null
        } else {
          if (trustCUChange(policyPeriod, policyBic, inboundRecordPublicID, policyStartDate)) {
            _log.info("bicCodeLookupForExistingPolicy: accID=${account.ACCID_ACC}, bic=${bic}, trustCUChange=true. Applying BIC change")
            return bicCode
          } else {
            _log.info("bicCodeLookupForExistingPolicy: accID=${account.ACCID_ACC}, bic=${bic}, trustCUChange=false. Not applying BIC change")
            return null
          }
        }
      }
    }
  }

  private function trustCUChange(
      policyPeriod : PolicyPeriod,
      policyBic : PolicyLineBusinessClassificationUnit_ACC,
      inboundRecordPublicID : String,
      policyStartDate : Date) : boolean {

    var prevNOB : String = null

    if (inboundRecordPublicID != null) {
      var inboundRecord = Query.make(IRInboundRecord_ACC)
          .compare(IRInboundRecord_ACC#PublicID, Relop.Equals, inboundRecordPublicID)
          .select()
          .single()
      prevNOB = getPreviousNOB(inboundRecord)
    }

    if (prevNOB == null) {
      return !policyPeriod.Policy.CU_Maintained_By_ACC
    }
    var prevNOBBicCode = _bicApi.getBICCode(prevNOB, policyStartDate.YearOfDate)

    if (prevNOBBicCode == null) {
      //prevNOB could be description
      prevNOBBicCode = _bicApi.getBICCodeFromDescription(prevNOB, policyStartDate.YearOfDate)
      if (prevNOBBicCode == null) {
        return false
      }
    }
    //check if previous IR Creg CU equals to current policy CU
    var result = prevNOBBicCode.ClassificationUnit_ACC.ClassificationUnitCode.trim().equalsIgnoreCase(policyBic.CUCode.trim())

    return result
  }

  /**
   * This method will derive last Nature Of Business for the same ACCNumber
   * Return String value
   */
  @VisibleForTesting
  public function getPreviousNOB(inboundRecord : IRInboundRecord_ACC) : String {
    var result = Query.make(IRInboundRecord_ACC)
        .compare(IRInboundRecord_ACC#SequencerKey, Relop.Equals, inboundRecord.SequencerKey)
        .compare(IRInboundRecord_ACC#EmployerClassification, Relop.Equals, inboundRecord.EmployerClassification)
        .compare(IRInboundRecord_ACC#EntityType, Relop.Equals, inboundRecord.EntityType)
        .compare(IRInboundRecord_ACC#NatureOfBusiness, Relop.NotEquals, null)
        .compare(IRInboundRecord_ACC#RecordSequence, Relop.LessThan, inboundRecord.RecordSequence)
        .select({QuerySelectColumns.path(Paths.make(IRInboundRecord_ACC#NatureOfBusiness))})
        .orderByDescending(QuerySelectColumns.path(Paths.make(IRInboundRecord_ACC#RecordSequence)))
        .FirstResult

    var nob = result?.getColumn(0) as String

    return nob
  }

  public function isDefaultBICApplied() : Boolean {
    return _defaultBICApplied
  }
}