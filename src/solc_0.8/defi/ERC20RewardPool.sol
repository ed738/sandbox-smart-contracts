//SPDX-License-Identifier: MIT

pragma solidity 0.8.2;

import {Context} from "@openzeppelin/contracts-0.8/utils/Context.sol";
import {SafeERC20} from "@openzeppelin/contracts-0.8/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts-0.8/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts-0.8/security/ReentrancyGuard.sol";
import {Address} from "@openzeppelin/contracts-0.8/utils/Address.sol";
import {AccessControl} from "@openzeppelin/contracts-0.8/access/AccessControl.sol";
import {ERC2771Handler} from "../common/BaseWithStorage/ERC2771Handler.sol";
import {StakeTokenWrapper} from "./StakeTokenWrapper.sol";
import {IContributionRules} from "./interfaces/IContributionRules.sol";
import {IRewardCalculator} from "./interfaces/IRewardCalculator.sol";
import {LockRules} from "./rules/LockRules.sol";
import {RequirementsRules} from "./rules/RequirementsRules.sol";

/// @title A pool that distributes rewards between users that stake any erc20 token
/// @notice The contributions are updated passively, an external call to computeContribution from a backend is needed.
/// @notice After initialization the reward calculator must be set by the admin.
/// @dev The contract has two plugins that affect the behaviour: contributionCalculator and rewardCalculator
/// @dev contributionCalculator instead of using the stake directly the result of computeContribution is used
/// @dev this way some users can get an extra share of the rewards
/// @dev rewardCalculator is used to manage the rate at which the rewards are distributed.
/// @dev This way we can build different types of pools by mixing in the plugins we want with this contract.
/// @dev default behaviour (address(0)) for contributionCalculator is to use the stacked amount as contribution.
/// @dev default behaviour (address(0)) for rewardCalculator is that no rewards are giving
contract ERC20RewardPool is
    StakeTokenWrapper,
    LockRules,
    RequirementsRules,
    AccessControl,
    ReentrancyGuard,
    ERC2771Handler
{
    using SafeERC20 for IERC20;
    using Address for address;

    event Staked(address indexed account, uint256 stakeAmount);
    event Withdrawn(address indexed account, uint256 stakeAmount);
    event Exit(address indexed account);
    event RewardPaid(address indexed account, uint256 rewardAmount);
    event ContributionUpdated(address indexed account, uint256 newContribution, uint256 oldContribution);

    uint256 internal constant DECIMALS_18 = 1000000000000000000;

    // This value multiplied by the user contribution is the share of accumulated rewards (from the start of time
    // until the last call to restartRewards) for the user taking into account the value of totalContributions.
    uint256 public rewardPerTokenStored;

    IERC20 public rewardToken;
    IContributionRules public contributionRules;
    IRewardCalculator public rewardCalculator;

    // This value multiplied by the user contribution is the share of reward from the the last time
    // the user changed his contribution and called restartRewards
    mapping(address => uint256) public userRewardPerTokenPaid;

    // This value is the accumulated rewards won by the user when he called the contract.
    mapping(address => uint256) public rewards;

    uint256 internal _totalContributions;
    mapping(address => uint256) internal _contributions;

    constructor(
        IERC20 stakeToken_,
        IERC20 rewardToken_,
        address trustedForwarder
    ) StakeTokenWrapper(stakeToken_) {
        rewardToken = rewardToken_;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        __ERC2771Handler_initialize(trustedForwarder);
    }

    modifier isContractAndAdmin(address contractAddress) {
        require(contractAddress.isContract(), "ERC20RewardPool: is not a contract");
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "ERC20RewardPool: not admin");
        _;
    }

    modifier isValidAddress(address account) {
        require(account != address(0), "ERC20RewardPool: is not contract");

        _;
    }

    /// @notice set the lockPeriodInSecs for the anti-compound buffer
    /// @param lockPeriodInSecs amount of time the user must wait between reward withdrawal
    function setTimelockClaim(uint256 lockPeriodInSecs) external onlyRole(DEFAULT_ADMIN_ROLE) {
        timeLockClaim.lockPeriodInSecs = lockPeriodInSecs;
    }

    function setTimelockDeposit(uint256 newTimeDeposit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        lockDeposit.lockPeriodInSecs = newTimeDeposit;
    }

    function setTimeLockWithdraw(uint256 newTimeWithdraw) external onlyRole(DEFAULT_ADMIN_ROLE) {
        lockWithdraw.lockPeriodInSecs = newTimeWithdraw;
    }

    function setAmountLockClaim(uint256 newAmountLockClaim, bool isEnabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        amountLockClaim.amount = newAmountLockClaim;
        amountLockClaim.claimLockEnabled = isEnabled;
    }

    /// @notice set the reward token
    /// @param contractAddress address token used to pay rewards
    function setRewardToken(address contractAddress) external isContractAndAdmin(contractAddress) {
        rewardToken = IERC20(contractAddress);
    }

    /// @notice set the stake token
    /// @param contractAddress address token used to stake funds
    function setStakeToken(address contractAddress) external isContractAndAdmin(contractAddress) {
        _stakeToken = IERC20(contractAddress);
    }

    /// @notice set the trusted forwarder
    /// @param trustedForwarder address of the contract that is enabled to send meta-tx on behalf of the user
    function setTrustedForwarder(address trustedForwarder) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _trustedForwarder = trustedForwarder;
    }

    /// @notice set contract that contains all the contribution rules
    function setContributionRules(address contractAddress) external isContractAndAdmin(contractAddress) {
        contributionRules = IContributionRules(contractAddress);
    }

    function getRemainingTimelockClaim() external view returns (uint256) {
        return block.timestamp - (timeLockClaim.lastClaim[_msgSender()] + timeLockClaim.lockPeriodInSecs);
    }

    function getRemainingTimelockWithdraw() external view returns (uint256) {
        return block.timestamp - (lockWithdraw.lastWithdraw[_msgSender()] + lockWithdraw.lockPeriodInSecs);
    }

    function getRemainingTimelockDeposit() external view returns (uint256) {
        return block.timestamp - (lockDeposit.lastDeposit[_msgSender()] + lockDeposit.lockPeriodInSecs);
    }

    /// @notice set the reward calculator
    /// @param contractAddress address of a plugin that calculates absolute rewards at any point in time
    /// @param restartRewards_ if true the rewards from the previous calculator are accumulated before changing it
    function setRewardCalculator(address contractAddress, bool restartRewards_)
        external
        isContractAndAdmin(contractAddress)
    {
        // We process the rewards of the current reward calculator before the switch.
        if (restartRewards_) {
            _restartRewards();
        }
        rewardCalculator = IRewardCalculator(contractAddress);
    }

    /// @notice the admin recover is able to recover reward funds
    /// @param receiver address of the beneficiary of the recovered funds
    /// @dev this function must be called in an emergency situation only.
    /// @dev Calling it is risky specially when rewardToken == stakeToken
    function recoverFunds(address receiver) external onlyRole(DEFAULT_ADMIN_ROLE) isValidAddress(receiver) {
        rewardToken.safeTransfer(receiver, rewardToken.balanceOf(address(this)));
    }

    /// @notice return the total supply of staked tokens
    /// @return the total supply of staked tokens
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    /// @notice return the balance of staked tokens for a user
    /// @param account the address of the account
    /// @return balance of staked tokens
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    /// @notice return the address of the stake token contract
    /// @return address of the stake token contract
    function stakeToken() external view returns (IERC20) {
        return _stakeToken;
    }

    /// @notice return the amount of rewards deposited in the contract that can be distributed by different campaigns
    /// @return the total amount of deposited rewards
    /// @dev this function can be called by a reward calculator to throw if a campaign doesn't have
    /// @dev enough rewards to start
    function getRewardsAvailable() external view returns (uint256) {
        if (address(rewardToken) != address(_stakeToken)) {
            return rewardToken.balanceOf(address(this));
        }
        return _stakeToken.balanceOf(address(this)) - _totalSupply;
    }

    /// @notice return the sum of the values returned by the contribution calculator
    /// @return total contributions of the users
    /// @dev this is the same than the totalSupply only if the contribution calculator
    /// @dev uses the staked amount as the contribution of the user which is the default behaviour
    function totalContributions() external view returns (uint256) {
        return _totalContributions;
    }

    /// @notice return the contribution of some user
    /// @param account the address of the account
    /// @return contribution of the users
    /// @dev this is the same than the balanceOf only if the contribution calculator
    /// @dev uses the staked amount as the contribution of the user which is the default behaviour
    function contributionOf(address account) external view returns (uint256) {
        return _contributions[account];
    }

    /// @notice accumulated rewards taking into account the totalContribution (see: rewardPerTokenStored)
    /// @return the accumulated total rewards
    /// @dev This value multiplied by the user contribution is the share of accumulated rewards for the user. Taking
    /// @dev into account the value of totalContributions.
    function rewardPerToken() external view returns (uint256) {
        return rewardPerTokenStored + _rewardPerToken();
    }

    /// @notice available earnings for some user
    /// @param account the address of the account
    /// @return the available earnings for the user
    function earned(address account) external view returns (uint256) {
        return rewards[account] + _earned(account, _rewardPerToken());
    }

    /// @notice accumulates the current rewards into rewardPerTokenStored and restart the reward calculator
    /// @dev calling this function make no difference. It is useful for testing and when the reward calculator
    /// @dev is changed.
    function restartRewards() external {
        _restartRewards();
    }

    /// @notice update the contribution for a user
    /// @param account the address of the account
    /// @dev if the user change his holdings (or any other parameter that affect the contribution calculation),
    /// @dev he can the reward distribution to his favor. This function must be called by an external agent ASAP to
    /// @dev update the contribution for the user. We understand the risk but the rewards are distributes slowly so
    /// @dev the user cannot affect the reward distribution heavily.
    function computeContribution(address account) external isValidAddress(account) {
        // We decide to give the user the accumulated rewards even if he cheated a little bit.
        _processRewards(account);
        _updateContribution(account);
    }

    /// @notice update the contribution for a sef of users
    /// @param accounts the addresses of the accounts to update
    /// @dev see: computeContribution
    function computeContributionInBatch(address[] calldata accounts) external {
        _restartRewards();
        for (uint256 i = 0; i < accounts.length; i++) {
            address account = accounts[i];
            if (account == address(0)) {
                continue;
            }
            _processAccountRewards(account);
            _updateContribution(account);
        }
    }

    /// @notice stake some amount into the contract
    /// @param amount the amount of tokens to stake
    /// @dev the user must approve in the stack token before calling this function
    function stake(uint256 amount)
        external
        nonReentrant
        antiDepositCheck(_msgSender())
        checkRequirements(_msgSender(), amount, _balances[_msgSender()])
    {
        require(amount > 0, "ERC20RewardPool: Cannot stake 0");

        // The first time a user stakes he cannot remove his rewards immediately.
        if (timeLockClaim.lastClaim[_msgSender()] == 0) {
            timeLockClaim.lastClaim[_msgSender()] = block.timestamp;
        }

        lockDeposit.lastDeposit[_msgSender()] = block.timestamp;

        uint256 earlierRewards = 0;

        if (_totalContributions == 0 && rewardCalculator != IRewardCalculator(address(0))) {
            earlierRewards = rewardCalculator.getRewards();
        }

        _processRewards(_msgSender());
        super._stake(amount);
        _updateContribution(_msgSender());
        require(_contributions[_msgSender()] > 0, "ERC20RewardPool: not enough contributions");

        if (earlierRewards != 0) {
            rewards[_msgSender()] = rewards[_msgSender()] + earlierRewards;
        }
        emit Staked(_msgSender(), amount);
    }

    /// @notice withdraw the stake from the contract
    /// @param amount the amount of tokens to withdraw
    /// @dev the user can withdraw his stake independently from the rewards
    function withdraw(uint256 amount) external nonReentrant {
        _processRewards(_msgSender());
        _withdrawStake(_msgSender(), amount);
        _updateContribution(_msgSender());
    }

    /// @notice withdraw the stake and the rewards from the contract
    function exit() external nonReentrant {
        _processRewards(_msgSender());
        _withdrawStake(_msgSender(), _balances[_msgSender()]);
        _withdrawRewards(_msgSender());
        _updateContribution(_msgSender());
        emit Exit(_msgSender());
    }

    /// @notice withdraw the rewards from the contract
    /// @dev the user can withdraw his stake independently from the rewards
    function getReward() external nonReentrant {
        _processRewards(_msgSender());
        _withdrawRewards(_msgSender());
        _updateContribution(_msgSender());
    }

    function _withdrawStake(address account, uint256 amount) internal antiWithdrawCheck(_msgSender()) {
        require(amount > 0, "ERC20RewardPool: Cannot withdraw 0");
        super._withdraw(amount);
        lockWithdraw.lastWithdraw[_msgSender()] = block.timestamp;
        emit Withdrawn(account, amount);
    }

    function _withdrawRewards(address account) internal timeLockClaimCheck(account) {
        uint256 reward = rewards[account];
        uint256 mod = 0;
        if (reward > 0) {
            if (amountLockClaim.claimLockEnabled == true) {
                // constrain the reward amount to the integer allowed
                mod = reward % DECIMALS_18;
                reward = reward - mod;
                require(
                    amountLockClaim.amount <= reward,
                    "ERC20RewardPool: Cannot withdraw - lockClaim.amount < reward"
                );
            }
            rewards[account] = mod;
            rewardToken.safeTransfer(account, reward);
            emit RewardPaid(account, reward);
        }
    }

    function _updateContribution(address account) internal {
        uint256 oldContribution = _contributions[account];
        _totalContributions = _totalContributions - oldContribution;
        uint256 contribution = _computeContribution(account);
        _totalContributions = _totalContributions + contribution;
        _contributions[account] = contribution;
        emit ContributionUpdated(account, contribution, oldContribution);
    }

    function _computeContribution(address account) internal returns (uint256) {
        if (contributionRules == IContributionRules(address(0))) {
            return _balances[account];
        } else {
            return contributionRules.computeMultiplier(account, _balances[account]);
        }
    }

    // Something changed (stake, withdraw, etc), we distribute current accumulated rewards and start from zero.
    // Called each time there is a change in contract state (stake, withdraw, etc).
    function _processRewards(address account) internal {
        _restartRewards();
        _processAccountRewards(account);
    }

    // Update the earnings for this specific user with what he earned until now
    function _processAccountRewards(address account) internal {
        // usually _earned takes _rewardPerToken() but in this method is zero because _restartRewards must be
        // called before _processAccountRewards
        rewards[account] = rewards[account] + _earned(account, 0);
        // restart rewards for this specific user, now earned(account) = 0
        userRewardPerTokenPaid[account] = rewardPerTokenStored;
    }

    function _restartRewards() internal {
        if (rewardCalculator != IRewardCalculator(address(0))) {
            // Distribute the accumulated rewards
            rewardPerTokenStored = rewardPerTokenStored + _rewardPerToken();
            // restart rewards so now the rewardCalculator return zero rewards
            rewardCalculator.restartRewards();
        }
    }

    function _earned(address account, uint256 rewardPerToken_) internal view returns (uint256) {
        // - userRewardPerTokenPaid[account] * _contributions[account]  / _totalContributions is the portion of
        //      rewards the last time the user changed his contribution and called _restartRewards
        //      (_totalContributions corresponds to previous value of that moment).
        // - rewardPerTokenStored * _contributions[account] is the share of the user from the
        //      accumulated rewards (from the start of time until the last call to _restartRewards) with the
        //      current value of _totalContributions
        // - _rewardPerToken() * _contributions[account]  / _totalContributions is the share of the user of the
        //      rewards from the last time anybody called _restartRewards until this moment
        //
        // The important thing to note is that at any moment in time _contributions[account] / _totalContributions is
        // the share of the user even if _totalContributions changes because of other users activity.
        return
            ((rewardPerToken_ + rewardPerTokenStored - userRewardPerTokenPaid[account]) * _contributions[account]) /
            1e24;
    }

    // This function gives the proportion of the total contribution that corresponds to each user from
    // last restartRewards call.
    // _rewardsPerToken() * _contributions[account] is the amount of extra rewards gained from last restartRewards.
    function _rewardPerToken() internal view returns (uint256) {
        if (rewardCalculator == IRewardCalculator(address(0)) || _totalContributions == 0) {
            return 0;
        }
        return (rewardCalculator.getRewards() * 1e24) / _totalContributions;
    }

    function _msgSender() internal view override(Context, ERC2771Handler) returns (address sender) {
        return ERC2771Handler._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Handler) returns (bytes calldata) {
        return ERC2771Handler._msgData();
    }
}