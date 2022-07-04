// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import {IERC721} from "@openzeppelin/contracts-0.8/token/ERC721/IERC721.sol";
import {Context} from "@openzeppelin/contracts-0.8/utils/Context.sol";
import {IEstateToken} from "../../../common/interfaces/IEstateToken.sol";
import {IEstateExperienceRegistry} from "../../../common/interfaces/IEstateExperienceRegistry.sol";
import {TileLib} from "../../../common/Libraries/TileLib.sol";
import {TileWithCoordLib} from "../../../common/Libraries/TileWithCoordLib.sol";
import {MapLib} from "../../../common/Libraries/MapLib.sol";

interface ExperienceTokenInterface {
    function getTemplate(uint256 expId) external view returns (TileLib.Tile calldata, uint256[] calldata landCoords);

    function getStorageId(uint256 expId) external view returns (uint256 storageId);
}

/// @notice Contract managing tExperiences and Estates
contract ExperienceEstateRegistry is Context, IEstateExperienceRegistry {
    using MapLib for MapLib.Map;
    using TileLib for TileLib.Tile;

    struct RelinkData {
        uint256 estateId;
        uint256 expId;
        uint256 x;
        uint256 y;
    }

    ExperienceTokenInterface public experienceToken;
    IEstateToken public estateToken;
    IERC721 public landToken;

    struct EstateAndLands {
        // 0 means not found, 1 means single land,  >1 means multiLand with the value estateId - 1,
        uint256 estateId;
        uint256 singleLand;
        MapLib.Map multiLand;
    }

    // Experience Id => EstateAndLands
    mapping(uint256 => EstateAndLands) internal links;

    MapLib.Map internal linkedLands;

    constructor(
        //address trustedForwarder,
        IEstateToken _estateToken,
        ExperienceTokenInterface _experienceToken,
        //uint8 chainIndex,
        IERC721 _landToken
    ) {
        experienceToken = _experienceToken;
        estateToken = _estateToken;
        landToken = _landToken;
    }

    function linkSingle(
        uint256 expId,
        uint256 x,
        uint256 y
    ) external {
        _link(0, expId, x, y);
    }

    function link(
        uint256 estateId,
        uint256 expId,
        uint256 x,
        uint256 y
    ) external override {
        _link(estateId, expId, x, y);
    }

    function unLink(uint256 expId) external override {
        _unLink(expId);
    }

    function relink(uint256[] calldata expIdsToUnlink, RelinkData[] memory expToLink) external {
        uint256 len = expIdsToUnlink.length;
        for (uint256 i; i < len; i++) {
            _unLink(expIdsToUnlink[i]);
        }
        len = expToLink.length;
        for (uint256 i; i < len; i++) {
            RelinkData memory d;
            _link(d.estateId, d.expId, d.x, d.y);
        }
    }

    function batchUnLink(uint256[] calldata expIdsToUnlink) external override {
        uint256 len = expIdsToUnlink.length;
        for (uint256 i; i < len; i++) {
            _unLink(expIdsToUnlink[i]);
        }
    }

    // Called by the estate contract to check that the land are ready to remove.
    function isLinked(uint256[][3] calldata quads) external view override returns (bool) {
        uint256 len = quads.length;
        for (uint256 i; i < len; i++) {
            if (linkedLands.intersect(quads[1][i], quads[2][i], quads[0][i])) {
                return true;
            }
        }
        return false;
    }

    function isLinked(uint256 expId) external view override returns (bool) {
        uint256 storageId = _getStorageId(expId);
        EstateAndLands storage est = links[storageId];
        return est.estateId > 0;
    }

    function isLinked(TileWithCoordLib.TileWithCoord[] calldata tiles) external view override returns (bool) {
        return linkedLands.intersect(tiles);
    }

    function _link(
        uint256 estateId,
        uint256 expId,
        uint256 x,
        uint256 y
    ) internal {
        //single lands = 0 exists

        // Link
        uint256 storageId = _getStorageId(expId);
        (TileLib.Tile memory template, uint256[] memory landCoords) = experienceToken.getTemplate(storageId);
        require(landCoords.length > 0, "empty template");
        EstateAndLands storage est = links[storageId];
        // TODO: This affect the test: trying to create a link with a land already in use should revert
        require(est.estateId == 0, "Exp already in use");
        //single lands = 0 exists

        // TODO: Maybe this one must take storageId directly
        if (estateId == 0) {
            require(landCoords.length == 1, "must be done inside estate");
            uint256 translatedId = landCoords[0] + x + (y * 408);
            uint256 translatedX = translatedId % 408;
            uint256 translatedY = translatedId / 408;
            require(!linkedLands.contain(translatedX, translatedY), "already linked");
            linkedLands.set(translatedX, translatedY, 1);
            est.singleLand = translatedId;
        } else {
            MapLib.TranslateResult memory s = MapLib.translate(template, x, y);
            require(!linkedLands.intersect(s), "already linked");
            linkedLands.set(s);
            require(estateToken.contain(estateId, s), "not enough land");
            est.multiLand.set(s);
        }
        est.estateId = estateId + 1;
        require(_isValidUser(est), "invalid user");
    }

    function _unLink(uint256 expId) internal {
        uint256 storageId = _getStorageId(expId);
        EstateAndLands storage est = links[storageId];
        require(est.estateId > 0, "unknown experience");
        require(_isValidUser(est), "Invalid user");
        if (est.estateId == 1) {
            uint256 landId = est.singleLand;
            uint256 x = landId % 408;
            uint256 y = landId / 408;
            linkedLands.clear(x, y, 1);
        } else {
            linkedLands.clear(est.multiLand);
        }
        delete links[storageId];
    }

    function _getStorageId(uint256 expId) internal view returns (uint256) {
        return experienceToken.getStorageId(expId);
    }

    function _isValidUser(EstateAndLands storage est) internal view returns (bool) {
        if (est.estateId == 1) {
            return landToken.ownerOf(est.singleLand) == _msgSender();
        }
        return estateToken.getOwnerOfStorage(est.estateId - 1) == _msgSender();
    }
}
