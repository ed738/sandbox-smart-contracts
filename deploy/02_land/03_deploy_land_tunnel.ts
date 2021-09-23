import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {skipUnlessTestnet} from '../../utils/network';
import {ethers} from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const Land = await deployments.get('Land');
  const FXROOT = await deployments.get('FXROOT');
  // @todo - Update correct address
  const CheckpointManager = ethers.constants.AddressZero;

  await deploy('LandTunnel', {
    from: deployer,
    contract: 'LandTunnel',
    args: [CheckpointManager, FXROOT.address, Land.address],
    log: true,
    skipIfAlreadyDeployed: true,
  });
};

export default func;
func.tags = ['LandTunnel', 'LandTunnel_deploy', 'L1'];
func.dependencies = ['Land', 'FXROOT'];
func.skip = skipUnlessTestnet;
