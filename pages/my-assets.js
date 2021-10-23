/* pages/index.js */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'

import { nftaddress, nftmarketaddress } from '../config'

import NFT from '../artifacts_json/NFT.json'
import Market from '../artifacts_json/NFTMarket.json'

export default function MyAssets() {
  const [myNfts, setMyNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
  }, [])

  async function loadNFTs() {
    console.log('here')
    /* create a generic provider and query for unsold market items */
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-mumbai.g.alchemy.com/v2/ESPbaNCPGeAcsDO5epRx61f2gPfmsbA0')
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const data = await marketContract.fetchMyNFTs()
    console.log(data)

    /*
    *  map over items returned from smart contract and format 
    *  them as well as fetch their token metadata
    */
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      console.log(i);
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))
    setMyNfts(items)
    setLoadingState('loaded') 
  }

  return (
    <div>
    {loadingState === 'loaded' && !myNfts.length ? <h1 className="px-6 py-10 text-3xl">No NFT for the time being!</h1> : 
      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: '1600px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {
              myNfts.map((nft, i) => (
                <div key={i} className="border shadow rounded-xl overflow-hidden">
                  <img src={nft.image} />
                  <div className="p-4">
                    <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                    <div style={{ height: '70px', overflow: 'hidden' }}>
                      <p className="text-gray-400">{nft.description}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-black">
                    <p className="text-2xl mb-4 font-bold text-white">Price - {nft.price}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>}
    </div>
  )
}