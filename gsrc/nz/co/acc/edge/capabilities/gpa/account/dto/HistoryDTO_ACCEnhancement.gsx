package nz.co.acc.edge.capabilities.gpa.account.dto

/**
 * Created by lee.teoh on 27/06/2017.
 */
enhancement HistoryDTO_ACCEnhancement: HistoryDTO_ACC {

  static function fromHistory(history: entity.History): HistoryDTO_ACC {
    var historyDTO = new HistoryDTO_ACC()

    if (history.BCSSUser_ACC != null) {
      historyDTO.Creator = history.BCSSUser_ACC
    } else {
      historyDTO.Creator = history.User.DisplayName
    }
    historyDTO.Date = history.EventTimestamp
    historyDTO.Type = history.CustomType.DisplayName
    historyDTO.Description = history.getDescription()
    historyDTO.PolicyNumber = history.PolicyTerm.PolicyNumberDisplayString

    return historyDTO
  }
}
