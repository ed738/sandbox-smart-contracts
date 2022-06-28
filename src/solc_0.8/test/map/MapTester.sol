//SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-version
pragma solidity 0.8.2;

import {MapLib} from "../../common/Libraries/MapLib.sol";
import {TileWithCoordLib} from "../../common/Libraries/TileWithCoordLib.sol";
import {TileLib} from "../../common/Libraries/TileLib.sol";

contract MapTester {
    using MapLib for MapLib.Map;
    using TileWithCoordLib for TileWithCoordLib.TileWithCoord;
    using TileLib for TileLib.Tile;
    MapLib.Map[30] internal maps;
    TileWithCoordLib.TileWithCoord[10] public tiles;

    function setQuad(
        uint256 idx,
        uint256 x,
        uint256 y,
        uint256 size
    ) external {
        maps[idx].set(x, y, size);
    }

    function setTileWithCoord(uint256 idx, TileWithCoordLib.TileWithCoord calldata tile) external {
        maps[idx].set(tile);
    }

    function setMap(uint256 idx, uint256 contained) external {
        maps[idx].set(maps[contained]);
    }

    function setMapUsingTiles(uint256 idx, uint256 contained) external {
        maps[idx].set(maps[contained].values);
    }

    function clearQuad(
        uint256 idx,
        uint256 x,
        uint256 y,
        uint256 size
    ) external {
        maps[idx].clear(x, y, size);
    }

    function clearTileWithCoord(uint256 idx, TileWithCoordLib.TileWithCoord calldata tile) external {
        maps[idx].clear(tile);
    }

    function clearMap(uint256 idx, uint256 contained) external {
        maps[idx].clear(maps[contained]);
    }

    function clearMapUsingTiles(uint256 idx, uint256 contained) external {
        maps[idx].clear(maps[contained].values);
    }

    function clear(uint256 idx) external {
        maps[idx].clear();
    }

    function containCoord(
        uint256 idx,
        uint256 x,
        uint256 y
    ) external view returns (bool) {
        return maps[idx].contain(x, y);
    }

    function containQuad(
        uint256 idx,
        uint256 x,
        uint256 y,
        uint256 size
    ) external view returns (bool) {
        return maps[idx].contain(x, y, size);
    }

    function containMap(uint256 idx, uint256 contained) external view returns (bool) {
        return maps[idx].contain(maps[contained]);
    }

    function containTiles(uint256 idx, uint256 contained) external view returns (bool) {
        return maps[idx].contain(maps[contained].values);
    }

    function containTileWithOffset(
        uint256 idx,
        TileLib.Tile calldata tile,
        uint256 x,
        uint256 y
    ) external view returns (bool) {
        MapLib.TranslateResult memory s = MapLib.translate(tile, x, y);
        return maps[idx].contain(s);
    }

    function intersectTileWithOffset(
        uint256 idx,
        TileLib.Tile calldata tile,
        uint256 x,
        uint256 y
    ) external view returns (bool) {
        MapLib.TranslateResult memory s = MapLib.translate(tile, x, y);
        return maps[idx].intersect(s);
    }

    function isAdjacent(uint256 idx) external view returns (bool) {
        return maps[idx].isAdjacent();
    }

    function isQuadAdjacent(
        uint256 idx,
        uint256 x,
        uint256 y,
        uint256 size
    ) external view returns (bool) {
        return maps[idx].isAdjacent(x, y, size);
    }

    function floodStep(uint256 idx, TileLib.Tile[] memory data)
        external
        view
        returns (
            TileLib.Tile[] memory current,
            TileLib.Tile[] memory next,
            bool done
        )
    {
        (next, done) = maps[idx].floodStep(data);
        return (data, next, done);
    }

    function floodStepWithSpot(uint256 idx)
        external
        view
        returns (
            TileWithCoordLib.TileWithCoord[] memory current,
            TileLib.Tile[] memory next,
            bool done
        )
    {
        current = maps[idx].values;
        next = new TileLib.Tile[](current.length);
        next[0] = current[0].tile.findAPixel();
        return (current, next, done);
    }

    function findAPixel(uint256 idx) external view returns (TileLib.Tile memory tile) {
        return maps[idx].values[0].tile.findAPixel();
    }

    function intersect(uint256 idx, uint256 tileIdx) external view returns (bool) {
        return maps[idx].intersect(tiles[tileIdx]);
    }

    function intersectQuad(
        uint256 idx,
        uint256 x,
        uint256 y,
        uint256 size
    ) external view returns (bool) {
        return maps[idx].intersect(x, y, size);
    }

    function intersectMap(uint256 idx, uint256 contained) external view returns (bool) {
        return maps[idx].intersect(maps[contained]);
    }

    function intersectTiles(uint256 idx, uint256 contained) external view returns (bool) {
        return maps[idx].intersect(maps[contained].values);
    }

    function isEqual(uint256 idx, uint256 other) external view returns (bool) {
        return maps[idx].isEqual(maps[other]);
    }

    function length(uint256 idx) external view returns (uint256) {
        return maps[idx].length();
    }

    function at(uint256 idx, uint256 index) external view returns (TileWithCoordLib.TileWithCoord memory) {
        return maps[idx].at(index);
    }

    function getMap(uint256 idx) external view returns (TileWithCoordLib.TileWithCoord[] memory) {
        return maps[idx].getMap();
    }

    function translate(
        TileLib.Tile calldata t,
        uint256 x,
        uint256 y
    ) external pure returns (MapLib.TranslateResult memory) {
        return MapLib.translate(t, x, y);
    }

    function getLandCount(uint256 idx) external view returns (uint256) {
        return maps[idx].getLandCount();
    }

    function setTileQuad(
        uint256 idx,
        uint256 x,
        uint256 y,
        uint256 size
    ) external {
        tiles[idx] = tiles[idx].set(x, y, size);
    }

    function initTile(
        uint256 idx,
        uint256 x,
        uint256 y
    ) external {
        tiles[idx] = TileWithCoordLib.init(x, y);
    }

    function getTile(uint256 idx) external view returns (TileWithCoordLib.TileWithCoord memory) {
        return tiles[idx];
    }
}
