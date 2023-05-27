# Multi-party ECDSA for EVM transaction

## Introdutcion
![backend tss](https://user-images.githubusercontent.com/23033847/210301775-f091faa9-ef02-451b-b515-a9b9f36a627b.jpeg)

4 components

1. Node.js client
   1. parse the tx data and send it to client Rust server
   1. get the response and send_rawTransaction
1. client Rust server
   1. send the tx data to service Rust server
   1. talk to state machine manager server to start the signing process
   1. return the signature value as response to Node.js server
1. service Rust server
   1. take the tx data and talk to state machine manager to complete the signature
1. state machine manager server

## How to send transaction

1. at the root directory of the repo, start the servers for last 3 items above (in different terminals)
   1. `cargo run --example client`
   2. `cargo run --example server`
   3. `cargo run --example gg20_sm_manager`
2. open a new terminal, cd into `examples/` and run `node sendTx.cjs`
   1. configure tx data in `sendTx.cjs` if needed

# Multi-party ECDSA

[![Build Status](https://travis-ci.com/ZenGo-X/multi-party-ecdsa.svg?branch=master)](https://travis-ci.com/zengo-x/multi-party-ecdsa)
[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

This project is a Rust implementation of {t,n}-threshold ECDSA (elliptic curve digital signature algorithm).

Threshold ECDSA includes two protocols:

- Key Generation for creating secret shares.
- Signing for using the secret shares to generate a signature.

ECDSA is used extensively for crypto-currencies such as Bitcoin, Ethereum (secp256k1 curve), NEO (NIST P-256 curve) and much more.
This library can be used to create MultiSig and ThresholdSig crypto wallet. For a full background on threshold signatures please read our Binance academy article [Threshold Signatures Explained](https://www.binance.vision/security/threshold-signatures-explained).

## Library Introduction

The library was built with four core design principles in mind:

1. Multi-protocol support
2. Built for cryptography engineers
3. Foolproof
4. Black box use of cryptographic primitives

To learn about the core principles as well as on the [audit](https://github.com/KZen-networks/multi-party-ecdsa/tree/master/audits) process and security of the library, please read our [Intro to multiparty ecdsa library](https://zengo.com/introducing-multi-party-ecdsa-library/) blog post.

## Use It

The library implements four different protocols for threshold ECDSA. The protocols presents different tradeoffs in terms of parameters, security assumptions and efficiency.

| Protocol                                                                         | High Level code                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lindell 17 [1]                                                                   | [Gotham-city](https://github.com/KZen-networks/gotham-city) (accepted to [CIW19](https://ifca.ai/fc19/ciw/program.html)) is a two party bitcoin wallet, including benchmarks. [KMS](https://github.com/KZen-networks/kms-secp256k1) is a Rust wrapper library that implements a general purpose two party key management system. [thresh-sig-js](https://github.com/KZen-networks/thresh-sig-js) is a Javascript SDK |
| Gennaro, Goldfeder 19 [2] ([video](https://www.youtube.com/watch?v=PdfDZIwuZm0)) | [tss-ecdsa-cli](https://github.com/cryptochill/tss-ecdsa-cli) is a wrapper CLI for full threshold access structure, including network and threshold HD keys ([BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)). See [Demo](https://github.com/KZen-networks/multi-party-ecdsa#run-demo) in this library to get better low level understanding                                                 |
| Castagnos et. al. 19 [3]                                                         | Currently enabled as a feature in this library. To Enable, build with `--features=cclst`. to Test, use `cargo test --features=cclst -- --test-threads=1`                                                                                                                                                                                                                                                             |
| Gennaro, Goldfeder 20 [4]                                                        | A full threshold protocol that supports identifying malicious parties. If signing fails - a list of malicious parties is returned. The protocol requires only a broadcast channel (all messages are broadcasted)                                                                                                                                                                                                     |

## Run GG20 Demo

In the following steps we will generate 2-of-3 threshold signing key and sign a message with 2 parties.

### Setup

1. You need [Rust](https://rustup.rs/) and [GMP library](https://gmplib.org) (optionally) to be installed on your computer.
2. - Run `cargo build --release --examples`
   - Don't have GMP installed? Use this command instead:
     ```bash
     cargo build --release --examples --no-default-features --features curv-kzen/num-bigint
     ```
     But keep in mind that it will be less efficient.

   Either of commands will produce binaries into `./target/release/examples/` folder.

3. `cd ./target/release/examples/`

### Start an SM server

`./gg20_sm_manager`

That will start an HTTP server on `http://127.0.0.1:8000`. Other parties will use that server in order to communicate with
each other. Note that communication channels are neither encrypted nor authenticated. In production, you must encrypt and
authenticate parties messages.

### Run Keygen

Open 3 terminal tabs for each party. Run:

1. `./gg20_keygen -t 1 -n 3 -i 1 --output local-share1.json`
2. `./gg20_keygen -t 1 -n 3 -i 2 --output local-share2.json`
3. `./gg20_keygen -t 1 -n 3 -i 3 --output local-share3.json`

Each command corresponds to one party. Once keygen is completed, you'll have 3 new files:
`local-share1.json`, `local-share2.json`, `local-share3.json` corresponding to local secret
share of each party.

### Run Signing

Since we use 2-of-3 scheme (`t=1 n=3`), any two parties can sign a message. Run:

1. `./gg20_signing -p 1,2 -d "hello" -l local-share1.json`
2. `./gg20_signing -p 1,2 -d "hello" -l local-share2.json`

Each party will produce a resulting signature. `-p 1,2` specifies indexes of parties
who attends in signing (each party has an associated index given at keygen, see argument
`-i`), `-l file.json` sets a path to a file with secret local share, and `-d "hello"`
is a message being signed.

### Running Demo on different computers

While previous steps show how to run keygen & signing on local computer, you actually can
run each party on dedicated machine. To do this, you should ensure that parties can reach
SM Server, and specify its address via command line argument, eg:

`./gg20_keygen --address http://10.0.1.9:8000/ ...`


## References

[1] <https://eprint.iacr.org/2017/552.pdf>

[2] <https://eprint.iacr.org/2019/114.pdf>

[3] <https://eprint.iacr.org/2019/503.pdf>

[4] <https://eprint.iacr.org/2020/540.pdf>
