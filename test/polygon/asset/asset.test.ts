import {setupAssetERC1155Tunnels, setupPolygonAsset} from './fixtures';

import {waitFor, getAssetChainIndex, setupUser} from '../../utils';
import {expect} from '../../chai-setup';
import {sendMetaTx} from '../../sendMetaTx';
import {AbiCoder} from 'ethers/lib/utils';
import {ethers} from 'hardhat';
// import {Event} from '@ethersproject/contracts';

const abiCoder = new AbiCoder();

const MOCK_DATA =
  '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000084e42535759334450000000000000000000000000000000000000000000000000';

describe('PolygonAsset.sol', function () {
  it('user sending asset to itself keep the same balance', async function () {
    const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
    const tokenId = await mintAsset(users[0].address, 10);
    await waitFor(
      PolygonAssetERC1155.connect(
        ethers.provider.getSigner(users[0].address)
      ).safeTransferFrom(users[0].address, users[0].address, tokenId, 10, '0x')
    );
    const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
      users[0].address,
      tokenId
    );
    expect(balance).to.be.equal(10);
  });

  it('user batch sending asset to itself keep the same balance', async function () {
    const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
    const tokenId = await mintAsset(users[0].address, 20);
    await waitFor(
      PolygonAssetERC1155.connect(
        ethers.provider.getSigner(users[0].address)
      ).safeBatchTransferFrom(
        users[0].address,
        users[0].address,
        [tokenId],
        [10],
        '0x'
      )
    );
    const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
      users[0].address,
      tokenId
    );
    expect(balance).to.be.equal(20);
  });

  it('user batch sending in series whose total is more than its balance', async function () {
    const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
    const tokenId = await mintAsset(users[0].address, 20);
    await waitFor(
      PolygonAssetERC1155.connect(
        ethers.provider.getSigner(users[0].address)
      ).safeBatchTransferFrom(
        users[0].address,
        users[0].address,
        [tokenId, tokenId, tokenId],
        [10, 20, 20],
        '0x'
      )
    );
    const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
      users[0].address,
      tokenId
    );
    expect(balance).to.be.equal(20);
  });

  it('user batch sending more asset than it owns should fails', async function () {
    const {users, mintAsset, PolygonAssetERC1155} = await setupPolygonAsset();
    const tokenId = await mintAsset(users[0].address, 20);
    await expect(
      PolygonAssetERC1155.connect(
        ethers.provider.getSigner(users[0].address)
      ).safeBatchTransferFrom(
        users[0].address,
        users[0].address,
        [tokenId],
        [30],
        '0x'
      )
    ).to.be.revertedWith(`BALANCE_TOO_LOW`);
  });

  it('can get the chainIndex from the tokenId', async function () {
    const {users, mintAsset} = await setupPolygonAsset();
    const tokenId = await mintAsset(users[1].address, 11);
    const chainIndex = getAssetChainIndex(tokenId);
    expect(chainIndex).to.be.equal(1);
  });

  it('can get the URI for an asset with amount 1', async function () {
    const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
    const tokenId = await mintAsset(users[1].address, 1);
    const URI = await PolygonAssetERC1155.callStatic.tokenURI(tokenId);
    expect(URI).to.be.equal(
      'ipfs://bafybeidyxh2cyiwdzczgbn4bk6g2gfi6qiamoqogw5bxxl5p6wu57g2ahy/0.json'
    );
  });

  it('can get the URI for a FT', async function () {
    const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
    const tokenId = await mintAsset(users[1].address, 11);
    const URI = await PolygonAssetERC1155.callStatic.tokenURI(tokenId);
    expect(URI).to.be.equal(
      'ipfs://bafybeidyxh2cyiwdzczgbn4bk6g2gfi6qiamoqogw5bxxl5p6wu57g2ahy/0.json'
    );
  });

  it('fails get the URI for an invalid tokeId', async function () {
    const {PolygonAssetERC1155} = await setupPolygonAsset();
    const tokenId = 42;
    await expect(
      PolygonAssetERC1155.callStatic.tokenURI(tokenId)
    ).to.be.revertedWith('NFT_!EXIST_||_FT_!MINTED');
  });

  it('can burn ERC1155 asset', async function () {
    const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
    const tokenId = await mintAsset(users[0].address, 20);
    await waitFor(
      PolygonAssetERC1155.connect(
        ethers.provider.getSigner(users[0].address)
      ).burnFrom(users[0].address, tokenId, 10)
    );
    const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
      users[0].address,
      tokenId
    );
    expect(balance).to.be.equal(10);
  });

  it('can mint and burn asset of amount 1', async function () {
    const {PolygonAssetERC1155, users, mintAsset} = await setupPolygonAsset();
    const tokenId = await mintAsset(users[0].address, 1);
    let balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
      users[0].address,
      tokenId
    );
    expect(balance).to.be.equal(1);
    await waitFor(
      PolygonAssetERC1155.connect(
        ethers.provider.getSigner(users[0].address)
      ).burnFrom(users[0].address, tokenId, 1)
    );
    balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
      users[0].address,
      tokenId
    );
    expect(balance).to.be.equal(0);
  });

  describe('PolygonAsset: MetaTransactions', function () {
    it('can transfer by metaTx', async function () {
      const {
        PolygonAssetERC1155,
        users,
        mintAsset,
        trustedForwarder,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(users[1].address, 11);

      const {to, data} = await PolygonAssetERC1155.populateTransaction[
        'safeTransferFrom(address,address,uint256,uint256,bytes)'
      ](users[1].address, users[2].address, tokenId, 10, '0x');

      await sendMetaTx(to, trustedForwarder, data, users[1].address);

      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[2].address,
        tokenId
      );
      expect(balance).to.be.equal(10);
    });

    it('fails to transfer someone else token by metaTx', async function () {
      const {
        PolygonAssetERC1155,
        users,
        mintAsset,
        trustedForwarder,
      } = await setupPolygonAsset();
      const tokenId = await mintAsset(users[1].address, 11);

      const {to, data} = await PolygonAssetERC1155.populateTransaction[
        'safeTransferFrom(address,address,uint256,uint256,bytes)'
      ](users[1].address, users[2].address, tokenId, 10, '0x');

      await sendMetaTx(to, trustedForwarder, data, users[2].address);

      const balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[2].address,
        tokenId
      );
      expect(balance).to.be.equal(0);
    });

    it('can batch-transfer by metaTx', async function () {
      const {
        PolygonAssetERC1155,
        users,
        mintAsset,
        trustedForwarder,
      } = await setupPolygonAsset();
      const tokenId1 = await mintAsset(users[1].address, 7);
      const tokenId2 = await mintAsset(users[1].address, 3);
      const tokenIds = [tokenId1, tokenId2];
      const values = [7, 3];

      const {to, data} = await PolygonAssetERC1155.populateTransaction[
        'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'
      ](users[1].address, users[2].address, tokenIds, values, '0x');

      await sendMetaTx(to, trustedForwarder, data, users[1].address);

      const balance1 = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[2].address,
        tokenId1
      );
      const balance2 = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[2].address,
        tokenId2
      );
      expect(balance1).to.be.equal(7);
      expect(balance2).to.be.equal(3);
    });
  });

  describe('Asset <> PolygonAsset: Transfer', function () {
    it.only('can transfer L2 minted assets: L2 to L1', async function () {
      const {
        AssetERC1155,
        PolygonAssetERC1155,
        MockAssetERC1155Tunnel,
        PolygonAssetERC1155Tunnel,
        users,
        deployer,
        mintAsset,
      } = await setupAssetERC1155Tunnels();
      const tokenId = await mintAsset(users[0].address, 10);
      await waitFor(
        PolygonAssetERC1155.connect(
          ethers.provider.getSigner(users[0].address)
        ).safeTransferFrom(
          users[0].address,
          users[0].address,
          tokenId,
          10,
          '0x'
        )
      );

      let balance = await PolygonAssetERC1155['balanceOf(address,uint256)'](
        users[0].address,
        tokenId
      );
      expect(balance).to.be.equal(10);

      // Transfer to L1 Tunnel
      await PolygonAssetERC1155.connect(
        ethers.provider.getSigner(users[0].address)
      ).setApprovalForAll(PolygonAssetERC1155Tunnel.address, true);

      await waitFor(
        PolygonAssetERC1155Tunnel.connect(
          ethers.provider.getSigner(users[0].address)
        ).batchTransferToL1(users[0].address, [tokenId], [10], MOCK_DATA)
      );

      // Release on L1
      const abiCoder = new AbiCoder();

      await deployer.MockAssetERC1155Tunnel.receiveMessage(
        abiCoder.encode(
          ['address', 'uint256[]', 'uint256[]', 'bytes'],
          [users[0].address, [tokenId], [10], MOCK_DATA]
        )
      );

      balance = await AssetERC1155['balanceOf(address,uint256)'](
        users[0].address,
        tokenId
      );
      expect(balance).to.be.equal(10);
    });

    //   it('', async function () {
    //     const {mainnet, polygon} = await setupMainnetAndPolygonAsset();

    //     const tokenId = await polygon.mintAsset(polygon.users[0].address, 20);

    //     const balance = await polygon.Asset['balanceOf(address,uint256)'](
    //       polygon.users[0].address,
    //       tokenId
    //     );

    //     // User withdraws tokens from Polygon
    //     const receipt = await waitFor(
    //       polygon.users[0].Asset.withdraw([tokenId], [balance])
    //     );
    //     const event = receipt?.events?.filter(
    //       (event: Event) => event.event === 'ChainExit'
    //     )[0];
    //     const tokenData = event?.args?.data;

    //     // Emulate exit call
    //     await waitFor(
    //       mainnet.predicate.exitTokens(
    //         polygon.users[0].address,
    //         [tokenId],
    //         [balance],
    //         tokenData
    //       )
    //     );

    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     const mainnetBalance = await mainnet.Asset['balanceOf(address,uint256)'](
    //       polygon.users[0].address,
    //       tokenId
    //     );
    //     const polygonBalance = await polygon.Asset['balanceOf(address,uint256)'](
    //       polygon.users[0].address,
    //       tokenId
    //     );
    //     expect(polygonBalance).to.be.equal(0);
    //     expect(mainnetBalance).to.be.equal(balance);

    //     // Ensure URI is same
    //     const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](tokenId);
    //     const polygonURI = await polygon.Asset['tokenURI(uint256)'](tokenId);
    //     expect(mainnetURI).to.be.equal(polygonURI);
    //   });
    //   it('can transfer multiple L1 minted assets: L1 to L2', async function () {
    //     const {mainnet, polygon} = await setupMainnetAndPolygonAsset();

    //     const hash =
    //       '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e';
    //     const supplies = [20, 5, 10];
    //     const tokenIds = await mainnet.mintMultiple(
    //       mainnet.users[0].address,
    //       supplies,
    //       hash
    //     );

    //     const initialMainnetBalances = [];
    //     for (let i = 0; i < tokenIds.length; i++) {
    //       const balance = await mainnet.Asset['balanceOf(address,uint256)'](
    //         mainnet.users[0].address,
    //         tokenIds[i]
    //       );
    //       initialMainnetBalances.push(balance);
    //     }

    //     // Approve ERC1155 predicate contarct
    //     await waitFor(
    //       mainnet.users[0].Asset.setApprovalForAll(
    //         mainnet.predicate.address,
    //         true
    //       )
    //     );

    //     // Generate data to be passed to Polygon
    //     // @review - is this how we're expecting to pass hash?
    //     const ipfsHashes = [hash, hash, hash];

    //     const tokenData = abiCoder.encode(
    //       ['bytes32[]', '(uint256, uint16, uint16[])[]'],
    //       [ipfsHashes, []]
    //     );

    //     const data = abiCoder.encode(
    //       ['uint256[]', 'uint256[]', 'bytes'],
    //       [tokenIds, supplies, tokenData]
    //     );

    //     // Lock tokens on ERC1155 predicate contract
    //     await waitFor(
    //       mainnet.predicate.lockTokens(
    //         mainnet.users[0].address,
    //         tokenIds,
    //         supplies,
    //         data
    //       )
    //     );

    //     // Emulate the ChildChainManager call to deposit
    //     await waitFor(
    //       polygon.childChainManager.callDeposit(mainnet.users[0].address, data)
    //     );

    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     for (let i = 0; i < tokenIds.length; i++) {
    //       const mainnetBalance = await mainnet.Asset[
    //         'balanceOf(address,uint256)'
    //       ](mainnet.users[0].address, tokenIds[i]);
    //       const polygonBalance = await polygon.Asset[
    //         'balanceOf(address,uint256)'
    //       ](mainnet.users[0].address, tokenIds[i]);
    //       // Check if balance is updated on L1 & L2
    //       expect(polygonBalance).to.be.equal(supplies[i]);
    //       expect(mainnetBalance).to.be.equal(0);
    //       // Check if correct balance is reflected on L2
    //       expect(polygonBalance).to.be.equal(initialMainnetBalances[i]);

    //       // Ensure URI is same
    //       const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       const polygonURI = await polygon.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       expect(mainnetURI).to.be.equal(polygonURI);
    //     }
    //   });
    //   it('can transfer partial supplies of L1 minted assets: L1 to L2', async function () {
    //     const {mainnet, polygon} = await setupMainnetAndPolygonAsset();

    //     const hash =
    //       '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e';
    //     const supplies = [20, 5, 10];
    //     const supplyBreakdown01 = [10, 2, 5];
    //     const supplyBreakdown02 = [10, 3, 5];
    //     const tokenIds = await mainnet.mintMultiple(
    //       mainnet.users[0].address,
    //       supplies,
    //       hash
    //     );

    //     const initialMainnetBalances = [];
    //     for (let i = 0; i < tokenIds.length; i++) {
    //       const balance = await mainnet.Asset['balanceOf(address,uint256)'](
    //         mainnet.users[0].address,
    //         tokenIds[i]
    //       );
    //       initialMainnetBalances.push(balance);
    //     }

    //     // Approve ERC1155 predicate contarct
    //     await waitFor(
    //       mainnet.users[0].Asset.setApprovalForAll(
    //         mainnet.predicate.address,
    //         true
    //       )
    //     );

    //     // Generate data to be passed to Polygon
    //     // @review - is this how we're expecting to pass hash?
    //     const ipfsHashes = [hash, hash, hash];

    //     const tokenData = abiCoder.encode(
    //       ['bytes32[]', '(uint256, uint16, uint16[])[]'],
    //       [ipfsHashes, []]
    //     );

    //     // Partial Transfer - 01
    //     let data = abiCoder.encode(
    //       ['uint256[]', 'uint256[]', 'bytes'],
    //       [tokenIds, supplyBreakdown01, tokenData]
    //     );
    //     // Lock tokens on ERC1155 predicate contract
    //     await waitFor(
    //       mainnet.predicate.lockTokens(
    //         mainnet.users[0].address,
    //         tokenIds,
    //         supplyBreakdown01,
    //         data
    //       )
    //     );
    //     // Emulate the ChildChainManager call to deposit
    //     await waitFor(
    //       polygon.childChainManager.callDeposit(mainnet.users[0].address, data)
    //     );

    //     // Partial Transfer - 02
    //     data = abiCoder.encode(
    //       ['uint256[]', 'uint256[]', 'bytes'],
    //       [tokenIds, supplyBreakdown02, tokenData]
    //     );
    //     // Lock tokens on ERC1155 predicate contract
    //     await waitFor(
    //       mainnet.predicate.lockTokens(
    //         mainnet.users[0].address,
    //         tokenIds,
    //         supplyBreakdown02,
    //         data
    //       )
    //     );
    //     // Emulate the ChildChainManager call to deposit
    //     await waitFor(
    //       polygon.childChainManager.callDeposit(mainnet.users[0].address, data)
    //     );

    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     for (let i = 0; i < tokenIds.length; i++) {
    //       const mainnetBalance = await mainnet.Asset[
    //         'balanceOf(address,uint256)'
    //       ](mainnet.users[0].address, tokenIds[i]);
    //       const polygonBalance = await polygon.Asset[
    //         'balanceOf(address,uint256)'
    //       ](mainnet.users[0].address, tokenIds[i]);
    //       // Check if balance is updated on L1 & L2
    //       expect(polygonBalance).to.be.equal(supplies[i]);
    //       expect(mainnetBalance).to.be.equal(0);
    //       // Check if correct balance is reflected on L2
    //       expect(polygonBalance).to.be.equal(initialMainnetBalances[i]);

    //       // Ensure URI is same
    //       const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       const polygonURI = await polygon.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       expect(mainnetURI).to.be.equal(polygonURI);
    //     }
    //   });
    //   it('can transfer multiple L2 minted assets: L2 to L1', async function () {
    //     const {mainnet, polygon} = await setupMainnetAndPolygonAsset();

    //     const hash =
    //       '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e';
    //     const supplies = [20, 5, 10];
    //     const tokenIds = await polygon.mintMultiple(
    //       polygon.users[0].address,
    //       supplies,
    //       hash
    //     );

    //     const initialPolygonBalances = [];
    //     for (let i = 0; i < tokenIds.length; i++) {
    //       const balance = await polygon.Asset['balanceOf(address,uint256)'](
    //         polygon.users[0].address,
    //         tokenIds[i]
    //       );
    //       initialPolygonBalances.push(balance);
    //     }

    //     // User withdraws tokens from Polygon
    //     const receipt = await waitFor(
    //       polygon.users[0].Asset.withdraw(tokenIds, supplies)
    //     );
    //     const event = receipt?.events?.filter(
    //       (event: Event) => event.event === 'ChainExit'
    //     )[0];
    //     const tokenData = event?.args?.data;

    //     // Emulate exit call
    //     await waitFor(
    //       mainnet.predicate.exitTokens(
    //         polygon.users[0].address,
    //         tokenIds,
    //         supplies,
    //         tokenData
    //       )
    //     );

    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     for (let i = 0; i < tokenIds.length; i++) {
    //       const mainnetBalance = await mainnet.Asset[
    //         'balanceOf(address,uint256)'
    //       ](polygon.users[0].address, tokenIds[i]);
    //       const polygonBalance = await polygon.Asset[
    //         'balanceOf(address,uint256)'
    //       ](polygon.users[0].address, tokenIds[i]);
    //       // Check if balance is updated on L1 & L2
    //       expect(polygonBalance).to.be.equal(0);
    //       expect(mainnetBalance).to.be.equal(supplies[i]);
    //       // Check if correct balance is reflected on L2
    //       expect(mainnetBalance).to.be.equal(initialPolygonBalances[i]);

    //       // Ensure URI is same
    //       const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       const polygonURI = await polygon.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       expect(mainnetURI).to.be.equal(polygonURI);
    //     }
    //   });
    //   it('can transfer partial supplies of L2 minted assets: L2 to L1', async function () {
    //     const {mainnet, polygon} = await setupMainnetAndPolygonAsset();

    //     const hash =
    //       '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e';
    //     const supplies = [20, 5, 10];
    //     const supplyBreakdown01 = [10, 2, 5];
    //     const supplyBreakdown02 = [10, 3, 5];
    //     const tokenIds = await polygon.mintMultiple(
    //       polygon.users[0].address,
    //       supplies,
    //       hash
    //     );

    //     const initialPolygonBalances = [];
    //     for (let i = 0; i < tokenIds.length; i++) {
    //       const balance = await polygon.Asset['balanceOf(address,uint256)'](
    //         polygon.users[0].address,
    //         tokenIds[i]
    //       );
    //       initialPolygonBalances.push(balance);
    //     }

    //     // Partial Transfer - 01
    //     // User withdraws tokens from Polygon
    //     let receipt = await waitFor(
    //       polygon.users[0].Asset.withdraw(tokenIds, supplyBreakdown01)
    //     );
    //     let event = receipt?.events?.filter(
    //       (event: Event) => event.event === 'ChainExit'
    //     )[0];
    //     let tokenData = event?.args?.data;
    //     // Emulate exit call
    //     await waitFor(
    //       mainnet.predicate.exitTokens(
    //         polygon.users[0].address,
    //         tokenIds,
    //         supplyBreakdown01,
    //         tokenData
    //       )
    //     );

    //     // Partial Transfer - 02
    //     // User withdraws tokens from Polygon
    //     receipt = await waitFor(
    //       polygon.users[0].Asset.withdraw(tokenIds, supplyBreakdown02)
    //     );
    //     event = receipt?.events?.filter(
    //       (event: Event) => event.event === 'ChainExit'
    //     )[0];
    //     tokenData = event?.args?.data;
    //     // Emulate exit call
    //     await waitFor(
    //       mainnet.predicate.exitTokens(
    //         polygon.users[0].address,
    //         tokenIds,
    //         supplyBreakdown02,
    //         tokenData
    //       )
    //     );

    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     for (let i = 0; i < tokenIds.length; i++) {
    //       const mainnetBalance = await mainnet.Asset[
    //         'balanceOf(address,uint256)'
    //       ](polygon.users[0].address, tokenIds[i]);
    //       const polygonBalance = await polygon.Asset[
    //         'balanceOf(address,uint256)'
    //       ](polygon.users[0].address, tokenIds[i]);
    //       // Check if balance is updated on L1 & L2
    //       expect(polygonBalance).to.be.equal(0);
    //       expect(mainnetBalance).to.be.equal(supplies[i]);
    //       // Check if correct balance is reflected on L2
    //       expect(mainnetBalance).to.be.equal(initialPolygonBalances[i]);

    //       // Ensure URI is same
    //       const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       const polygonURI = await polygon.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       expect(mainnetURI).to.be.equal(polygonURI);
    //     }
    //   });
    //   it('can transfer assets from multiple L1 minted batches: L1 to L2', async function () {
    //     const {mainnet, polygon} = await setupMainnetAndPolygonAsset();
    //     // First batch of tokens
    //     const hash01 =
    //       '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e';
    //     const supplies01 = [20, 5, 10];
    //     const tokenIds01 = await mainnet.mintMultiple(
    //       mainnet.users[0].address,
    //       supplies01,
    //       hash01
    //     );
    //     // Second batch of tokens
    //     const hash02 =
    //       '0xd40f1ad7abf13696d469acf4d6f191da56a246149473821aef5fd24664c1989e';
    //     const supplies02 = [5, 25];
    //     const tokenIds02 = await mainnet.mintMultiple(
    //       mainnet.users[0].address,
    //       supplies02,
    //       hash02
    //     );

    //     const initialMainnetBalances01: number[] = [];
    //     for (let i = 0; i < tokenIds01.length; i++) {
    //       const balance = await mainnet.Asset['balanceOf(address,uint256)'](
    //         mainnet.users[0].address,
    //         tokenIds01[i]
    //       );
    //       initialMainnetBalances01.push(balance);
    //     }
    //     const initialMainnetBalances02: number[] = [];
    //     for (let i = 0; i < tokenIds02.length; i++) {
    //       const balance = await mainnet.Asset['balanceOf(address,uint256)'](
    //         mainnet.users[0].address,
    //         tokenIds02[i]
    //       );
    //       initialMainnetBalances02.push(balance);
    //     }
    //     const initialMainnetBalances = initialMainnetBalances01.concat(
    //       initialMainnetBalances02
    //     );

    //     // Approve ERC1155 predicate contarct
    //     await waitFor(
    //       mainnet.users[0].Asset.setApprovalForAll(
    //         mainnet.predicate.address,
    //         true
    //       )
    //     );

    //     // Generate data to be passed to Polygon
    //     const tokenIds = tokenIds01.concat(tokenIds02);
    //     const supplies = supplies01.concat(supplies02);

    //     const ipfsHashes = [hash01, hash01, hash01, hash02, hash02];

    //     const tokenData = abiCoder.encode(
    //       ['bytes32[]', '(uint256, uint16, uint16[])[]'],
    //       [ipfsHashes, []]
    //     );

    //     const data = abiCoder.encode(
    //       ['uint256[]', 'uint256[]', 'bytes'],
    //       [tokenIds, supplies, tokenData]
    //     );
    //     // Lock tokens on ERC1155 predicate contract
    //     await waitFor(
    //       mainnet.predicate.lockTokens(
    //         mainnet.users[0].address,
    //         tokenIds,
    //         supplies,
    //         data
    //       )
    //     );
    //     // Emulate the ChildChainManager call to deposit
    //     await waitFor(
    //       polygon.childChainManager.callDeposit(mainnet.users[0].address, data)
    //     );

    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     for (let i = 0; i < tokenIds.length; i++) {
    //       const mainnetBalance = await mainnet.Asset[
    //         'balanceOf(address,uint256)'
    //       ](mainnet.users[0].address, tokenIds[i]);
    //       const polygonBalance = await polygon.Asset[
    //         'balanceOf(address,uint256)'
    //       ](mainnet.users[0].address, tokenIds[i]);
    //       // Check if balance is updated on L1 & L2
    //       expect(polygonBalance).to.be.equal(supplies[i]);
    //       expect(mainnetBalance).to.be.equal(0);
    //       // Check if correct balance is reflected on L2
    //       expect(polygonBalance).to.be.equal(initialMainnetBalances[i]);

    //       // Ensure URI is same
    //       const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       const polygonURI = await polygon.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       expect(mainnetURI).to.be.equal(polygonURI);
    //     }
    //   });
    //   it('can transfer assets from multiple L2 minted batches: L2 to L1', async function () {
    //     const {mainnet, polygon} = await setupMainnetAndPolygonAsset();
    //     // First batch of tokens
    //     const hash01 =
    //       '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e';
    //     const supplies01 = [20, 5, 10];
    //     const tokenIds01 = await polygon.mintMultiple(
    //       polygon.users[0].address,
    //       supplies01,
    //       hash01
    //     );
    //     // Second batch of tokens
    //     const hash02 =
    //       '0xd40f1ad7abf13696d469acf4d6f191da56a246149473821aef5fd24664c1989e';
    //     const supplies02 = [5, 25];
    //     const tokenIds02 = await polygon.mintMultiple(
    //       polygon.users[0].address,
    //       supplies02,
    //       hash02
    //     );

    //     const initialPolygonBalances01: number[] = [];
    //     for (let i = 0; i < tokenIds01.length; i++) {
    //       const balance = await polygon.Asset['balanceOf(address,uint256)'](
    //         polygon.users[0].address,
    //         tokenIds01[i]
    //       );
    //       initialPolygonBalances01.push(balance);
    //     }
    //     const initialPolygonBalances02: number[] = [];
    //     for (let i = 0; i < tokenIds02.length; i++) {
    //       const balance = await polygon.Asset['balanceOf(address,uint256)'](
    //         polygon.users[0].address,
    //         tokenIds02[i]
    //       );
    //       initialPolygonBalances02.push(balance);
    //     }
    //     const initialPolygonBalances = initialPolygonBalances01.concat(
    //       initialPolygonBalances02
    //     );

    //     // Generate data to be passed to Polygon
    //     const tokenIds = tokenIds01.concat(tokenIds02);
    //     const supplies = supplies01.concat(supplies02);

    //     // User withdraws tokens from Polygon
    //     const receipt = await waitFor(
    //       polygon.users[0].Asset.withdraw(tokenIds, supplies)
    //     );
    //     const event = receipt?.events?.filter(
    //       (event: Event) => event.event === 'ChainExit'
    //     )[0];
    //     const tokenData = event?.args?.data;

    //     // Emulate exit call
    //     await waitFor(
    //       mainnet.predicate.exitTokens(
    //         polygon.users[0].address,
    //         tokenIds,
    //         supplies,
    //         tokenData
    //       )
    //     );

    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     for (let i = 0; i < tokenIds.length; i++) {
    //       const mainnetBalance = await mainnet.Asset[
    //         'balanceOf(address,uint256)'
    //       ](polygon.users[0].address, tokenIds[i]);
    //       const polygonBalance = await polygon.Asset[
    //         'balanceOf(address,uint256)'
    //       ](polygon.users[0].address, tokenIds[i]);
    //       // Check if balance is updated on L1 & L2
    //       expect(mainnetBalance).to.be.equal(supplies[i]);
    //       expect(polygonBalance).to.be.equal(0);
    //       // Check if correct balance is reflected on L2
    //       expect(mainnetBalance).to.be.equal(initialPolygonBalances[i]);

    //       // Ensure URI is same
    //       const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       const polygonURI = await polygon.Asset['tokenURI(uint256)'](
    //         tokenIds[i]
    //       );
    //       expect(mainnetURI).to.be.equal(polygonURI);
    //     }
    //   });
    //   it('can return L1 minted assets: L1 to L2 to L1', async function () {
    //     const {mainnet, polygon} = await setupMainnetAndPolygonAsset();
    //     const tokenId = await mainnet.mintAsset(mainnet.users[0].address, 20);
    //     const user = await setupUser(mainnet.users[0].address, {
    //       Asset: mainnet.Asset,
    //       PolygonAsset: polygon.Asset,
    //     });

    //     const balance = await mainnet.Asset['balanceOf(address,uint256)'](
    //       user.address,
    //       tokenId
    //     );

    //     // Approve ERC1155 predicate contarct
    //     await waitFor(
    //       user.Asset.setApprovalForAll(mainnet.predicate.address, true)
    //     );

    //     // Generate data to be passed to Polygon
    //     const ipfsHashes = [
    //       '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e',
    //     ];
    //     let tokenData = abiCoder.encode(
    //       ['bytes32[]', '(uint256, uint16, uint16[])[]'],
    //       [ipfsHashes, []]
    //     );
    //     const data = abiCoder.encode(
    //       ['uint256[]', 'uint256[]', 'bytes'],
    //       [[tokenId], [balance], tokenData]
    //     );

    //     // L1 -> L2
    //     // Lock tokens on ERC1155 predicate contract
    //     await waitFor(
    //       mainnet.predicate.lockTokens(user.address, [tokenId], [20], data)
    //     );
    //     // Emulate the ChildChainManager call to deposit
    //     await waitFor(polygon.childChainManager.callDeposit(user.address, data));
    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     let mainnetBalance = await mainnet.Asset['balanceOf(address,uint256)'](
    //       user.address,
    //       tokenId
    //     );
    //     let polygonBalance = await polygon.Asset['balanceOf(address,uint256)'](
    //       user.address,
    //       tokenId
    //     );
    //     expect(polygonBalance).to.be.equal(balance);
    //     expect(mainnetBalance).to.be.equal(0);

    //     // L2 -> L1
    //     // User withdraws tokens from Polygon
    //     const receipt = await waitFor(
    //       user.PolygonAsset.withdraw([tokenId], [balance])
    //     );
    //     const event = receipt?.events?.filter(
    //       (event: Event) => event.event === 'ChainExit'
    //     )[0];
    //     tokenData = event?.args?.data;
    //     // Emulate exit call
    //     await waitFor(
    //       mainnet.predicate.exitTokens(
    //         user.address,
    //         [tokenId],
    //         [balance],
    //         tokenData
    //       )
    //     );

    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     mainnetBalance = await mainnet.Asset['balanceOf(address,uint256)'](
    //       user.address,
    //       tokenId
    //     );
    //     polygonBalance = await polygon.Asset['balanceOf(address,uint256)'](
    //       user.address,
    //       tokenId
    //     );
    //     expect(polygonBalance).to.be.equal(0);
    //     expect(mainnetBalance).to.be.equal(balance);

    //     // Ensure URI is same
    //     const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](tokenId);
    //     const polygonURI = await polygon.Asset['tokenURI(uint256)'](tokenId);
    //     expect(mainnetURI).to.be.equal(polygonURI);
    //   });
    //   it('can return L2 minted assets: L2 to L1 to L2', async function () {
    //     const {mainnet, polygon} = await setupMainnetAndPolygonAsset();

    //     const tokenId = await polygon.mintAsset(mainnet.users[0].address, 20);
    //     const user = await setupUser(mainnet.users[0].address, {
    //       Asset: mainnet.Asset,
    //       PolygonAsset: polygon.Asset,
    //     });

    //     const balance = await polygon.Asset['balanceOf(address,uint256)'](
    //       user.address,
    //       tokenId
    //     );

    //     // L2 -> L1
    //     // User withdraws tokens from Polygon
    //     const receipt = await waitFor(
    //       user.PolygonAsset.withdraw([tokenId], [balance])
    //     );
    //     const event = receipt?.events?.filter(
    //       (event: Event) => event.event === 'ChainExit'
    //     )[0];
    //     let tokenData = event?.args?.data;
    //     // Emulate exit call
    //     await waitFor(
    //       mainnet.predicate.exitTokens(
    //         user.address,
    //         [tokenId],
    //         [balance],
    //         tokenData
    //       )
    //     );
    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     let mainnetBalance = await mainnet.Asset['balanceOf(address,uint256)'](
    //       user.address,
    //       tokenId
    //     );
    //     let polygonBalance = await polygon.Asset['balanceOf(address,uint256)'](
    //       user.address,
    //       tokenId
    //     );
    //     expect(polygonBalance).to.be.equal(0);
    //     expect(mainnetBalance).to.be.equal(balance);

    //     // L1 -> L2
    //     // Approve ERC1155 predicate contarct
    //     await waitFor(
    //       user.Asset.setApprovalForAll(mainnet.predicate.address, true)
    //     );
    //     // Generate data to be passed to Polygon
    //     const ipfsHashes = [
    //       '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e',
    //     ];
    //     tokenData = abiCoder.encode(
    //       ['bytes32[]', '(uint256, uint16, uint16[])[]'],
    //       [ipfsHashes, []]
    //     );
    //     const data = abiCoder.encode(
    //       ['uint256[]', 'uint256[]', 'bytes'],
    //       [[tokenId], [balance], tokenData]
    //     );
    //     // Lock tokens on ERC1155 predicate contract
    //     await waitFor(
    //       mainnet.predicate.lockTokens(user.address, [tokenId], [balance], data)
    //     );
    //     // Emulate the ChildChainManager call to deposit
    //     await waitFor(polygon.childChainManager.callDeposit(user.address, data));
    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     mainnetBalance = await mainnet.Asset['balanceOf(address,uint256)'](
    //       user.address,
    //       tokenId
    //     );
    //     polygonBalance = await polygon.Asset['balanceOf(address,uint256)'](
    //       user.address,
    //       tokenId
    //     );
    //     expect(polygonBalance).to.be.equal(balance);
    //     expect(mainnetBalance).to.be.equal(0);

    //     // Ensure URI is same
    //     const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](tokenId);
    //     const polygonURI = await polygon.Asset['tokenURI(uint256)'](tokenId);
    //     expect(mainnetURI).to.be.equal(polygonURI);
    //   });

    //   describe('Transfer Gems and catalyst L1 to L2', function () {
    //     async function executeL1toL2Deposit(
    //       gemsAndCatalystsdata: (number | number[] | void)[]
    //     ) {
    //       const {mainnet, polygon} = await setupMainnetAndPolygonAsset();

    //       const tokenId = await mainnet.mintAsset(mainnet.users[0].address, 20);

    //       const balance = await mainnet.Asset['balanceOf(address,uint256)'](
    //         mainnet.users[0].address,
    //         tokenId
    //       );

    //       // Approve ERC1155 predicate contarct
    //       await waitFor(
    //         mainnet.users[0].Asset.setApprovalForAll(
    //           mainnet.predicate.address,
    //           true
    //         )
    //       );

    //       // Generate data to be passed to Polygon
    //       const ipfsHashes = [
    //         '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e',
    //       ];

    //       gemsAndCatalystsdata[0] = tokenId;

    //       const tokenData = abiCoder.encode(
    //         ['bytes32[]', '(uint256, uint16, uint16[])[]'],
    //         [ipfsHashes, [gemsAndCatalystsdata]]
    //       );

    //       const data = abiCoder.encode(
    //         ['uint256[]', 'uint256[]', 'bytes'],
    //         [[tokenId], [balance], tokenData]
    //       );

    //       // Lock tokens on ERC1155 predicate contract
    //       await waitFor(
    //         mainnet.predicate.lockTokens(
    //           mainnet.users[0].address,
    //           [tokenId],
    //           [20],
    //           data
    //         )
    //       );

    //       // Emulate the ChildChainManager call to deposit
    //       await waitFor(
    //         polygon.childChainManager.callDeposit(mainnet.users[0].address, data)
    //       );

    //       // Ensure balance has been updated on Asset & PolygonAsset
    //       const mainnetBalance = await mainnet.Asset[
    //         'balanceOf(address,uint256)'
    //       ](mainnet.users[0].address, tokenId);
    //       const polygonBalance = await polygon.Asset[
    //         'balanceOf(address,uint256)'
    //       ](mainnet.users[0].address, tokenId);
    //       expect(polygonBalance).to.be.equal(balance);
    //       expect(mainnetBalance).to.be.equal(0);

    //       // Ensure URI is same
    //       const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](tokenId);
    //       const polygonURI = await polygon.Asset['tokenURI(uint256)'](tokenId);
    //       expect(mainnetURI).to.be.equal(polygonURI);
    //     }

    //     it('Deposit asset from L1 to L2 with 1 catalyst legendary and 4 power gems', async function () {
    //       const {polygonAssetRegistry} = await setupMainnetAndPolygonAsset();

    //       const catalystData = [
    //         0,
    //         4,
    //         [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //       ];
    //       await executeL1toL2Deposit(catalystData);
    //       const internalRecordRegistry = await polygonAssetRegistry.getRecord(
    //         catalystData[0]
    //       );

    //       expect(internalRecordRegistry).to.eql([
    //         true,
    //         4,
    //         [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //       ]);
    //     });

    //     it('Deposit asset from L1 to L2 with 1 catalyst legendary', async function () {
    //       const {polygonAssetRegistry} = await setupMainnetAndPolygonAsset();

    //       const catalystData = [0, 4, []];
    //       await executeL1toL2Deposit(catalystData);
    //       const internalRecordRegistry = await polygonAssetRegistry.getRecord(
    //         catalystData[0]
    //       );

    //       expect(internalRecordRegistry).to.eql([
    //         true,
    //         4,
    //         [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //       ]);
    //     });

    //     it('Deposit asset from L1 to L2 with 1 catalyst legendary 1 gem defense', async function () {
    //       const {polygonAssetRegistry} = await setupMainnetAndPolygonAsset();

    //       const catalystData = [0, 4, [2]];
    //       await executeL1toL2Deposit(catalystData);
    //       const internalRecordRegistry = await polygonAssetRegistry.getRecord(
    //         catalystData[0]
    //       );

    //       expect(internalRecordRegistry).to.eql([
    //         true,
    //         4,
    //         [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //       ]);
    //     });

    //     it('Deposit asset from L1 to L2 with catalyst or gems out of bound ', async function () {
    //       await setupMainnetAndPolygonAsset();
    //       const catalystData: (number | number[] | void)[] = [0, 99, []];
    //       await expect(executeL1toL2Deposit(catalystData)).to.be.revertedWith(
    //         'CATALYST_DOES_NOT_EXIST'
    //       );
    //     });
    //     it('Deposit asset from L1 to L2 without catalyst and gems', async function () {
    //       const {
    //         mainnet,
    //         polygon,
    //         polygonAssetRegistry,
    //       } = await setupMainnetAndPolygonAsset();

    //       const tokenId = await mainnet.mintAsset(mainnet.users[0].address, 20);

    //       const balance = await mainnet.Asset['balanceOf(address,uint256)'](
    //         mainnet.users[0].address,
    //         tokenId
    //       );

    //       // Approve ERC1155 predicate contarct
    //       await waitFor(
    //         mainnet.users[0].Asset.setApprovalForAll(
    //           mainnet.predicate.address,
    //           true
    //         )
    //       );

    //       // Generate data to be passed to Polygon
    //       const ipfsHashes = [
    //         '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e',
    //       ];

    //       const tokenData = abiCoder.encode(
    //         ['bytes32[]', '(uint256, uint16, uint16[])[]'],
    //         [ipfsHashes, []]
    //       );

    //       const data = abiCoder.encode(
    //         ['uint256[]', 'uint256[]', 'bytes'],
    //         [[tokenId], [balance], tokenData]
    //       );

    //       // Lock tokens on ERC1155 predicate contract
    //       await waitFor(
    //         mainnet.predicate.lockTokens(
    //           mainnet.users[0].address,
    //           [tokenId],
    //           [20],
    //           data
    //         )
    //       );

    //       // Emulate the ChildChainManager call to deposit
    //       await waitFor(
    //         polygon.childChainManager.callDeposit(mainnet.users[0].address, data)
    //       );

    //       // Ensure balance has been updated on Asset & PolygonAsset
    //       const mainnetBalance = await mainnet.Asset[
    //         'balanceOf(address,uint256)'
    //       ](mainnet.users[0].address, tokenId);
    //       const polygonBalance = await polygon.Asset[
    //         'balanceOf(address,uint256)'
    //       ](mainnet.users[0].address, tokenId);
    //       expect(polygonBalance).to.be.equal(balance);
    //       expect(mainnetBalance).to.be.equal(0);

    //       // Ensure URI is same
    //       const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](tokenId);
    //       const polygonURI = await polygon.Asset['tokenURI(uint256)'](tokenId);
    //       expect(mainnetURI).to.be.equal(polygonURI);

    //       const internalRecordRegistry = await polygonAssetRegistry.getRecord(
    //         tokenId
    //       );

    //       expect(internalRecordRegistry[0]).to.be.equal(false);
    //     });
    //   });

    //   it('Deposit 1 asset from 20 ERC1155 L1 to L2', async function () {
    //     const {
    //       mainnet,
    //       polygon,
    //       polygonAssetRegistry,
    //     } = await setupMainnetAndPolygonAsset();

    //     const tokenId = await mainnet.mintAsset(mainnet.users[0].address, 20);

    //     // Approve ERC1155 predicate contarct
    //     await waitFor(
    //       mainnet.users[0].Asset.setApprovalForAll(
    //         mainnet.predicate.address,
    //         true
    //       )
    //     );

    //     // Generate data to be passed to Polygon
    //     const ipfsHashes = [
    //       '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e',
    //     ];

    //     const tokenData = abiCoder.encode(
    //       ['bytes32[]', '(uint256, uint16, uint16[])[]'],
    //       [ipfsHashes, []]
    //     );

    //     const data = abiCoder.encode(
    //       ['uint256[]', 'uint256[]', 'bytes'],
    //       [[tokenId], [1], tokenData]
    //     );

    //     // Lock tokens on ERC1155 predicate contract
    //     await waitFor(
    //       mainnet.predicate.lockTokens(
    //         mainnet.users[0].address,
    //         [tokenId],
    //         [20],
    //         data
    //       )
    //     );

    //     // Emulate the ChildChainManager call to deposit
    //     await waitFor(
    //       polygon.childChainManager.callDeposit(mainnet.users[0].address, data)
    //     );

    //     // Ensure balance has been updated on Asset & PolygonAsset
    //     const mainnetBalance = await mainnet.Asset['balanceOf(address,uint256)'](
    //       mainnet.users[0].address,
    //       tokenId
    //     );
    //     const polygonBalance = await polygon.Asset['balanceOf(address,uint256)'](
    //       mainnet.users[0].address,
    //       tokenId
    //     );
    //     expect(polygonBalance).to.be.equal(1);
    //     expect(mainnetBalance).to.be.equal(0);

    //     // Ensure URI is same
    //     const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](tokenId);
    //     const polygonURI = await polygon.Asset['tokenURI(uint256)'](tokenId);
    //     expect(mainnetURI).to.be.equal(polygonURI);

    //     const internalRecordRegistry = await polygonAssetRegistry.getRecord(
    //       tokenId
    //     );

    //     expect(internalRecordRegistry[0]).to.be.equal(false);
    //   });

    //   describe('Transfer Gems and catalyst L2 to L1', function () {
    //     async function executeL2toL1Deposit(
    //       gemsAndCatalystsdata: (number | number[] | void)[]
    //     ) {
    //       const {
    //         mainnet,
    //         polygon,
    //         polygonAssetRegistry,
    //       } = await setupMainnetAndPolygonAsset();

    //       const tokenId = await polygon.mintAsset(polygon.users[0].address, 20);

    //       const balance = await polygon.Asset['balanceOf(address,uint256)'](
    //         polygon.users[0].address,
    //         tokenId
    //       );

    //       // we use this function because it allows us to add gems and catalyst without having the ERC20 burnt ...
    //       // it's only for convenience
    //       polygonAssetRegistry.setCatalystWhenDepositOnOtherLayer(
    //         tokenId,
    //         gemsAndCatalystsdata[0],
    //         gemsAndCatalystsdata[1]
    //       );

    //       // User withdraws tokens from Polygon
    //       const receipt = await waitFor(
    //         polygon.users[0].Asset.withdraw([tokenId], [balance])
    //       );
    //       const event = receipt?.events?.filter(
    //         (event: Event) => event.event === 'ChainExit'
    //       )[0];
    //       const tokenData = event?.args?.data;

    //       // Emulate exit call
    //       await waitFor(
    //         mainnet.predicate.exitTokens(
    //           polygon.users[0].address,
    //           [tokenId],
    //           [balance],
    //           tokenData
    //         )
    //       );

    //       // Ensure balance has been updated on Asset & PolygonAsset
    //       const mainnetBalance = await mainnet.Asset[
    //         'balanceOf(address,uint256)'
    //       ](polygon.users[0].address, tokenId);
    //       const polygonBalance = await polygon.Asset[
    //         'balanceOf(address,uint256)'
    //       ](polygon.users[0].address, tokenId);
    //       expect(polygonBalance).to.be.equal(0);
    //       expect(mainnetBalance).to.be.equal(balance);

    //       // Ensure URI is same
    //       const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](tokenId);
    //       const polygonURI = await polygon.Asset['tokenURI(uint256)'](tokenId);
    //       expect(mainnetURI).to.be.equal(polygonURI);
    //       return tokenId;
    //     }

    //     it('Deposit asset from L2 to L1 with 1 catalyst legendary and 4 power gems', async function () {
    //       const {assetRegistry} = await setupMainnetAndPolygonAsset();

    //       const catalystData = [4, [1, 1, 1, 1]];
    //       const tokenId = await executeL2toL1Deposit(catalystData);
    //       const internalRecordRegistry = await assetRegistry.getRecord(tokenId);

    //       expect(internalRecordRegistry).to.eql([
    //         true,
    //         4,
    //         [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //       ]);
    //     });

    //     it('Deposit asset from L2 to L1 with 1 catalyst legendary', async function () {
    //       const {assetRegistry} = await setupMainnetAndPolygonAsset();

    //       const catalystData = [4, []];
    //       const tokenId = await executeL2toL1Deposit(catalystData);
    //       const internalRecordRegistry = await assetRegistry.getRecord(tokenId);

    //       expect(internalRecordRegistry).to.eql([
    //         true,
    //         4,
    //         [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //       ]);
    //     });

    //     it('Deposit asset from L2 to L1 with 1 catalyst legendary 1 gem defense', async function () {
    //       const {assetRegistry} = await setupMainnetAndPolygonAsset();

    //       const catalystData = [4, [2]];
    //       const tokenId = await executeL2toL1Deposit(catalystData);
    //       const internalRecordRegistry = await assetRegistry.getRecord(tokenId);

    //       expect(internalRecordRegistry).to.eql([
    //         true,
    //         4,
    //         [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //       ]);
    //     });

    //     it('Deposit asset from L2 to L1 without catalyst and gems', async function () {
    //       const {
    //         mainnet,
    //         polygon,
    //         assetRegistry,
    //       } = await setupMainnetAndPolygonAsset();

    //       const tokenId = await polygon.mintAsset(polygon.users[0].address, 20);
    //       const balance = await polygon.Asset['balanceOf(address,uint256)'](
    //         polygon.users[0].address,
    //         tokenId
    //       );

    //       // User withdraws tokens from Polygon
    //       const receipt = await waitFor(
    //         polygon.users[0].Asset.withdraw([tokenId], [balance])
    //       );
    //       const event = receipt?.events?.filter(
    //         (event: Event) => event.event === 'ChainExit'
    //       )[0];
    //       const tokenData = event?.args?.data;

    //       // Emulate exit call
    //       await waitFor(
    //         mainnet.predicate.exitTokens(
    //           polygon.users[0].address,
    //           [tokenId],
    //           [balance],
    //           tokenData
    //         )
    //       );

    //       // Ensure balance has been updated on Asset & PolygonAsset
    //       const mainnetBalance = await mainnet.Asset[
    //         'balanceOf(address,uint256)'
    //       ](polygon.users[0].address, tokenId);
    //       const polygonBalance = await polygon.Asset[
    //         'balanceOf(address,uint256)'
    //       ](polygon.users[0].address, tokenId);
    //       expect(polygonBalance).to.be.equal(0);
    //       expect(mainnetBalance).to.be.equal(balance);

    //       // Ensure URI is same
    //       const mainnetURI = await mainnet.Asset['tokenURI(uint256)'](tokenId);
    //       const polygonURI = await polygon.Asset['tokenURI(uint256)'](tokenId);
    //       expect(mainnetURI).to.be.equal(polygonURI);

    //       const internalRecordRegistry = await assetRegistry.getRecord(tokenId);

    //       expect(internalRecordRegistry[0]).to.be.equal(false);
    //     });
    //   });
  });
});
