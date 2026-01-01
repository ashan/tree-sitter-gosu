package nz.co.acc.edge.capabilities.policychange.bind

uses edge.capabilities.policychange.bind.DefaultPolicyChangeBindPlugin
uses edge.capabilities.policychange.bind.IPolicyChangePaymentPlugin
uses edge.capabilities.policychange.exception.PolicyChangeUnderwritingException
uses edge.di.annotations.ForAllNodes
uses edge.exception.EntityPermissionException
uses edge.security.authorization.IAuthorizerProviderPlugin
uses gw.api.locale.DisplayKey
uses gw.api.util.Logger
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC

/**
 * Created by lee.teoh on 11/07/2017.
 */
class PolicyChangeBindPlugin_ACC extends DefaultPolicyChangeBindPlugin implements IPolicyChangeBindPlugin_ACC {
  private static final var LOGGER = StructuredLogger_ACC.INTEGRATION.withClass(PolicyChangeBindPlugin_ACC)

  @ForAllNodes
  construct(authorizerProvider: IAuthorizerProviderPlugin, paymentPlugin: IPolicyChangePaymentPlugin) {
    super(authorizerProvider, paymentPlugin)
  }

  override function bind_ACC(job: Job): boolean {
    if(job typeis PolicyChange) {
      if (job.SelectedVersion.PolicyChangeProcess.canIssue().Okay &&
          job.SelectedVersion.PolicyChangeProcess.canBind().Okay) {
        try {
          job.SelectedVersion.PolicyChangeProcess.issueJob(true)
          return true
        } catch (e: Exception) {
          LOGGER.error_ACC("Exception occured while binding and issuing period", e)
          throw new PolicyChangeUnderwritingException(e)
        }
      } else {
        throw new PolicyChangeUnderwritingException(){
          :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeBindPlugin_ACC.Exception.UnableToBindAndIssueThePolicyChange")
        }
      }
    } else if(job typeis Audit) {
      if (job.SelectedVersion.AuditProcess.canComplete().Okay) {
        try {
          job.SelectedVersion.AuditProcess.complete()
          return true
        } catch (e: Exception) {
          LOGGER.error_ACC("Exception occured while binding and issuing period", e)
          throw new PolicyChangeUnderwritingException(e)
        }
      } else {
        throw new PolicyChangeUnderwritingException(){
          :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeBindPlugin_ACC.Exception.UnableToBindAndIssueThePolicyChange")
        }
      }
    }
    else if (job typeis Renewal) {
      try {
        job.SelectedVersion.RenewalProcess.pendingRenew()
        return true
      } catch (e: Exception) {
        LOGGER.error_ACC("Exception occured on pendingRenew", e)
        throw new EntityPermissionException(e)
      }
    } else if (job typeis Submission) {
      if (job.SelectedVersion.SubmissionProcess.canIssue().Okay &&
          job.SelectedVersion.SubmissionProcess.canBind().Okay) {
        try {
          job.SelectedVersion.SubmissionProcess.issueJob(true)
          return true
        } catch (e: Exception) {
          LOGGER.error_ACC("Exception occured while binding and issuing period", e)
          throw new PolicyChangeUnderwritingException(e)
        }
      } else {
        throw new PolicyChangeUnderwritingException(){
          :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeBindPlugin_ACC.Exception.UnableToBindAndIssueThePolicyChange")
        }
      }
    }
    return false
  }
}