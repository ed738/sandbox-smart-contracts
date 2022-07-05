//SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IAccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {ILandToken} from "../common/interfaces/ILandToken.sol";
import {IERC721MandatoryTokenReceiver} from "../common/interfaces/IERC721MandatoryTokenReceiver.sol";
import {ERC721BaseToken} from "../common/BaseWithStorage/ERC721BaseToken.sol";
import {TileWithCoordLib} from "../common/Libraries/TileWithCoordLib.sol";
import {MapLib} from "../common/Libraries/MapLib.sol";
import {IEstateToken} from "../common/interfaces/IEstateToken.sol";
import {EstateTokenIdHelperLib} from "./EstateTokenIdHelperLib.sol";
import {BaseERC721Upgradeable} from "../common/Base/BaseERC721Upgradeable.sol";

/// @dev Base contract for estate contract on L1 and L2, it uses tile maps to save the landTileSet
abstract contract EstateBaseToken is BaseERC721Upgradeable, IEstateToken {
    using MapLib for MapLib.Map;
    using EstateTokenIdHelperLib for uint256;

    struct Estate {
        // current estateId, for the same storageId we have only one valid estateId
        uint256 id;
        // estate lands tile set.
        MapLib.Map land;
    }

    struct EstateBaseTokenStorage {
        address landToken;
        uint64 nextId; // max uint64 = 18,446,744,073,709,551,615
        uint16 chainIndex;
        string baseUri;
        // storageId -> estateData
        mapping(uint256 => Estate) estate;
    }

    uint256[50] private __preGap;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @dev Emitted when an estate is updated.
    /// @param estateId The id of the newly minted token.
    /// @param lands initial quads of lands to add
    event EstateTokenCreated(uint256 indexed estateId, uint256[][3] lands);

    /// @dev Emitted when lands are added to the estate.
    /// @param estateId The id of the previous erc721 ESTATE token.
    /// @param newId The id of the newly minted token.
    /// @param lands The quads of lands added to the estate.
    event EstateTokenLandsAdded(uint256 indexed estateId, uint256 indexed newId, uint256[][3] lands);

    event EstateTokenMinted(uint256 indexed estateId, TileWithCoordLib.TileWithCoord[] tiles);
    event EstateBurned(uint256 indexed estateId);

    function initV1(
        address trustedForwarder,
        address admin,
        address landToken_,
        uint16 chainIndex_,
        string calldata name_,
        string calldata symbol_
    ) external initializer {
        __ERC2771Context_init_unchained(trustedForwarder);
        __ERC721_init_unchained(name_, symbol_);
        __EstateBaseERC721_init_unchained(admin);
        __EstateBaseToken_init_unchained(landToken_, chainIndex_);
    }

    function __EstateBaseToken_init_unchained(address landToken_, uint16 chainIndex_) internal onlyInitializing {
        _s().landToken = landToken_;
        _s().chainIndex = chainIndex_;
    }

    /// @notice Create a new estate token with lands.
    /// @param landToAdd The set of quads to add.
    function create(uint256[][3] calldata landToAdd) external virtual returns (uint256 estateId) {
        Estate storage estate = _mintEstate(_msgSender());
        _addLand(estate, _msgSender(), landToAdd);
        require(estate.land.isAdjacent(), "not adjacent");
        emit EstateTokenCreated(estate.id, landToAdd);
        return estate.id;
    }

    function addLand(uint256 oldId, uint256[][3] calldata landToAdd) external virtual returns (uint256) {
        require(_isApprovedOrOwner(_msgSender(), oldId), "caller is not owner nor approved");
        Estate storage estate = _estate(oldId);
        // we can optimize when adding only one quad
        // The risk with this optimizations is that you keep adding lands but then you cannot remove because
        // the removal check is the expensive one.
        if (landToAdd[0].length == 1) {
            // check that the quad is adjacent before adding
            require(estate.land.isAdjacent(landToAdd[1][0], landToAdd[2][0], landToAdd[0][0]), "not adjacent");
            _addLand(estate, _msgSender(), landToAdd);
        } else {
            // add everything then make the heavier check of the result
            _addLand(estate, _msgSender(), landToAdd);
            require(estate.land.isAdjacent(), "not adjacent");
        }
        estate.id = _incrementTokenVersion(estate.id);
        emit EstateTokenLandsAdded(oldId, estate.id, landToAdd);
        return estate.id;
    }

    // Used by the bridge
    function mintEstate(address from, TileWithCoordLib.TileWithCoord[] calldata tiles)
        external
        virtual
        override
        returns (uint256)
    {
        require(hasRole(MINTER_ROLE, _msgSender()), "not minter");
        Estate storage estate = _mintEstate(from);
        estate.land.set(tiles);
        emit EstateTokenMinted(estate.id, tiles);
        return estate.id;
    }

    // Used by the bridge
    function burnEstate(address from, uint256 estateId)
        external
        virtual
        override
        returns (TileWithCoordLib.TileWithCoord[] memory tiles)
    {
        require(hasRole(BURNER_ROLE, _msgSender()), "not authorized");
        require(_isApprovedOrOwner(from, estateId), "caller is not owner nor approved");
        Estate storage estate = _estate(estateId);
        tiles = estate.land.getMap();
        _burnEstate(estate);
        return (tiles);
    }

    function setLandToken(address landToken) external {
        require(hasRole(ADMIN_ROLE, _msgSender()), "not admin");
        _s().landToken = landToken;
    }

    function setBaseURI(string calldata baseUri) external {
        require(hasRole(ADMIN_ROLE, _msgSender()), "not admin");
        _s().baseUri = baseUri;
    }

    function getNextId() external view returns (uint256) {
        return _s().nextId;
    }

    function getChainIndex() external view returns (uint256) {
        return _s().chainIndex;
    }

    function getLandToken() external view returns (address) {
        return _s().landToken;
    }

    function getOwnerOfStorage(uint256 storageId) external view override returns (address) {
        return ownerOf(_estate(storageId).id);
    }

    function getCurrentEstateId(uint256 storageId) external view returns (uint256) {
        return _estate(storageId).id;
    }

    function getLandLength(uint256 estateId) external view returns (uint256) {
        return _estate(estateId).land.length();
    }

    function getLandAt(
        uint256 estateId,
        uint256 offset,
        uint256 limit
    ) external view returns (TileWithCoordLib.TileWithCoord[] memory) {
        return _estate(estateId).land.at(offset, limit);
    }

    function contain(uint256 estateId, MapLib.TranslateResult memory s) external view override returns (bool) {
        return _estate(estateId).land.contain(s);
    }

    function getLandCount(uint256 estateId) external view returns (uint256) {
        return _estate(estateId).land.getLandCount();
    }

    function getStorageId(uint256 tokenId) external pure override returns (uint256) {
        return tokenId.storageId();
    }

    function onERC721Received(
        address, /* operator */
        address, /* from */
        uint256, /* id */
        bytes calldata /* data */
    ) external virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function onERC721BatchReceived(
        address, /* operator */
        address, /* from */
        uint256[] calldata, /* ids */
        bytes calldata /* data */
    ) external virtual returns (bytes4) {
        return this.onERC721BatchReceived.selector;
    }

    function _addLand(
        Estate storage estate,
        address from,
        uint256[][3] calldata quads
    ) internal {
        uint256 len = quads[0].length;
        if (len > 0) {
            require(len == quads[1].length && len == quads[2].length, "Invalid data");
            for (uint256 i; i < len; i++) {
                estate.land.set(quads[1][i], quads[2][i], quads[0][i]);
            }
            ILandToken(_s().landToken).batchTransferQuad(from, address(this), quads[0], quads[1], quads[2], "");
        }
    }

    function _mintEstate(address to) internal returns (Estate storage estate) {
        uint256 estateId = EstateTokenIdHelperLib.packId(to, _s().nextId++, _s().chainIndex, 1);
        estate = _estate(estateId);
        estate.id = estateId;
        super._mint(to, estateId);
        return estate;
    }

    function _burnEstate(Estate storage estate) internal {
        estate.land.clear();
        delete estate.land;
        uint256 estateId = estate.id;
        delete _s().estate[estateId.storageId()];
        super._burn(estateId);
        emit EstateBurned(estateId);
    }

    /// @dev used to increment the version in a tokenId by burning the original and reminting a new token. Mappings to
    /// @dev token-specific data are preserved via the storageId mechanism.
    /// @param estateId The estateId to increment.
    /// @return new estate id
    function _incrementTokenVersion(uint256 estateId) internal returns (uint256) {
        address owner = ownerOf(estateId);
        super._burn(estateId);
        estateId = estateId.incrementVersion();
        super._mint(owner, estateId);
        return estateId;
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     * We don't use storageId in the url because we want the centralized backend to extract it if needed.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _s().baseUri;
    }

    function _estate(uint256 estateId) internal view returns (Estate storage) {
        return _s().estate[estateId.storageId()];
    }

    function _s() internal pure returns (EstateBaseTokenStorage storage ds) {
        bytes32 storagePosition = keccak256("EstateBaseTokenStorage.EstateBaseTokenStorage");
        assembly {
            ds.slot := storagePosition
        }
    }

    uint256[50] private __posGap;
}
