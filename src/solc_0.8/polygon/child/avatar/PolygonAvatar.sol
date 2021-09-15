//SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-version
pragma solidity 0.8.2;

import {PolygonAvatarStorage} from "./PolygonAvatarStorage.sol";
import {IAvatarMinter} from "../../../common/interfaces/IAvatarMinter.sol";

/// @title This contract is a erc 721 compatible NFT token that represents an avatar and can be minted by a minter role.
/// @dev This contract support meta transactions.
/// @dev This contract is final, don't inherit form it.
contract PolygonAvatar is PolygonAvatarStorage, IAvatarMinter {
    function initialize(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        address trustedForwarder_,
        address defaultAdmin_,
        address storageChanger_
    ) external initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __AccessControl_init_unchained();
        __UpgradeableBase_init_unchained(defaultAdmin_, storageChanger_);
        __ERC721_init_unchained(name_, symbol_);
        __ERC2771Handler_initialize(trustedForwarder_);
        baseTokenURI = baseTokenURI_;
    }

    /**
     * @dev Creates a new token for `to`. Its token ID will be automatically
     * assigned (and available on the emitted {IERC721-Transfer} event), and the token
     * URI autogenerated based on the base URI passed at construction.
     *
     * See {ERC721-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint256 id) external override {
        require(hasRole(MINTER_ROLE, _msgSender()), "must have minter role");
        // TODO: we want call the callback for this one _safeMint ?
        _mint(to, id);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }
}
