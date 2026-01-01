package nz.co.acc.integration.ir.inbound.transformer

interface IRFile {
  property get Header() : IRFileHeaderRecord

  property get Records() : ArrayList<IRFileRecord>
  
  property get FilePath(): String
}