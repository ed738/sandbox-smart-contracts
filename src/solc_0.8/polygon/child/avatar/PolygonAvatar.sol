//SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-version
pragma solidity 0.8.2;

import {AvatarBase} from "../../../avatar/AvatarBase.sol";
import {IAvatarMinter} from "../../../common/interfaces/IAvatarMinter.sol";
import {Upgradeable} from "../../../common/BaseWithStorage/Upgradeable.sol";
import {IChildToken} from "../../../common/interfaces/@maticnetwork/pos-portal/child/ChildToken/IChildToken.sol";

/// @title This contract is a erc 721 compatible NFT token that represents an avatar and can be minted by a minter role.
/// @dev This contract support meta transactions.
/// @dev Avatar will be minted only on L2 (using the sale contract) and can be transferred to L1 but not minted on L1.
/// @dev This contract is final, don't inherit form it.
contract PolygonAvatar is AvatarBase, Upgradeable, IChildToken, IAvatarMinter {
    event Deposit(address indexed from, uint256 tokenId);
    event DepositBatch(address indexed from, uint256[] tokenIds);
    // This is not part of the interface, but it seems that this specific event is necessary!!!.
    event WithdrawnBatch(address indexed user, uint256[] tokenIds);
    event Withdrawn(address indexed user, uint256 tokenId);
    event Minted(address indexed user, uint256 id);
    event MintedBatch(address indexed user, uint256[] ids);

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CHILD_MANAGER_ROLE = keccak256("CHILD_MANAGER_ROLE");
    // We only mint on L2, then it make sense to keep track of tokens transferred to L1
    // to avoid minting them twice.
    mapping(uint256 => bool) public withdrawnTokens;
    uint256 private _maxMinLength;

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        address trustedForwarder_,
        address defaultAdmin_
    ) external initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __AccessControl_init_unchained();
        __AvatarBase_init_unchained(defaultAdmin_, baseTokenURI_);
        __ERC721_init_unchained(name_, symbol_);
        __ERC2771Handler_initialize(trustedForwarder_);
    }

    /**
     * @notice called when token is deposited on root chain
     * @dev Should be callable only by ChildChainManager
     * Should handle deposit by minting the required tokenId(s) for user
     * Should set `withdrawnTokens` mapping to `false` for the tokenId being deposited
     * Minting can also be done by other functions
     * @param user user address for whom deposit is being done
     * @param depositData abi encoded tokenIds. Batch deposit also supported.
     */
    function deposit(address user, bytes calldata depositData) external override whenNotPaused {
        require(hasRole(CHILD_MANAGER_ROLE, _msgSender()), "!CHILD_MANAGER_ROLE");
        require(user != address(0x0), "invalid user");
        if (depositData.length == 32) {
            // deposit single
            uint256 tokenId = abi.decode(depositData, (uint256));
            _deposit(user, tokenId);
            emit Deposit(user, tokenId);
        } else {
            // deposit batch
            uint256[] memory tokenIds = abi.decode(depositData, (uint256[]));
            for (uint256 i; i < tokenIds.length; i++) {
                _deposit(user, tokenIds[i]);
            }
            emit DepositBatch(user, tokenIds);
        }
    }

    /// @notice Withdraw tokens
    /// @param tokenId tokenId of the token to be withdrawn
    function withdraw(uint256 tokenId) external whenNotPaused {
        _withdraw(tokenId);
        emit Withdrawn(_msgSender(), tokenId);
    }

    /**
     * @notice called when user wants to withdraw multiple tokens back to root chain
     * @dev Should burn user's tokens. This transaction will be verified when exiting on root chain
     * @param tokenIds tokenId list to withdraw
     */
    function withdrawBatch(uint256[] calldata tokenIds) external whenNotPaused {
        // Iteratively burn ERC721 tokens, for performing batch withdraw
        for (uint256 i; i < tokenIds.length; i++) {
            _withdraw(tokenIds[i]);
        }
        // At last emit this event, which will be used
        // in MintableERC721 predicate contract on L1
        // while verifying burn proof
        emit WithdrawnBatch(_msgSender(), tokenIds);
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
    function mint(address to, uint256 id) external override whenNotPaused {
        require(hasRole(MINTER_ROLE, _msgSender()), "must have minter role");
        require(!withdrawnTokens[id], "TOKEN_EXISTS_ON_ROOT_CHAIN");
        _mint(to, id);
        emit Minted(to, id);
    }

    /**
     * @dev Creates a new token for `to`. Its token IDs will be automatically
     * assigned (and available on the emitted {IERC721-Transfer} event), and the token
     * URI autogenerated based on the base URI passed at construction.
     *
     * See {ERC721-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mintBatch(address to, uint256[] calldata ids) external override whenNotPaused {
        require(hasRole(MINTER_ROLE, _msgSender()), "must have minter role");
        require(ids.length > 0, "ids empty");
        require(ids.length <= _maxMinLength + 1, "too many ids");
        for (uint256 i = 0; i < ids.length; i++) {
            require(!withdrawnTokens[i], "TOKEN_EXISTS_ON_ROOT_CHAIN");
            _mint(to, ids[i]);
        }
        emit MintedBatch(to, ids);
    }

    /// @dev Set the maximum number of id that can be minted at once
    /// @param maxMintLength maximum number of ids to mint at once
    function setMaxMintLength(uint256 maxMintLength) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "must have admin role");
        require(maxMintLength > 0, "invalid value");
        _maxMinLength = maxMintLength - 1;
    }

    /**
     * @dev We don't implement {IMintableERC721-exists} but this one is a nice to have.
     */
    function maxMinLength() external view returns (uint256) {
        return _maxMinLength + 1;
    }

    /**
     * @dev We don't implement {IMintableERC721-exists} but this one is a nice to have.
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    /// @notice Deposit tokens
    /// @param user address for deposit
    /// @param tokenId tokenId to mint to user's account
    function _deposit(address user, uint256 tokenId) internal {
        // We only accept tokens that were minted on L1, withdrawn and now came from L1
        require(withdrawnTokens[tokenId], "TOKEN_NOT_EXISTS_ON_ROOT_CHAIN");
        withdrawnTokens[tokenId] = false;
        _mint(user, tokenId);
    }

    // TODO: This makes the contract matic-pos portal compatible, but it is kind of risky
    // TODO: Remove if we only want to use matic-fx portal.
    /// @notice Withdraw tokens
    /// @param tokenId tokenId of the token to be withdrawn
    function _withdraw(uint256 tokenId) internal {
        require(ownerOf(tokenId) == _msgSender(), "Not owner");
        withdrawnTokens[tokenId] = true;
        _burn(tokenId);
    }
}
