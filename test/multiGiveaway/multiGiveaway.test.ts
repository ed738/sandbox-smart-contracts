import {ethers} from 'hardhat';
import {setupTestGiveaway} from './fixtures';
import {constants} from 'ethers';
import {waitFor, expectReceiptEventWithArgs, increaseTime} from '../utils';
import {expect} from '../chai-setup';

import helpers from '../../lib/merkleTreeHelper';
const {calculateMultiClaimHash} = helpers;

const zeroAddress = constants.AddressZero;
const emptyBytes32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

describe('Multi_Giveaway', function () {
  describe('Multi_Giveaway_common_functionality', function () {
    it('Admin can add a new giveaway', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContract, nftGiveawayAdmin} = setUp;

      const giveawayContractAsAdmin = await giveawayContract.connect(
        ethers.provider.getSigner(nftGiveawayAdmin)
      );

      const receipt = await waitFor(
        giveawayContractAsAdmin.addNewGiveaway(emptyBytes32, 1615194000)
      );

      const event = await expectReceiptEventWithArgs(receipt, 'NewGiveaway');
      expect(event.args[0]).to.equal(emptyBytes32);
      expect(event.args[1]).to.equal(1615194000);
    });

    it('Cannot add a new giveaway if not admin', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContract, others} = setUp;

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.addNewGiveaway(emptyBytes32, 1615194000)
      ).to.be.revertedWith('ADMIN_ONLY');
    });

    it('User can get their claimed status', async function () {
      const options = {multi: true};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContract, others, allMerkleRoots} = setUp;

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      const statuses = await giveawayContractAsUser.getClaimedStatus(
        others[0],
        allMerkleRoots
      );

      expect(statuses[0]).to.equal(false);
      expect(statuses[1]).to.equal(false);
    });

    it('Claimed status is correctly updated after allocated tokens are claimed - 2 claims of 2 claimed', async function () {
      const options = {
        mint: true,
        sand: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs: any = [];
      const userClaims = [];
      const claim = allClaims[0][0];
      const secondClaim = allClaims[1][0];
      userClaims.push(claim);
      userClaims.push(secondClaim);

      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          allTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      userMerkleRoots.push(allMerkleRoots[1]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      const statuses = await giveawayContractAsUser.getClaimedStatus(
        others[0],
        allMerkleRoots
      );

      expect(statuses[0]).to.equal(false);
      expect(statuses[1]).to.equal(false);

      await giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
        userMerkleRoots,
        userClaims,
        userProofs
      );

      const statusesAfterClaim = await giveawayContractAsUser.getClaimedStatus(
        others[0],
        allMerkleRoots
      );

      expect(statusesAfterClaim[0]).to.equal(true);
      expect(statusesAfterClaim[1]).to.equal(true);
    });

    it('Claimed status is correctly updated after allocated tokens are claimed - 1 claim of 2 claimed', async function () {
      const options = {
        mint: true,
        sand: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs: any = [];
      const userClaims = [];
      const secondClaim = allClaims[1][0];
      userClaims.push(secondClaim);
      userProofs.push(
        allTrees[1].getProof(calculateMultiClaimHash(userClaims[0]))
      );
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[1]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      const statuses = await giveawayContractAsUser.getClaimedStatus(
        others[0],
        allMerkleRoots
      );

      expect(statuses[0]).to.equal(false);
      expect(statuses[1]).to.equal(false);

      await giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
        userMerkleRoots,
        userClaims,
        userProofs
      );

      const statusesAfterClaim = await giveawayContractAsUser.getClaimedStatus(
        others[0],
        allMerkleRoots
      );

      expect(statusesAfterClaim[0]).to.equal(false);
      expect(statusesAfterClaim[1]).to.equal(true);
    });
  });
  describe('Multi_Giveaway_single_giveaway', function () {
    it('User cannot claim when test contract holds no tokens', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims, // all claims from all giveaways
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs: any = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      userClaims.push(allClaims[0][0]);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith(`can't substract more than there is`);
    });

    it('User cannot claim sand when contract does not hold any', async function () {
      const options = {
        mint: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs: any = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      userClaims.push(allClaims[0][0]);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith(`not enough fund`);
    });

    it('User can claim allocated multiple tokens from Giveaway contract', async function () {
      const options = {
        mint: true,
        sand: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        assetContract,
        landContract,
        sandContract,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs: any = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      const initBalanceAssetId1 = await assetContract[
        'balanceOf(address,uint256)'
      ](giveawayContract.address, claim.erc1155[0].ids[0]);
      expect(initBalanceAssetId1).to.equal(claim.erc1155[0].values[0]);
      const initBalanceAssetId2 = await assetContract[
        'balanceOf(address,uint256)'
      ](giveawayContract.address, claim.erc1155[0].ids[1]);
      expect(initBalanceAssetId2).to.equal(claim.erc1155[0].values[1]);
      const initBalanceAssetId3 = await assetContract[
        'balanceOf(address,uint256)'
      ](giveawayContract.address, claim.erc1155[0].ids[2]);
      expect(initBalanceAssetId3).to.equal(claim.erc1155[0].values[2]);

      const originalOwnerLandId1 = await landContract.ownerOf(0);
      expect(originalOwnerLandId1).to.equal(giveawayContract.address);
      const originalOwnerLandId2 = await landContract.ownerOf(1);
      expect(originalOwnerLandId2).to.equal(giveawayContract.address);
      const originalOwnerLandId3 = await landContract.ownerOf(2);
      expect(originalOwnerLandId3).to.equal(giveawayContract.address);
      const originalOwnerLandId4 = await landContract.ownerOf(3);
      expect(originalOwnerLandId4).to.equal(giveawayContract.address);
      const originalOwnerLandId5 = await landContract.ownerOf(4);
      expect(originalOwnerLandId5).to.equal(giveawayContract.address);
      const originalOwnerLandId6 = await landContract.ownerOf(5);
      expect(originalOwnerLandId6).to.equal(giveawayContract.address);

      const initialSandBalance = await sandContract.balanceOf(others[0]);
      expect(initialSandBalance).to.equal(0);

      await waitFor(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      );

      const updatedSandBalance = await sandContract.balanceOf(others[0]);
      expect(updatedSandBalance).to.equal(claim.erc20.amounts[0]);

      const balanceAssetId1 = await assetContract['balanceOf(address,uint256)'](
        others[0],
        claim.erc1155[0].ids[0]
      );
      expect(balanceAssetId1).to.equal(claim.erc1155[0].values[0]);
      const balanceAssetId2 = await assetContract['balanceOf(address,uint256)'](
        others[0],
        claim.erc1155[0].ids[1]
      );
      expect(balanceAssetId2).to.equal(claim.erc1155[0].values[1]);
      const balanceAssetId3 = await assetContract['balanceOf(address,uint256)'](
        others[0],
        claim.erc1155[0].ids[2]
      );
      expect(balanceAssetId3).to.equal(claim.erc1155[0].values[2]);

      const ownerLandId1 = await landContract.ownerOf(0);
      expect(ownerLandId1).to.equal(claim.to);
      const ownerLandId2 = await landContract.ownerOf(1);
      expect(ownerLandId2).to.equal(claim.to);
      const ownerLandId3 = await landContract.ownerOf(2);
      expect(ownerLandId3).to.equal(claim.to);
      const ownerLandId4 = await landContract.ownerOf(3);
      expect(ownerLandId4).to.equal(claim.to);
      const ownerLandId5 = await landContract.ownerOf(4);
      expect(ownerLandId5).to.equal(claim.to);
      const ownerLandId6 = await landContract.ownerOf(5);
      expect(ownerLandId6).to.equal(claim.to);
    });

    // it('Claimed Event is emitted for successful claim', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {giveawayContract, others, tree, claims, merkleRootHash} = setUp;

    //   const claim = claims[0];
    //   const proof = tree.getProof(calculateMultiClaimHash(claim));
    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(others[0])
    //   );

    //   const receipt = await waitFor(
    //     giveawayContractAsUser.claimMultipleTokens(merkleRootHash, claim, proof)
    //   );

    //   const claimedEvent = await expectReceiptEventWithArgs(
    //     receipt,
    //     'ClaimedMultipleTokens'
    //   );
    //   expect(claimedEvent.args[0]).to.equal(others[0]); // to

    //   expect(claimedEvent.args[1][0][0][0]).to.equal(claim.erc1155[0].ids[0]);
    //   expect(claimedEvent.args[1][0][0][1]).to.equal(claim.erc1155[0].ids[1]);
    //   expect(claimedEvent.args[1][0][0][2]).to.equal(claim.erc1155[0].ids[2]);

    //   expect(claimedEvent.args[1][0][1][0]).to.equal(claim.erc1155[0].values[0]);
    //   expect(claimedEvent.args[1][0][1][1]).to.equal(claim.erc1155[0].values[1]);
    //   expect(claimedEvent.args[1][0][1][2]).to.equal(claim.erc1155[0].values[2]);

    //   expect(claimedEvent.args[1][0][2]).to.equal(
    //     claim.erc1155[0].contractAddress
    //   );

    //   expect(claimedEvent.args[2][0][0][0]).to.equal(claim.erc721[0].ids[0]);
    //   expect(claimedEvent.args[2][0][0][1]).to.equal(claim.erc721[0].ids[1]);
    //   expect(claimedEvent.args[2][0][0][2]).to.equal(claim.erc721[0].ids[2]);
    //   expect(claimedEvent.args[2][0][0][3]).to.equal(claim.erc721[0].ids[3]);
    //   expect(claimedEvent.args[2][0][0][4]).to.equal(claim.erc721[0].ids[4]);
    //   expect(claimedEvent.args[2][0][0][5]).to.equal(claim.erc721[0].ids[5]);
    //   expect(claimedEvent.args[2][0][1]).to.equal(
    //     claim.erc721[0].contractAddress
    //   );
    //   expect(claimedEvent.args[3][0][0]).to.equal(claim.erc20.amounts[0]);
    //   expect(claimedEvent.args[3][1][0]).to.equal(
    //     claim.erc20.contractAddresses[0]
    //   );
    // });

    // it('User can claim allocated sand from Giveaway contract when there are no assets or lands allocated', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {
    //     giveawayContract,
    //     others,
    //     tree,
    //     claims,
    //     sandContract,
    //     merkleRootHash,
    //   } = setUp;

    //   const claim = claims[4];

    //   const proof = tree.getProof(calculateMultiClaimHash(claim));
    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(others[0])
    //   );

    //   const initialSandBalance = await sandContract.balanceOf(others[0]);
    //   expect(initialSandBalance).to.equal(0);

    //   await waitFor(
    //     giveawayContractAsUser.claimMultipleTokens(merkleRootHash, claim, proof)
    //   );

    //   const updatedSandBalance = await sandContract.balanceOf(others[0]);
    //   expect(updatedSandBalance).to.equal(claim.erc20.amounts[0]);
    // });

    // it('User cannot claim if they claim the wrong amount of sand', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {giveawayContract, others, tree, claims, merkleRootHash} = setUp;

    //   const badClaim = JSON.parse(JSON.stringify(claims[0])); // deep clone
    //   badClaim.erc20.amounts[0] = 250; // bad param

    //   const proof = tree.getProof(calculateMultiClaimHash(claims[0]));
    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(others[0])
    //   );

    //   await expect(
    //     giveawayContractAsUser.claimMultipleTokens(
    //       merkleRootHash,
    //       badClaim,
    //       proof
    //     )
    //   ).to.be.revertedWith('INVALID_CLAIM');
    // });

    // it('User cannot claim more than once', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {giveawayContract, others, tree, claims, merkleRootHash} = setUp;

    //   const claim = claims[0];
    //   const proof = tree.getProof(calculateMultiClaimHash(claim));
    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(others[0])
    //   );

    //   await waitFor(
    //     giveawayContractAsUser.claimMultipleTokens(merkleRootHash, claim, proof)
    //   );
    //   await expect(
    //     giveawayContractAsUser.claimMultipleTokens(merkleRootHash, claim, proof)
    //   ).to.be.revertedWith('DESTINATION_ALREADY_CLAIMED');
    // });

    // it('User cannot claim from Giveaway contract if destination is not the reserved address', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {giveawayContract, others, tree, claims, merkleRootHash} = setUp;

    //   const badClaim = JSON.parse(JSON.stringify(claims[0])); // deep clone
    //   badClaim.to = others[2]; // bad param
    //   const proof = tree.getProof(calculateMultiClaimHash(claims[0]));
    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(others[0])
    //   );

    //   await expect(
    //     giveawayContractAsUser.claimMultipleTokens(
    //       merkleRootHash,
    //       badClaim,
    //       proof
    //     )
    //   ).to.be.revertedWith('INVALID_CLAIM');
    // });

    // it('User cannot claim from Giveaway contract to destination zeroAddress', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {giveawayContract, others, tree, claims, merkleRootHash} = setUp;

    //   const badClaim = JSON.parse(JSON.stringify(claims[0])); // deep clone
    //   badClaim.to = zeroAddress; // bad param
    //   const proof = tree.getProof(calculateMultiClaimHash(claims[0]));
    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(others[0])
    //   );

    //   await expect(
    //     giveawayContractAsUser.claimMultipleTokens(
    //       merkleRootHash,
    //       badClaim,
    //       proof
    //     )
    //   ).to.be.revertedWith('INVALID_TO_ZERO_ADDRESS');
    // });

    // it('User cannot claim after the expiryTime', async function () {
    //   const options = {};
    //   const setUp = await setupTestGiveaway(options);
    //   const {giveawayContract, others, tree, claims, merkleRootHash} = setUp;

    //   const claim = claims[0];
    //   const proof = tree.getProof(calculateMultiClaimHash(claim));
    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(others[0])
    //   );

    //   await increaseTime(60 * 60 * 24 * 30 * 4);

    //   await expect(
    //     giveawayContractAsUser.claimMultipleTokens(merkleRootHash, claim, proof)
    //   ).to.be.revertedWith('CLAIM_PERIOD_IS_OVER');
    // });
  });

  describe('Multi_Giveaway_two_giveaways', function () {
    it('User cannot claim when test contract holds no tokens - multiple giveaways, 1 claim', async function () {
      const options = {multi: true};
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs: any = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      userClaims.push(allClaims[0][0]);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith(`can't substract more than there is`);
    });

    it('User cannot claim sand when contract does not hold any - multiple giveaways, 1 claim', async function () {
      const options = {
        mint: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs: any = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      userClaims.push(allClaims[0][0]);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith(`not enough fund`);
    });

    it('User can claim allocated multiple tokens from Giveaway contract - multiple giveaways, 1 claim', async function () {
      const options = {
        mint: true,
        sand: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        assetContract,
        landContract,
        sandContract,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs: any = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      const initBalanceAssetId1 = await assetContract[
        'balanceOf(address,uint256)'
      ](giveawayContract.address, claim.erc1155[0].ids[0]);
      expect(initBalanceAssetId1).to.equal(claim.erc1155[0].values[0]);
      const initBalanceAssetId2 = await assetContract[
        'balanceOf(address,uint256)'
      ](giveawayContract.address, claim.erc1155[0].ids[1]);
      expect(initBalanceAssetId2).to.equal(claim.erc1155[0].values[1]);
      const initBalanceAssetId3 = await assetContract[
        'balanceOf(address,uint256)'
      ](giveawayContract.address, claim.erc1155[0].ids[2]);
      expect(initBalanceAssetId3).to.equal(claim.erc1155[0].values[2]);

      const originalOwnerLandId1 = await landContract.ownerOf(0);
      expect(originalOwnerLandId1).to.equal(giveawayContract.address);
      const originalOwnerLandId2 = await landContract.ownerOf(1);
      expect(originalOwnerLandId2).to.equal(giveawayContract.address);
      const originalOwnerLandId3 = await landContract.ownerOf(2);
      expect(originalOwnerLandId3).to.equal(giveawayContract.address);
      const originalOwnerLandId4 = await landContract.ownerOf(3);
      expect(originalOwnerLandId4).to.equal(giveawayContract.address);
      const originalOwnerLandId5 = await landContract.ownerOf(4);
      expect(originalOwnerLandId5).to.equal(giveawayContract.address);
      const originalOwnerLandId6 = await landContract.ownerOf(5);
      expect(originalOwnerLandId6).to.equal(giveawayContract.address);

      const initialSandBalance = await sandContract.balanceOf(others[0]);
      expect(initialSandBalance).to.equal(0);

      await waitFor(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      );

      const updatedSandBalance = await sandContract.balanceOf(others[0]);
      expect(updatedSandBalance).to.equal(claim.erc20.amounts[0]);

      const balanceAssetId1 = await assetContract['balanceOf(address,uint256)'](
        others[0],
        claim.erc1155[0].ids[0]
      );
      expect(balanceAssetId1).to.equal(claim.erc1155[0].values[0]);
      const balanceAssetId2 = await assetContract['balanceOf(address,uint256)'](
        others[0],
        claim.erc1155[0].ids[1]
      );
      expect(balanceAssetId2).to.equal(claim.erc1155[0].values[1]);
      const balanceAssetId3 = await assetContract['balanceOf(address,uint256)'](
        others[0],
        claim.erc1155[0].ids[2]
      );
      expect(balanceAssetId3).to.equal(claim.erc1155[0].values[2]);

      const ownerLandId1 = await landContract.ownerOf(0);
      expect(ownerLandId1).to.equal(claim.to);
      const ownerLandId2 = await landContract.ownerOf(1);
      expect(ownerLandId2).to.equal(claim.to);
      const ownerLandId3 = await landContract.ownerOf(2);
      expect(ownerLandId3).to.equal(claim.to);
      const ownerLandId4 = await landContract.ownerOf(3);
      expect(ownerLandId4).to.equal(claim.to);
      const ownerLandId5 = await landContract.ownerOf(4);
      expect(ownerLandId5).to.equal(claim.to);
      const ownerLandId6 = await landContract.ownerOf(5);
      expect(ownerLandId6).to.equal(claim.to);
    });

    it('User can claim allocated multiple tokens from Giveaway contract - multiple giveaways, 2 claims', async function () {
      const options = {
        mint: true,
        sand: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        assetContract,
        landContract,
        sandContract,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs: any = [];
      const userClaims = [];
      const claim = allClaims[0][0];
      const secondClaim = allClaims[1][0];
      userClaims.push(claim);
      userClaims.push(secondClaim);

      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          allTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      userMerkleRoots.push(allMerkleRoots[1]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      // Claim 1

      const initBalanceAssetId1 = await assetContract[
        'balanceOf(address,uint256)'
      ](giveawayContract.address, claim.erc1155[0].ids[0]);
      expect(initBalanceAssetId1).to.equal(claim.erc1155[0].values[0]);
      const initBalanceAssetId2 = await assetContract[
        'balanceOf(address,uint256)'
      ](giveawayContract.address, claim.erc1155[0].ids[1]);
      expect(initBalanceAssetId2).to.equal(claim.erc1155[0].values[1]);
      const initBalanceAssetId3 = await assetContract[
        'balanceOf(address,uint256)'
      ](giveawayContract.address, claim.erc1155[0].ids[2]);
      expect(initBalanceAssetId3).to.equal(claim.erc1155[0].values[2]);

      const originalOwnerLandId1 = await landContract.ownerOf(0);
      expect(originalOwnerLandId1).to.equal(giveawayContract.address);
      const originalOwnerLandId2 = await landContract.ownerOf(1);
      expect(originalOwnerLandId2).to.equal(giveawayContract.address);
      const originalOwnerLandId3 = await landContract.ownerOf(2);
      expect(originalOwnerLandId3).to.equal(giveawayContract.address);
      const originalOwnerLandId4 = await landContract.ownerOf(3);
      expect(originalOwnerLandId4).to.equal(giveawayContract.address);
      const originalOwnerLandId5 = await landContract.ownerOf(4);
      expect(originalOwnerLandId5).to.equal(giveawayContract.address);
      const originalOwnerLandId6 = await landContract.ownerOf(5);
      expect(originalOwnerLandId6).to.equal(giveawayContract.address);

      const initialSandBalance = await sandContract.balanceOf(others[0]);
      expect(initialSandBalance).to.equal(0);

      // Claim 2: TODO:

      await waitFor(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      );

      // const updatedSandBalance = await sandContract.balanceOf(others[0]);
      // expect(updatedSandBalance).to.equal(claim.erc20.amounts[0]);

      // const balanceAssetId1 = await assetContract['balanceOf(address,uint256)'](
      //   others[0],
      //   claim.erc1155[0].ids[0]
      // );
      // expect(balanceAssetId1).to.equal(claim.erc1155[0].values[0]);
      // const balanceAssetId2 = await assetContract['balanceOf(address,uint256)'](
      //   others[0],
      //   claim.erc1155[0].ids[1]
      // );
      // expect(balanceAssetId2).to.equal(claim.erc1155[0].values[1]);
      // const balanceAssetId3 = await assetContract['balanceOf(address,uint256)'](
      //   others[0],
      //   claim.erc1155[0].ids[2]
      // );
      // expect(balanceAssetId3).to.equal(claim.erc1155[0].values[2]);

      // const ownerLandId1 = await landContract.ownerOf(0);
      // expect(ownerLandId1).to.equal(claim.to);
      // const ownerLandId2 = await landContract.ownerOf(1);
      // expect(ownerLandId2).to.equal(claim.to);
      // const ownerLandId3 = await landContract.ownerOf(2);
      // expect(ownerLandId3).to.equal(claim.to);
      // const ownerLandId4 = await landContract.ownerOf(3);
      // expect(ownerLandId4).to.equal(claim.to);
      // const ownerLandId5 = await landContract.ownerOf(4);
      // expect(ownerLandId5).to.equal(claim.to);
      // const ownerLandId6 = await landContract.ownerOf(5);
      // expect(ownerLandId6).to.equal(claim.to);

      // Claim 2: TODO:
    });
  });
});

// TODO: multi erc20 - add cats and gems