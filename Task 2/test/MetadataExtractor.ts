import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { MetadataExtractor, MetadataExtractor__factory } from "../typechain-types";

const NFT_METADATA: any = '0x0000000000000001018000ffd8da6bf26964af9d7eed9e03e53415d37aa96045';
const EXPECTED_RESULT: string = '0x8000ff';

describe('Metadata Extractor Challenge', function () {
    async function deployMetadataExtractor(): Promise<MetadataExtractor> {
        const MetadataExtractor: MetadataExtractor__factory = await ethers.getContractFactory('MetadataExtractor');
        const metadataExtractor: MetadataExtractor =  await MetadataExtractor.deploy();
        await metadataExtractor.waitForDeployment();
        return metadataExtractor;
    }

    it('The extractColor() must return proper color hex', async function () {
        const metadataExtractor: MetadataExtractor = await loadFixture(deployMetadataExtractor);

        expect(await metadataExtractor.extractColor(NFT_METADATA)).to.be.eq(EXPECTED_RESULT);
    });
});
