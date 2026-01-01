package nz.co.acc.edge.capabilities.policychange

uses com.google.common.collect.Sets
uses edge.PlatformSupport.Bundle
uses edge.PlatformSupport.Logger
uses edge.capabilities.gpa.activity.DefaultActivityPatternPlugin
uses edge.capabilities.gpa.activity.IActivityPatternPlugin
uses edge.capabilities.gpa.activity.dto.ActivityDTO
uses edge.capabilities.gpa.job.IJobPlugin
uses edge.capabilities.policy.auth.IPolicyAccessPlugin
uses edge.capabilities.policychange.IPolicyChangeRetrievalPlugin
uses edge.capabilities.policychange.PolicyChangeHandler
uses edge.capabilities.policychange.bind.IPolicyChangeBindPlugin
uses edge.capabilities.policychange.bind.dto.PolicyChangeBindDTO
uses edge.capabilities.policychange.bind.dto.TransactionBindDTO
uses edge.capabilities.policychange.draft.IPolicyChangeDraftPlugin
uses edge.capabilities.policychange.dto.TransactionDTO
uses edge.capabilities.policychange.exception.PolicyChangeUnderwritingException
uses edge.capabilities.policychange.quote.IPolicyChangeQuotePlugin
uses edge.capabilities.quote.quoting.exception.UnderwritingException
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.jsonrpc.exception.JsonRpcInvalidRequestException
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.time.LocalDateUtil
uses entity.Activity
uses entity.BusinessIndustryCode_ACC
uses entity.CWPSLine
uses entity.History
uses gw.api.util.DisplayableException
uses gw.api.locale.DisplayKey
uses gw.api.productmodel.PolicyLinePatternLookup
uses gw.api.util.DateUtil
uses gw.job.AuditProcess
uses gw.job.PolicyChangeProcess
uses gw.job.RenewalProcess
uses gw.lang.function.IBlock
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.common.edge.security.BCSSUserProvider_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.AccountContactDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.account.IAccountPlugin_ACC
uses nz.co.acc.edge.capabilities.gpa.account.dto.ActivityDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.activity.IActivityPlugin_ACC
uses nz.co.acc.edge.capabilities.policy.IPolicyPlugin_ACC
uses nz.co.acc.edge.capabilities.policy.dto.BICCodeDTO_ACC
uses nz.co.acc.edge.capabilities.policy.dto.CoverableDTO_ACC
uses nz.co.acc.edge.capabilities.policy.dto.PolicyPeriodDTO_ACC
uses nz.co.acc.edge.capabilities.policy.dto.PolicyPeriodUpdateDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.dto.PolicyLineBaseDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.util.PolicyLineUtil_ACC
uses nz.co.acc.edge.capabilities.policy.util.PolicyUtil_ACC
uses nz.co.acc.edge.capabilities.policychange.bind.IPolicyChangeBindPlugin_ACC
uses nz.co.acc.edge.capabilities.policychange.draft.IPolicyChangeDraftPlugin_ACC
uses nz.co.acc.edge.capabilities.policychange.item.ActivityItem
uses nz.co.acc.edge.capabilities.policychange.item.HistoryItem
uses nz.co.acc.job.audit.AuditHelper_ACC
uses nz.co.acc.lob.common.BusinessIndustrySearchCriteria_ACC
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.cpx.INDCPXCalculateMaximumPreviousEarnings_ACC
uses nz.co.acc.lob.cpx.INDCPXCovUtil_ACC
uses nz.co.acc.plm.common.bic.BusinessClassificationAPI
uses nz.co.acc.plm.util.ActivityUtil
uses nz.co.acc.plm.util.AssignableQueueUtils
uses entity.Job
uses entity.ClassificationUnit_ACC
uses nz.co.acc.util.FeatureToogleUtil

uses java.text.SimpleDateFormat
uses com.guidewire.pl.system.entity.proxy.OneToOneException

/**
 * ACC Policy Change Handler API.
 */
class PolicyChangeHandler_ACC extends PolicyChangeHandler {
  private static final var LOGGER = new Logger(PolicyChangeHandler_ACC.Type.QName)
  private var _retrievePlugin: IPolicyChangeRetrievalPlugin
  private var _draftPlugin: IPolicyChangeDraftPlugin_ACC
  private var _accountPlugin: IAccountPlugin_ACC
  private var _quotingPlugin: IPolicyChangeQuotePlugin
  private var _activityPlugin: IActivityPlugin_ACC
  private var _activityPatternPlugin: IActivityPatternPlugin
  private var _accBindPlugin: IPolicyChangeBindPlugin_ACC
  private var _policyAccessPlugin: IPolicyAccessPlugin
  private var _policyPluginACC : IPolicyPlugin_ACC
  private var _jobPlugin : IJobPlugin

  @InjectableNode
  construct(authorizer: IAuthorizerProviderPlugin, retrievalPlugin: IPolicyChangeRetrievalPlugin,
            draftPlugin: IPolicyChangeDraftPlugin, quotingPlugin: IPolicyChangeQuotePlugin,
            bindingPlugin: IPolicyChangeBindPlugin, aUserProvider: EffectiveUserProvider,
            accountPlugin: IAccountPlugin_ACC, activityPlugin: IActivityPlugin_ACC,
            accBindPlugin: IPolicyChangeBindPlugin_ACC, activityPatternPlugin: IActivityPatternPlugin,
            policyAccessPlugin: IPolicyAccessPlugin, draftPlugin_ACC:IPolicyChangeDraftPlugin_ACC,
            policyPluginACC : IPolicyPlugin_ACC, jobPlugin : IJobPlugin

            ) {
    super(authorizer, retrievalPlugin, draftPlugin, quotingPlugin, bindingPlugin, aUserProvider)
    this._retrievePlugin = retrievalPlugin
    this._draftPlugin = draftPlugin_ACC
    this._accountPlugin = accountPlugin
    this._quotingPlugin = quotingPlugin
    this._accBindPlugin = accBindPlugin
    this._activityPlugin = activityPlugin
    this._activityPatternPlugin = activityPatternPlugin
    this._policyAccessPlugin = policyAccessPlugin
    this._policyPluginACC = policyPluginACC
    this._jobPlugin = jobPlugin
  }

  /**
   * Update the policy holder.
   * @param policyNumber policy to update
   * @param accountContactDto the new account contact details
   * @return the updated account contact
   */
  @JsonRpcMethod
  function updatePolicyHolder(policyNumber: String, accountContactDto: AccountContactDTO_ACC): AccountContactDTO_ACC {
    var policy = PolicyUtil_ACC.findPolicyByPolicyNumber(policyNumber, _policyAccessPlugin)
    var contact = _accountPlugin.updateAccountContact(policy.getAccount().ACCID_ACC, accountContactDto, null)
    var history = new HistoryItem(CustomHistoryType.TC_POLICY_CONTACT_UPDATE_ACC,
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeHistory.PolicyContact.Description"))

    Bundle.transaction(\bundle -> {
      history.createWithoutJob(bundle, policy)
    })

    return contact
  }

  /**
   * Save the acc data
   * @param changeDto the transaction details
   * @param additionalProcessing code block to provide extra processing
   * @return the transaction details
   */
  function save_ACC(changeDto: TransactionDTO, additionalProcessing: IBlock[], checkForInProgress: boolean, status : String): TransactionDTO {
    var policyPeriod : PolicyPeriod
    if(!checkForInProgress and changeDto.JobID.HasContent) {
      policyPeriod = _retrievePlugin.retrieveByJobNumber(changeDto.JobID)
    } else {
      policyPeriod = _retrievePlugin.retrieveByPolicyNumberAndLevyYear(changeDto.PolicyNumber,
          changeDto.LevyYear,
          {  PolicyPeriodStatus.TC_DRAFT,
             PolicyPeriodStatus.TC_RENEWING,
             PolicyPeriodStatus.TC_QUOTED,
             PolicyPeriodStatus.TC_BOUND})
    }

    var change = policyPeriod.Job

    if(checkForInProgress) {
      if(policyPeriod.Job typeis PolicyChange) {
        PolicyUtil_ACC.isPolicyChangeInProgress(policyPeriod)
      } else if(policyPeriod.Job typeis Audit) {
        PolicyUtil_ACC.isAuditInProgress(policyPeriod)
      }
    }

    if (change != null and changeDto.JobID != null and change.JobNumber != changeDto.JobID) {
      throw new JsonRpcInvalidRequestException(){:Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.Exception.InvalidJobNumber")}
    }

    changeDto.EffectiveDate = LocalDateUtil.toDTO(policyPeriod.EditEffectiveDate)
    var effectiveDateMidnight = LocalDateUtil.toMidnightDate(changeDto.EffectiveDate)
    Bundle.transaction(\bundle -> {
      if (change != null and !change.Complete) {
        change = bundle.add(change)
        if(change typeis PolicyChange) {
          policyPeriod = change.LatestPeriod
          // Set the policy period in Draft mode it it is quoted
          if (policyPeriod.Status == PolicyPeriodStatus.TC_QUOTED) {
            policyPeriod.PolicyChangeProcess.edit()
          }

          if (DateUtil.compareIgnoreTime(effectiveDateMidnight, policyPeriod.EditEffectiveDate) != 0) {
            // Checks before changing the effective date as this is an expensive operation
            policyPeriod.PolicyChangeProcess.changeEditEffectiveDate(effectiveDateMidnight)
          }
        } else if (change typeis Renewal) {
          // Set the policy period in Draft mode it it is quoted
          if (policyPeriod.Status == PolicyPeriodStatus.TC_RENEWING or
              policyPeriod.Status == PolicyPeriodStatus.TC_QUOTED)  {
            var newPeriod = bundle.add(policyPeriod.getSlice(policyPeriod.EditEffectiveDate))
            var renewalProcess = newPeriod.JobProcess as RenewalProcess
            if(renewalProcess.ActiveRenewalWorkflow != null) {
              renewalProcess.ActiveRenewalWorkflow.invokeTrigger(TC_EDITPOLICY)
            }
            else {
              renewalProcess.edit()
            }
          }
        } else if (change typeis Audit) {
          var newPeriod = bundle.add(policyPeriod.getSlice(policyPeriod.EditEffectiveDate))
          var auditProcess = newPeriod.JobProcess as AuditProcess

          if (policyPeriod.Status == PolicyPeriodStatus.TC_QUOTED) {
            auditProcess.edit()
          }
        }
      } else if(change.Complete and (policyPeriod.Status == TC_BOUND or policyPeriod.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE)) {
        if(!policyPeriod.INDCoPLineExists) {
          var auditInformation : AuditInformation
          try {
            if(policyPeriod.Audit != null) {
              policyPeriod = bundle.add(policyPeriod)
              var audit = bundle.add(policyPeriod.Audit)
              policyPeriod = bundle.add(policyPeriod.Audit.revise())
              auditInformation =  bundle.add(policyPeriod.Audit.AuditInformation)
              auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
              auditInformation.ReceivedDate = Date.CurrentDate
              policyPeriod = auditInformation.Audit.PolicyPeriod
              change = policyPeriod.Job
            } else if(changeDto.CeasedTradingDate != null and policyPeriod.Audit == null) {
              var auditInformations = policyPeriod.AuditInformations
              if (auditInformations == null || !auditInformations.HasElements) {
                throw new DisplayableException("Can't find the AuditInformation for LevyYear[${policyPeriod.LevyYear_ACC}]!")
              }

              auditInformation = policyPeriod.AuditInformations.orderByDescending(\elt -> elt.ID).first()
              auditInformation = bundle.add(auditInformation)
              auditInformation.withdrawUnboundPolicyChanges()
              auditInformation.startAuditJob()
              auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
              auditInformation.ReceivedDate = Date.CurrentDate
              policyPeriod = auditInformation.Audit.PolicyPeriod
              change = policyPeriod.Job
            } else {
              change = new PolicyChange()
              (change as PolicyChange).startJob(policyPeriod.Policy, effectiveDateMidnight)
              policyPeriod = change.LatestPeriod
            }
          } catch (ex : OneToOneException) {
            throw new DisplayableException("Audit already created")
          } catch (ex : Exception) {
            throw new DisplayableException(ex.getMessage())
          }
        } else {
          change = new PolicyChange()
          (change as PolicyChange).startJob(policyPeriod.Policy, effectiveDateMidnight)
          policyPeriod = change.LatestPeriod
        }
      }
      additionalProcessing.each(\elt -> elt.invokeWithArgs({bundle, policyPeriod}))
      _draftPlugin.updateFromDto(change, changeDto)
    })

    if(change typeis Renewal) {
      return _draftPlugin.toDto(change)
    } else if(change typeis Audit) {
      return _draftPlugin.toDto(change)
    }
    return _draftPlugin.toDto(change as PolicyChange)
  }

  private function createCustomHistoryForJob(job : Job, history : HistoryItem) {
    removeOOTBJobHistory(job)
    job.createCustomHistoryEvent(history.CustomType, \-> history.Description)
  }

  private function removeOOTBJobHistory(job : Job) {
    var existingHistory = job.Bundle.getBeansByRootType(History)
        .where(\historyEntry -> {
          if (historyEntry typeis History) {
            return historyEntry.Job.JobNumber == job.JobNumber
          }
          return false
        })
    existingHistory.each(\newOOTBHistory -> job.Bundle.delete(newOOTBHistory))
  }

  private function createTransactionActivity(policyNumber : String, anActivityDTO : ActivityDTO, history : HistoryItem): ActivityDTO {
    return createTransactionActivity(policyNumber, anActivityDTO, history, false)
  }

  private function createTransactionActivity(policyNumber : String, anActivityDTO : ActivityDTO, history : HistoryItem, usePortalActivityQueue : boolean): ActivityDTO {
    var policy = PolicyUtil_ACC.findPolicyByPolicyNumber(policyNumber, _policyAccessPlugin)

    final var anActivity = Bundle.resolveInTransaction(\bundle -> {
      var activity : Activity

      if (anActivityDTO.Job != null) {
        activity = _activityPlugin.createActivityForJob(anActivityDTO.Job, anActivityDTO)
      } else {
        activity = _activityPlugin.createActivityForPolicy(policy, anActivityDTO)
      }

      var assignedQueue : AssignableQueue
      if(ActivityUtil.isDFAActivity_ACC(activity)) {
        assignedQueue = AssignableQueueUtils.getQueueForPortalDFAIssues()
      } else if(ActivityUtil.hasCPXUWIssueType(activity) and !usePortalActivityQueue) {
        assignedQueue = AssignableQueueUtils.getQueueForCPX()
      } else {
        assignedQueue = AssignableQueueUtils.getQueueForPortalActivity()
      }

      activity.assignActivityToQueue(assignedQueue, assignedQueue.getGroup())

      if(anActivityDTO.ChangeReason != null) {
        activity.ChangeReason_ACC  = anActivityDTO.ChangeReason
      }

      history.createWithoutJob(bundle, policy)

      return activity
    })

    return _activityPlugin.toDTO(anActivity)
  }

  /**
   * Updates the BIC code for a policy
   *
   * @param policyNumber     the policy number identifying the policy from which the change is to be loaded
   * @param BICCodeDTO_ACC[] array of BICCodeDTO_ACC
   * @returns details for a policy change
   */
  @JsonRpcMethod
  function changePolicyBIC(policyNumber: String, bics: BICCodeDTO_ACC[], effectiveDate : Date, reason: String): ActivityDTO {
    var period : PolicyPeriod
    var levyYear : Integer
    if(ScriptParameters.AllowHistoricalYearProcessing_ACC) {
      levyYear = DateUtil_ACC.getLevyYear(effectiveDate)
      period = PolicyUtil_ACC.getMostRecentPeriodByLevyYear_ACC(policyNumber, levyYear)
    } else {
      period = _retrievePlugin.retrieveByPolicyNumber(policyNumber)
      levyYear = period.LevyYear_ACC
    }

    var cpxCovExists = period.INDCoPLineExists and period.INDCPXLineExists
    if(period.EMPWPCLineExists and (bics.length > 1 or period.EMPWPCLine.BICCodes.length > 1)) {
      //if WPC policy already contains two or more BICs or request contains two or more BICs, send error - DE1033
      throw new JsonRpcInvalidRequestException(){
          :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChange.BIC.ExceptionWPCExists")
          }
    } else if(period.CWPSLineExists and (bics.length > 1 or period.CWPSLine.BICCodes.length > 1)) {
      //if WPC policy already contains two or more BICs or request contains two or more BICs, send error - DE1033
      throw new JsonRpcInvalidRequestException(){
          :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChange.BIC.ExceptionWPSExists")
          }
    } else {
      //in case effective date is less than period start date OR it is a CPX policy, create activity
      if ((DateUtil.compareIgnoreTime(effectiveDate, period.PeriodStart) < 0) or cpxCovExists) {
        var bicsToAdd: String
        bics.each(\bic -> {
          if (bicsToAdd != null)
            bicsToAdd += ",\n"
          else
            bicsToAdd = ""
          bicsToAdd += "{CU Code: " + bic.CUCode + "\nCU Description: " + bic.CUDescription + "\nBIC Code: " + bic.BicCode + "}"
        })

        final var anActPattern = ActivityPattern.finder.getActivityPatternByCode("review_bic_change")
        var anActivityDTO = new ActivityDTO()
        anActivityDTO.PolicyNumber = policyNumber
        anActivityDTO.Subject = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyBICChangeActivity.Subject")
        anActivityDTO.Description = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyBICChangeActivity.Description", policyNumber, effectiveDate, bicsToAdd, reason)
        anActivityDTO.ActivityPattern = _activityPatternPlugin.toDTO(anActPattern)
        anActivityDTO.Priority = anActPattern.Priority
        anActivityDTO.DueDate = DefaultActivityPatternPlugin.getDueDate(anActPattern)
        anActivityDTO.EscalationDate = DefaultActivityPatternPlugin.getEscalationDate(anActPattern)
        anActivityDTO.Mandatory = anActPattern.Mandatory

        var history = new HistoryItem(CustomHistoryType.TC_POLICY_BIC_UPDATE_ACC,
            DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeHistory.BIC.Description", reason))

        return createTransactionActivity(policyNumber, anActivityDTO, history)
      } else {
        var newPolicyChangeDto = this.loadWithLevyYear(policyNumber, levyYear, {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_AUDITCOMPLETE})
        var func = \bundle: Bundle, policyPeriod: PolicyPeriod -> {
          var bicsToAdd = toBicCodes(bics)
          if (policyPeriod.INDCoPLineExists and !policyPeriod.INDCPXLineExists) {
            var line = bundle.add(policyPeriod.INDCoPLine)
            line.BICCodes.each(\bicCode -> line.removeBICCode(bicCode, true))
            bicsToAdd.each(\elt -> {
              var newPolicylinebic = line.createAndAddBICCode_ACC()
              newPolicylinebic.BICCode = elt.BusinessIndustryCode
              line.setSelectedBIC(elt, newPolicylinebic)
            })
          } else if (policyPeriod.EMPWPCLineExists) {
            //only one bic code is received here for WPC
            var wpcline = bundle.add(policyPeriod.EMPWPCLine)

            wpcline.BICCodes.each(\bicCode -> {
              wpcline.removeBICCode(bicCode, true)
            })
            bicsToAdd.each(\elt -> {
              var newPolicylinebic = wpcline.createAndAddBICCode_ACC()
              newPolicylinebic.BICCode = elt.BusinessIndustryCode
              wpcline.setSelectedBIC(elt, newPolicylinebic)
            })
          } else if (policyPeriod.CWPSLineExists) {
            //only one bic code is received here for WPS
            var wpsLine = bundle.add(policyPeriod.CWPSLine)

            var primaryBIC = wpsLine.BICCodes.where(\bicCode -> bicCode.isPrimary()).first()
            wpsLine.PolicyShareholders.each(\sh -> sh.ShareholderEarnings.where(\she -> she.CUCode == primaryBIC.CUCode).each(\she -> she.setCUCode(bicsToAdd.first().ClassificationUnit_ACC.ClassificationUnitCode)))

            bicsToAdd.each(\bicCode -> {
              var newPolicylinebic = wpsLine.createAndAddBICCode_ACC()
              newPolicylinebic.BICCode = bicCode.BusinessIndustryCode
              wpsLine.PrimaryBICCode_ACC = newPolicylinebic
              wpsLine.setSelectedBIC(bicCode, newPolicylinebic)
            })


            wpsLine.BICCodes.where(\bicCode -> !bicCode.isPrimary()).each(\bicCode -> {
              wpsLine.removeBICCode(bicCode, false)
            })
          }
        }
        var history = new HistoryItem(CustomHistoryType.TC_POLICY_BIC_UPDATE_ACC,
            DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeHistory.BIC.Description", reason))
        var savedPolicyChangeDto = this.save_ACC(newPolicyChangeDto, {func}, true, null)
        var quoted: TransactionDTO
        var bound: PolicyChangeBindDTO
        try {
          quoted = this.quote(savedPolicyChangeDto.JobID)
          bound = this.bind_ACC(quoted.JobID, history)
        } catch (uwException: PolicyChangeUnderwritingException) {
          var job = Job.finder.findJobByJobNumber(savedPolicyChangeDto.JobID)
          var user = BCSSUserProvider_ACC.getBCSSSUser()
          var activity = ActivityDTO_ACC.createActivityForJob(
              DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeActivity.BIC.Subject"),
              DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeActivity.BIC.Description",
                  user.FullName), job, user)
          return _activityPlugin.toDTO(activity)
        }
        //instead of returnig PolicyChange, return type changed to activityDTO after introducing effectiveDate
//      return bound.PolicyChange
        var activityDTO = new ActivityDTO()
        activityDTO.Subject = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeSuccess.Subject", "BIC")
        activityDTO.Description = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeSuccess.Description")
        return activityDTO
      }
    }
  }

  private function toBicCodes(bicCodeDtos: BICCodeDTO_ACC[]): BusinessIndustryCode_ACC[] {
    return bicCodeDtos.map(\bicCodeDTO -> {
      var criteria = new BusinessIndustrySearchCriteria_ACC()
      criteria.BICCode = bicCodeDTO.BicCode
      criteria.CUCode = bicCodeDTO.CUCode
      criteria.CUDescription = bicCodeDTO.CUDescription
      return criteria.performSearch().first()
    })
  }

  private function createEmploymentStatusChangeActivity(policyNumber: String, subject : String,
                                                        description: String, reason: String) : ActivityDTO {
    return createEmploymentStatusChangeActivity(policyNumber, subject, description, reason, null, false)
  }

    private function createEmploymentStatusChangeActivity(policyNumber: String, subject : String, description: String, reason: String, job : Job, usePortalActivityQueue : boolean) : ActivityDTO {
    final var anActPattern = ActivityPattern.finder.getActivityPatternByCode("review_employment_status_change")
    var anActivityDTO = new ActivityDTO()
    anActivityDTO.PolicyNumber = policyNumber
    anActivityDTO.Subject = subject
    anActivityDTO.Description = description
    anActivityDTO.ActivityPattern = _activityPatternPlugin.toDTO(anActPattern)
    anActivityDTO.Priority = anActPattern.Priority
    anActivityDTO.DueDate = DefaultActivityPatternPlugin.getDueDate(anActPattern)
    anActivityDTO.EscalationDate = DefaultActivityPatternPlugin.getEscalationDate(anActPattern)
    anActivityDTO.Mandatory = anActPattern.Mandatory
    anActivityDTO.ChangeReason = ChangeReason_ACC.TC_CPXEMPLOYMENTSTATUS
    if (job != null) {
      anActivityDTO.Job = job
      anActivityDTO.JobNumber = job.JobNumber
      anActivityDTO.JobType = job.Subtype
    }

    var history = new HistoryItem(CustomHistoryType.TC_POLICY_EMPLOYMENT_STATUS_UPDATE_ACC,
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeHistory.EmploymentStatus.Description", reason))

    return createTransactionActivity(policyNumber, anActivityDTO, history, usePortalActivityQueue)
  }

  /**
   * Update the employment status of a CP policy
   * @param policyNumber the policy to update
   * @param isFullTime the employment status
   * @param effectiveDate the effective date
   * @param reason the updat reason
   * @return the activity created
   */
  @JsonRpcMethod
  function changeEmploymentStatus(policyNumber: String, isFullTime: boolean, effectiveDate : Date, reason: String): ActivityDTO {
    var period : PolicyPeriod
    var levyYear = DateUtil_ACC.getLevyYear(effectiveDate)

    if(ScriptParameters.AllowHistoricalYearProcessing_ACC) {
      period = PolicyUtil_ACC.getMostRecentPeriodByLevyYear_ACC(policyNumber, levyYear)
    } else {
      period = _retrievePlugin.retrieveByPolicyNumber(policyNumber)
      levyYear = period.LevyYear_ACC
    }

    var cpCov = period.INDCoPLine.INDCoPCovs?.first()
    var cpxCovExists = period.INDCoPLineExists and period.INDCPXLineExists
    if (cpCov != null or cpxCovExists) {
      //in case effective date is less than period start date OR it is a CPX policy, create activity
      if ((!ScriptParameters.AllowHistoricalYearProcessing_ACC and DateUtil.compareIgnoreTime(effectiveDate, period.PeriodStart) < 0) or cpxCovExists) {
        var subject = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyEmploymentStatusChangeActivity.Subject")
        var description = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyEmploymentStatusChangeActivity.Description", policyNumber, effectiveDate, isFullTime, reason)
        return createEmploymentStatusChangeActivity(policyNumber, subject, description, reason)
      } else {
        var newPolicyChangeDto = this.loadWithLevyYear(policyNumber, levyYear, {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_AUDITCOMPLETE})
        var func = \bundle: Bundle, policyPeriod: PolicyPeriod -> {
          newPolicyChangeDto.EffectiveDate = LocalDateUtil.toDTO(policyPeriod.EditEffectiveDate)
          var cpCoverage = policyPeriod.INDCoPLine.INDCoPCovs?.first()
          var liableEarnings : INDLiableEarnings_ACC
          if(policyPeriod.IsNewLERuleAppliedYear) {
            liableEarnings = policyPeriod.INDCoPLine.INDCoPCovs?.first().ActualLiableEarningsCov
          } else {
            liableEarnings = policyPeriod.INDCoPLine.INDCoPCovs?.first().LiableEarningCov
          }

          cpCoverage = bundle.add(cpCoverage)
          liableEarnings = bundle.add(liableEarnings)
          liableEarnings.FullTime = isFullTime

          if(policyPeriod.IsLETransitionYear) {
            var previousEarnings = policyPeriod.INDCoPLine.INDCoPCovs?.first().LiableEarningCov
            previousEarnings = bundle.add(previousEarnings)
            previousEarnings.FullTime = isFullTime
          }

          cpCoverage.calculateBICLiableEarnings(true)
        }
        var bound: PolicyChangeBindDTO
        var history = new HistoryItem(CustomHistoryType.TC_POLICY_EMPLOYMENT_STATUS_UPDATE_ACC,
            DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeHistory.EmploymentStatus.Description", reason))
        var savedPolicyChangeDto = this.save_ACC(newPolicyChangeDto, {func}, true, null)
        try {
          var quoted = this.quote(savedPolicyChangeDto.JobID)
          bound = this.bind_ACC(quoted.JobID, history)
        } catch (uwException: PolicyChangeUnderwritingException) {
          var job = Job.finder.findJobByJobNumber(savedPolicyChangeDto.JobID)
          var user = BCSSUserProvider_ACC.getBCSSSUser()
          var activity = ActivityDTO_ACC.createActivityForJob(
              DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeActivity.EmploymentStatus.Subject"),
              DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeActivity.EmploymentStatus.Description",
                  user.FullName), job, user)
          return _activityPlugin.toDTO(activity)
        }
        //instead of returnig PolicyChange, return type changed to activityDTO after introducing effectiveDate

        var activityDTO = new ActivityDTO()
        activityDTO.Subject = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeSuccess.Subject", "Employment Status")
        activityDTO.Description = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeSuccess.Description")
        return activityDTO
      }
    } else {
      throw new JsonRpcInvalidRequestException(){
          :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.Exception.CouldNotSetEmploymentStatus")
          }
    }
  }

  /**
   * Cancel a CPX policy by year.
   * @param policyNumber the policy to cancel
   * @param levyYear the levy year to cancel the policy for
   * @param reason the cancel reason
   * @return the policy period details or exception
   */
  @JsonRpcMethod
  function cancelCpxPolicyByLevyYear(policyNumber : String, levyYear : int, reason : String) : Object {
    var transactionStatus : PolicyPeriodStatus[] = {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_RENEWING}
    var nPeriod = _retrievePlugin.retrieveByPolicyNumberAndLevyYear(policyNumber, levyYear, transactionStatus)

    if(!nPeriod.INDCPXLineExists) {
      throw new JsonRpcInvalidRequestException() {
        :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChange.ChangeCPXCover.CPXLineNotExists")
      }
    }

    if(nPeriod.Job.Subtype != typekey.Job.TC_RENEWAL or
       (nPeriod.Job.Subtype == typekey.Job.TC_RENEWAL and nPeriod.Status != PolicyPeriodStatus.TC_RENEWING)) {
      throw new JsonRpcInvalidRequestException() {
        :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChange.CancelCPX.RenewalOnly", nPeriod.Status.DisplayName)
      }
    }

    var func : IBlock
    var newPolicyChangeDto = this.loadWithLevyYear(policyNumber, levyYear, transactionStatus)
    func = \bundle: Bundle, pp: PolicyPeriod -> {
      pp.removeFromLines(pp.INDCPXLine)
      pp.updateTerritoryCodes()
    }
    var history = new HistoryItem(CustomHistoryType.TC_CANCEL_CPX_POLICY,
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeActivity.CancelCPXPolicy.Subject") + reason)
    var activityItem = new ActivityItem(DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeActivity.CancelCPXPolicy.Subject"),
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeActivity.CancelCPXPolicy.Description", BCSSUserProvider_ACC.getBCSSSUser().FullName),
        "cpx_uw_approval_acc", ChangeReason_ACC.TC_CPXCEASE)
    return performTransactionUpdate(newPolicyChangeDto, {func}, history, activityItem, PolicyPeriodStatus.TC_BOUND.Code, true)
  }

  @JsonRpcMethod
  function createPolicyTransaction(policyperiodDTO : PolicyPeriodUpdateDTO_ACC, status : String, reason:String): Object {
    var changeReason = ChangeReason_ACC.getAllTypeKeys().firstWhere(\elt -> reason.contains(elt.DisplayName))
    var history = new HistoryItem(CustomHistoryType.TC_CREATE_TRANSACTION_ACC,
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeHistory.CreateTransaction.Description", reason))

    var activityItem = new ActivityItem(DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeActivity.CreatePolicyTransaction.Subject"),
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeHistory.CreateTransaction.Description", BCSSUserProvider_ACC.getBCSSSUser().FullName),
        "cpx_uw_approval_acc", changeReason)

    var policyNumber = policyperiodDTO.PolicyNumber
    var levyYear = policyperiodDTO.LevyYear
    var jobNumber = policyperiodDTO.JobNumber
    var newPolicyChangeDto : TransactionDTO

    if(jobNumber != null) {
      newPolicyChangeDto = this.loadByJobNumber(jobNumber)

      if(newPolicyChangeDto.Branch.Status == PolicyPeriodStatus.TC_BOUND ||
         newPolicyChangeDto.Branch.Status == PolicyPeriodStatus.TC_WITHDRAWN ||
         newPolicyChangeDto.Branch.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE ) {
        throw new Exception("Can't update bound or withdrawn transaction")
      } else if(status == PolicyPeriodStatus.TC_QUOTED.Code and
                newPolicyChangeDto.Branch.Status == PolicyPeriodStatus.TC_QUOTED ) {
        throw new Exception("Can't quote already quoted transaction")
      }
      else if(status.equalsIgnoreCase(PolicyPeriodStatus.TC_WITHDRAWN.Code)) {
        return withdrawTransaction(newPolicyChangeDto.Branch, history, status)
      }
    } else {
      var transactionStatus : PolicyPeriodStatus[] = {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_RENEWING}
      newPolicyChangeDto = this.loadWithLevyYear(policyNumber, levyYear, transactionStatus)
    }
    // validate ceased date is within policy period
    if(policyperiodDTO.CeasedTradingDate != null and
        !DateUtil_ACC.isBetweenOrEqualIgnoreTime(policyperiodDTO.CeasedTradingDate,
                                                newPolicyChangeDto.Branch.PeriodStart,
                                                newPolicyChangeDto.Branch.PeriodEnd)) {
      throw new Exception("Ceased Trading Date : Ceased Date must be within the same levy year")
    }

    // validate cpx info from MyACC is valid
    for (cpxCov in policyperiodDTO.Lobs.firstWhere(\elt -> elt.LineOfBusiness.equalsIgnoreCase("CoverPlus Extra")).CoverableDTOs) {
      validateCoverableDTO(cpxCov, newPolicyChangeDto.Branch)
    }

    var funcs = new ArrayList<IBlock>()
    funcs.add(addPolicyUpdateFunctions(policyperiodDTO))

    if(policyperiodDTO.CoverPlus != null) {
      funcs.add(updatePolicyBICFunction(policyperiodDTO.CoverPlus, policyperiodDTO, newPolicyChangeDto))
      funcs.add(addCPUpdateBlockFunctions(policyperiodDTO, newPolicyChangeDto))
    }

    if (policyperiodDTO.CoverPlusExtra != null) {
      funcs.add(addCPXLineFunction())
      funcs.add(addCPXUpdateBlockFunctions(policyperiodDTO, newPolicyChangeDto))
    } else {
      funcs.add(removeCPXLine())
    }

    if (newPolicyChangeDto.Branch.INDCPXLine != null and
        policyperiodDTO.CoverPlusExtra != null and
        newPolicyChangeDto?.Branch?.INDCPXLine?.EmploymentStatus != policyperiodDTO.CoverPlusExtra.EmploymentStatus.equalsIgnoreCase("full-time") and
        (status.equalsIgnoreCase(PolicyPeriodStatus.TC_QUOTED.Code) or status.equalsIgnoreCase(PolicyPeriodStatus.TC_BOUND.Code))) {
      return onEmploymentStatusChanged(newPolicyChangeDto, funcs, policyperiodDTO.CoverPlusExtra.EmploymentStatus, reason, policyperiodDTO.JobNumber == null)
    }

    if (policyperiodDTO.Employer != null) {
      funcs.add(updatePolicyBICFunction(policyperiodDTO.Employer, policyperiodDTO, newPolicyChangeDto))
      funcs.add(addWPCLineFunction(policyperiodDTO, newPolicyChangeDto))
    }

    if (policyperiodDTO.ShareholdingCompany != null) {
      funcs.add(updatePolicyBICFunction(policyperiodDTO.ShareholdingCompany, policyperiodDTO, newPolicyChangeDto))
    }

    newPolicyChangeDto.CeasedTradingDate = policyperiodDTO.CeasedTradingDate

    var result = performTransactionUpdate(newPolicyChangeDto, funcs.toTypedArray(), history, activityItem, status, policyperiodDTO.JobNumber == null)

    if(result typeis PolicyPeriodDTO_ACC) {
      AuditHelper_ACC.checkAndTriggerProvisionalUpdate(result.Branch)
    }

    return result
  }

  function withdrawTransaction(policyPeriod : PolicyPeriod, history : HistoryItem, status : String ) : PolicyPeriodDTO_ACC {
    Bundle.transaction(\bundle -> {
      bundle.add(policyPeriod).Job.withdraw()
    })

    var ppDTO =  _policyPluginACC.getPolicyPeriodDetails(policyPeriod)
    createHistoryEvent(policyPeriod, history, ppDTO, status)
    return ppDTO
  }

  function createHistoryEvent(policyPeriod:PolicyPeriod, history:HistoryItem, transactionDTO : Object, status : String) {
    if(transactionDTO != null and !status.equalsIgnoreCase(PolicyPeriodStatus.TC_BOUND.Code)) {
      try {
        Bundle.transaction(\bundle -> {
          var job = bundle.add(policyPeriod.Job)
          createCustomHistoryForJob(job, history)
        })
      } catch (uwe : PolicyChangeUnderwritingException) {
        // Set flag for use later
        throw new PolicyChangeUnderwritingException(uwe)
      }
    }
  }

  function onEmploymentStatusChanged(newPolicyChangeDto : TransactionDTO, funcs : List<IBlock>, employmentStatus : String,reason : String, checkForInProgress : boolean) : Object {
    // create draft policy change txn with activity
    var savedTransactionDTO = this.save_ACC(newPolicyChangeDto, funcs.toTypedArray(), checkForInProgress, null)
    // create activity
    var subject = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.CPXPolicyEmploymentStatusChangeActivity.Subject")
    var description = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.CPXPolicyEmploymentStatusChangeActivity.Description",
        newPolicyChangeDto.PolicyNumber, newPolicyChangeDto.Branch.PeriodStart, employmentStatus.equalsIgnoreCase("full-time"), reason)
    var employmentStatusChangeActivity = createEmploymentStatusChangeActivity(newPolicyChangeDto.PolicyNumber, subject, description, reason, savedTransactionDTO.Job, true)
    var activityDTOArray = new ArrayList<ActivityDTO>()
    activityDTOArray.add(employmentStatusChangeActivity)
    return activityDTOArray
  }

  @JsonRpcMethod
  function addCPXLineFunction() : IBlock {
    var func = \bundle: Bundle, policyPeriod: PolicyPeriod -> {
      if(!policyPeriod.INDCPXLineExists) {
        policyPeriod.createPolicyLine(PolicyLinePatternLookup.getByPublicID(typekey.PolicyLine.TC_INDCPXLINE.Code))
      }
    }

    return func
  }

  @JsonRpcMethod
  function addWPCLineFunction(policyperiodDTO :  PolicyPeriodUpdateDTO_ACC, newPolicyChangeDto : TransactionDTO) : IBlock {
    var func = \bundle: Bundle, policyPeriod: PolicyPeriod -> {
      var employer = policyperiodDTO.Employer
      var empCov = policyPeriod.EMPWPCLine.EMPWPCCovs.first()
      var earningsCov = empCov.LiableEarningCov
      earningsCov.TotalGrossEarnings = new MonetaryAmount(employer.EmployerEarnings.TotalGrossEarnings, Currency.TC_NZD)
      earningsCov.TotalPAYE = new MonetaryAmount(employer.EmployerEarnings.TotalPAYE, Currency.TC_NZD)
      earningsCov.TotalExcessPaid = new MonetaryAmount(employer.EmployerEarnings.TotalExcessPaid, Currency.TC_NZD)
      earningsCov.TotalEarningsNotLiable = new MonetaryAmount(employer.EmployerEarnings.TotalEarningsNotLiable, Currency.TC_NZD)
      earningsCov.PaymentToEmployees = new MonetaryAmount(employer.EmployerEarnings.PaymentToEmployees, Currency.TC_NZD)
      empCov.calculateBICLiableEarnings()
    }

    return func
  }

  @JsonRpcMethod
  function removeCPXLine() : IBlock {
    var func = \bundle: Bundle, policyPeriod: PolicyPeriod -> {
      if(policyPeriod.INDCPXLineExists) {
        policyPeriod.removePolicyLine(PolicyLinePatternLookup.getByPublicID(typekey.PolicyLine.TC_INDCPXLINE.Code))
      }
    }

    return func
  }

  @JsonRpcMethod
  function addPolicyUpdateFunctions(policyperiodDTO :  PolicyPeriodUpdateDTO_ACC) : IBlock {

    var func = \bundle: Bundle, policyPeriod: PolicyPeriod -> {
      bundle.add(policyPeriod).CeasedTradingDate_ACC = policyperiodDTO.CeasedTradingDate
    }

    return func
  }

  private function updatePolicyBICFunction(policyLineBaseDTO : PolicyLineBaseDTO_ACC , policyperiodDTO:PolicyPeriodUpdateDTO_ACC, newPolicyChangeDto : TransactionDTO) : IBlock {
    var bicAPI = new BusinessClassificationAPI()
    var func = \bundle: Bundle, policyPeriod: PolicyPeriod -> {
      var bicCodeDTO = policyLineBaseDTO.BICCodes.first()

      if(bicCodeDTO.CUCode == null and bicCodeDTO.BicCode == null) {
        throw new JsonRpcInvalidRequestException() {
          :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChange.ChangeCPXCover.ErrorBICCUNotDefined")
        }
      }

      var newCUItem : ClassificationUnit_ACC
      var policyLine : PolicyLine
      if(policyLineBaseDTO.LineOfBusiness.equals("CoverPlus")) {
        policyLine = policyPeriod.INDCoPLine
      } else if (policyLineBaseDTO.LineOfBusiness.equals("CoverPlus Extra")) {
        policyLine = policyPeriod.INDCPXLine
      } else if (policyLineBaseDTO.LineOfBusiness.equals("WorkPlace Cover")) {
        policyLine = policyPeriod.EMPWPCLine
      } else if (policyLineBaseDTO.LineOfBusiness.equals("WorkPlace Cover for Shareholders")) {
        policyLine = policyPeriod.CWPSLine
      }

      var currentBIC = policyLine.BICCodes.first()
      var oldCUCode = currentBIC.CUCode

      if(bicCodeDTO.BicCode != null and currentBIC.BICCode != bicCodeDTO.BicCode) {
        var newBIC = bicAPI.getBICCode(bicCodeDTO.BicCode, policyperiodDTO.LevyYear)
        currentBIC.BICCode = newBIC.BusinessIndustryCode
        currentBIC.BICDescription = newBIC.BusinessIndustryDescription
        newCUItem = newBIC.ClassificationUnit_ACC
      } else if(bicCodeDTO.CUCode != null and currentBIC.CUCode != bicCodeDTO.CUCode) {
        currentBIC.BICCode = null
        currentBIC.BICDescription = null
        newCUItem = bicAPI.getCUCode(bicCodeDTO.CUCode, policyperiodDTO.LevyYear)
      }

      if(newCUItem != null) {
        currentBIC.CUCode = newCUItem.ClassificationUnitCode
        currentBIC.CUDescription = newCUItem.ClassificationUnitDescription
        currentBIC.ReplacementLabourCost = newCUItem.ReplacementLabourCost
      }

      if(policyLine typeis CWPSLine) {
        var earnings = policyLine.PolicyShareholders.arrays("ShareholderEarnings")
        var cuLinkedEarnings = earnings.where(\elt -> (elt as ShareholderEarnings_ACC).CUCode.equals(oldCUCode))
        cuLinkedEarnings.each(\elt -> {
          (elt as ShareholderEarnings_ACC).CUCode = newCUItem.ClassificationUnitCode
        })
      }
    }

    return func
  }

  private function addCPUpdateBlockFunctions(policyperiodDTO :  PolicyPeriodUpdateDTO_ACC, newPolicyChangeDto : TransactionDTO) : IBlock {
    var cpPolicyLine = policyperiodDTO.CoverPlus
    var bicAPI = new BusinessClassificationAPI()
    var func = \bundle: Bundle, policyPeriod: PolicyPeriod -> {
      newPolicyChangeDto.EffectiveDate = LocalDateUtil.toDTO(policyPeriod.EditEffectiveDate)

      policyPeriod.INDCoPLine.INDCoPCovs.first().calculateBICLiableEarnings(true)

      var policyLine = policyPeriod.INDCoPLine

      // Depending on if the policy is ceased, we update different coverages - note that we use the isCeased value from the preProcess.  We do not check again.
      var indCopCov = policyLine.INDCoPCovs.first()
      var cov : INDLiableEarnings_ACC
      if (policyPeriod.CeasedTrading_ACC or policyLine.AssociatedPolicyPeriod.IsNewLERuleAppliedYear) {
        cov = indCopCov.ActualLiableEarningsCov
      } else {
        cov = indCopCov.LiableEarningCov
      }

      if(cpPolicyLine.CoverPlusEarnings != null) {
        cov.NetSchedulerPayments = new MonetaryAmount(cpPolicyLine.CoverPlusEarnings.NetSchedulerPayments, Currency.TC_NZD)
        cov.TotalActivePartnershipInc = new MonetaryAmount(cpPolicyLine.CoverPlusEarnings.TotalActivePartnershipInc, Currency.TC_NZD)
        cov.AdjustedLTCIncome = new MonetaryAmount(cpPolicyLine.CoverPlusEarnings.AdjustedLTCIncome, Currency.TC_NZD)
        cov.SelfEmployedNetIncome = new MonetaryAmount(cpPolicyLine.CoverPlusEarnings.SelfEmployedNetIncome, Currency.TC_NZD)
        cov.TotalOtherExpensesClaimed = new MonetaryAmount(cpPolicyLine.CoverPlusEarnings.TotalOtherExpensesClaimed, Currency.TC_NZD)
        if (FeatureToogleUtil.overseasIncomeEnabled(cov.Branch.LevyYear_ACC)) {
          cov.TotalOverseasIncome = new MonetaryAmount(cpPolicyLine.CoverPlusEarnings.TotalOverseasIncome, Currency.TC_NZD)
        }
      }
      cov.FullTime = cpPolicyLine.EmploymentStatus.equalsIgnoreCase("full-time")
      indCopCov.calculateBICLiableEarnings(true)
    }

    return func
  }

  private function addCPXUpdateBlockFunctions(policyperiodDTO :  PolicyPeriodUpdateDTO_ACC, newPolicyChangeDto : TransactionDTO) : IBlock {
    var cpxPolicyLine = policyperiodDTO.CoverPlusExtra
    var bicAPI = new BusinessClassificationAPI()
    var func = \bundle: Bundle, policyPeriod: PolicyPeriod -> {
      newPolicyChangeDto.EffectiveDate = LocalDateUtil.toDTO(policyPeriod.EditEffectiveDate)

      policyPeriod.INDCoPLine.INDCoPCovs.first().calculateBICLiableEarnings(true)

      var employmentStatusChanged = policyPeriod.INDCPXLine.EmploymentStatus != cpxPolicyLine.EmploymentStatus.equalsIgnoreCase("full-time")
      var bicCodeDTO = cpxPolicyLine.BICCodes.first()

      if(bicCodeDTO.CUCode == null and bicCodeDTO.BicCode == null) {
        throw new JsonRpcInvalidRequestException() {
          :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChange.ChangeCPXCover.ErrorBICCUNotDefined")
        }
      }

      var policyLine = policyPeriod.INDCPXLine
      policyLine.BusinessStructure = BusinessStructure_ACC.AllTypeKeys.firstWhere(\elt -> elt.DisplayName == cpxPolicyLine.BusinessStructure)
      policyLine.EmploymentStatus = cpxPolicyLine.EmploymentStatus.equalsIgnoreCase("full-time")
      if(!policyPeriod.INDCPXLine.BICCodes.HasElements) {
        policyPeriod.INDCPXLine.addToBICCodes(new PolicyLineBusinessClassificationUnit_ACC(policyPeriod, policyLine.EffectiveDate, policyLine.ExpirationDate))
      }

      var currentBIC = policyPeriod.INDCPXLine.BICCodes.first()
      var newCUItem : ClassificationUnit_ACC
      if(bicCodeDTO.BicCode != null and currentBIC.BICCode != bicCodeDTO.BicCode) {
        var newBIC = bicAPI.getBICCode(bicCodeDTO.BicCode, policyperiodDTO.LevyYear)
        currentBIC.BICCode = newBIC.BusinessIndustryCode
        currentBIC.BICDescription = newBIC.BusinessIndustryDescription
        newCUItem = newBIC.ClassificationUnit_ACC
      } else if(bicCodeDTO.CUCode != null and currentBIC.CUCode != bicCodeDTO.CUCode) {
        currentBIC.BICCode = null
        currentBIC.BICDescription = null
        newCUItem = bicAPI.getCUCode(bicCodeDTO.CUCode, policyperiodDTO.LevyYear)
      }

      if(newCUItem != null) {
        currentBIC.CUCode = newCUItem.ClassificationUnitCode
        currentBIC.CUDescription = newCUItem.ClassificationUnitDescription
        currentBIC.ReplacementLabourCost = newCUItem.ReplacementLabourCost
      }

      var indcpxCov = policyPeriod.INDCPXLine.INDCPXCovs.first()
      updateCPXCov(cpxPolicyLine.CoverableDTOs, indcpxCov)
    }

    return func
  }


  /**
   * Change a CPX policy coverable by policy period
   * @param policyNumber the policy with the coverable to update
   * @param levyYear the levy year
   * @param employmentStatus the new employment status
   * @param businessStructure the new business structure
   * @param bicCodeDTOList the new bic codes
   * @param cpxCoverable the new CPX coverables
   * @param reason the update reason
   * @return the update coverable or exception
   */
  @JsonRpcMethod
  function changePolicyCoverByPolicyPeriod(policyNumber: String, levyYear: int, employmentStatus:String, businessStructure:String, bicCodeDTOList:BICCodeDTO_ACC[], cpxCoverable : CoverableDTO_ACC[], reason: String): Object {
    LOGGER.logInfo("Start " + DateUtil_ACC.currentDateToString())
    var bicAPI = new BusinessClassificationAPI()
    var transactionStatus : PolicyPeriodStatus[] = {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_RENEWING}
    var nPeriod = _retrievePlugin.retrieveByPolicyNumberAndLevyYear(policyNumber, levyYear, transactionStatus)
    var employmentStatusChanged = nPeriod.INDCPXLine.EmploymentStatus != employmentStatus.equalsIgnoreCase("full-time")

    if(!nPeriod.INDCPXLineExists) {
      throw new JsonRpcInvalidRequestException() {
        :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChange.ChangeCPXCover.CPXLineNotExists")
      }
    }

    // validate cpx info from MyACC is valid
    for (cpxCov in cpxCoverable) {
      validateCoverableDTO(cpxCov, nPeriod)
    }

    var newPolicyChangeDto = this.loadWithLevyYear(policyNumber, levyYear, transactionStatus)
    var func = \bundle: Bundle, policyPeriod: PolicyPeriod -> {
      newPolicyChangeDto.EffectiveDate = LocalDateUtil.toDTO(policyPeriod.EditEffectiveDate)

      policyPeriod.INDCoPLine.INDCoPCovs.first().calculateBICLiableEarnings(true)

      var bicCodeDTO = bicCodeDTOList.first()

      if(bicCodeDTO.CUCode == null and bicCodeDTO.BicCode == null) {
        throw new JsonRpcInvalidRequestException() {
          :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChange.ChangeCPXCover.ErrorBICCUNotDefined")
        }
      }

      if(!policyPeriod.INDCPXLineExists) {
        policyPeriod.createPolicyLine(PolicyLinePatternLookup.getByPublicID(typekey.PolicyLine.TC_INDCPXLINE.Code))
      }

      var policyLine = policyPeriod.INDCPXLine

      policyLine.BusinessStructure = BusinessStructure_ACC.AllTypeKeys.firstWhere(\elt -> elt.DisplayName == businessStructure)
      policyLine.EmploymentStatus = employmentStatus.toLowerCase().equals("full-time")
      var currentBIC = policyPeriod.INDCPXLine.BICCodes.first()
      var newCUItem : ClassificationUnit_ACC
      if(bicCodeDTO.BicCode != null and currentBIC.BICCode != bicCodeDTO.BicCode) {
        var newBIC = bicAPI.getBICCode(bicCodeDTO.BicCode, levyYear)
        currentBIC.BICCode = newBIC.BusinessIndustryCode
        currentBIC.BICDescription = newBIC.BusinessIndustryDescription
        newCUItem = newBIC.ClassificationUnit_ACC
      } else if(bicCodeDTO.CUCode != null and currentBIC.CUCode != bicCodeDTO.CUCode) {
        currentBIC.BICCode = null
        currentBIC.BICDescription = null
        newCUItem = bicAPI.getCUCode(bicCodeDTO.CUCode, levyYear)
      }

      if(newCUItem != null) {
        currentBIC.CUCode = newCUItem.ClassificationUnitCode
        currentBIC.CUDescription = newCUItem.ClassificationUnitDescription
        currentBIC.ReplacementLabourCost = newCUItem.ReplacementLabourCost
      }

      var indcpxCov = policyPeriod.INDCPXLine.INDCPXCovs.first()
      updateCPXCov(cpxCoverable, indcpxCov)
    }

    var history = new HistoryItem(CustomHistoryType.TC_CPX_CHANGE_COVER_ACC,
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeHistory.ChangeCPXCover.Description", reason))

    var result : Object
    if (employmentStatusChanged) {
      return onEmploymentStatusChanged(newPolicyChangeDto, {func}, employmentStatus, reason, true)
    } else {
      var activityItem = new ActivityItem(DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeActivity.ChangeCPXCover.Subject"),
          DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeActivity.ChangeCPXCover.Description", BCSSUserProvider_ACC.getBCSSSUser().FullName),
          "cpx_uw_approval_acc", ChangeReason_ACC.TC_LEVELOFCOVERCHANGE)
      result = performTransactionUpdate(newPolicyChangeDto, {func}, history, activityItem, PolicyPeriodStatus.TC_BOUND.Code, true)
    }
    LOGGER.logInfo("End " + DateUtil_ACC.currentDateToString())
    return result
  }

  private function updateCPXCov(cpxCoverable : CoverableDTO_ACC[], indCPXCov : INDCPXCov) {
    var cpxInfoCov = indCPXCov.CPXInfoCovs
    var matchedList = new HashSet<CPXInfoCov_ACC>()
    var cpxMaxEarningCalc = new INDCPXCalculateMaximumPreviousEarnings_ACC(indCPXCov.Branch)
    for(cpxCov in cpxCoverable) {
      var matchedCPXCov = cpxInfoCov.firstWhere(\elt -> (elt.PeriodStart == cpxCov.PeriodStart and elt.PeriodEnd == cpxCov.PeriodEnd) or
                                                         cpxCov?.FixedID == elt.FixedId.Value)
      if(matchedCPXCov != null) {
        if(checkCPXIfUpdateRequired(matchedCPXCov, cpxCov)) {
          updateCPXInfoCov(matchedCPXCov, cpxCov, cpxMaxEarningCalc)
        }
        matchedCPXCov.PeriodStart = cpxCov.PeriodStart
        matchedCPXCov.PeriodEnd = cpxCov.PeriodEnd

        matchedList.add(matchedCPXCov)
        cpxCov.Exists = true
      }
    }

    var diffCPXInfoCov = Sets.difference(indCPXCov.CPXInfoCovs.toSet(), matchedList)
    if(diffCPXInfoCov.HasElements) {
      diffCPXInfoCov*.remove()
    }

    var newCPXCovList = cpxCoverable.where(\elt -> !elt.Exists).orderBy(\elt -> elt.PeriodStart)
    for (newCPXCov in newCPXCovList) {
      if(!indCPXCov.canCreateNewPeriod(newCPXCov.PeriodStart, newCPXCov.PeriodEnd)) {
        throw new JsonRpcInvalidRequestException() {
          :Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChange.ChangeCPXCover.CannotAddCPXPeriod")
        }
      }

      var newCPXInfoCov = indCPXCov.createCPXInfoCov(newCPXCov.PeriodStart, newCPXCov.PeriodEnd)
      updateCPXInfoCov(newCPXInfoCov, newCPXCov, cpxMaxEarningCalc)
    }
  }

  private function updateCPXInfoCov(cpxInfoCov : CPXInfoCov_ACC, cpxCov : CoverableDTO_ACC, cpxMaxEarningCalc:INDCPXCalculateMaximumPreviousEarnings_ACC) {
    cpxInfoCov.RequestedLevelOfCover = new MonetaryAmount(cpxCov.RequestedLevelOfCover, Currency.TC_NZD)
    cpxInfoCov.AgreedLevelOfCover = new MonetaryAmount(cpxCov.AgreedLevelOfCover, Currency.TC_NZD)
    cpxInfoCov.ApplicationReceived = cpxCov.ApplicationReceived
    cpxInfoCov.CoverTypeStandard = cpxCov?.CoverType?.equals("standard")
    if(cpxCov.MaxCoverPermitted != null) {
      cpxInfoCov.MaxCoverPermitted = new MonetaryAmount(cpxCov.MaxCoverPermitted, Currency.TC_NZD)
    } else {
      var replacementLabourCost = cpxMaxEarningCalc.calculateReplacementLabourCost(cpxInfoCov.Branch.INDCPXLine.BICCodes.first())
      cpxInfoCov.MaxCoverPermitted = cpxMaxEarningCalc.calculateMaximumPreviousEarnings(replacementLabourCost).Second
    }
    cpxInfoCov.RequestedLevelOfCover = INDCPXCovUtil_ACC.adjustAmountWithCPXMinMax(cpxInfoCov.RequestedLevelOfCover, cpxInfoCov.Branch.INDCPXLine.EffectiveDate)
    cpxInfoCov.adjustMaxCoverPermitted()
    cpxInfoCov.adjustAgreedCover()
  }

  private function checkCPXIfUpdateRequired(cpxInfoCov : CPXInfoCov_ACC, cpxCov : CoverableDTO_ACC) : boolean {
    if ((cpxInfoCov.RequestedLevelOfCover == null and cpxCov.RequestedLevelOfCover != null) or
        (cpxInfoCov?.RequestedLevelOfCover_amt?.compareTo(cpxCov.RequestedLevelOfCover) != 0))
      return true

    if ((cpxInfoCov.AgreedLevelOfCover == null and cpxCov.AgreedLevelOfCover != null) or
        (cpxInfoCov?.AgreedLevelOfCover_amt?.compareTo(cpxCov.AgreedLevelOfCover) != 0))
      return true

    if ((cpxInfoCov.MaxCoverPermitted == null and cpxCov.MaxCoverPermitted != null) or
        (cpxInfoCov?.MaxCoverPermitted_amt?.compareTo(cpxCov.MaxCoverPermitted) != 0))
      return true

    if(cpxInfoCov.CoverTypeStandard != null and
       !cpxInfoCov?.CoverTypeStandard?.equals(cpxCov?.CoverType?.equals("standard")))
      return true

    return false
  }

  private function validateCoverableDTO(coverable : CoverableDTO_ACC, nPeriod : PolicyPeriod) : boolean {
    validateAmount(new MonetaryAmount(coverable.AgreedLevelOfCover, Currency.TC_NZD), nPeriod, "AgreedLevelOfCover")
    return true
  }

  private function validateAmount(amount : MonetaryAmount, nPeriod : PolicyPeriod, fieldName : String) {
    var msg = INDCPXCovUtil_ACC.validateLevelOfCover(nPeriod.PeriodStart, amount,
                                                     nPeriod.Policy.Account.PreventReassessment_ACC)
    if(msg != null) {
      throw new JsonRpcInvalidRequestException() {
        :Message = fieldName.concat(", ").concat(msg)
      }
    }
  }

  private function performTransactionUpdate(newPolicyChangeDto : TransactionDTO, func:IBlock[], history:HistoryItem, activityItem : ActivityItem, status : String, checkForInProgress : boolean) : Object {
    var savedTransactionDTO = this.save_ACC(newPolicyChangeDto, func, checkForInProgress, status)
    var quoted : TransactionDTO
    var bindDTO : PolicyChangeBindDTO

    if(status.equalsIgnoreCase(PolicyPeriodStatus.TC_BOUND.Code) or
       status.equalsIgnoreCase(PolicyPeriodStatus.TC_QUOTED.Code) or
       status.equalsIgnoreCase(PolicyPeriodStatus.TC_RENEWING.Code) or
       status.equalsIgnoreCase(PolicyPeriodStatus.TC_AUDITCOMPLETE.Code)) {
      try {
        if(savedTransactionDTO.Branch.Status == PolicyPeriodStatus.TC_DRAFT) {
          quoted = this.quote(savedTransactionDTO.JobID)
        }

        if(!status.equalsIgnoreCase(PolicyPeriodStatus.TC_QUOTED.Code)) {
          bindDTO = this.bind_ACC(quoted.JobID, history)
        }
      } catch (uwException: PolicyChangeUnderwritingException) {
        return processUWException(uwException, savedTransactionDTO, activityItem, history)
      } catch (uwException: UnderwritingException) {
        return processUWException(uwException, savedTransactionDTO, activityItem, history)
      }
    }

    if(status.equalsIgnoreCase(PolicyPeriodStatus.TC_DRAFT.Code)) {
      createHistoryEvent(savedTransactionDTO.Job.LatestPolicyPeriod, history, savedTransactionDTO, status)
      return _policyPluginACC.getPolicyPeriodDetails(savedTransactionDTO.Job.LatestPolicyPeriod)
    } else if(status.equalsIgnoreCase(PolicyPeriodStatus.TC_QUOTED.Code)) {
      createHistoryEvent(quoted.Job.LatestPolicyPeriod, history, quoted, status)
      return _policyPluginACC.getPolicyPeriodDetails(quoted.Job.LatestPolicyPeriod)
    }

    return _policyPluginACC.getPolicyPeriodDetails(bindDTO.Job.LatestPolicyPeriod)
  }

  function processUWException(uwException : Exception, transactionDTO : TransactionDTO, activityItem : ActivityItem, history:HistoryItem) : Object {
    var activityDTOArray = new ArrayList<ActivityDTO>()
    var msg = uwException.Message.replace("edge.capabilities.policychange.exception.PolicyChangeUnderwritingException:", "")
    var pattern = ActivityUtil.deriveActivityPattern(msg)
    activityItem.setActivityPattern(pattern)
    var activityDTO = createActivityDTO(transactionDTO.PolicyNumber, activityItem)
    activityDTO.Description = activityDTO?.Description?.concat(msg)

    if(transactionDTO.Branch.INDCPXLineExists and
       !transactionDTO.Branch.BasedOn.INDCPXLineExists) {
      var startDate = transactionDTO.Branch.INDCPXLine.INDCPXCovs.first().CPXInfoCovs.orderBy(\elt -> elt.PeriodStart).first().PeriodStart
      var stringDate = new SimpleDateFormat("dd/MM/yyyy").format(startDate)
      activityDTO.Description = "CPX policy application requires approval. Start date: ${stringDate}. ${msg}"
      if(ActivityUtil.hasCPXUWIssueType(transactionDTO.Branch) and activityItem.ActivityPattern.equals(ActivityUtil.ACTIVITY_CODE_CPX_UW_RULE)) {
        var changeReason = ChangeReason_ACC.getAllTypeKeys().firstWhere(\elt -> history.Description.contains(elt.DisplayName))
        activityItem.CostChangeReason = changeReason
      } else {
        activityItem.CostChangeReason = ChangeReason_ACC.TC_POLICYCANCELLATIONORACCEPTANCE
      }
    }

    if(pattern.equals(ActivityUtil.ACTIVITY_CODE_DFA_UW_RULE)) {
      activityDTO.Subject = activityDTO.Subject.concat(" - DFA approval required")
    }

    activityDTO.Job = transactionDTO.Job
    activityDTOArray.add(createTransactionActivity(transactionDTO.PolicyNumber, activityDTO, history))
    return activityDTOArray.toArray()
  }

  function createActivityDTO(policyNumber : String, activityItem : ActivityItem) : ActivityDTO {
    final var anActPattern = ActivityPattern.finder.getActivityPatternByCode(activityItem.ActivityPattern)
    var anActivityDTO = new ActivityDTO()
    anActivityDTO.PolicyNumber = policyNumber
    anActivityDTO.Subject = activityItem.Subject
    anActivityDTO.Description = activityItem.Description
    anActivityDTO.ActivityPattern = _activityPatternPlugin.toDTO(anActPattern)
    anActivityDTO.Priority = anActPattern.Priority
    anActivityDTO.DueDate = DefaultActivityPatternPlugin.getDueDate(anActPattern)
    anActivityDTO.EscalationDate = DefaultActivityPatternPlugin.getEscalationDate(anActPattern)
    anActivityDTO.Mandatory = anActPattern.Mandatory
    anActivityDTO.ChangeReason = activityItem.CostChangeReason
    return anActivityDTO
  }

  /**
   * Retrieve transaction data for a policy period.
   * @param policyNumber the policy
   * @param levyYear the levy year
   * @param transactionStatus the transaction status
   * @return the transaction data found
   */
  @JsonRpcMethod
  function loadWithLevyYear(policyNumber:String, levyYear:int, transactionStatus : PolicyPeriodStatus[]) : TransactionDTO {
    var policyPeriod = _retrievePlugin.retrieveByPolicyNumberAndLevyYear(policyNumber, levyYear, transactionStatus)

    var dto : TransactionDTO
    if ( policyPeriod.Job typeis PolicyChange) {
      if (!policyPeriod.Job.Complete) {
        dto = _draftPlugin.toDto(policyPeriod.Job)
      } else {
        dto = _draftPlugin.toDto(policyPeriod)
      }
    } else {
      dto = _draftPlugin.toDto(policyPeriod.Job)
    }

    return dto
  }


  /**
   * Retrieve transaction data for a policy period.
   * @param jobNumber the policy
   * @return the transaction data found
   */
  @JsonRpcMethod
  function loadByJobNumber(jobNumber : String): TransactionDTO {
    var policyPeriod = _retrievePlugin.retrieveByJobNumber(jobNumber)

    if (policyPeriod.Job == null) {
      throw new Exception("Transaction number does not exist")
    }
    var dto : TransactionDTO
    if ( policyPeriod.Job typeis PolicyChange) {
      if (!policyPeriod.Job.Complete) {
        dto = _draftPlugin.toDto(policyPeriod.Job)
      } else {
        dto = _draftPlugin.toDto(policyPeriod)
      }
    } else {
      dto = _draftPlugin.toDto(policyPeriod.Job)
    }

    return dto
  }

  protected function createActivity(jobDTO : TransactionDTO) : Activity {
    var job = Job.finder.findJobByJobNumber(jobDTO.JobID)
    var user = BCSSUserProvider_ACC.getBCSSSUser()
    return ActivityDTO_ACC.createActivityForJob("", "", job, user)
  }

  /**
   * Quotes a policy change
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd><code>IPolicyChangeRetrievalPlugin#retrieveByJobNumber(String)</code> - to retrieve the policy change</dd>
   * <dd><code>IPolicyChangeQuotePlugin#quote(PolicyChange)</code> - to quote the policy change</dd>
   * <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyChange)</code> - to provide the policy change as a DTO</dd>
   * <dt>Throws:</dt>
   * <dd><code>JsonRpcInvalidRequestException</code> - if the job number is invalid or the effective date is in the past</dd>
   * <dd><code>UnderwritingException</code> - if there was an underwriting issue preventing the quote</dd>
   * </dl>
   *
   * @param jobNumber a job number identifying the policy change that is to be quoted
   * @returns details of the quoted policy change
   */
  @JsonRpcMethod
  override function quote(jobNumber: String): TransactionDTO {
    var policyPeriod = _retrievePlugin.retrieveByJobNumber(jobNumber)
    var job : Job
    if(!policyPeriod.Job.Complete) {
      job = policyPeriod.Job
    } else {
      job = policyPeriod.Job
    }

    if (job == null) {
      throw new JsonRpcInvalidRequestException(){:Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.Exception.InvalidJobNumber")}
    }

    Bundle.transaction(\bundle -> {
      job = bundle.add(job)
      policyPeriod = bundle.add(policyPeriod)
      checkForBlockingUWIssues(policyPeriod, UWIssueBlockingPoint.TC_BLOCKSQUOTE)
      _quotingPlugin.quote(job)
    })

    if (job typeis Renewal) {
      return _draftPlugin.toDto(job as Renewal)
    } else
      return _draftPlugin.toDto(job)
  }

  /**
   * Create an activity to cease a policy.
   * @param policyNumber the policy number
   * @param stopDate the stop date
   * @param provisionalIncome the provisional income
   * @param reason the cease reason
   * @return the created activity
   */
  @JsonRpcMethod
  function ceasePolicy(policyNumber: String, stopDate: Date, provisionalIncome : String, reason: String): ActivityDTO {
    final var anActPattern = ActivityPattern.finder.getActivityPatternByCode("review_policy_cease")
    var anActivityDTO = new ActivityDTO()
    anActivityDTO.PolicyNumber = policyNumber
    anActivityDTO.Subject = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyCeaseActivity.Subject")
    anActivityDTO.Description = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyCeaseActivity.Description", policyNumber, stopDate, provisionalIncome, reason)
    anActivityDTO.ActivityPattern = _activityPatternPlugin.toDTO(anActPattern)
    anActivityDTO.Priority = anActPattern.Priority
    anActivityDTO.DueDate = DefaultActivityPatternPlugin.getDueDate(anActPattern)
    anActivityDTO.EscalationDate = DefaultActivityPatternPlugin.getEscalationDate(anActPattern)
    anActivityDTO.Mandatory = anActPattern.Mandatory

    var history = new HistoryItem(CustomHistoryType.TC_POLICY_CEASE_ACC,
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.PolicyChangeHistory.PolicyCease.Description"))

    return createTransactionActivity(policyNumber, anActivityDTO, history)
  }

  /**
   * change PolicyPeriod Status
   * @param jobNumber the job number
   * @param status the job number
   * @param reason the job number
   */
  @JsonRpcMethod
  function changePolicyPeriodStatus(jobNumber:String, status : String, reason: String) : Object {
    var newPolicyChangeDto = this.loadByJobNumber(jobNumber)
    var policyPeriod = newPolicyChangeDto.Branch
    if(policyPeriod == null) {
      throw new JsonRpcInvalidRequestException(){:Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.Exception.InvalidJobNumber")}
    }

    if(status.equalsIgnoreCase(newPolicyChangeDto.Branch.Status.Code)) {
      return "Status is current"
    }

    if(policyPeriod.Status == PolicyPeriodStatus.TC_WITHDRAWN or policyPeriod.Status == PolicyPeriodStatus.TC_BOUND) {
      throw new JsonRpcInvalidRequestException(){:Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.ChangePolicyPeriodStatus.CantUpdateLockedBranch")}
    }

    var history = new HistoryItem(CustomHistoryType.TC_CHANGE_POLICYPERIODSTATUS_ACC,
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.ChangePolicyPeriodStatus.DescriptionWithReason", BCSSUserProvider_ACC.getBCSSSUser().FullName, status, reason))

    var activityItem = new ActivityItem(DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.ChangePolicyPeriodStatus.Subject"),
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.ChangePolicyPeriodStatus.DescriptionNoReason", BCSSUserProvider_ACC.getBCSSSUser().FullName, status),
        "cpx_uw_approval_acc", ChangeReason_ACC.TC_OTHER)

    if(status.equalsIgnoreCase(PolicyPeriodStatus.TC_DRAFT.Code)) {

      Bundle.transaction(\bundle -> {
        bundle.add(policyPeriod).edit()
      })

      var transactionDTO = _policyPluginACC.getPolicyPeriodDetails(policyPeriod)
      createHistoryEvent(policyPeriod, history, transactionDTO, status)

      return transactionDTO
    } else if (status.equalsIgnoreCase(PolicyPeriodStatus.TC_QUOTED.Code) and policyPeriod.Status == PolicyPeriodStatus.TC_DRAFT) {

      var transactionDTO : TransactionDTO
      try {
        transactionDTO = quote(jobNumber)
      } catch (uwException: PolicyChangeUnderwritingException) {
        return processUWException(uwException, newPolicyChangeDto, activityItem, history)
      } catch (uwException: UnderwritingException) {
        return processUWException(uwException, newPolicyChangeDto, activityItem, history)
      }

      createHistoryEvent(policyPeriod, history, transactionDTO, status)

      return transactionDTO
    } else if (status.equalsIgnoreCase(PolicyPeriodStatus.TC_BOUND.Code) or
               status.equalsIgnoreCase(PolicyPeriodStatus.TC_AUDITCOMPLETE.Code) or
               status.equalsIgnoreCase(PolicyPeriodStatus.TC_RENEWING.Code)) {

      var transactionDTO : PolicyChangeBindDTO
      try {
        transactionDTO = bind_ACC(jobNumber, history)
      } catch (uwException: PolicyChangeUnderwritingException) {
        return processUWException(uwException, newPolicyChangeDto, activityItem, history)
      } catch (uwException: UnderwritingException) {
        return processUWException(uwException , newPolicyChangeDto, activityItem, history)
      }

      AuditHelper_ACC.checkAndTriggerProvisionalUpdate(transactionDTO.Job.LatestPolicyPeriod)

      return transactionDTO

    } else if( status.equalsIgnoreCase(PolicyPeriodStatus.TC_WITHDRAWN.Code) and
              (policyPeriod.Status != PolicyPeriodStatus.TC_WITHDRAWN and
               policyPeriod.Status != PolicyPeriodStatus.TC_BOUND and
               policyPeriod.Status != PolicyPeriodStatus.TC_AUDITCOMPLETE)) {

      Bundle.transaction(\bundle -> {
        bundle.add(policyPeriod).Job.withdraw()
      })

      var transactionDTO =  _policyPluginACC.getPolicyPeriodDetails(policyPeriod)
      createHistoryEvent(policyPeriod, history, transactionDTO, status)
      return transactionDTO
    }

    return null
  }

  /**
   * Binds a policy transaction
   * @param jobNumber the job number
   */
  @JsonRpcMethod
  function bindPolicyTransaction(jobNumber:String, reason: String) : Object {
    var history = new HistoryItem(CustomHistoryType.TC_BIND_TRANSACTION_ACC,
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.BindTransaction.Description", BCSSUserProvider_ACC.getBCSSSUser().FullName,reason))

    var activityItem = new ActivityItem(DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.BindTransaction.Subject"),
        DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.BindTransaction.Description", BCSSUserProvider_ACC.getBCSSSUser().FullName, jobNumber),
        "approve_general", ChangeReason_ACC.TC_OTHER)

    var bindDTO : PolicyChangeBindDTO
    try {
      bindDTO = this.bind_ACC(jobNumber, history)
    } catch (uwException: PolicyChangeUnderwritingException) {
      return processUWException(uwException, bindDTO.Transaction, activityItem, history)
    } catch (uwException: UnderwritingException) {
      return processUWException(uwException, bindDTO.Transaction, activityItem, history)
    }

    return _policyPluginACC.getPolicyPeriodDetails(bindDTO.Job.LatestPolicyPeriod)
  }

  function processUWException(uwException : Exception, transactionDTO : TransactionBindDTO, activityItem : ActivityItem, history:HistoryItem) : Object {
    var policyNumber = transactionDTO.Job.LatestPeriod.PolicyNumber
    var activityDTOArray = new ArrayList<ActivityDTO>()
    var msg = uwException.Message.replace("edge.capabilities.policychange.exception.PolicyChangeUnderwritingException:", "")
    activityItem.setActivityPattern(ActivityUtil.deriveActivityPattern(msg))
    var activityDTO = createActivityDTO(policyNumber, activityItem)
    activityDTO.Description = activityDTO?.Description?.concat(msg)
    activityDTO.Job = transactionDTO.Job
    activityDTOArray.add(createTransactionActivity(policyNumber, activityDTO, history))
    return activityDTOArray.toArray()
  }

  /**
   * Binds a policy change
   * If the policy has a pending draft renewal job, this operation will also try to apply the change to the renewal.
   * Overriden from OOTB code
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd><code>IPolicyChangeRetrievalPlugin#retrieveByJobNumber(String)</code> - to retrieve the policy change</dd>
   * <dd><code>IPolicyChangeBindPlugin#bind(PolicyChange)</code> - to bind the policy change</dd>
   * <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyChange)</code> - to provide the policy change as a DTO</dd>
   * <dt>Throws:</dt>
   * <dd><code>JsonRpcInvalidRequestException</code> - if the job number is invalid</dd>
   * <dd><code>PolicyChangeUnderwritingException</code> - if there was an underwriting issue preventing the bind</dd>
   * </dl>
   *
   * @param jobNumber a job number identifying the policy change that is to be bound
   * @returns details of the bound policy change
   */
  private function bind_ACC(jobNumber: String, history : HistoryItem) : PolicyChangeBindDTO {
    var policyPeriod = _retrievePlugin.retrieveByJobNumber(jobNumber)
    var changesAppliedForward = false
    var job = policyPeriod.Job

    if (job == null) {
      throw new JsonRpcInvalidRequestException(){:Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.Exception.InvalidJobNumber")}
    } else if (policyPeriod.Status != PolicyPeriodStatus.TC_QUOTED) {
      throw new JsonRpcInvalidRequestException(){:Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.Exception.PolicyNotQuoted")}
    }

    try {
      Bundle.transaction(\bundle -> {
        job = bundle.add(job)
        changesAppliedForward = _accBindPlugin.bind_ACC(job)
        createCustomHistoryForJob(job, history)
      })
    } catch (uwe: PolicyChangeUnderwritingException) {
      // Set flag for use later
      throw new PolicyChangeUnderwritingException(uwe)
    }

    return new PolicyChangeBindDTO(){
        :Transaction = _draftPlugin.toDto(job),
        :Job = job,
        :ChangesAppliedForward = changesAppliedForward
        }
  }

  @JsonRpcMethod
  function getBICOccurences(bicCode : String, startYear : int, endYear: int): BICCodeDTO_ACC {
    if (bicCode == null or bicCode.Empty) {
      throw new JsonRpcInvalidRequestException(){:Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.Exception.InvalidBICCode")}
    } else if (startYear == 0 or endYear == 0) {
      throw new JsonRpcInvalidRequestException(){:Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.Exception.InvalidYearRange")}
    } else if (startYear >= endYear) {
      throw new JsonRpcInvalidRequestException(){:Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.Exception.InvalidYearRange")}
    }

    var bicData = new BusinessClassificationAPI().getBICCodeAvailableYears(bicCode, startYear, endYear)
    if(bicData.IsEmpty) {
      throw new JsonRpcInvalidRequestException(){:Message = DisplayKey.get("Edge.Capabilities.PolicyChange.PolicyChangeHandler_ACC.Exception.InvalidBICCode")}
    }

    var bicCodeDTO = PolicyLineUtil_ACC.createBICCodeFromBusinessIndustryCode(bicData.first())
    bicCodeDTO.AvailableYears = bicData*.EndDate*.YearOfDate
    return bicCodeDTO
  }
}