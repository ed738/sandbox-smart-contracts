//SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-version
pragma solidity 0.8.2;

interface IAssetERC721Token {
    function mint(address to, uint256 id) external;

    function mint(
        address to,
        uint256 id,
        bytes calldata metaData
    ) external;

    function burnFrom(address from, uint256 id) external;

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public;

    function exists(uint256 tokenId) external view override returns (bool);
}
