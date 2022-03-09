//SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-version
pragma solidity 0.8.2;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

abstract contract AssetBaseERC721 is AccessControlUpgradeable, ERC721Upgradeable {
    bool internal _init;
    uint256 internal _initBits;

    address internal _predicate; // used in place of polygon's `PREDICATE_ROLE`
    uint8 internal _chainIndex; // modify this for l2
    // uint256 private constant CHAIN_INDEX_OFFSET_MULTIPLIER = uint256(2)**(256 - 160 - 1 - 32);
    // uint256 private constant CHAIN_INDEX_MASK = 0x00000000000000000000000000000000000000000000007F8000000000000000;

    address internal _trustedForwarder;

    bytes32 public constant MINTER = keccak256("MINTER");

    function initV3(
        address trustedForwarder,
        address admin,
        address predicate,
        uint8 chainIndex
    ) public {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        __ERC2771Handler_initialize(trustedForwarder);
        _predicate = predicate;
        _chainIndex = chainIndex;
        __ERC721_init("Sandbox's Assets", "ASSET");
    }

    /// @notice Mint an ERC721 Asset with the provided id.
    /// @param id ERC721 id to be used.
    /// @param owner address that will receive the token.
    function mint(uint256 id, address owner) external onlyRole(MINTER) {
        _safeMint(owner, id);
    }

    // TODO: look at setApprovalForAllFrom

    /// @notice Burns token with given `id`.
    /// @param from address whose token is to be burnt.
    /// @param id token which will be burnt.
    function burnFrom(address from, uint256 id) external {
        require(from == _msgSender() || isApprovedForAll(from, _msgSender()), "!AUTHORIZED"); // TODO: do we want a burner role?
        _burn(id);
    }

    /// @notice Query if a contract implements interface `id`.
    /// @param id the interface identifier, as specified in ERC-165.
    /// @return `true` if the contract implements `id`.
    function supportsInterface(bytes4 id)
        public
        pure
        override(AccessControlUpgradeable, ERC721Upgradeable)
        returns (bool)
    {
        return
            id == 0x01ffc9a7 || //ERC165
            id == 0x80ac58cd || // ERC721
            id == 0x5b5e139f; // ERC721 metadata
    }

    function __ERC2771Handler_initialize(address forwarder) internal {
        _trustedForwarder = forwarder;
    }

    function isTrustedForwarder(address forwarder) public view returns (bool) {
        return forwarder == _trustedForwarder;
    }

    function getTrustedForwarder() external view returns (address trustedForwarder) {
        return _trustedForwarder;
    }

    function _msgSender() internal view virtual override returns (address sender) {
        if (isTrustedForwarder(msg.sender)) {
            // The assembly code is more direct than the Solidity version using `abi.decode`.
            // solhint-disable-next-line no-inline-assembly
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            return msg.sender;
        }
    }

    function _msgData() internal view virtual override returns (bytes calldata) {
        if (isTrustedForwarder(msg.sender)) {
            return msg.data[:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }

    /// @dev Allows the use of a bitfield to track the initialized status of the version `v` passed in as an arg.
    /// If the bit at the index corresponding to the given version is already set, revert.
    /// Otherwise, set the bit and return.
    /// @param v The version of this contract.
    function _checkInit(uint256 v) internal {
        require((_initBits >> v) & uint256(1) != 1, "ALREADY_INITIALISED");
        _initBits = _initBits | (uint256(1) << v);
    }
}