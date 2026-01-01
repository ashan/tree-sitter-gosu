package nz.co.acc.integration.instruction.record

/**
 * Created by Mike Ourednik on 6/02/2021.
 */
interface InstructionRecord {
  property get ACCID(): String
  property get InstructionType(): InstructionType_ACC
  property get InstructionSource(): InstructionSource_ACC
}