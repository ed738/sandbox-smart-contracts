import {
  ethers,
  deployments,
  getUnnamedAccounts,
  getNamedAccounts,
} from 'hardhat';

type Options = {
  fee10000th?: number;
};

export const setupTestAuction = deployments.createFixture(async function (
  hre,
  options?: Options
) {
  const {fee10000th} = options || {};
  const {deployer, assetAdmin} = await getNamedAccounts();
  const others = await getUnnamedAccounts();

  const initialMetaTx = others[0];
  const feeCollector = others[2];

  await deployments.fixture(['Asset']);
  const assetContract = await ethers.getContract('Asset');

  await deployments.deploy('AssetSignedAuction', {
    from: deployer,
    args: [
      assetContract.address,
      assetAdmin,
      initialMetaTx,
      feeCollector,
      fee10000th,
    ],
  });

  const assetSignedAuctionContract = await ethers.getContract(
    'AssetSignedAuction'
  );

  return {
    assetSignedAuctionContract1: assetSignedAuctionContract,
    assetContract1: assetContract,
    others1: others,
  };
});
