//SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import {ERC721} from "@openzeppelin/contracts-0.8/token/ERC721/ERC721.sol";
import "../common/interfaces/@maticnetwork/pos-portal/root/RootToken/IMintableERC721.sol";

/// @dev This is NOT a secure ERC721
/// DO NOT USE in production.
contract ERC721Mintable is ERC721, IMintableERC721 {
    mapping(address => uint256) public fakeBalance;

    // solhint-disable-next-line no-empty-blocks
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mint(address to, uint256 tokenId) external override {
        _mint(to, tokenId);
    }

    // just testing, ignore metadata.
    function mint(
        address user,
        uint256 tokenId,
        bytes calldata metaData
    ) external override {
        _mint(user, tokenId);
    }

    function exists(uint256 tokenId) external view override returns (bool) {
        return _exists(tokenId);
    }

    function balanceOf(address owner) public view override returns (uint256) {
        if (fakeBalance[owner] != 0) {
            return fakeBalance[owner];
        }
        return ERC721.balanceOf(owner);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IMintableERC721) {
        ERC721.safeTransferFrom(from, to, tokenId);
    }

    function setFakeBalance(address owner, uint256 balance) external {
        fakeBalance[owner] = balance;
    }
}
