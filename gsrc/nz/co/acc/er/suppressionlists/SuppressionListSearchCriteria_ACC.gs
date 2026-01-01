package nz.co.acc.er.suppressionlists

uses java.io.Serializable

class SuppressionListSearchCriteria_ACC implements Serializable{

  private var _businessGroupIdField : Integer as BusinessGroupIdField

  private var _accPolicyIdField : String as AccPolicyIdField

  private var _levyNameField : String as LevyNameField

}