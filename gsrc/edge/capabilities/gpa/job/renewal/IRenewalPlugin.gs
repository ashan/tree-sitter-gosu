package edge.capabilities.gpa.job.renewal

interface IRenewalPlugin {

  public function startRenewal(aPolicy : Policy) : Renewal

}
