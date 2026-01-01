Select a.ExtractDate, a.GroupName, a.JunoWork, a.Untouched, a.Completed, a.ReceivedToday, a.OldestDate,
DATEDIFF(DD,DATEADD(DD, (DATEPART(Weekday,a.ExtractDate) - DATEPART(Weekday,a.OldestDate)), a.OldestDate),a.ExtractDate)/7*5
+ (DATEPART(Weekday,a.ExtractDate) - DATEPART(Weekday,a.OldestDate)) + 1
+ IIf(DATEPART(Weekday,a.ExtractDate) = 7,-1,0) + IIf(DATEPART(Weekday,a.OldestDate) = 1,-1,0)  AgeInDays,
IIF(ISNULL(cd.OldestDate,CAST('1900-01-01' as date))<ISNULL(a.OldestDate,CAST('1900-01-01' as date)),'Yes',
IIF(ISNULL(cd.OldestDate,CAST('1900-01-01' as date))=ISNULL(a.OldestDate,CAST('1900-01-01' as date)),'No',NULL)) DateMoved,
IIF(DATEDIFF(DD,DATEADD(DD, (DATEPART(Weekday,a.ExtractDate) - DATEPART(Weekday,a.OldestDate)), a.OldestDate),a.ExtractDate)/7*5
+ (DATEPART(Weekday,a.ExtractDate) - DATEPART(Weekday,a.OldestDate)) + 1
+ IIf(DATEPART(Weekday,a.ExtractDate) = 7,-1,0) + IIf(DATEPART(Weekday,a.OldestDate) = 1,-1,0) > a.HigherSLA, 'red',
IIF(DATEDIFF(DD,DATEADD(DD, (DATEPART(Weekday,a.ExtractDate) - DATEPART(Weekday,a.OldestDate)), a.OldestDate),a.ExtractDate)/7*5
+ (DATEPART(Weekday,a.ExtractDate) - DATEPART(Weekday,a.OldestDate)) + 1
+ IIf(DATEPART(Weekday,a.ExtractDate) = 7,-1,0) + IIf(DATEPART(Weekday,a.OldestDate) = 1,-1,0) < a.LowerSLA, 'green', 'amber')) SLA_Color
From (
  Select ExtractDate, GroupName, JunoWork, LowerSLA, HigherSLA,
  SUM(IsOpen) Untouched, SUM(IsComplete) Completed,
  SUM(IsRcvdToday) ReceivedToday, ISNULL(MIN(CreateDate),ExtractDate) OldestDate
  From (
    Select ROW_NUMBER() OVER (PARTITION BY act.ID, grp.Name, dm.JunoWork ORDER BY dmf.SubjectFilter) IdxAct,
    GETDATE() ExtractDate, grp.Name GroupName, dm.JunoWork, dm.LowerSLA, dm.HigherSLA,
    act.ID ActivityID, xst.NAME ActivityStatus,
    IIF(xst.NAME='Open' AND aq.ID IS NOT NULL,1,0) IsOpen,
    IIF(xst.NAME='Complete' AND CAST(act.CloseDate as date)=GETDATE(),1,0) IsComplete,
    IIF(CAST(act.CreateTime as date)=GETDATE(),1,0) IsRcvdToday,
    IIF(xst.NAME='Open' AND aq.ID IS NOT NULL,CAST(act.CreateTime as date),NULL) CreateDate
    From PC.dbo.pcx_dashboardmapping_acc dm
    INNER JOIN PC.dbo.pcx_dashboardjunoworkfilter dmf ON dmf.DashboardMapping = dm.ID
    INNER JOIN PC.dbo.pc_group grp ON grp.ID = dm.GroupID
    LEFT JOIN PC.dbo.pc_activity act ON act.AssignedGroupID = dm.GroupID AND act.Subject like dmf.SubjectFilter
    LEFT JOIN PC.dbo.pc_assignqueue aq ON aq.id = act.AssignedQueueID
    LEFT JOIN PC.dbo.pctl_activitystatus xst ON xst.ID = act.Status AND xst.NAME IN ('Open','Complete')
    Where xst.NAME = 'Open' OR act.CloseDate BETWEEN DATEADD(WEEK,-6,GETDATE()) AND GETDATE()
  ) x
  Group By ExtractDate, GroupName, JunoWork, LowerSLA, HigherSLA
) a
LEFT JOIN PC.dbo.pcx_dashboardhistory_acc cd ON cd.GroupName=a.GroupName
AND cd.JunoWork=a.JunoWork AND cd.ExtractDate = DATEADD(DD,-1,a.ExtractDate)