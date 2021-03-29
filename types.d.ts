export interface Data {
  message: string;
}

export interface Block {
  data: Data;
  previousHash: string;
  timestamp: number;
  nonce: number;
}

export interface HashedBlock extends Block {
  hash: string;
}
