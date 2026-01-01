package nz.co.acc.gwer.enhancement

uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses typekey.PolicyLine

uses java.math.BigDecimal

enhancement ERTransferEnhancement : ERTransfer_ACC {

  function createNewBuyer() : ERTransferBuyer_ACC {
    var buyer = new ERTransferBuyer_ACC(this.Bundle)
    buyer.ERTransfer = this
    this.addToBuyers(buyer)
    return buyer
  }

  function updatePolicyDetails() {
    if(this.ERTransferType == ERTransferType_ACC.TC_FUL) {
      clearPolicyEarnings()
    } else {
      createTransferPolicyDetails()
    }
  }

  function clearPolicyEarnings() {
    if(this.TransferPolicyEarnings.HasElements){
      this.TransferPolicyEarnings.each(\elt -> this.removeFromTransferPolicyEarnings(elt))
    }
  }

  function createTransferPolicyDetails() {
    if(this.ERTransferType == ERTransferType_ACC.TC_SPL) {
      addBuyerOrSellerDetailsByACCPolicyID(this.SellerACCPolicyID)
      this.Buyers.each(\elt -> addBuyerOrSellerDetailsByTransferBuyer(elt))

      var policyIDList = new ArrayList<String>()
      policyIDList.addAll(this.Buyers*.ACCPolicyID_ACC.toList())
      policyIDList.add(this.SellerACCPolicyID)

      var tobeRemoved = this.TransferPolicyEarnings*.ACCPolicyID_ACC.subtract(policyIDList.toTypedArray())
      tobeRemoved.each(\elt -> {
        var toRemovedElements = this.TransferPolicyEarnings.where(\elt1 -> elt1.ACCPolicyID_ACC == elt)
        if(toRemovedElements.Count > 0) {
          toRemovedElements.each(\elt2 -> this.removeFromTransferPolicyEarnings(elt2))
        }
      })
    }
  }

  function addBuyerOrSellerDetailsByTransferBuyer(transferBuyer : ERTransferBuyer_ACC) {
    addParamCUandPolicyDetail(transferBuyer, null, this.TransferDate.LevyYear_ACC)
    addParamCUandPolicyDetail(transferBuyer, null, this.TransferDate.LevyYear_ACC-1)
    addParamCUandPolicyDetail(transferBuyer, null, this.TransferDate.LevyYear_ACC-2)
    addParamCUandPolicyDetail(transferBuyer, null, this.TransferDate.LevyYear_ACC-3)
  }

  function addBuyerOrSellerDetailsByACCPolicyID(accPolicyID : String) {
    addParamCUandPolicyDetail(null, accPolicyID, this.TransferDate.LevyYear_ACC)
    addParamCUandPolicyDetail(null, accPolicyID, this.TransferDate.LevyYear_ACC-1)
    addParamCUandPolicyDetail(null, accPolicyID, this.TransferDate.LevyYear_ACC-2)
    addParamCUandPolicyDetail(null, accPolicyID, this.TransferDate.LevyYear_ACC-3)
  }

  function addParamCUandPolicyDetail(transferBuyer : ERTransferBuyer_ACC, accPolicyID : String, levyYear : int) {
    var nACCPolicyID = transferBuyer != null ? transferBuyer.ACCPolicyID_ACC : accPolicyID
    var _erProcessUtils = new ERProcessUtils_ACC()
    var policyTerm = _erProcessUtils.getPolicyTermByACCPolicyIDAndLevyYear(nACCPolicyID, levyYear).FirstResult
    if(policyTerm != null) {
      var policyPeriod = policyTerm.findLatestBoundOrAuditedPeriod_ACC()
      policyPeriod = policyPeriod.getSlice(policyPeriod.EditEffectiveDate)
      policyPeriod.Lines.each(\elt -> {
        var policyLine = elt.Subtype
        elt.BICCodes.each(\bicCode -> {

          var paramCUData = _erProcessUtils.getERParamCUByLevyYear(bicCode.CUCode, this.TransferDate.LevyYear_ACC)
          if (!this.ERTransferParamCU.hasMatch(\elt1 -> elt1.ParamCU.CUCode == paramCUData.CUCode and
                                                        elt1.ParamCU.LevyYear == paramCUData.LevyYear)) {
            var transferParamCU = new ERTransferParamCU_ACC()
            transferParamCU.ParamCU = paramCUData
            this.addToERTransferParamCU(transferParamCU)
          }

          var liableEarnings = BigDecimal.ZERO
          var levyCost = _erProcessUtils.getPeriodLevyCost(policyPeriod, ChargePattern.TC_WAL, bicCode.CUCode)

          if (policyLine == PolicyLine.TC_EMPWPCLINE) {
            liableEarnings = policyPeriod.EMPWPCLine.getTotalLiableEarningsByCUCode(bicCode.CUCode)
          } else if (policyLine == PolicyLine.TC_CWPSLINE) {
            liableEarnings = policyPeriod.CWPSLine.getTotalLiableEarningsByCUCode(bicCode.CUCode)
          } else if (policyLine == PolicyLine.TC_INDCOPLINE) {
            liableEarnings = policyPeriod.INDCoPLine.BICCodes.first().AdjustedLiableEarnings
          } else if (policyLine == PolicyLine.TC_INDCPXLINE) {
            levyCost = _erProcessUtils.getPeriodLevyCost(policyPeriod, ChargePattern.TC_WAL_CPX, bicCode.CUCode)
            var isShareLE = Boolean.FALSE
            liableEarnings = _erProcessUtils.getShareholderCPXLiableEarnings(policyPeriod)
            if (liableEarnings == null) {
              liableEarnings = policyPeriod.INDCPXLine.INDCPXCovs.first().CPXInfoCovs*.AgreedLevelOfCover_amt.sum()
            } else {
              isShareLE = Boolean.TRUE
            }
          }

          var earnings = this.TransferPolicyEarnings.where(\tpe -> tpe.ACCPolicyID_ACC == nACCPolicyID and
              tpe.CUCode == bicCode.CUCode).first()
          print(this.TransferPolicyEarnings.Count)
          print(this.TransferPolicyEarnings)
          if (earnings == null) {
            print("Earnings not found")
            earnings = new ERTransferPolicyEarnings()
            earnings.ACCPolicyID_ACC = nACCPolicyID
            earnings.CUCode = bicCode.CUCode
            earnings.ERTransfer = this
            earnings.Seller = this.SellerACCPolicyID == nACCPolicyID
          } else {
            print("Earnings found")
          }

          var leOption = this.TransferDate.LevyYear_ACC - levyYear
          if(leOption == 0) {
            earnings.LiableEarningsRecent = liableEarnings
            earnings.LevyDueRecent = levyCost
          } else if (leOption == 1) {
            earnings.LiableEarningsYear3 = liableEarnings
            earnings.LevyDueYear3 = levyCost
          } else if (leOption == 2) {
            earnings.LiableEarningsYear2 = liableEarnings
            earnings.LevyDueYear2 = levyCost
          } else if (leOption == 3) {
            earnings.LiableEarningsYear1 = liableEarnings
            earnings.LevyDueYear1 = levyCost
          }

          this.addToTransferPolicyEarnings(earnings)
        })
      })
    }

    if(transferBuyer != null and !this.Buyers.hasMatch(\elt1 -> elt1.ACCPolicyID_ACC == transferBuyer.ACCPolicyID_ACC)) {
      this.addToBuyers(transferBuyer)
    }
  }

  function validateBuyers() {
    if(!this.Buyers.HasElements) {
      throw new gw.api.util.DisplayableException("No Buyers found")
    }

    if(this.ERTransferType == ERTransferType_ACC.TC_FUL and this.Buyers.Count > 1) {
      throw new gw.api.util.DisplayableException("Only 1 buyer is required for a full transfer")
    }
  }
}
