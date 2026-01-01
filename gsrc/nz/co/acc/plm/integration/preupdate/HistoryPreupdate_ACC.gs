package nz.co.acc.plm.integration.preupdate

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses gw.api.locale.DisplayKey
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.edge.security.BCSSUserProvider_ACC
uses typekey.Job

/**
 * Created by nitesh.gautam on 22-Jun-17.
 */
class HistoryPreupdate_ACC {
  static final var _instance : HistoryPreupdate_ACC as readonly Instance = new HistoryPreupdate_ACC()
  private static var _logger = StructuredLogger.CONFIG.withClass(HistoryPreupdate_ACC)

  function executePreUpdate(entity : KeyableBean) {
    if (entity typeis History) {
      if (entity.New and BCSSUserProvider_ACC.getBCSSSUser() != null) {
        _logger.info("Updating BCSS User to '" + BCSSUserProvider_ACC.getBCSSSUser().FullName + "' in history entity")
        entity.BCSSUser_ACC = BCSSUserProvider_ACC.getBCSSSUser().FullName
      }
    }
  }


  public static function createAuditHistory(audit : Audit) {
    if (audit.isFieldChanged("CloseDate") and audit.CloseDate != null and audit.AuditInformation.AuditScheduleType == AuditScheduleType.TC_FINALAUDIT and audit.AuditInformation.RevisionType == null) {
      audit.PolicyPeriod.createCustomHistoryEvent(CustomHistoryType.TC_FINAL_AUDIT_CREATED, \-> DisplayKey.get("Web.Audit.History.FinalAudit.Completed", audit.PolicyPeriod.getLevyYear_ACC()))
    } else if (audit.isFieldChanged("CloseDate") and audit.CloseDate != null and audit.AuditInformation.AuditScheduleType == AuditScheduleType.TC_FINALAUDIT and audit.AuditInformation.RevisionType == RevisionType.TC_REVISION) {
      audit.PolicyPeriod.createCustomHistoryEvent(CustomHistoryType.TC_FINAL_AUDIT_REVISION_CREATED, \-> DisplayKey.get("Web.Audit.History.FinalAudit.Revison.Completed", audit.PolicyPeriod.getLevyYear_ACC()))
    } else if (audit.isFieldChanged("CloseDate") and audit.CloseDate != null and audit.AuditInformation.AuditScheduleType == AuditScheduleType.TC_FINALAUDIT and audit.AuditInformation.RevisionType == RevisionType.TC_REVERSAL) {
      audit.PolicyPeriod.createCustomHistoryEvent(CustomHistoryType.TC_FINAL_AUDIT_REVERSAL_CREATED, \-> DisplayKey.get("Web.Audit.History.FinalAudit.Reversal.Completed", audit.PolicyPeriod.getLevyYear_ACC()))
    }
  }
}
