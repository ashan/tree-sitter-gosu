select distinct
	a.AEPContractNumber_ACC
	,pca.Name as AccountName
	,concat(con.FirstName,' ',con.LastName) RelationshipManager
	,concat(con2.FirstName,' ',con2.LastName) ComplianceAdvisor
	,cl.NAME ContactType
	,act.NAME ContactRole
	,coalesce(c.Name,concat(c.FirstName, ' ',c.LastName)) CustomerName
	,tpaa.NAME AEPTPAAgreement
	,tpan.NAME AEPTPANature
	,c.WorkPhone
	,c.HomePhone
	,c.CellPhone
	,c.EmailAddress1
	,c.EmailAddress2
	,ad.Attention_ACC AS PrimaryAttentionTo
    ,ad.AddressLine1 AS PrimaryAddressLine1
    ,ad.AddressLine2 AS PrimaryAddressLine2
    ,ad.AddressLine3 AS PrimaryAddressLine3
    ,iif(ad.City='Unknown',null,ad.City) AS PrimaryCity
    ,iif(ad.PostalCode='Unknown',null,ad.PostalCode) AS PrimaryPostalCode
    ,iif(cnty.NAME='Unknown',null,cnty.NAME) AS PrimaryCountry
    ,max(ltrim(case when at2.NAME = 'Preferred' and loc2.NAME= 'Postal' then concat(ad2.Attention_ACC,' ',ad2.AddressLine1,' ',ad2.AddressLine2,' ',ad2.AddressLine3,' ',iif(ad2.City='Unknown',null,ad2.City),' ',iif(ad2.PostalCode='Unknown',null,ad2.PostalCode),' ',iif(cnty2.NAME='Unknown',null,cnty2.NAME)) else '' end)) [Preferred Postal]
	,max(ltrim(case when at2.NAME = 'Preferred' and loc2.NAME= 'Physical' then concat(ad2.Attention_ACC,' ',ad2.AddressLine1,' ',ad2.AddressLine2,' ',ad2.AddressLine3,' ',iif(ad2.City='Unknown',null,ad2.City),' ',iif(ad2.PostalCode='Unknown',null,ad2.PostalCode),' ',iif(cnty2.NAME='Unknown',null,cnty2.NAME)) else '' end)) [Preferred Physical]
	,max(ltrim(case when at2.NAME = 'Claims' and loc2.NAME= 'Physical' then concat(ad2.Attention_ACC,' ',ad2.AddressLine1,' ',ad2.AddressLine2,' ',ad2.AddressLine3,' ',iif(ad2.City='Unknown',null,ad2.City),' ',iif(ad2.PostalCode='Unknown',null,ad2.PostalCode),' ',iif(cnty2.NAME='Unknown',null,cnty2.NAME)) else '' end)) [Claims Physical]
	,max(ltrim(case when at2.NAME = 'Claims' and loc2.NAME= 'Postal' then concat(ad2.Attention_ACC,' ',ad2.AddressLine1,' ',ad2.AddressLine2,' ',ad2.AddressLine3,' ',iif(ad2.City='Unknown',null,ad2.City),' ',iif(ad2.PostalCode='Unknown',null,ad2.PostalCode),' ',iif(cnty2.NAME='Unknown',null,cnty2.NAME)) else '' end)) [Claims Postal]
from PC.dbo.pc_account a with(nolock)
inner join PC.dbo.pc_accountcontact         ac on a.ID = ac.Account
inner join PC.dbo.pc_accountcontactrole     acr on ac.ID = acr.AccountContact
inner join PC.dbo.pctl_accountcontactrole   act on act.ID = acr.Subtype
inner join PC.dbo.pc_contact c on c.ID = ac.Contact
inner join PC.dbo.pctl_contact cl on c.Subtype = cl.ID
left join PC.dbo.pc_address ad on ad.ID = c.PrimaryAddressID
left join PC.dbo.pctl_addresslocationtype_acc loc on loc.ID = ad.AddressLocType_ACC
left join PC.dbo.pctl_addresspolicytype_acc pol on pol.ID = ad.AddressPolicyType_ACC
left join PC.dbo.pctl_addresstype at on at.ID = ad.AddressType
left join PC.dbo.pctl_country cnty on ad.Country = cnty.ID
left join PC.dbo.pc_contactaddress ca on c.ID = ca.ContactID
left join PC.dbo.pc_address ad2 on ad2.ID = ca.AddressID
left join PC.dbo.pctl_addresslocationtype_acc loc2 on loc2.ID = ad2.AddressLocType_ACC
left join PC.dbo.pctl_addresspolicytype_acc pol2 on pol2.ID = ad2.AddressPolicyType_ACC
left join PC.dbo.pctl_addresstype at2 on at2.ID = ad2.AddressType
left join PC.dbo.pctl_country cnty2 on ad2.Country = cnty2.ID
LEFT JOIN (PC.dbo.pc_accountuserroleassign AS aur
    INNER JOIN PC.dbo.pctl_userrole xur
		ON xur.ID = aur.Role
		AND xur.NAME not in ('Creator', 'AEP Compliance Advisor')
	INNER JOIN PC.dbo.pc_user usr
		ON usr.CredentialID = aur.AssignedUserID
	INNER JOIN PC.dbo.pc_contact con
		ON con.ID = usr.ContactID
	)
	ON a.ID = aur.AccountID AND aur.retired = 0
LEFT JOIN (PC.dbo.pc_accountuserroleassign AS aur2
    INNER JOIN PC.dbo.pctl_userrole xur2
		ON xur2.ID = aur2.Role
		AND xur2.NAME = 'AEP Compliance Advisor'
	INNER JOIN PC.dbo.pc_user usr2
		ON usr2.CredentialID = aur2.AssignedUserID
	INNER JOIN PC.dbo.pc_contact con2
		ON con2.ID = usr2.ContactID
	)
	ON a.ID = aur2.AccountID AND aur2.retired = 0
left join pc.dbo.pctl_aeptpaagreement_acc tpaa on tpaa.id = a.AEPTPAAgreement_ACC
left join pc.dbo.pctl_aeptpanature_acc tpan on tpan.id = a.AEPTPANature_ACC
LEFT JOIN (PC.dbo.pc_contact as pca
	INNER JOIN PC.dbo.pc_accountcontact as pac ON pca.ID = pac.Contact
	INNER JOIN PC.dbo.pc_accountcontactrole as pacr ON pac.ID = pacr.AccountContact and pacr.Subtype in (2)
	) --AccountHolder
	ON a.ID = pac.Account
where a.AEPContractAccount_ACC = 1 -- just looking at AEP accounts
and act.name not in ('NamedInsured')
and ac.Retired = 0
group by
	a.AEPContractNumber_ACC
	,pca.Name
	,concat(con.FirstName,' ',con.LastName)
	,concat(con2.FirstName,' ',con2.LastName)
	,cl.NAME
	,act.NAME
	,coalesce(c.Name,concat(c.FirstName, ' ',c.LastName))
	,tpaa.NAME
	,tpan.NAME
	,c.WorkPhone
	,c.HomePhone
	,c.CellPhone
	,c.EmailAddress1
	,c.EmailAddress2
	,ad.Attention_ACC
    ,ad.AddressLine1
    ,ad.AddressLine2
    ,ad.AddressLine3
	,iif(ad.City='Unknown',null,ad.City)
    ,iif(ad.PostalCode='Unknown',null,ad.PostalCode)
    ,iif(cnty.NAME='Unknown',null,cnty.NAME)
order by a.AEPContractNumber_ACC, act.NAME