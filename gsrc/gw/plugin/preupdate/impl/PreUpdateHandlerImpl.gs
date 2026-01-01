package gw.plugin.preupdate.impl

uses entity.AccountContact
uses entity.AccountContactRole
uses entity.Activity
uses entity.Address
uses entity.Contact
uses entity.History
uses gw.api.preupdate.PreUpdateContext
uses gw.pl.persistence.core.Bundle
uses gw.plugin.preupdate.IPreUpdateHandler
uses nz.co.acc.aep.AEPPolicyPeriodPreupdateImpl
uses nz.co.acc.integration.junoinformationservice.preupdate.JISPreupdateHandler
uses nz.co.acc.integration.securemessage.SecureMessagePreUpdateHandler
uses nz.co.acc.plm.integration.preupdate.AccountContactPreupdate_ACC
uses nz.co.acc.plm.integration.preupdate.AccountPreupdate_ACC
uses nz.co.acc.plm.integration.preupdate.ActivityPreupdate
uses nz.co.acc.plm.integration.preupdate.AddressPreupdate_ACC
uses nz.co.acc.plm.integration.preupdate.ContactPreupdate_ACC
uses nz.co.acc.plm.integration.preupdate.HistoryPreupdate_ACC
uses nz.co.acc.plm.integration.preupdate.PolicyPeriodPreupdate
uses nz.co.acc.plm.integration.preupdate.PolicyPreupdate
uses nz.co.acc.preupdate.AccountUserRoleAssignmentPreupdate_ACC


@Export
class PreUpdateHandlerImpl implements IPreUpdateHandler {

  /**
   * Pre-update callback that's executed if the config parameter UseOldStylePreUpdate is set to false.
   * If so, this method should do whatever pre-updating is necessary. By default, this collects all
   * inserted and updated beans (plus Accounts and Jobs if any of their Assignments were changed),
   * then executes the pre-update logic for each one. Any exception will cause the bounding database
   * transaction to roll back, effectively vetoing the update.
   */
  override function executePreUpdate(context : PreUpdateContext) {
    var jisPreupdateHandler = new JISPreupdateHandler()
    var insertedOrUpdatedBeans = new HashSet<KeyableBean>()
    var removedBeans = context.RemovedBeans.toSet()
    for (bean in context.InsertedBeans) {
      addBeansToBePreUpdated(insertedOrUpdatedBeans, bean)
    }

    for (bean in context.UpdatedBeans) {
      addBeansToBePreUpdated(insertedOrUpdatedBeans, bean)
    }

    for (bean in insertedOrUpdatedBeans) {
      DemoPreUpdateImpl.Instance.executePreUpdate(bean)

      switch (typeof bean) {
        case AEPAccountComplianceDetail_ACC:
          jisPreupdateHandler.handleAEPAccountComplianceDetailsChanged(bean)
          break
        case Account:
          AccountPreupdate_ACC.executePreUpdate(bean)
          jisPreupdateHandler.handleAccountChanged(bean)
          break
        case MaoriBusinessInfo_ACC:
          jisPreupdateHandler.handleMaoriBusinessInfo(bean)
          break
        case AccountUserRoleAssignment:
          AccountUserRoleAssignmentPreupdate_ACC.updated(bean)
          break
        case AccountContact:
          jisPreupdateHandler.handleAccountContactChanged(bean)
          break
        case Audit:
          HistoryPreupdate_ACC.Instance.createAuditHistory(bean)
          break
        case AccountLocation:
          AddressPreupdate_ACC.Instance.executePreUpdate(bean)
          jisPreupdateHandler.handleAccountLocationChanged(bean)
          break
        case Accreditation_ACC:
          jisPreupdateHandler.handleAccreditationChanged(bean)
          break
        case Activity:
          ActivityPreupdate.executePreUpdate(bean)
          break
        case Address:
          AddressPreupdate_ACC.Instance.executePreUpdate(bean)
          jisPreupdateHandler.handleAddressChanged(bean)
          break
        case History:
          HistoryPreupdate_ACC.Instance.executePreUpdate(bean)
          break
        case Policy:
          PolicyPreupdate.executePreUpdate(bean)
          jisPreupdateHandler.handlePolicyChanged(bean)
          break
        case PolicyPeriod:
          PolicyPeriodPreupdate.executePreUpdate(bean)
          jisPreupdateHandler.handlePolicyPeriodChanged(bean)
          break
        case PolicyTerm:
          jisPreupdateHandler.handlePolicyTermChanged(bean)
          break
        case SecureMessage_ACC:
          SecureMessagePreUpdateHandler.newMessage(bean)
          break
        default:
          break
      }

      // Matched outside of switch statement because switch does not work on subtypes.
      if (bean typeis AccountContactRole) {
        AccountContactPreupdate_ACC.accountContactRoleCreated(bean)
        jisPreupdateHandler.handleAccountContactRoleChanged(bean)

      } else if (bean typeis Contact) {
        ContactPreupdate_ACC.Instance.executePreUpdate(bean)
        jisPreupdateHandler.handleContactChanged(bean)
      }

	 /** TODO check if uncomment **/
      //APD specific change to add the list of other APD pre-update implementations
      //PreUpdateImpl.execute(bean)
    }

    for (bean in removedBeans) {

      if (bean typeis AccountContactRole) {
        AccountContactPreupdate_ACC.accountContactRoleRemoved(bean)
        jisPreupdateHandler.handleAccountContactRoleChanged(bean)

      } else if (bean typeis AccountContact) {
        jisPreupdateHandler.handleAccountContactChanged(bean)

      } else if (bean typeis AccountUserRoleAssignment) {
        AccountUserRoleAssignmentPreupdate_ACC.removed(bean)

      } else if (bean typeis Accreditation_ACC) {
        jisPreupdateHandler.handleAccreditationChanged(bean)

      } else if (bean typeis AEPAccountComplianceDetail_ACC) {
        jisPreupdateHandler.handleAEPAccountComplianceDetailsChanged(bean)
      }
    }


    var bundle = bundleOf(context)
    if (bundle != null and !bundle.ReadOnly) {
      TransactionCallback_ACC.createCallbackFor(bundle)
    }
  }

  private function bundleOf(context : PreUpdateContext) : Bundle {
    var bundle = context.UpdatedBeans.first().Bundle
    return (bundle == null ? context.InsertedBeans.first().Bundle : bundle)
  }

  protected function addBeansToBePreUpdated(entitySet : Set<KeyableBean>, bean : KeyableBean) {
    if (bean typeis EffDated and bean.isEffective(bean.EffectiveDate)) {
      // If the PreUpdateContext includes multiple slices of the same eff-dated bean, the entitySet
      // will end up with one instance of the bean sliced as of its EffectiveDate.
      entitySet.add(bean.getSliceUntyped(bean.EffectiveDate))
    } else {
      entitySet.add(bean)
    }
    if (bean typeis AccountUserRoleAssignment) {
      entitySet.add(bean.Account)
    }
    if (bean typeis JobUserRoleAssignment) {
      entitySet.add(bean.Job)
    }
  }

  private function printBeans(context : PreUpdateContext) {
    if (context.InsertedBeans.Count == 0
        and context.RemovedBeans.Count == 0
        and context.UpdatedBeans.Count == 1
        and context.UpdatedBeans.hasMatch(\bean -> bean typeis ClusterMemberData)) {
      return
    }
    print("=== Preupdate Beans ===")
    print("InsertedBeans: ${context.InsertedBeans.map(\b -> b.Class.TypeName)}")
    print("UpdatedBeans: ${context.UpdatedBeans.map(\b -> b.Class.TypeName)}")
    print("RemovedBeans: ${context.RemovedBeans.map(\b -> b.Class.TypeName)}")
  }
}
