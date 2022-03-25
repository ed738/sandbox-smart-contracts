// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "fx-portal/contracts/tunnel/FxBaseChildTunnel.sol";
import "@openzeppelin/contracts-0.8/access/Ownable.sol";
import "@openzeppelin/contracts-0.8/security/Pausable.sol";

import "../../../common/interfaces/IPolygonAssetERC721.sol";
import "../../../common/interfaces/IERC721MandatoryTokenReceiver.sol";
import "../../../common/BaseWithStorage/ERC2771Handler.sol";

import "./PolygonAssetERC721.sol";

/// @title ASSETERC721 bridge on L2
contract PolygonAssetERC721Tunnel is
    FxBaseChildTunnel,
    IERC721MandatoryTokenReceiver,
    ERC2771Handler,
    Ownable,
    Pausable
{
    IPolygonAssetERC721 public childToken;
    uint32 public maxGasLimitOnL1;
    mapping(uint8 => uint32) public gasLimits;

    event SetGasLimit(uint8 size, uint32 limit);
    event SetMaxGasLimit(uint32 maxGasLimit);
    event Deposit(address user, uint256 id, bytes data);
    event Withdraw(address user, uint256 id, bytes data);

    function setMaxLimitOnL1(uint32 _maxGasLimit) external onlyOwner {
        maxGasLimitOnL1 = _maxGasLimit;
        emit SetMaxGasLimit(_maxGasLimit);
    }

    function _setLimit(uint8 size, uint32 limit) internal {
        gasLimits[size] = limit;
        emit SetGasLimit(size, limit);
    }

    function setLimit(uint8 size, uint32 limit) external onlyOwner {
        _setLimit(size, limit);
    }

    // setupLimits([5, 10, 20, 90, 340]);
    function setupLimits(uint32[5] memory limits) public onlyOwner {
        _setLimit(1, limits[0]);
        _setLimit(3, limits[1]);
        _setLimit(6, limits[2]);
        _setLimit(12, limits[3]);
        _setLimit(24, limits[4]);
    }

    constructor(
        address _fxChild,
        IPolygonAssetERC721 _childToken,
        address _trustedForwarder,
        uint32 _maxGasLimit,
        uint32[5] memory limits
    ) FxBaseChildTunnel(_fxChild) {
        childToken = _childToken;
        maxGasLimitOnL1 = _maxGasLimit;
        setupLimits(limits);
        __ERC2771Handler_initialize(_trustedForwarder);
    }

    function withdrawToRoot(
        address to,
        uint256 id,
        bytes memory data
    ) external whenNotPaused() {
        uint32 gasLimit = 0;
        gasLimit += gasLimits[uint8(id)];
        require(gasLimit < maxGasLimitOnL1, "Exceeds gas limit on L1.");
        // lock the child token in this contract
        childToken.safeTransferFrom(_msgSender(), address(this), id, data); // TODO: test data format
        emit Withdraw(to, id, data);
        _sendMessageToRoot(abi.encode(to, id, data));
    }

    function batchWithdrawToL1(
        address to,
        uint256[] calldata ids,
        bytes memory data
    ) external whenNotPaused() {
        uint32 gasLimit = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            gasLimit += gasLimits[uint8(ids[i])];
        }
        require(gasLimit < maxGasLimitOnL1, "Exceeds gas limit on L1.");
        for (uint256 i = 0; i < ids.length; i++) {
            // lock the child tokens in this contract
            childToken.safeTransferFrom(_msgSender(), address(this), ids[i], data); // TODO: test data format
            emit Withdraw(to, ids[i], data);
        }
        _sendMessageToRoot(abi.encode(to, ids, data));
    }

    /// @dev Change the address of the trusted forwarder for meta-TX
    /// @param trustedForwarder The new trustedForwarder
    function setTrustedForwarder(address trustedForwarder) external onlyOwner {
        _trustedForwarder = trustedForwarder;
    }

    /// @dev Pauses all token transfers across bridge
    function pause() public onlyOwner {
        _pause();
    }

    /// @dev Unpauses all token transfers across bridge
    function unpause() public onlyOwner {
        _unpause();
    }

    function _processMessageFromRoot(
        uint256, /* stateId */
        address sender,
        bytes memory data
    ) internal override validateSender(sender) {
        _syncDeposit(data);
    }

    function _syncDeposit(bytes memory syncData) internal {
        (address to, uint256 id, bytes memory data) = abi.decode(syncData, (address, uint256, bytes));
        if (!childToken.exists(id)) childToken.mint(to, id, data);
        else childToken.safeTransferFrom(address(this), to, id, data);
        emit Deposit(to, id, data);
    }

    function _msgSender() internal view override(Context, ERC2771Handler) returns (address sender) {
        return ERC2771Handler._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Handler) returns (bytes calldata) {
        return ERC2771Handler._msgData();
    }

    function onERC721Received(
        address, /* operator */
        address, /* from */
        uint256, /* tokenId */
        bytes calldata /* data */
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function onERC721BatchReceived(
        address, /* operator */
        address, /* from */
        uint256[] calldata, /* ids */
        bytes calldata /* data */
    ) external pure override returns (bytes4) {
        return this.onERC721BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x5e8bf644 || interfaceId == 0x01ffc9a7;
    }
}