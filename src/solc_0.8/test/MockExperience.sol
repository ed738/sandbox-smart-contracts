// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import {ERC721Mintable} from "../test/ERC721Mintable.sol";
import {TileLib} from "../common/Libraries/TileLib.sol";
import {IExperienceToken} from "../common/interfaces/IExperienceToken.sol";

contract MockExperience is ERC721Mintable, IExperienceToken {
    using TileLib for TileLib.Tile;

    uint256 internal constant GRID_SIZE = 408;

    struct Experience {
        TileLib.Tile tile;
        uint256[] landCoords;
    }

    mapping(uint256 => Experience) internal experiences;

    // solhint-disable-next-line no-empty-blocks
    constructor() ERC721Mintable("Experience", "Exp") {}

    function setTemplate(uint256 expId, uint256[2][] memory coords) external {
        Experience storage exp = experiences[expId];
        TileLib.Tile memory newTile;
        bool success;

        delete exp.landCoords;
        uint256 len = coords.length;
        for (uint256 i; i < len; i++) {
            uint256 x = coords[i][0];
            uint256 y = coords[i][1];
            uint256 id = x + y * GRID_SIZE;
            exp.landCoords.push(id);
            (success, newTile) = newTile.addIfNotContain(x, y);
            //my idea here was just to ignore repeted lands
            //but since we're listing coordinates, why not
            require(success, "repeated lands");
        }
        exp.tile = newTile;
    }

    function getTemplate(uint256 expId)
        external
        view
        override
        returns (TileLib.Tile memory template, uint256[] memory landList)
    {
        Experience storage exp = experiences[expId];
        return (exp.tile, exp.landCoords);
    }

    function getStorageId(uint256 expId) external pure override returns (uint256 storageId) {
        return expId;
    }
}
