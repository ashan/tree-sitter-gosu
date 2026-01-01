package edge.capabilities.gpa.job.submission.dto
uses edge.capabilities.document.dto.DocumentBaseDTO
uses edge.jsonmapper.JsonProperty

class JobDocumentDTO {

  //    @JsonProperty
//      var _accountNumber : String as AccountNumber

      @JsonProperty
      var _level : String as Level

      @JsonProperty
      var _canDelete : Boolean as CanDelete

    }
