import {setupTestEstateBaseToken} from './fixtures';
import {assert, expect} from '../chai-setup';
import {BigNumber} from 'ethers';
import {Event} from '@ethersproject/contracts';
import {getFullTile, setRectangle, tileWithCoordToJS} from '../map/fixtures';
import {AddressZero} from '@ethersproject/constants';
import {interfaceSignature} from '../utils';

describe('Estate base token test', function () {
  it('test initial values', async function () {
    const {
      other,
      trustedForwarder,
      estateDefaultAdmin,
      estateContractAsDeployer,
      chainIndex,
      name,
      symbol,
      landContractAsDeployer,
    } = await setupTestEstateBaseToken();
    expect(
      BigNumber.from(await estateContractAsDeployer.getLandToken())
    ).to.be.equal(landContractAsDeployer.address);
    expect(
      BigNumber.from(await estateContractAsDeployer.getNextId())
    ).to.be.equal(0);
    expect(
      BigNumber.from(await estateContractAsDeployer.getChainIndex())
    ).to.be.equal(chainIndex);
    expect(await estateContractAsDeployer.name()).to.be.equal(name);
    expect(await estateContractAsDeployer.symbol()).to.be.equal(symbol);
    expect(await estateContractAsDeployer.isTrustedForwarder(trustedForwarder))
      .to.be.true;
    expect(await estateContractAsDeployer.isTrustedForwarder(other)).to.be
      .false;
    const DEFAULT_ADMIN_ROLE = await estateContractAsDeployer.DEFAULT_ADMIN_ROLE();
    expect(
      await estateContractAsDeployer.hasRole(
        DEFAULT_ADMIN_ROLE,
        estateDefaultAdmin
      )
    ).to.be.true;
    expect(await estateContractAsDeployer.hasRole(DEFAULT_ADMIN_ROLE, other)).to
      .be.false;
  });
  describe('roles', function () {
    describe('admin', function () {
      it('admin should be able to setBaseURI and setLandToken', async function () {
        const {
          other,
          estateAdmin,
          estateContractAsAdmin,
        } = await setupTestEstateBaseToken();

        expect(await estateContractAsAdmin.getBaseUri()).to.be.equal('');
        const uri = 'https://bla';
        await expect(estateContractAsAdmin.setBaseURI(uri))
          .to.emit(estateContractAsAdmin, 'EstateBaseUrlChanged')
          .withArgs(estateAdmin, '', uri);
        expect(await estateContractAsAdmin.getBaseUri()).to.be.equal(uri);

        const landToken = await estateContractAsAdmin.getLandToken();
        expect(landToken).not.to.be.equal(other);
        await expect(estateContractAsAdmin.setLandToken(other))
          .to.emit(estateContractAsAdmin, 'EstateLandTokenChanged')
          .withArgs(estateAdmin, landToken, other);
        expect(await estateContractAsAdmin.getLandToken()).to.be.equal(other);
      });
      it('other should fail to setLandToken and setBaseURI', async function () {
        const {other, estateContractAsOther} = await setupTestEstateBaseToken();
        await expect(estateContractAsOther.setBaseURI(other)).to.revertedWith(
          'not admin'
        );
        await expect(estateContractAsOther.setLandToken(other)).to.revertedWith(
          'not admin'
        );
      });
      it('other should fail to setLandToken if address is invalid', async function () {
        const {estateContractAsAdmin} = await setupTestEstateBaseToken();
        await expect(
          estateContractAsAdmin.setLandToken(AddressZero)
        ).to.revertedWith('invalid address');
      });
    });
  });
  describe('minter used by the estate tunnel', function () {
    it('minter should be able to mintEstate', async function () {
      const {
        other,
        estateMinter,
        estateContractAsMinter,
      } = await setupTestEstateBaseToken();
      // Used to get a TileWithCoord[]
      const tiles = await estateContractAsMinter.burnEstate(other, 144);
      const receipt = await (
        await estateContractAsMinter.mintEstate(other, tiles)
      ).wait();
      const events = receipt.events.filter(
        (v: Event) => v.event === 'EstateBridgeMinted'
      );
      assert.equal(events.length, 1);
      const estateId = events[0].args['estateId'];
      expect(events[0].args['operator']).to.be.equal(estateMinter);
      expect(events[0].args['to']).to.be.equal(other);
      const lands = events[0].args['lands'];
      expect(lands.length).to.be.equal(1);
      const l = tileWithCoordToJS(lands[0]);
      expect(l.x).to.be.equal(144 / 24);
      expect(l.y).to.be.equal(144 / 24);
      expect(l.tile).to.be.eql(getFullTile());
      expect(await estateContractAsMinter.ownerOf(estateId)).to.be.equal(other);
    });
    it('other should fail to mintEstate', async function () {
      const {other, estateContractAsOther} = await setupTestEstateBaseToken();
      await expect(estateContractAsOther.mintEstate(other, [])).to.revertedWith(
        'not authorized'
      );
    });
  });
  describe('create', function () {
    it('create an estate', async function () {
      const {
        other,
        estateContractAsOther,
        chainIndex,
        mintQuad,
        landContractAsOther,
      } = await setupTestEstateBaseToken();
      await landContractAsOther.setApprovalForAll(
        estateContractAsOther.address,
        true
      );
      await mintQuad(other, 24, 240, 120);

      const nextId = BigNumber.from(await estateContractAsOther.getNextId());

      const size = BigNumber.from(24);
      const x = BigNumber.from(240);
      const y = BigNumber.from(120);
      const quads = [[size], [x], [y]];
      const receipt = await (await estateContractAsOther.create(quads)).wait();
      expect(await estateContractAsOther.getNextId()).to.be.equal(
        nextId.add(1)
      );
      const events = receipt.events.filter(
        (v: Event) => v.event === 'EstateTokenCreated'
      );
      assert.equal(events.length, 1);
      const estateId = await estateContractAsOther.packId(
        nextId.add(1),
        chainIndex,
        1
      );
      expect(events[0].args['estateId']).to.be.equal(estateId);
      expect(events[0].args['user']).to.be.equal(other);
      const lands = events[0].args['lands'];
      expect(lands.length).to.be.equal(1);
      const l = tileWithCoordToJS(lands[0]);
      expect(l.x).to.be.equal(240 / 24);
      expect(l.y).to.be.equal(120 / 24);
      expect(l.tile).to.be.eql(getFullTile());
      expect(await estateContractAsOther.ownerOf(estateId)).to.be.equal(other);

      const storageId = await estateContractAsOther.getStorageId(estateId);
      expect(
        await estateContractAsOther.getCurrentEstateId(storageId)
      ).to.be.equal(estateId);
      expect(
        await estateContractAsOther.getOwnerOfStorage(storageId)
      ).to.be.equal(other);
      expect(
        await estateContractAsOther.getCurrentEstateId(estateId)
      ).to.be.equal(estateId);
      expect(
        await estateContractAsOther.getOwnerOfStorage(estateId)
      ).to.be.equal(other);
      expect(await estateContractAsOther.getLandCount(estateId)).to.be.equal(
        24 * 24
      );
      expect(await estateContractAsOther.getLandLength(estateId)).to.be.equal(
        1
      );
      const tiles = await estateContractAsOther.getLandAt(estateId, 0, 1);

      expect(tileWithCoordToJS(tiles[0])).to.be.eql({
        x: x.div(24),
        y: y.div(24),
        tile: setRectangle(x.mod(24), y.mod(24), size, size),
      });
      expect(
        await estateContractAsOther.contain(
          estateId,
          await estateContractAsOther.translateSquare(x, y, 1)
        )
      ).to.be.true;
      expect(
        await estateContractAsOther.contain(
          estateId,
          await estateContractAsOther.translateSquare(x.add(24), y, 1)
        )
      ).to.be.false;
    });
    it('should fail to create an empty estate', async function () {
      const {estateContractAsOther} = await setupTestEstateBaseToken();
      await expect(estateContractAsOther.create([[], [], []])).to.revertedWith(
        'nothing to add'
      );
    });
    it('should fail to create with invalid quads (different length)', async function () {
      const {
        estateContractAsOther,
        mintQuad,
        other,
        landContractAsOther,
      } = await setupTestEstateBaseToken();
      await landContractAsOther.setApprovalForAll(
        estateContractAsOther.address,
        true
      );
      await mintQuad(other, 24, 240, 120);
      const sizes = [24, 24];
      const xs = [240, 240];
      const ys = [120];
      await expect(
        estateContractAsOther.create([sizes, xs, ys])
      ).to.revertedWith('invalid data');
    });
    it('should fail to create using the same land', async function () {
      const {
        estateContractAsOther,
        mintQuad,
        other,
        landContractAsOther,
      } = await setupTestEstateBaseToken();
      await landContractAsOther.setApprovalForAll(
        estateContractAsOther.address,
        true
      );
      await mintQuad(other, 24, 240, 120);
      const sizes = [24];
      const xs = [240];
      const ys = [120];
      await estateContractAsOther.create([sizes, xs, ys]);
      await expect(
        estateContractAsOther.create([sizes, xs, ys])
      ).to.revertedWith('not owner of all sub quads not parent quad');
    });
    it('should fail if quads are not adjacent', async function () {
      const {
        estateContractAsOther,
        landContractAsOther,
        mintQuad,
        other,
      } = await setupTestEstateBaseToken();
      await landContractAsOther.setApprovalForAll(
        estateContractAsOther.address,
        true
      );
      await mintQuad(other, 24, 240, 120);
      await mintQuad(other, 24, 240 + 24, 120 + 24);
      const sizes = [24, 24];
      const xs = [240, 240 + 24];
      const ys = [120, 120 + 24];
      await expect(
        estateContractAsOther.create([sizes, xs, ys])
      ).to.revertedWith('not adjacent');
    });
  });
  describe('add land', function () {
    it('create an estate then add a single land', async function () {
      const {
        estateContractAsOther,
        mintApproveAndCreateAsOther,
        mintQuad,
        other,
      } = await setupTestEstateBaseToken();
      const {estateId} = await mintApproveAndCreateAsOther(24, 240, 120);
      const size = 24;
      const x = 240 + 24;
      const y = 120;
      const quads = [[size], [x], [y]];
      await mintQuad(other, size, x, y);

      const receipt = await (
        await estateContractAsOther.addLand(estateId, quads)
      ).wait();
      const events = receipt.events.filter(
        (v: Event) => v.event === 'EstateTokenLandsAdded'
      );
      assert.equal(events.length, 1);
      expect(events[0].args['estateId']).to.be.equal(estateId);
      const newId = await estateContractAsOther.incrementTokenId(estateId);
      expect(events[0].args['newId']).to.be.equal(newId);
      expect(events[0].args['user']).to.be.equal(other);
      const lands = events[0].args['lands'];
      expect(lands.length).to.be.equal(2);
      const l1 = tileWithCoordToJS(lands[0]);
      expect(l1.x).to.be.equal(240 / 24);
      expect(l1.y).to.be.equal(120 / 24);
      expect(l1.tile).to.be.eql(getFullTile());
      const l2 = tileWithCoordToJS(lands[1]);
      expect(l2.x).to.be.equal((240 + 24) / 24);
      expect(l2.y).to.be.equal(120 / 24);
      expect(l2.tile).to.be.eql(getFullTile());
    });
    it('create an estate then add a multiple lands', async function () {
      const {
        estateContractAsOther,
        mintApproveAndCreateAsOther,
        mintQuad,
        other,
      } = await setupTestEstateBaseToken();
      const {estateId} = await mintApproveAndCreateAsOther(24, 240, 120);
      await mintQuad(other, 24, 240, 120 + 24);
      await mintQuad(other, 24, 240, 120 - 24);
      const quads = [
        [24, 24],
        [240, 240],
        [120 + 24, 120 - 24],
      ];
      const receipt = await (
        await estateContractAsOther.addLand(estateId, quads)
      ).wait();
      const events = receipt.events.filter(
        (v: Event) => v.event === 'EstateTokenLandsAdded'
      );
      assert.equal(events.length, 1);
      expect(events[0].args['estateId']).to.be.equal(estateId);
      expect(events[0].args['user']).to.be.equal(other);
      const newId = await estateContractAsOther.incrementTokenId(estateId);
      expect(events[0].args['newId']).to.be.equal(newId);
      const lands = events[0].args['lands'];
      expect(lands.length).to.be.equal(3);
      const l1 = tileWithCoordToJS(lands[0]);
      expect(l1.x).to.be.equal(240 / 24);
      expect(l1.y).to.be.equal(120 / 24);
      expect(l1.tile).to.be.eql(getFullTile());
      const l2 = tileWithCoordToJS(lands[1]);
      expect(l2.x).to.be.equal(240 / 24);
      expect(l2.y).to.be.equal((120 + 24) / 24);
      expect(l2.tile).to.be.eql(getFullTile());
      const l3 = tileWithCoordToJS(lands[2]);
      expect(l3.x).to.be.equal(240 / 24);
      expect(l3.y).to.be.equal((120 - 24) / 24);
      expect(l3.tile).to.be.eql(getFullTile());
    });
    it('should fail to addLand if quads are empty', async function () {
      const {
        estateContractAsOther,
        mintApproveAndCreateAsOther,
      } = await setupTestEstateBaseToken();
      const {estateId} = await mintApproveAndCreateAsOther(24, 240, 120);
      await expect(
        estateContractAsOther.addLand(estateId, [[], [], []])
      ).to.revertedWith('nothing to add');
    });
    it('should fail to add if quads are not adjacent', async function () {
      const {
        estateContractAsOther,
        mintQuad,
        other,
        mintApproveAndCreateAsOther,
      } = await setupTestEstateBaseToken();
      const {estateId} = await mintApproveAndCreateAsOther(24, 240, 120);
      await mintQuad(other, 24, 240 + 24, 120 + 24);
      await mintQuad(other, 24, 240 + 24, 120 - 24);
      // Single landa
      await expect(
        estateContractAsOther.addLand(estateId, [[24], [240 + 24], [120 + 24]])
      ).to.revertedWith('not adjacent');
      // Multiple landas
      await expect(
        estateContractAsOther.addLand(estateId, [
          [24, 24],
          [240 + 24, 240 + 24],
          [120 + 24, 120 - 24],
        ])
      ).to.revertedWith('not adjacent');
    });
    it('should fail if not the owner', async function () {
      const {
        deployer,
        estateContractAsDeployer,
        mintQuad,
        mintApproveAndCreateAsOther,
      } = await setupTestEstateBaseToken();
      const {estateId} = await mintApproveAndCreateAsOther(24, 240, 120);
      await mintQuad(deployer, 24, 240 + 24, 120);
      await expect(
        estateContractAsDeployer.addLand(estateId, [[24], [240 + 24], [120]])
      ).to.revertedWith('caller is not owner nor approved');
    });
  });
  it('estate contract is a valid ERC721/land receiver', async function () {
    const {estateContractAsOther} = await setupTestEstateBaseToken();
    // IERC721ReceiverUpgradeable
    expect(
      await estateContractAsOther.supportsInterface(
        interfaceSignature(estateContractAsOther, 'onERC721Received')
      )
    ).to.be.true;
    // IERC721MandatoryTokenReceiver
    expect(
      await estateContractAsOther.supportsInterface(
        interfaceSignature(estateContractAsOther, [
          'onERC721Received',
          'onERC721BatchReceived',
        ])
      )
    ).to.be.true;

    expect(
      await estateContractAsOther.onERC721Received(
        AddressZero,
        AddressZero,
        0,
        []
      )
    ).to.be.equal(
      interfaceSignature(estateContractAsOther, 'onERC721Received')
    );
    expect(
      await estateContractAsOther.onERC721BatchReceived(
        AddressZero,
        AddressZero,
        [],
        []
      )
    ).to.be.equal(
      interfaceSignature(estateContractAsOther, 'onERC721BatchReceived')
    );
  });
});
