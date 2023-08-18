import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';

describe('Metadata Extractor Challenge', function () {
    async function deployMetadataExtractor() {
        const MetadataExtractor = await ethers.getContractFactory('MetadataExtractor');
        const metadataExtractor =  await MetadataExtractor.deploy();
        await metadataExtractor.waitForDeployment();
        return metadataExtractor;
    }

    it('The extractColor() must return proper color hex', async function () {
        const metadataExtractor = await loadFixture(deployMetadataExtractor);

        expect(
            await metadataExtractor.extractColor('0x0000000000000001018000ffd8da6bf26964af9d7eed9e03e53415d37aa96045')
        ).to.be.eq('0x8000ff');
    });
});
