import hre from "hardhat";

const VAULT_ADDRESS = "0xD6429d7E7bd1cAD3e8Cc6A0e19D475A03E31aFdB";
const TOKEN_ADDRESS = "0xa7a453a4c88fac68fc82eff6ef5fe8f8cc4e7777";

const vaultAbi = [
  "function takeSeat(uint256 id) external",
  "function buyBlindBox() external",
  "function claim() external",
  "function triggerBnbDistribution() external",
  "function players(address) view returns (uint256 seatIdPlusOne,uint256 permBuffWeight,uint256 activeDiscount,uint256 pendingBNB,uint256 unclaimedNTM)",
  "function seats(uint256) view returns (address owner,uint256 currentPrice,uint256 paidAmount,uint256 occupyTime,uint256 baseWeight,uint256 tempBuffWeight,uint256 tempBuffExpiry,uint256 lastWeightUpdate)",
  "function accumulatedBnbTax() view returns (uint256)",
  "function backpackTokenRewards(address) view returns (uint256)"
];

const erc20Abi = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address spender,uint256 amount) external returns (bool)",
  "function balanceOf(address) view returns (uint256)"
];

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const user = signer.address;

  const vault = await hre.ethers.getContractAt(vaultAbi, VAULT_ADDRESS);
  const token = await hre.ethers.getContractAt(erc20Abi, TOKEN_ADDRESS);

  const symbol = await token.symbol();
  const decimals = await token.decimals();

  console.log("=== 当前钱包 ===");
  console.log(user);

  console.log("\n=== 第一步：检查并授权 ===");
  const approveAmount = hre.ethers.parseUnits("2000000", decimals); // 足够抢 100万席位+盲盒
  const allowance = await token.allowance(user, VAULT_ADDRESS);
  console.log("当前 allowance:", hre.ethers.formatUnits(allowance, decimals), symbol);

  if (allowance < approveAmount) {
    const tx = await token.approve(VAULT_ADDRESS, approveAmount);
    console.log("approve tx:", tx.hash);
    await tx.wait();
    console.log("授权完成");
  } else {
    console.log("授权已足够，跳过");
  }

  console.log("\n=== 第二步：尝试抢占 40 号位 ===");
  try {
    const seatBefore = await vault.seats(40);
    console.log("抢位前 owner:", seatBefore.owner);
    console.log("抢位前价格:", hre.ethers.formatUnits(seatBefore.currentPrice, decimals), symbol);

    const tx = await vault.takeSeat(40);
    console.log("takeSeat tx:", tx.hash);
    await tx.wait();

    const seatAfter = await vault.seats(40);
    const player = await vault.players(user);

    console.log("抢位后 owner:", seatAfter.owner);
    console.log("抢位后价格:", hre.ethers.formatUnits(seatAfter.currentPrice, decimals), symbol);
    console.log("我的 seatIdPlusOne:", Number(player.seatIdPlusOne));
  } catch (e) {
    console.log("takeSeat 失败：", e.shortMessage || e.message);
  }

  console.log("\n=== 第三步：尝试购买盲盒 ===");
  try {
    const tx = await vault.buyBlindBox();
    console.log("buyBlindBox tx:", tx.hash);
    await tx.wait();

    const backpack = await vault.backpackTokenRewards(user);
    console.log("背包代币奖励:", hre.ethers.formatUnits(backpack, decimals), symbol);
  } catch (e) {
    console.log("buyBlindBox 失败：", e.shortMessage || e.message);
  }

  console.log("\n=== 第四步：查看是否可触发分红 ===");
  try {
    const acc = await vault.accumulatedBnbTax();
    console.log("accumulatedBnbTax:", hre.ethers.formatEther(acc), "BNB");

    const tx = await vault.triggerBnbDistribution();
    console.log("triggerBnbDistribution tx:", tx.hash);
    await tx.wait();

    const player = await vault.players(user);
    console.log("pendingBNB:", hre.ethers.formatEther(player.pendingBNB), "BNB");
  } catch (e) {
    console.log("triggerBnbDistribution 失败：", e.shortMessage || e.message);
  }

  console.log("\n=== 第五步：尝试领取 ===");
  try {
    const before = await hre.ethers.provider.getBalance(user);
    const tx = await vault.claim();
    console.log("claim tx:", tx.hash);
    const rc = await tx.wait();
    const after = await hre.ethers.provider.getBalance(user);

    console.log("领取前 BNB:", hre.ethers.formatEther(before));
    console.log("领取后 BNB:", hre.ethers.formatEther(after));
    console.log("gasUsed:", rc.gasUsed.toString());
  } catch (e) {
    console.log("claim 失败：", e.shortMessage || e.message);
  }

  console.log("\n=== 最终状态 ===");
  const player = await vault.players(user);
  const seat = await vault.seats(40);
  const tokenBal = await token.balanceOf(user);

  console.log("seat 40 owner:", seat.owner);
  console.log("我的 seatIdPlusOne:", Number(player.seatIdPlusOne));
  console.log("我的 pendingBNB:", hre.ethers.formatEther(player.pendingBNB), "BNB");
  console.log("我的 unclaimedNTM:", hre.ethers.formatUnits(player.unclaimedNTM, decimals), symbol);
  console.log("我的代币余额:", hre.ethers.formatUnits(tokenBal, decimals), symbol);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});