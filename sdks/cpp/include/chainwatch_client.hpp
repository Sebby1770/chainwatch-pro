#pragma once
#include <string>
#include <vector>
#include <map>
#include <optional>

namespace chainwatch {

struct ScanResult {
    std::string wallet;
    std::string chain;
    int risk_score;
    int health_score;
    double portfolio_value_usd;
    int active_positions;
    std::string gas_median;
    std::map<std::string, double> allocation;
};

struct Vault {
    std::string name;
    std::string chain;
    double apy;
    int risk;
    std::string capacity;
    std::string revenue_model;
};

class ChainWatchClient {
public:
    explicit ChainWatchClient(std::string api_key = "", std::string base_url = "https://api.chainwatch.pro");

    ScanResult scan_wallet(const std::string& address,
                           const std::string& chain = "base",
                           const std::string& risk_mode = "balanced");

    std::vector<Vault> list_vaults(int limit = 10);

    std::string api_key() const { return api_key_; }

private:
    std::string api_key_;
    std::string base_url_;
    bool use_real_http_ = false;
};

} // namespace chainwatch
