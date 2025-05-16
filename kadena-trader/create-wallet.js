import {
  kadenaGenKeypairFromSeed,
  kadenaMnemonicToSeed,
  kadenaGenMnemonic,
} from "@kadena/hd-wallet";

const password = "anshuman";

const mnemonic = kadenaGenMnemonic();
const seed = await kadenaMnemonicToSeed(password, mnemonic);

const [publicKey, privateKey] = await kadenaGenKeypairFromSeed(
  password,
  seed,
  0
);
