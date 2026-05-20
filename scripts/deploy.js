const hre = require("hardhat");

async function main() {
  console.log("正在部署 FlapTaxVault 金库合约...");

  // 玩法初始参数配置：每次领取 0.001 BNB，冷却时间 24 小时 (86400秒)
  const claimAmount = hre.ethers.parseEther("0.001");
  const cooldownTime = 86400;

  const vault = await hre.ethers.deployContract("FlapTaxVault", [claimAmount, cooldownTime]);
  await vault.waitForDeployment();
  
  const vaultAddress = await vault.getAddress();

  console.log(`✅ FlapTaxVault 部署成功! 合约地址: ${vaultAddress}`);
  console.log(`📌 请在 FLAP 平台发射代币时，将此地址配置为你的【税收接收地址 / Vault Address】`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});