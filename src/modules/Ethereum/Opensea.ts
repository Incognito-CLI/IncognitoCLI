import { ethers, utils } from 'ethers';
import 'colorts/lib/string';
import { sleep } from '../../utils/misc';
import { got } from '../../utils/TLS/GotTLS';
import { log } from '../../utils/logger';
import { OpenSeaPort, Network } from 'opensea-js';
import HDWalletProvider from '@truffle/hdwallet-provider';

// this stuff is nasty - banana
export default class Sniper {
    public totalPrice: any;
	public mintFunction: any;
	public parameters: any;
	public privateKey: any;
	public alchemyKey: any;
	public contractId: any;
	public webhook: any;
	public abiJson: any;
	public maxFeeGas: any;
	public signer: any;
	public walletAddress: any;
	public mintContract: any;
	public parametersDefault: any;
	public gasPriceMode: any;
    public providerUrl: any;
    public taskProvider: any;
    public taskWallet: ethers.Wallet | undefined;
    public parsedABI: ethers.utils.Interface | undefined;
    public transaction: string | undefined;
    public maxPriority: any;
    public gasLimit: any;
    public seaport: OpenSeaPort | undefined;
    public osProvider: HDWalletProvider | undefined;

    constructor(task: any) {
        this.totalPrice = task.mintPrice;
        this.mintFunction = task.mintFunction; 
        this.parameters = task.mintParameters; 
        this.privateKey = task.privatekey;
        this.providerUrl = task.providerUrl;
        this.contractId = task.contractAddress; 
        this.maxFeeGas = task.maxFeeGas;
        this.maxPriority = task.maxPriority;
        this.gasLimit = task.gasLimit;
    }
    
    async start() {
        try {
            await this.initialize();
            await this.getTaskWallet();
            await this.monitor();
        } catch (error) {
            await sleep(2500);
            this.start();
        }
    }

    async initialize() {
        try {
            this.taskProvider = new ethers.providers.JsonRpcProvider(this.providerUrl);
            this.osProvider = new HDWalletProvider(this.privateKey, this.providerUrl);
            this.seaport = new OpenSeaPort(this.osProvider, {
                networkName: Network.Main,
                apiKey: `2994802c1238407bbd86f3700070703b`,
            }, (arg) => {});
        } catch (error) {
            log('error', `Error initializing task: ${error}`.red);
        }
    }

    async getTaskWallet() {
        try {
            log('misc', `Connecting to wallet...`);
            this.taskWallet = new ethers.Wallet(this.privateKey, this.taskProvider);
        } catch (error) {
            log('error', `Error connecting to wallet: ${error}`);
        }
    }

    async monitor() {
        try {
            while (true) {
                log('misc', `Monitoring: ${this.contractId}`);
                const response = await got.post("https://api.opensea.io/graphql/", {
                    headers: {
                        "accept-language": "en-US,en;q=0.9",
                        "Cache-Control":'private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
                        "content-type": "application/json",
                        "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"97\", \"Chromium\";v=\"97\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-site",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
                        "x-api-key": "2f6f419a083c46de9d83ce3dbe7db601",
                        "x-build-id": "BBoIbfl7o7p7qFpNB31WS",
                        "x-signed-query": "ac90cef79e9898a9e0d2dea265a5355bd39307f6ecd89239bdc6a5a11c408bc8",
                        "Referer": "https://opensea.io/",
                        "Referrer-Policy": "strict-origin"
                    },
                    body: JSON.stringify({
                        id: "AssetSearchQuery",
                        query: `query AssetSearchQuery(\n  $categories: [CollectionSlug!]\n  $chains: [ChainScalar!]\n  $collection: CollectionSlug\n  $collectionQuery: String\n  $collectionSortBy: CollectionSort\n  $collections: [CollectionSlug!]\n  $count: Int\n  $cursor: String\n  $identity: IdentityInputType\n  $includeHiddenCollections: Boolean\n  $numericTraits: [TraitRangeType!]\n  $paymentAssets: [PaymentAssetSymbol!]\n  $priceFilter: PriceFilterType\n  $query: String\n  $resultModel: SearchResultModel\n  $showContextMenu: Boolean = false\n  $shouldShowQuantity: Boolean = false\n  $sortAscending: Boolean\n  $sortBy: SearchSortBy\n  $stringTraits: [TraitInputType!]\n  $toggles: [SearchToggle!]\n  $creator: IdentityInputType\n  $assetOwner: IdentityInputType\n  $isPrivate: Boolean\n  $safelistRequestStatuses: [SafelistRequestStatus!]\n) {\n  query {\n    ...AssetSearch_data_2hBjZ1\n  }\n}\n\nfragment AssetCardAnnotations_assetBundle on AssetBundleType {\n  assetCount\n}\n\nfragment AssetCardAnnotations_asset_3Aax2O on AssetType {\n  assetContract {\n    chain\n    id\n  }\n  decimals\n  ownedQuantity(identity: $identity) @include(if: $shouldShowQuantity)\n  relayId\n  favoritesCount\n  isDelisted\n  isFavorite\n  isFrozen\n  hasUnlockableContent\n  ...AssetCardBuyNow_data\n  orderData {\n    bestAsk {\n      orderType\n      relayId\n      maker {\n        address\n      }\n    }\n  }\n  ...AssetContextMenu_data_3z4lq0 @include(if: $showContextMenu)\n}\n\nfragment AssetCardBuyNow_data on AssetType {\n  tokenId\n  relayId\n  assetContract {\n    address\n    chain\n    id\n  }\n  collection {\n    slug\n    id\n  }\n  orderData {\n    bestAsk {\n      relayId\n    }\n  }\n}\n\nfragment AssetCardContent_asset on AssetType {\n  relayId\n  name\n  ...AssetMedia_asset\n  assetContract {\n    address\n    chain\n    openseaVersion\n    id\n  }\n  tokenId\n  collection {\n    slug\n    id\n  }\n  isDelisted\n}\n\nfragment AssetCardContent_assetBundle on AssetBundleType {\n  assetQuantities(first: 18) {\n    edges {\n      node {\n        asset {\n          relayId\n          ...AssetMedia_asset\n          id\n        }\n        id\n      }\n    }\n  }\n}\n\nfragment AssetCardFooter_assetBundle on AssetBundleType {\n  ...AssetCardAnnotations_assetBundle\n  name\n  assetCount\n  assetQuantities(first: 18) {\n    edges {\n      node {\n        asset {\n          collection {\n            name\n            relayId\n            slug\n            isVerified\n            ...collection_url\n            id\n          }\n          id\n        }\n        id\n      }\n    }\n  }\n  assetEventData {\n    lastSale {\n      unitPriceQuantity {\n        ...AssetQuantity_data\n        id\n      }\n    }\n  }\n  orderData {\n    bestBid {\n      orderType\n      paymentAssetQuantity {\n        ...AssetQuantity_data\n        id\n      }\n    }\n    bestAsk {\n      closedAt\n      orderType\n      dutchAuctionFinalPrice\n      openedAt\n      priceFnEndedAt\n      quantity\n      decimals\n      paymentAssetQuantity {\n        quantity\n        ...AssetQuantity_data\n        id\n      }\n    }\n  }\n}\n\nfragment AssetCardFooter_asset_3Aax2O on AssetType {\n  ...AssetCardAnnotations_asset_3Aax2O\n  name\n  tokenId\n  collection {\n    slug\n    name\n    isVerified\n    ...collection_url\n    id\n  }\n  isDelisted\n  assetContract {\n    address\n    chain\n    openseaVersion\n    id\n  }\n  assetEventData {\n    lastSale {\n      unitPriceQuantity {\n        ...AssetQuantity_data\n        id\n      }\n    }\n  }\n  orderData {\n    bestBid {\n      orderType\n      paymentAssetQuantity {\n        ...AssetQuantity_data\n        id\n      }\n    }\n    bestAsk {\n      closedAt\n      orderType\n      dutchAuctionFinalPrice\n      openedAt\n      priceFnEndedAt\n      quantity\n      decimals\n      paymentAssetQuantity {\n        quantity\n        ...AssetQuantity_data\n        id\n      }\n    }\n  }\n}\n\nfragment AssetContextMenu_data_3z4lq0 on AssetType {\n  ...asset_edit_url\n  ...asset_url\n  ...itemEvents_data\n  relayId\n  isDelisted\n  isEditable {\n    value\n    reason\n  }\n  isListable\n  ownership(identity: {}) {\n    isPrivate\n    quantity\n  }\n  creator {\n    address\n    id\n  }\n  collection {\n    isAuthorizedEditor\n    id\n  }\n  imageUrl\n  ownedQuantity(identity: {})\n}\n\nfragment AssetMedia_asset on AssetType {\n  animationUrl\n  backgroundColor\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n  isDelisted\n  imageUrl\n  displayImageUrl\n}\n\nfragment AssetQuantity_data on AssetQuantityType {\n  asset {\n    ...Price_data\n    id\n  }\n  quantity\n}\n\nfragment AssetSearchFilter_data_3KTzFc on Query {\n  ...CollectionFilter_data_2qccfC\n  collection(collection: $collection) {\n    numericTraits {\n      key\n      value {\n        max\n        min\n      }\n      ...NumericTraitFilter_data\n    }\n    stringTraits {\n      key\n      ...StringTraitFilter_data\n    }\n    id\n  }\n  ...PaymentFilter_data_2YoIWt\n}\n\nfragment AssetSearchList_data_3Aax2O on SearchResultType {\n  asset {\n    assetContract {\n      address\n      chain\n      id\n    }\n    collection {\n      isVerified\n      relayId\n      id\n    }\n    relayId\n    tokenId\n    ...AssetSelectionItem_data\n    ...asset_url\n    id\n  }\n  assetBundle {\n    relayId\n    id\n  }\n  ...Asset_data_3Aax2O\n}\n\nfragment AssetSearch_data_2hBjZ1 on Query {\n  ...AssetSearchFilter_data_3KTzFc\n  ...SearchPills_data_2Kg4Sq\n  search(after: $cursor, chains: $chains, categories: $categories, collections: $collections, first: $count, identity: $identity, numericTraits: $numericTraits, paymentAssets: $paymentAssets, priceFilter: $priceFilter, querystring: $query, resultType: $resultModel, sortAscending: $sortAscending, sortBy: $sortBy, stringTraits: $stringTraits, toggles: $toggles, creator: $creator, isPrivate: $isPrivate, safelistRequestStatuses: $safelistRequestStatuses) {\n    edges {\n      node {\n        ...AssetSearchList_data_3Aax2O\n        __typename\n      }\n      cursor\n    }\n    totalCount\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment AssetSelectionItem_data on AssetType {\n  backgroundColor\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    imageUrl\n    id\n  }\n  imageUrl\n  name\n  relayId\n}\n\nfragment Asset_data_3Aax2O on SearchResultType {\n  asset {\n    relayId\n    isDelisted\n    ...AssetCardContent_asset\n    ...AssetCardFooter_asset_3Aax2O\n    ...AssetMedia_asset\n    ...asset_url\n    ...itemEvents_data\n    orderData {\n      bestAsk {\n        paymentAssetQuantity {\n          quantityInEth\n          id\n        }\n      }\n    }\n    id\n  }\n  assetBundle {\n    relayId\n    ...bundle_url\n    ...AssetCardContent_assetBundle\n    ...AssetCardFooter_assetBundle\n    orderData {\n      bestAsk {\n        paymentAssetQuantity {\n          quantityInEth\n          id\n        }\n      }\n    }\n    id\n  }\n}\n\nfragment CollectionFilter_data_2qccfC on Query {\n  selectedCollections: collections(first: 25, collections: $collections, includeHidden: true) {\n    edges {\n      node {\n        assetCount\n        imageUrl\n        name\n        slug\n        isVerified\n        id\n      }\n    }\n  }\n  collections(assetOwner: $assetOwner, assetCreator: $creator, onlyPrivateAssets: $isPrivate, chains: $chains, first: 100, includeHidden: $includeHiddenCollections, parents: $categories, query: $collectionQuery, sortBy: $collectionSortBy) {\n    edges {\n      node {\n        assetCount\n        imageUrl\n        name\n        slug\n        isVerified\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment CollectionModalContent_data on CollectionType {\n  description\n  imageUrl\n  name\n  slug\n}\n\nfragment NumericTraitFilter_data on NumericTraitTypePair {\n  key\n  value {\n    max\n    min\n  }\n}\n\nfragment PaymentFilter_data_2YoIWt on Query {\n  paymentAssets(first: 10) {\n    edges {\n      node {\n        symbol\n        relayId\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  PaymentFilter_collection: collection(collection: $collection) {\n    paymentAssets {\n      symbol\n      relayId\n      id\n    }\n    id\n  }\n}\n\nfragment Price_data on AssetType {\n  decimals\n  imageUrl\n  symbol\n  usdSpotPrice\n  assetContract {\n    blockExplorerLink\n    chain\n    id\n  }\n}\n\nfragment SearchPills_data_2Kg4Sq on Query {\n  selectedCollections: collections(first: 25, collections: $collections, includeHidden: true) {\n    edges {\n      node {\n        imageUrl\n        name\n        slug\n        ...CollectionModalContent_data\n        id\n      }\n    }\n  }\n}\n\nfragment StringTraitFilter_data on StringTraitType {\n  counts {\n    count\n    value\n  }\n  key\n}\n\nfragment asset_edit_url on AssetType {\n  assetContract {\n    address\n    chain\n    id\n  }\n  tokenId\n  collection {\n    slug\n    id\n  }\n}\n\nfragment asset_url on AssetType {\n  assetContract {\n    address\n    chain\n    id\n  }\n  tokenId\n}\n\nfragment bundle_url on AssetBundleType {\n  slug\n}\n\nfragment collection_url on CollectionType {\n  slug\n}\n\nfragment itemEvents_data on AssetType {\n  assetContract {\n    address\n    chain\n    id\n  }\n  tokenId\n}\n`,
                        variables: {
                            "categories": null,
                            "chains": null,
                            "collection": this.contractId,
                            "collectionQuery": null,
                            "collectionSortBy": "SEVEN_DAY_VOLUME",
                            "collections":[ this.contractId ],
                            "count": 32,
                            "cursor": null,
                            "identity": null,
                            "includeHiddenCollections": null,
                            "numericTraits": null,
                            "paymentAssets": null,
                            "priceFilter":{
                                "symbol":"ETH",
                                "max": this.totalPrice,
                            },
                            "query": " ",
                            "resultModel": "ASSETS",
                            "showContextMenu": true,
                            "shouldShowQuantity": false,
                            "sortAscending": true,
                            "sortBy": "PRICE",
                            "toggles": [
                                "BUY_NOW"
                            ],
                            "creator": null,
                            "assetOwner": null,
                            "isPrivate": null,
                            "safelistRequestStatuses": null
                        }
                    })
                });

                if (JSON.parse(response.body).data.query.search.edges.length >= 1) {
                    const asset = JSON.parse(response.body).data.query.search.edges[0]
                    await this.snipe(asset.node.asset.assetContract.address, asset.node.asset.tokenId, asset.node.asset.displayImageUrl, asset.node.asset.collection.name);
                }
                await sleep(5000);
                this.monitor();
            }
        } catch (error) {
            log('error', `Error Monitoring: ${error}`);
        }
    }

    async snipe(contractAddress: string, tokenId: string, imageUrl: string, collection: string) {
        try {
            log('misc', `Sniping: ${tokenId}`);
            //@ts-ignore
            const order = await this.seaport.api.getOrder({
                asset_contract_address: contractAddress,
                token_id: tokenId,
                side: 1,
            });

            //@ts-ignore
            if((parseInt(order.basePrice.toString())/1000000000000000000) > parseFloat(this.totalPrice)) {
                throw `Detected scam listing`;
            }

            //@ts-ignore
            const transaction = await this.seaport.fulfillOrder({
                //@ts-ignore
                accountAddress: this.taskWallet.address, //@ts-ignore
                order: order,
            });

            //@ts-ignore
            transaction.push({
                //@ts-ignore
                value: ethers.utils.parseEther((parseInt(order.basePrice.toString())/1000000000000000000).toString()),
                maxPriorityFeePerGas: parseInt(this.maxPriority) * 1000000000,
                maxFeePerGas: parseInt(this.maxFeeGas) * 1000000000,
            });
            log('success', `Sniped: ${tokenId}`);
            await this.sendWebhook("Success", tokenId, imageUrl, collection);
        } catch (error) {
            log('error', `Error sniping: ${error}`);
            await this.sendWebhook("Failed", tokenId, imageUrl, collection);
            await sleep(2500);
            this.snipe(contractAddress, tokenId, imageUrl, collection);
        }
    }

    async sendWebhook(status: string, tokenId: string, imageUrl: string, collection: string) {
        try {
            const webhook = {
                "content": null,
                    "embeds": [
                    {
                        "title": `Snipe ${status}`,
                        "color": 16514301,
                        "fields": [
                        {
                            "name": "Collection",
                            "value": collection,
                            "inline": true
                        },
                        {
                            "name": "Token ID",
                            "value": `#${tokenId}`,
                            "inline": true
                        }
                        ],
                        "thumbnail": {
                            "url": imageUrl
                        }
                    }
                ]
            }
    
            console.log(this.parameters);
            const response = await got.post(this.parameters, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhook),
            });
        } catch (error) {console.log(error)}
    }
}