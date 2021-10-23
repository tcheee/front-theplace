import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import { nftaddress, nftmarketaddress } from '../config'

import NFT from '../artifacts_json/NFT.json'
import Market from '../artifacts_json/NFTMarket.json'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

export default function CreateItemPage() {
    const [fileURL, setFileURL] = useState('');
    const [formInput, setFormInput] = useState({price: '', name: '', description: ''});
    const router = useRouter();

    async function onChange(e) {
        const file = e.target.files[0];
        try {
            const added = await client.add(
                file,
                {
                    progress: (prog) => console.log("received: " + prog)
                }
            )
            setFileURL(`https://ipfs.infura.io/ipfs/${added.path}`);

        } catch (err) {
            console.log(err);
        }
    }

    async function createSale(url) {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner()

        let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
        let transaction = await contract.createToken(url);
        let tx = await transaction.wait();

        let tokenId = tx.events[0].args[2].toNumber();
        const price = ethers.utils.parseUnits(formInput.price, 'ether');

        let marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
        let listingPrice = await marketContract.getListingPrice();
        listingPrice = listingPrice.toString();

        transaction = await marketContract.createMarketItem(nftaddress, tokenId, price, {value: listingPrice});
        await transaction.wait();

        router.push('/');
    }

    async function createItem() {
        console.log('let create an item')
        const {name, description, price } = formInput;
        if (!name|| !description || !price || !fileURL) return;

        const data = JSON.stringify({
            name, description, image: fileURL
        })

        try {
            const added = await client.add(data);
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            createSale(url);
        } catch (err) {
            console.log(err);
        }

    }

    return (
        <div className="flex justify-center">
        <div className="w-1/2 flex flex-col pb-12">
          <input 
            placeholder="Asset Name"
            className="mt-8 border rounded p-4"
            onChange={e => setFormInput({ ...formInput, name: e.target.value })}
          />
          <textarea
            placeholder="Asset Description"
            className="mt-2 border rounded p-4"
            onChange={e => setFormInput({ ...formInput, description: e.target.value })}
          />
          <input
            placeholder="Asset Price in Eth"
            className="mt-2 border rounded p-4"
            onChange={e => setFormInput({ ...formInput, price: e.target.value })}
          />
          <input
            type="file"
            name="Asset"
            className="my-4"
            onChange={onChange}
          />
          {
            fileURL && (
              <img className="rounded mt-4" width="350" src={fileURL} />
            )
          }
          <button onClick={() => createItem()} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
            Create Digital Item
          </button>
        </div>
      </div>
    )
 }