const ethers = require("ethers");
const axios = require("axios");
const { resolveProperties } = require("@ethersproject/properties");
const { serialize } = require("@ethersproject/transactions");
const { splitSignature, hexZeroPad } = require("@ethersproject/bytes");
const { keccak256 } = require("@ethersproject/keccak256");

const local_share = require('./local-share1.json');

function getAddress() {
    return ethers.utils.computeAddress("0x" + Buffer.from(local_share.y_sum_s.point).toString("hex"))
}


const main = async () => {

  console.log(getAddress());

  // const rpcUrl = "https://rpc.ankr.com/eth_goerli";
  const rpcUrl = "http://localhost:8545";
  const provider = ethers.getDefaultProvider(rpcUrl);

  const signature = await axios.post(
    "http://localhost:8001/send-tx",
    keccak256(serializedTx).slice(2),
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );

  const parsedSigature = {
    recoveryParam: signature.data.recid,
    r: hexZeroPad(
      "0x" + Buffer.from(signature.data.r.scalar).toString("hex"),
      32
    ),
    s: hexZeroPad(
      "0x" + Buffer.from(signature.data.s.scalar).toString("hex"),
      32
    ),
  };

  const theSplitSignature = splitSignature(parsedSigature);
  const serializeTx = serialize(resolvedTx, theSplitSignature);

  console.log(ethers.utils.parseTransaction(serializeTx));
  const sentTx = await provider.sendTransaction(serializeTx);
  const rc = await sentTx.wait();
};

main();
