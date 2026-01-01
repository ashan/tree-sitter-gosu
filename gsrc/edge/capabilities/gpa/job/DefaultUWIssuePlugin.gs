package edge.capabilities.gpa.job

uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.gpa.job.dto.UWIssueDTO
uses java.util.HashMap
uses java.util.ArrayList
uses edge.capabilities.gpa.job.dto.UWIssueOfferingStatusDTO

class DefaultUWIssuePlugin implements IUWIssuePlugin {

  @ForAllGwNodes
  construct() {
  }

  override function toDTO(aUWIssue: UWIssue): UWIssueDTO {
    final var dto = new UWIssueDTO()
    dto.ShortDescription = aUWIssue.ShortDescription
    dto.LongDescription = aUWIssue.LongDescription
    dto.ApprovalBlockingPoint = aUWIssue.ApprovalBlockingPoint
    dto.CurrentBlockingPoint = aUWIssue.CurrentBlockingPoint
    dto.HasApprovalOrRejection = aUWIssue.HasApprovalOrRejection

    return dto
  }

  override function toDTOArray(uwIssues: UWIssue[]): UWIssueDTO[] {
    if (uwIssues != null && uwIssues.HasElements){
      return uwIssues.map(\uwIssue -> toDTO(uwIssue))
    }

    return new UWIssueDTO[]{}
  }

  override function toDTOArray(aJob: Job): UWIssueDTO[] {
    var dtos = new ArrayList<UWIssueDTO>()
    var uwIssues = getUWIssuesGroupedByOfferings(aJob)

    if (uwIssues != null && !uwIssues.Empty) {
      uwIssues.eachKeyAndValue( \ uwIssue, offerings -> {
        var dto = toDTO(uwIssue)
        dto.OnOfferings = mapUWIssueOfferingDTOs(offerings)
        dto.Offerings = aJob.ActivePeriods*.BranchName
        dtos.add(dto)
      })
    }

    return dtos.toTypedArray()
  }

  protected function getUWIssuesGroupedByOfferings(aJob : Job) : HashMap<UWIssue, HashMap<String, UWIssueDTO>> {
    var uwIssues = new HashMap<UWIssue, HashMap<String, UWIssueDTO>>()
    var authProfiles = User.util.CurrentUser.UWAuthorityProfiles

    aJob.ActivePeriods.each( \ period -> {
      period.UWIssuesActiveOnly.viewableToUserWithProfiles(authProfiles).each(\ uwIssue -> {
        var key = uwIssues.Keys.firstWhere( \ uwIssueKey -> {
          return uwIssueKey.IssueKey.contentEquals(uwIssue.IssueKey) && uwIssueKey.ShortDescription.contentEquals(uwIssue.ShortDescription)
        })

        if(key != null) {
          uwIssues.get(key).put(period.BranchName, toDTO(uwIssue))
        } else {
          var periodMap = new HashMap<String, UWIssueDTO>()
          periodMap.put(period.BranchName, toDTO(uwIssue))
          uwIssues.put(uwIssue, periodMap)
        }
      })
      // If UW does not exist on an offering, we want that offering to be marked as N/A in the UI
      uwIssues.eachValue( \ offeringsMap -> {
        if(!offeringsMap.containsKey(period.BranchName)) {
          offeringsMap.put(period.BranchName, null)
        }
      })
    })

    return uwIssues
  }

  protected function mapUWIssueOfferingDTOs(offerings : HashMap<String, UWIssueDTO>) : UWIssueOfferingStatusDTO[] {
    var offeringDTOs = new ArrayList<UWIssueOfferingStatusDTO>()
    offerings.eachKeyAndValue( \ offering, uwIssueDTO -> {
      var offeringDTO = new UWIssueOfferingStatusDTO()
      offeringDTO.Offering = offering
      offeringDTO.CurrentBlockingPoint = uwIssueDTO.CurrentBlockingPoint
      offeringDTO.HasApprovalOrRejection = uwIssueDTO.HasApprovalOrRejection
      offeringDTOs.add(offeringDTO)
    })

    return offeringDTOs.toTypedArray()
  }

}
