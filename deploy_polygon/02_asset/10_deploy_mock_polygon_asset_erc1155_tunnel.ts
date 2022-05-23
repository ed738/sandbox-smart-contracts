import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {skipUnlessTest} from '../../utils/network';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const PolygonAssetERC1155 = await deployments.get('PolygonAssetERC1155');
  const FXCHILD = await deployments.get('FXCHILD');
  const TRUSTED_FORWARDER = await deployments.get('TRUSTED_FORWARDER');
  const maxTransferLimit = 20;

  await deploy('MockPolygonAssetERC1155Tunnel', {
    from: deployer,
    contract: 'MockPolygonAssetERC1155Tunnel',
    args: [
      FXCHILD.address,
      PolygonAssetERC1155.address,
      TRUSTED_FORWARDER.address,
      maxTransferLimit,
    ],
    log: true,
    skipIfAlreadyDeployed: true,
    // gasLimit: 600000000000,
  });
};

export default func;
func.tags = [
  'MockPolygonAssetERC1155Tunnel',
  'MockPolygonAssetERC1155Tunnel_deploy',
];
func.dependencies = [
  'PolygonAssetERC1155',
  'FXCHILD',
  'CHECKPOINTMANAGER',
  'TRUSTED_FORWARDER',
];
func.skip = skipUnlessTest;
