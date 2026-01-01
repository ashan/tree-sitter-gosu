package edge.capabilities.gpa.job.renewal

uses edge.di.annotations.ForAllGwNodes
uses java.lang.IllegalArgumentException

class DefaultRenewalPlugin implements IRenewalPlugin {

  @ForAllGwNodes
  construct(){}

  override function startRenewal(aPolicy: Policy): Renewal {
    if(aPolicy == null){
      throw new IllegalArgumentException("Policy must not be null.")
    }

    final var job = new Renewal()
    job.startJob(aPolicy)

    return job
  }
}
