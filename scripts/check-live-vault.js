import hre from "hardhat";

const VAULT_ADDRESS = "0xD6429d7E7bd1cAD3e8Cc6A0e19D475A03E31aFdB";
const TOKEN_ADDRESS = "0xa7a453a4c88fac68fc82eff6ef5fe8f8cc4e7777";

const vaultAbi = [
  "function owner() view returns (address)",
  "function taxToken() view returns (address)",
  "function description() view returns (string)",
  "function blindBoxPool() view returns (uint256)",
  "function accumulatedBnbTax() view returns (uint256)",
  "function lastDistributionTime() view returns (uint256)",
  "function seats(uint256) view returns (address owner,uint256 currentPrice,uint256 paidAmount,uint256 occupyTime,uint256 baseWeight,uint256 tempBuffWeight,uint256 tempBuffExpiry,uint256 lastWeightUpdate)",
  "function players(address) view returns (uint256 seatIdPlusOne,uint256 permBuffWeight,uint256 activeDiscount,uint256 pendingBNB,uint256 unclaimedNTM)"
];

const erc20Abi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)"
];

function fmtBnb(v) {
  return hre.ethers.formatEther(v);
}

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const user = signer.address;

  const vault = await hre.ethers.getContractAt(vaultAbi, VAULT_ADDRESS);
  const token = await hre.ethers.getContractAt(erc20Abi, TOKEN_ADDRESS);

  console.log("=== 基础信息 ===");
  console.log("当前测试钱包:", user);
  console.log("Vault:", VAULT_ADDRESS);
  console.log("Token:", TOKEN_ADDRESS);

  const [owner, taxTokenAddr, desc, blindBoxPool, accumulatedBnbTax, lastDistributionTime] =
    await Promise.all([
      vault.owner(),
      vault.taxToken(),
      vault.description(),
      vault.blindBoxPool(),
      vault.accumulatedBnbTax(),
      vault.lastDistributionTime()
    ]);

  const [name, symbol, decimals, userTokenBalance, vaultTokenBalance, vaultBnbBalance] =
    await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
      token.balanceOf(user),
      token.balanceOf(VAULT_ADDRESS),
      hre.ethers.provider.getBalance(VAULT_ADDRESS)
    ]);

  console.log("\n=== Vault 状态 ===");
  console.log("owner:", owner);
  console.log("taxToken():", taxTokenAddr);
  console.log("description():", desc);
  console.log("blindBoxPool:", hre.ethers.formatUnits(blindBoxPool, decimals), symbol);
  console.log("accumulatedBnbTax:", fmtBnb(accumulatedBnbTax), "BNB");
  console.log("vault BNB balance:", fmtBnb(vaultBnbBalance), "BNB");
  console.log("lastDistributionTime:", Number(lastDistributionTime));

  console.log("\n=== Token 状态 ===");
  console.log("name:", name);
  console.log("symbol:", symbol);
  console.log("decimals:", decimals);
  console.log("当前钱包代币余额:", hre.ethers.formatUnits(userTokenBalance, decimals), symbol);
  console.log("Vault 持有代币余额:", hre.ethers.formatUnits(vaultTokenBalance, decimals), symbol);

  console.log("\n=== 抽样检查战位 ===");
  for (const seatId of [0, 9, 10, 39, 40, 99]) {
    const seat = await vault.seats(seatId);
    console.log(
      `seat ${seatId}: owner=${seat.owner}, currentPrice=${hre.ethers.formatUnits(seat.currentPrice, decimals)} ${symbol}, baseWeight=${seat.baseWeight}`
    );
  }

  console.log("\n=== 当前钱包玩家状态 ===");
  const player = await vault.players(user);
  console.log("seatIdPlusOne:", Number(player.seatIdPlusOne));
  console.log("permBuffWeight:", Number(player.permBuffWeight));
  console.log("activeDiscount:", Number(player.activeDiscount));
  console.log("pendingBNB:", fmtBnb(player.pendingBNB), "BNB");
  console.log("unclaimedNTM:", hre.ethers.formatUnits(player.unclaimedNTM, decimals), symbol);

  console.log("\n=== 核对结果 ===");
  console.log("1. taxToken 是否等于你的代币地址:", taxTokenAddr.toLowerCase() === TOKEN_ADDRESS.toLowerCase());
  console.log("2. Vault 是否有 BNB:", vaultBnbBalance > 0n);
  console.log("3. 当前钱包是否有代币可用于后续交互:", userTokenBalance > 0n);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});