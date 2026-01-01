package nz.co.acc.common.workqueueconfig

uses java.time.LocalTime

/**
 * Created by Mike Ourednik on 5/03/21.
 */
enhancement WorkQueueConfig_ACCEnhancement : WorkQueueConfig_ACC {

  property get IdleStartLocalTime() : LocalTime {
    return WorkQueueConfigUtil.toLocalTime(this.IdleStartTime)
  }

  property get IdleEndLocalTime() : LocalTime {
    return WorkQueueConfigUtil.toLocalTime(this.IdleEndTime)
  }

  property get IsCurrentlyIdle() : Boolean {
    return this.IdleEnabled and WorkQueueConfigUtil.isIdleTime(LocalTime.now(), this.IdleStartLocalTime, this.IdleEndLocalTime)
  }

  property get CurrentInstances(): Integer {
    if (this.IsCurrentlyIdle) {
      return this.IdleInstances
    } else {
      return this.Instances
    }
  }

}
