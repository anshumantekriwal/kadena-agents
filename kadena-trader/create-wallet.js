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

// Set public and private keys as environment variables, replacing any existing values
process.env.PUBLIC_KEY = publicKey;
process.env.PRIVATE_KEY = privateKey;
