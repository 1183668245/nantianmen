import hre from "hardhat";

async function main() {
  console.log("开始部署 Vault 实现合约和 Factory 合约...");

  // 1. 部署 Vault 实现合约（给 Clones 使用）
  const vaultImpl = await hre.ethers.deployContract("FlapTaxVault");
  await vaultImpl.waitForDeployment();
  const implementationAddress = await vaultImpl.getAddress();

  console.log("Vault 实现合约部署成功：", implementationAddress);

  // 2. 部署 Factory 合约
  const factory = await hre.ethers.deployContract("FlapTaxVaultFactory", [implementationAddress]);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("Factory 合约部署成功：", factoryAddress);
  console.log("请在 FLAP 平台 Launch Token -> Custom Vault 中填写这个 Factory 地址。");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});