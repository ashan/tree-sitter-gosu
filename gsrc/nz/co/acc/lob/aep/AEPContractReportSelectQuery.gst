select
    a.AEPContractNumber_ACC
	,coalesce(c.Name,concat(c.FirstName,' ',c.LastName)) AccountName
	,pp.AltBillingAccountNumber PrimeAccountNumber
	,convert(char(10),a.AEPAgreementOrigSignedDate_ACC,103) AEPAgreementOrigSignedDate_ACC
	,soa.NAME StatusOfAccount
	,rm.RelationshipManager
	,rm.RMPhone
	,rm.RMEmail
	,rm2.ComplianceAdvisor
	,rm2.CAPhone
	,rm2.CAEmail
	,convert(char(10),pt.AEPPlanStartDate_ACC,103) AEPPlanStartDate
	,convert(char(10),pt.AEPPlanEndDate_ACC,103) AEPPlanEndDate
	,ct.NAME ContractPlanType
	,cmp.NAME ClaimManagementPeriod
	,hccc.NAME HighCostClaimsCover
	,pl.StopLossPercentage
	,ar.NAME AuditResult
	,iif(p.ValidForClaimsReg_ACC=1,'Y','N') ValidForClaimsReg_ACC
	,aacd.NumberFTEs
from PC.dbo.pc_account a with(nolock)
inner join PC.dbo.pc_accountcontact ac on a.ID = ac.Account
inner join PC.dbo.pc_accountcontactrole acr on ac.ID = acr.AccountContact and acr.Subtype in (2) -- AccountHolder
inner join PC.dbo.pc_contact c on c.ID = ac.Contact
left join PC.dbo.pctl_statusofaccount_acc soa on soa.ID = a.StatusOfAccount_ACC
left join (select a.AEPContractNumber_ACC, concat(con.FirstName,' ',con.LastName) RelationshipManager, con.WorkPhone RMPhone, con.EmailAddress1 RMEmail
	   from pc.dbo.pc_account a
	   inner join PC.dbo.pc_accountuserroleassign aur on a.ID = aur.AccountID AND aur.retired = 0
	   inner join pc.dbo.pctl_userrole xur ON xur.ID = aur.Role AND xur.NAME not in ('Creator', 'AEP Compliance Advisor')
	   inner join pc.dbo.pc_user usr ON usr.CredentialID = aur.AssignedUserID
	   inner join pc.dbo.pc_contact con ON con.ID = usr.ContactID) rm ON rm.AEPContractNumber_ACC = a.AEPContractNumber_ACC
left join (select a.AEPContractNumber_ACC, concat(con2.FirstName,' ',con2.LastName) ComplianceAdvisor, con2.WorkPhone CAPhone, con2.EmailAddress1 CAEmail
	   from pc.dbo.pc_account a
	   inner join PC.dbo.pc_accountuserroleassign aur2 on a.ID = aur2.AccountID AND aur2.retired = 0
	   inner join pc.dbo.pctl_userrole xur2 ON xur2.ID = aur2.Role AND xur2.NAME = 'AEP Compliance Advisor'
	   inner join pc.dbo.pc_user usr2 ON usr2.CredentialID = aur2.AssignedUserID
	   inner join pc.dbo.pc_contact con2 ON con2.ID = usr2.ContactID) rm2 ON rm2.AEPContractNumber_ACC = a.AEPContractNumber_ACC
inner join PC.dbo.pc_policy p on a.ID = p.AccountID
inner join PC.dbo.pc_policyperiod pp on p.ID = pp.PolicyID and pp.[Status] in (9,10004)
inner join PC.dbo.pc_policyterm pt on pp.PolicyTermID = pt.ID and year(dateadd(month,9,getdate())) between year(dateadd(month,9,pt.AEPPlanStartDate_ACC)) and year(dateadd(month,9,coalesce(dateadd(day,-1,pt.AEPPlanEndDate_ACC),'4999-12-31')))
inner join PC.dbo.pc_policyline pl on pp.ID = pl.BranchID and pl.ExpirationDate is null
inner join PC.dbo.pc_job j on j.ID = pp.JobID and j.Subtype in (1,5,6,7,10)
inner join PC.dbo.pctl_job jt on j.Subtype = jt.ID
inner join (select max(j1.UpdateTime) UpdateTime, pp1.ACCPolicyID_ACC, pp1.LevyYear_ACC
            from PC.dbo.pc_policyperiod pp1
            inner join PC.dbo.pc_job j1 on j1.ID = pp1.JobID
            where pp1.[Status] in (9,10004)
            group by pp1.ACCPolicyID_ACC, pp1.LevyYear_ACC
            ) lat on lat.ACCPolicyID_ACC = pp.ACCPolicyID_ACC and lat.LevyYear_ACC = pp.LevyYear_ACC and lat.UpdateTime = j.UpdateTime
left join PC.dbo.pctl_aepcontractplantype_acc ct on ct.ID = pl.ContractPlanType
left join PC.dbo.pctl_aepauditresult_acc ar on ar.ID = pl.AuditResult
left join PC.dbo.pctl_aephighcostclaimscov_acc hccc on hccc.ID = pl.HighCostClaimsCover
left join PC.dbo.pctl_aepclaimmanageperiod_acc cmp on cmp.ID = pl.ClaimManagementPeriod
left join PC.dbo.pctl_aepcomplianceaudits_acc ca on ca.ID = pt.FinalAuditOption
left join PC.dbo.pcx_aepacctcompliancedet_acc aacd
    ON aacd.accountid = a.id
    AND aacd.LevyYear = pp.LevyYear_ACC
where isnull(a.AEPContractAccount_ACC,0) = 1
