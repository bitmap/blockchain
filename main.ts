import * as log from "https://deno.land/std@0.89.0/log/mod.ts";
import { createHash } from "https://deno.land/std@0.89.0/hash/mod.ts";
import { done, interpret, more, Trampoline } from "./_util/trampoline.ts";
import { Data, Block, HashedBlock } from "./types.d.ts"


function computeHash({ previousHash, timestamp, data, nonce }: Block) {
  const hash = createHash("sha256");
  hash.update(previousHash + timestamp + JSON.stringify(data) + nonce);
  return hash.toString();
}

function checkDifficulty(difficulty: number, hash: string): boolean {
  console.log(hash)
  return hash.substr(0, difficulty) === "0".repeat(difficulty);
}

function updateHash(block: Block): HashedBlock {
  const hash = computeHash(block);
  return { ...block, hash };
}

function nextNonce(block: Block): HashedBlock {
  return updateHash({ ...block, nonce: block.nonce + 1 });
}

function mineBlock(difficulty: number, block: Block): Trampoline<HashedBlock> {
  function mine(block: Block): Trampoline<HashedBlock> {
    const newBlock = nextNonce(block);
    return checkDifficulty(difficulty, newBlock.hash)
      ? done(newBlock)
      : more(() => mine(nextNonce(block)));
  }

  return mine(nextNonce(block));
}

function validateChain(chain: Map<number, HashedBlock>): Trampoline<boolean> {
  function validate(chain: Map<number, HashedBlock>, index: number): Trampoline<boolean> {

    if (index === 0) {
      return done(true);
    }

    const currentBlock = chain.get(index + 1);
    const previousBlock = chain.get(index);

    if (currentBlock) {
      const { hash, ...block } = currentBlock;

      const isValidHash = (hash && hash === computeHash(block));
      const isPreviousHashValid = (currentBlock?.previousHash === previousBlock?.hash);
      const isValidChain = (isValidHash && isPreviousHashValid);

      if (!isValidChain) {
        return done(false);
      }
    }

    return more(() => validate(chain, index - 1));
  }

  return validate(chain, chain.size);
}

export function generateGenesisBlock(): HashedBlock {
  const block: Block = {
    previousHash: "0",
    timestamp: +new Date(),
    data: {
      message: "Hello",
    },
    nonce: 0,
  };

  return {
    ...block,
    hash: computeHash(block),
  };
}

export function addBlock(chain: Map<number, HashedBlock>, data: Data): Map<number, HashedBlock> {
  const previousBlock = chain.get(chain.size);

  if (previousBlock) {
    const { hash: previousHash } = previousBlock

    const block: Block = {
      previousHash,
      timestamp: +new Date(),
      data,
      nonce: 0,
    };

    const hashedBlock = interpret(mineBlock)(4, block);
    const isValidBlockchain = interpret(validateChain)(chain);

    if (isValidBlockchain) {
      return chain.set(chain.size + 1, hashedBlock);
    }
  }

  log.error('Could not be validated, returning previous chain...');
  return chain
}

const blockchain: Map<number, HashedBlock> = new Map();

blockchain.set(1, generateGenesisBlock())

addBlock(blockchain, {
  message: "Hola"
});

addBlock(blockchain, {
  message: "Bounjour"
});

addBlock(blockchain, {
  message: "こんにちは"
});

console.log(blockchain);
