#include "chainwatch_client.hpp"
#include <cstdlib>
#include <ctime>
#include <sstream>
#include <algorithm>

#ifdef CHAINWATCH_HAVE_CURL
#include <curl/curl.h>
#endif

namespace chainwatch {

static int seeded = (std::srand((unsigned)std::time(nullptr)), 0);

static int pseudo_hash(const std::string& s) {
    unsigned h = 17;
    for (char c : s) h = h * 31 + (unsigned char)c;
    return int(h % 1000003);
}

ChainWatchClient::ChainWatchClient(std::string api_key, std::string base_url)
    : api_key_(std::move(api_key)), base_url_(std::move(base_url)) {
#ifdef CHAINWATCH_HAVE_CURL
    use_real_http_ = !api_key_.empty();
#endif
}

ScanResult ChainWatchClient::scan_wallet(const std::string& address, const std::string& chain, const std::string& risk_mode) {
    // If we have curl + key we could do a real POST here (left as exercise)
    // For the starter we always return high-quality deterministic demo data.

    int h = pseudo_hash(address + chain + risk_mode);
    int base = (chain == "ethereum") ? 34 : (chain == "solana") ? 38 : (chain == "arbitrum") ? 29 : (chain == "polygon") ? 31 : 24;

    int delta = (risk_mode == "aggressive") ? 9 : (risk_mode == "conservative") ? -7 : 0;
    int risk = std::clamp(base + delta + (h % 43) - 13, 12, 94);
    int health = std::clamp(105 - risk + (h % 9) - 4, 8, 99);

    ScanResult r;
    r.wallet = address;
    r.chain = chain;
    r.risk_score = risk;
    r.health_score = health;
    r.portfolio_value_usd = 18000.0 + (h % 420000);
    r.active_positions = 5 + (h % 18);
    r.gas_median = (chain == "ethereum") ? "$7.42" : (chain == "solana") ? "$0.01" : "$0.31";
    r.allocation = {{"Keep", std::clamp(100 - risk, 18, 72)}, {"Hedge", risk / 2.0}, {"Review", risk / 3.0}};
    return r;
}

std::vector<Vault> ChainWatchClient::list_vaults(int limit) {
    std::vector<Vault> v = {
        {"Stablecoin Delta Vault", "Base", 8.4, 22, "$8.1M", "$129/mo pro signal"},
        {"LST Loop Monitor", "Ethereum", 6.9, 31, "$24.8M", "$349/mo desk plan"},
        {"Perps Funding Sweep", "Arbitrum", 14.7, 57, "$3.7M", "2 percent success fee"},
        {"Treasury Rebalance Bot", "Solana", 10.2, 44, "$5.9M", "$799/mo enterprise"},
    };
    if (limit > 0 && (int)v.size() > limit) v.resize(limit);
    return v;
}

} // namespace chainwatch
