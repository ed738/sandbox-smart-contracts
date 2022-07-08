//SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import {
    IERC721ReceiverUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import {ILandToken} from "../common/interfaces/ILandToken.sol";
import {IEstateToken} from "../common/interfaces/IEstateToken.sol";
import {TileWithCoordLib} from "../common/Libraries/TileWithCoordLib.sol";
import {MapLib} from "../common/Libraries/MapLib.sol";
import {BaseERC721Upgradeable} from "../common/Base/BaseERC721Upgradeable.sol";
import {IERC721MandatoryTokenReceiver} from "../common/interfaces/IERC721MandatoryTokenReceiver.sol";
import {EstateTokenIdHelperLib} from "./EstateTokenIdHelperLib.sol";

/// @title Base contract for estate contract on L1 and L2, it used to group lands together.
/// @dev it uses tile maps to save the land
/// @dev each time something is modified the token id (version) is changed (but keeping a common storageId part)
abstract contract EstateBaseToken is BaseERC721Upgradeable, IEstateToken {
    using MapLib for MapLib.Map;
    using EstateTokenIdHelperLib for uint256;

    struct Estate {
        // current estateId, for the same storageId we have only one valid estateId (the last one)
        uint256 id;
        // estate lands tile set.
        MapLib.Map land;
    }

    struct EstateBaseTokenStorage {
        address landToken;
        uint128 nextId; // max uint64 = 18,446,744,073,709,551,615
        uint32 chainIndex;
        string baseUri;
        // storageId -> estateData
        mapping(uint256 => Estate) estate;
    }

    uint256[50] private __preGap;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @dev Emitted when an estate is updated.
    /// @param estateId The id of the newly minted token.
    /// @param user the user to which the estate is created
    /// @param lands the initial lands of the estate
    event EstateTokenCreated(uint256 indexed estateId, address user, TileWithCoordLib.TileWithCoord[] lands);

    /// @dev Emitted when lands are added to the estate.
    /// @param estateId The id of the previous erc721 ESTATE token.
    /// @param newId The id of the newly minted token.
    /// @param user the user that is adding lands
    /// @param lands The lands of the estate.
    event EstateTokenLandsAdded(
        uint256 indexed estateId,
        uint256 indexed newId,
        address user,
        TileWithCoordLib.TileWithCoord[] lands
    );

    /// @dev Emitted when the estate is updated
    /// @param oldId The original id of the erc721 ESTATE token.
    /// @param newId The updated id of the erc721 ESTATE token.
    /// @param user the user that is updating the estate
    /// @param lands the tiles that compose the estate
    event EstateTokenUpdated(
        uint256 indexed oldId,
        uint256 indexed newId,
        address user,
        TileWithCoordLib.TileWithCoord[] lands
    );

    /// @dev Emitted when the user burn an estate (must be empty).
    /// @param estateId The id of the erc721 ESTATE token.
    /// @param from the user from which the estate is taken
    event EstateTokenBurned(uint256 indexed estateId, address from);

    /// @dev Emitted when the bridge mint an estate.
    /// @param estateId The id of the  erc721 ESTATE token.
    /// @param operator The msg sender
    /// @param to the user to which the estate is minted
    /// @param lands the tiles that compose the estate and was sent from the other layer
    event EstateBridgeMinted(
        uint256 indexed estateId,
        address operator,
        address to,
        TileWithCoordLib.TileWithCoord[] lands
    );

    /// @dev Emitted when the bridge (burner role) burn an estate.
    /// @param estateId The id of the erc721 ESTATE token.
    /// @param operator The msg sender
    /// @param from the user from which the estate is taken
    /// @param lands the tiles that compose the estate and will be sent to the other layer
    event EstateBridgeBurned(
        uint256 indexed estateId,
        address operator,
        address from,
        TileWithCoordLib.TileWithCoord[] lands
    );

    /// @dev Emitted when the land contract address is changed
    /// @param operator The msg sender
    /// @param oldAddress of the land contract
    /// @param newAddress of the land contract
    event EstateLandTokenChanged(address indexed operator, address oldAddress, address newAddress);

    /// @dev Emitted when the base uri for the metadata url is changed
    /// @param operator The msg sender
    /// @param oldURI of the metadata url
    /// @param newURI of the metadata url
    event EstateBaseUrlChanged(address indexed operator, string oldURI, string newURI);

    /// @notice initialization
    /// @param trustedForwarder address of the meta tx trustedForwarder
    /// @param admin initial admin role that can grant or revoke other roles
    /// @param landToken_ the address of the land token contract
    /// @param chainIndex_ the chain index for example: 0:mainnet, 1:polygon, etc
    /// @param name_ name of the token
    /// @param symbol_ symbol of the token
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

    /// @notice initialization unchained
    /// @param landToken_ the address of the land token contract
    /// @param chainIndex_ the chain index for example: 0:mainnet, 1:polygon, etc
    function __EstateBaseToken_init_unchained(address landToken_, uint16 chainIndex_) internal onlyInitializing {
        _s().landToken = landToken_;
        _s().chainIndex = chainIndex_;
    }

    /// @notice Create a new estate token adding the given quads (aka lands).
    /// @param landToAdd The set of quads to add.
    /// @return estateId the estate Id created
    function create(uint256[][3] calldata landToAdd) external virtual returns (uint256 estateId) {
        Estate storage estate = _mintEstate(_msgSender());
        require(landToAdd[0].length > 0, "nothing to add");
        _addLand(estate, _msgSender(), landToAdd);
        require(estate.land.isAdjacent(), "not adjacent");
        emit EstateTokenCreated(estate.id, _msgSender(), estate.land.getMap());
        return estate.id;
    }

    /// @notice Add the given quads (aka lands) to an Estate.
    /// @param oldId the estate id that will be updated
    /// @param landToAdd The set of quads to add.
    /// @return estateId the new estate Id
    function addLand(uint256 oldId, uint256[][3] calldata landToAdd) external virtual returns (uint256) {
        require(_isApprovedOrOwner(_msgSender(), oldId), "caller is not owner nor approved");
        require(landToAdd[0].length > 0, "nothing to add");
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
        emit EstateTokenLandsAdded(oldId, estate.id, _msgSender(), estate.land.getMap());
        return estate.id;
    }

    /// @notice create a new estate from scratch (Used by the bridge)
    /// @param to user that will get the new minted Estate
    /// @param tiles the list of tiles (aka lands) to add to the estate
    /// @return the estate Id created
    function mintEstate(address to, TileWithCoordLib.TileWithCoord[] calldata tiles)
        external
        virtual
        override
        returns (uint256)
    {
        require(hasRole(MINTER_ROLE, _msgSender()), "not authorized");
        Estate storage estate = _mintEstate(to);
        estate.land.set(tiles);
        emit EstateBridgeMinted(estate.id, _msgSender(), to, tiles);
        return estate.id;
    }

    /// @notice completely burn an estate (Used by the bridge)
    /// @dev must be implemented for every layer, see PolygonEstateTokenV1 and EstateTokenV1
    /// @param from user that is trying to use the bridge
    /// @param estateId the id of the estate token
    /// @return tiles the list of tiles (aka lands) to add to the estate
    function burnEstate(address from, uint256 estateId)
        external
        virtual
        override
        returns (TileWithCoordLib.TileWithCoord[] memory tiles);

    /// @notice change the address of the land contract
    /// @param landToken the new address of the land contract
    function setLandToken(address landToken) external {
        require(hasRole(ADMIN_ROLE, _msgSender()), "not admin");
        require(landToken != address(0), "invalid address");
        address oldAddress = _s().landToken;
        _s().landToken = landToken;
        emit EstateLandTokenChanged(_msgSender(), oldAddress, landToken);
    }

    /// @notice change the base uri of the metadata url
    /// @param baseUri the base uri of the metadata url
    function setBaseURI(string calldata baseUri) external {
        require(hasRole(ADMIN_ROLE, _msgSender()), "not admin");
        string memory oldUri = _s().baseUri;
        _s().baseUri = baseUri;
        emit EstateBaseUrlChanged(_msgSender(), oldUri, baseUri);
    }

    /// @notice return the id of the next estate token
    /// @return next id
    function getNextId() external view returns (uint256) {
        return _s().nextId;
    }

    /// @notice return the chain index
    /// @return chain index
    function getChainIndex() external view returns (uint256) {
        return _s().chainIndex;
    }

    /// @notice return the address of the land token contract
    /// @return land token contract address
    function getLandToken() external view returns (address) {
        return _s().landToken;
    }

    /// @notice return owner of the estateId ignoring version rotations (used by the registry)
    /// @param storageId the storage id for an estate
    /// @return owner address
    function getOwnerOfStorage(uint256 storageId) external view override returns (address) {
        return ownerOf(_estate(storageId).id);
    }

    /// @notice return the amount of tiles that describe the land map inside a given estate
    /// @param estateId the estate id
    /// @return the length of the tile map
    function getLandLength(uint256 estateId) external view returns (uint256) {
        return _estate(estateId).land.length();
    }

    /// @notice return an array of tiles describing the map of lands for a given estate
    /// @param estateId the estate id
    /// @param offset an amount of entries to skip in the array (pagination)
    /// @param limit amount of entries to get (pagination)
    /// @return an array of tiles describing the map of lands
    function getLandAt(
        uint256 estateId,
        uint256 offset,
        uint256 limit
    ) external view returns (TileWithCoordLib.TileWithCoord[] memory) {
        return _estate(estateId).land.at(offset, limit);
    }

    /// @notice check if the estate contains certain displaced template (used by the registry)
    /// @param estateId the estate id
    /// @param s displaced template
    /// @return true if the estate contain all the lands of the displaced template
    function contain(uint256 estateId, MapLib.TranslateResult memory s) external view override returns (bool) {
        return _estate(estateId).land.contain(s);
    }

    /// @notice return the amount of lands inside the estate
    /// @param estateId the estate id
    /// @return the amount of lands inside the estate
    function getLandCount(uint256 estateId) external view returns (uint256) {
        return _estate(estateId).land.getLandCount();
    }

    /// @notice given and estateId return the part that doesn't change when the version is incremented
    /// @param estateId the estate id
    /// @return the storage Id
    function getStorageId(uint256 estateId) external pure override returns (uint256) {
        return estateId.storageId();
    }

    /// @notice this is necessary to be able to receive land
    function onERC721Received(
        address, /* operator */
        address, /* from */
        uint256, /* id */
        bytes calldata /* data */
    ) external view virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /// @notice this is necessary to be able to receive land
    function onERC721BatchReceived(
        address, /* operator */
        address, /* from */
        uint256[] calldata, /* ids */
        bytes calldata /* data */
    ) external view virtual returns (bytes4) {
        return this.onERC721BatchReceived.selector;
    }

    /// @notice Check if the contract supports an interface.
    /// @param interfaceId The id of the interface.
    /// @return Whether the interface is supported.
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC721ReceiverUpgradeable).interfaceId ||
            interfaceId == type(IERC721MandatoryTokenReceiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function _addLand(
        Estate storage estate,
        address from,
        uint256[][3] calldata quads
    ) internal {
        uint256 len = quads[0].length;
        require(len == quads[1].length && len == quads[2].length, "invalid data");
        for (uint256 i; i < len; i++) {
            estate.land.set(quads[1][i], quads[2][i], quads[0][i]);
        }
        ILandToken(_s().landToken).batchTransferQuad(from, address(this), quads[0], quads[1], quads[2], "");
    }

    function _mintEstate(address to) internal returns (Estate storage estate) {
        uint256 estateId = EstateTokenIdHelperLib.packId(++(_s().nextId), _s().chainIndex, 1);
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

    /// @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
    /// @dev token will be the concatenation of the `baseURI` and the `tokenId`.
    /// @dev We don't use storageId in the url because we want the centralized backend to extract it if needed.
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
