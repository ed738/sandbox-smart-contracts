import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments} = hre;
  const {execute, read} = deployments;

<<<<<<< HEAD
  const AssetUpgrader = await deployments.get('PolygonAssetUpgrader');

  const isAssetUpgraderSandSuperOperator = await read(
    'PolygonSand',
=======
  const AssetUpgrader = await deployments.get('AssetUpgrader');

  const isAssetUpgraderSandSuperOperator = await read(
    'Sand',
>>>>>>> e1ae78b592945b1030300697087b4af58128b48f
    'isSuperOperator',
    AssetUpgrader.address
  );

  if (!isAssetUpgraderSandSuperOperator) {
    const currentAdmin = await read('Sand', 'getAdmin');
    await execute(
      'PolygonSand',
      {from: currentAdmin, log: true},
      'setSuperOperator',
      AssetUpgrader.address,
      true
    );
  }

  const isAssetUpgraderGemsCatalystsRegistrySuperOperator = await read(
    'PolygonGemsCatalystsRegistry',
    'isSuperOperator',
    AssetUpgrader.address
  );

  if (!isAssetUpgraderGemsCatalystsRegistrySuperOperator) {
    const currentAdmin = await read('PolygonGemsCatalystsRegistry', 'getAdmin');
    await execute(
      'PolygonGemsCatalystsRegistry',
      {from: currentAdmin, log: true},
      'setSuperOperator',
      AssetUpgrader.address,
      true
    );
  }
};
export default func;
func.tags = ['PolygonAssetUpgrader', 'PolygonAssetUpgrader_setup', 'L2'];
func.dependencies = [
  'PolygonAssetUpgrader_deploy',
  'PolygonSand_deploy',
  'PolygonGemsCatalystsRegistry_deploy',
];
