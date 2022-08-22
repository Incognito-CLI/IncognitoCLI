import BN from 'bn.js';

export class ConfigAccount {
    presaleTime: any;
    publicTime: any;
    presalePrice: any;
    price: any;
    our_cut: any;
    sname: any;
    symbol: any;
    per_wallet: any;
    pda_buf: typeof BN | any;
    uri: any;
    index_cap: any;
    auth_pda: any;
    index_key: any;
    wl_key: any;
    wl_size: any;
    primary_wallet: any;
    sfbp: any;
    secondary_wl_index: any;
    creator_1: any;
    creator_1_cut: any;
    ctimeout: any;
    config_seed: typeof BN | any;
    creator_2: any | null;
    creator_3: any | null;
    creator_4: any | null;
    creator_2_cut: any | null;
    creator_3_cut: any | null;
    creator_4_cut: any | null;
    token_mint_account: any | null;
    token_recip_account: any | null;
    token_decimals: any | null;
    token_price: any | null;
    token_option: any | null;
    collection_key: any;
    collection_name: any;
    our_wallet: any;
    given_dao: any;
    token_mints: any;
    constructor(properties: any) {
        this.presaleTime = 0;
        this.publicTime = 0;
        this.presalePrice = 0;
        this.price = 0;
        this.our_cut = 0;
        this.sname = 0;
        this.symbol = 0;
        this.per_wallet = 0;
        this.pda_buf = 0;
        this.uri = 0;
        this.index_cap = 0;
        this.auth_pda = 0;
        this.index_key = 0;
        this.wl_key = 0;
        this.wl_size = 0;
        this.ctimeout = 0;
        this.primary_wallet = 0;
        this.sfbp = 0;
        this.secondary_wl_index = 0;
        this.collection_key = 0;
        this.creator_1 = 0;
        this.creator_1_cut = 0;
        this.collection_name = 0;
        this.config_seed = 0;
        this.creator_2 = 0;
        this.creator_3 = 0;
        this.creator_4 = 0;
        this.creator_2_cut = 0;
        this.creator_3_cut = 0;
        this.creator_4_cut = 0;
        this.token_mint_account = 0;
        this.token_recip_account = 0;
        this.token_decimals = 0;
        this.token_price = 0;
        this.token_option = 0;
        this.our_wallet = 0;
        this.given_dao = 0;
        this.token_mints = 0;
        this.presaleTime = properties.presaleTime;
        this.publicTime = properties.publicTime;
        this.presalePrice = properties.presalePrice;
        this.price = properties.price;
        this.our_cut = properties.our_cut;
        this.sname = properties.sname;
        this.symbol = properties.symbol;
        this.per_wallet = properties.per_wallet;
        this.pda_buf = new BN(properties.pda_buf, 10).or(properties.dutch ? new BN(1, 10).shln(56) : new BN(0, 10));
        this.uri = properties.uri;
        this.index_cap = properties.index_cap;
        this.auth_pda = properties.auth_pda;
        this.index_key = properties.index_key;
        this.wl_key = properties.wl_key;
        this.wl_size = properties.wl_size;
        this.primary_wallet = properties.primary_wallet;
        this.sfbp = properties.sfbp;
        this.secondary_wl_index = properties.secondary_wl_index;
        this.collection_key = properties.collection_key;
        this.creator_1 = properties.creator_1;
        this.creator_1_cut = properties.creator_1_cut;
        this.collection_name = properties.collection_name;
        this.ctimeout = properties.ctimeout;
        this.config_seed = new BN(properties.config_seed, 10).or(properties.dutch ? new BN(1, 10).shln(56) : new BN(0, 10));
        this.creator_2 = (null === properties || void 0 === properties ? void 0 : properties.creator_2) || null;
        this.creator_3 = (null === properties || void 0 === properties ? void 0 : properties.creator_3) || null;
        this.creator_4 = (null === properties || void 0 === properties ? void 0 : properties.creator_4) || null;
        this.creator_2_cut = (null === properties || void 0 === properties ? void 0 : properties.creator_2_cut) || null;
        this.creator_3_cut = (null === properties || void 0 === properties ? void 0 : properties.creator_3_cut) || null;
        this.creator_4_cut = (null === properties || void 0 === properties ? void 0 : properties.creator_4_cut) || null;
        this.token_mint_account = (null === properties || void 0 === properties ? void 0 : properties.token_mint_account) || null;
        this.token_recip_account = (null === properties || void 0 === properties ? void 0 : properties.token_recip_account) || null;
        this.token_decimals = (null === properties || void 0 === properties ? void 0 : properties.token_decimals) || null;
        this.token_price = (null === properties || void 0 === properties ? void 0 : properties.token_price) || null;
        this.token_option = (null === properties || void 0 === properties ? void 0 : properties.token_option) || null;
        this.our_wallet = (null === properties || void 0 === properties ? void 0 : properties.our_wallet) || null;
        this.given_dao = (null === properties || void 0 === properties ? void 0 : properties.given_dao) || null;
        this.token_mints = (null === properties || void 0 === properties ? void 0 : properties.token_mints) || null;
    }
}

export const ConfigAccountSchema = new Map([
    [
        ConfigAccount,
        {
            kind: 'struct',
            fields: [["presaleTime", "u32"], ["publicTime", "u32"], ["presalePrice", "u64"], ["price", "u64"], ["our_cut", "string"], ["sname", "string"], ["symbol", "string"], ["per_wallet", "u8"], ["pda_buf", "u64"], ["uri", "string"], ["index_cap", "u16"], ["auth_pda", "pubkeyAsString"], ["index_key", "pubkeyAsString"], ["wl_key", "pubkeyAsString"], ["wl_size", "u16"], ["ctimeout", "u16"], ["config_seed", "u64"], ["primary_wallet", "pubkeyAsString"], ["sfbp", "u16"], ["secondary_wl_index", "u16"], ["collection_key", "pubkeyAsString"], ["creator_1", "pubkeyAsString"], ["creator_1_cut", "u8"], ["collection_name", "string"], ["creator_2", {
                kind: "option",
                type: "pubkeyAsString"
            }], ["creator_2_cut", {
                kind: "option",
                type: "u8"
            }], ["creator_3", {
                kind: "option",
                type: "pubkeyAsString"
            }], ["creator_3_cut", {
                kind: "option",
                type: "u8"
            }], ["creator_4", {
                kind: "option",
                type: "pubkeyAsString"
            }], ["creator_4_cut", {
                kind: "option",
                type: "u8"
            }], ["token_mint_account", {
                kind: "option",
                type: "pubkeyAsString"
            }], ["token_recip_account", {
                kind: "option",
                type: "pubkeyAsString"
            }], ["token_decimals", {
                kind: "option",
                type: "u8"
            }], ["token_price", {
                kind: "option",
                type: "u64"
            }], ["token_option", {
                kind: "option",
                type: "u8"
            }], ["our_wallet", {
                kind: "option",
                type: "string"
            }], ["given_dao", {
                kind: "option",
                type: "string"
            }], ["token_mints", {
                kind: "option",
                type: "u16"
            }]]
        },
    ],
]);