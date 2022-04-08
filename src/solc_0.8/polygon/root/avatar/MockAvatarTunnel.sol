// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import {AvatarTunnel} from "./AvatarTunnel.sol";
import {IMintableERC721} from "../../../common/interfaces/@maticnetwork/pos-portal/root/RootToken/IMintableERC721.sol";

contract MockAvatarTunnel is AvatarTunnel {
    constructor(
        address _checkpointManager,
        address _fxRoot,
        IMintableERC721 _rootAvatarToken,
        address _trustedForwarder
    ) AvatarTunnel(_checkpointManager, _fxRoot, _rootAvatarToken, _trustedForwarder) {}

    function processMessageFromChild(bytes memory message) external {
        _processMessageFromChild(message);
    }
}
