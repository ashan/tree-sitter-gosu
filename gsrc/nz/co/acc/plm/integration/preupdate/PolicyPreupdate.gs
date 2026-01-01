package nz.co.acc.plm.integration.preupdate

uses gw.api.system.database.SequenceUtil
uses gw.api.util.DisplayableException
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * Preupdate rule for pathway using CLIENT_ID at Policy level.
 */
class PolicyPreupdate {

  public static function executePreUpdate(policy : Policy) {
    initializePolicyStatus(policy)
    initializeClientID(policy)
  }

  public static function initializePolicyStatus(policy : Policy) {
    if (policy.New and
        not(policy.IsActiveNewCustomer_ACC)) {
      policy.Status_ACC = PolicyStatus_ACC.TC_INACTIVE
    }
  }

  public static function initializeClientID(policy : Policy) {
    if (policy.ClientID_ACC == null) {
      // create legacyEmployerID for Legacy systems Pathway/ESS/EOS (8 digits)
      var clientID = SequenceUtil.next(ScriptParameters.LegacyClientIDStart_ACC, ConstantPropertyHelper.SEQUENCE_LEGACY_EMPLOYER_ID)
      if (clientID > ScriptParameters.LegacyClientIDMax_ACC) {
        throw new DisplayableException("ClientID over than ${ScriptParameters.LegacyClientIDMax_ACC}")
      }
      policy.ClientID_ACC = String.valueOf(clientID)
    }
  }

}